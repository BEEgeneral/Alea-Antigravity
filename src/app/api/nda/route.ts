import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";
import { uploadTransientDocument, createAgreement, getAgreementStatus, getSigningUrl } from "@/lib/adobeSign";
import { getValidAccessToken, isAdobeConnected } from "@/lib/adobeTokenManager";

const ADOBE_CLIENT_ID = process.env.ADOBE_SIGN_CLIENT_ID || "3396c256cc554b75ae4ed7e3e05300c3";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fecha, intervinientes, pdfBase64, fileName, action, ndaId } = body;

        if (action === "send_for_signature" && ndaId) {
            return handleSendForSignature(ndaId, intervinientes, pdfBase64, fileName);
        }

        return handleCreateAndSave(fecha, intervinientes, pdfBase64, fileName);
    } catch (error) {
        console.error("Error in NDA API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

async function handleCreateAndSave(fecha: string, intervinientes: any[], pdfBase64: string | null, fileName: string | null) {
    let pdfUrl = null;

    if (pdfBase64 && fileName) {
        const buffer = Buffer.from(pdfBase64, "base64");
        const blob = new Blob([buffer], { type: "application/pdf" });
        const file = new File([blob], fileName, { type: "application/pdf" });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "nda");
        formData.append("fileName", fileName);

        const uploadRes = await fetch("/api/storage/upload", {
            method: "POST",
            body: formData,
        });

        if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            pdfUrl = uploadData.url;
        }
    }

    const client = await createAuthenticatedClient();

    const { data: nda, error: ndaError } = await client.database
        .from("nda_agreements")
        .insert({
            fecha,
            estado: pdfUrl ? "pendiente_firma" : "borrador",
            pdf_url: pdfUrl,
        })
        .select()
        .single();

    if (ndaError) {
        console.error("Error creating NDA:", ndaError);
        return NextResponse.json(
            { error: "Error al crear el NDA" },
            { status: 500 }
        );
    }

    const intervinientesData = intervinientes.map((inter: any, index: number) => ({
        nda_id: nda.id,
        nombre: inter.nombre,
        dni: inter.dni,
        email: inter.email,
        rol: inter.rol,
        orden: index + 1,
    }));

    const { error: interError } = await client.database
        .from("nda_intervinientes")
        .insert(intervinientesData);

    if (interError) {
        console.error("Error creating intervinientes:", interError);
    }

    return NextResponse.json({
        success: true,
        nda,
        pdfUrl,
    });
}

async function handleSendForSignature(ndaId: string, intervinientes: any[], pdfBase64: string, fileName: string) {
    const connected = await isAdobeConnected();
    if (!connected) {
        return NextResponse.json(
            { error: "Adobe Sign no está conectado. Usa 'Conectar Adobe Sign' primero." },
            { status: 500 }
        );
    }

    const accessToken = await getValidAccessToken();
    if (!accessToken) {
        return NextResponse.json(
            { error: "No se pudo obtener token de Adobe Sign" },
            { status: 500 }
        );
    }

    const config = {
        clientId: process.env.ADOBE_SIGN_CLIENT_ID!,
        accessToken: accessToken,
    };

    try {
        const transientDocumentId = await uploadTransientDocument(
            config,
            pdfBase64,
            fileName
        );

        const signers = intervinientes.map((i: any) => ({
            email: i.email,
            name: i.nombre,
        }));

        const agreement = await createAgreement(
            config,
            transientDocumentId,
            fileName,
            signers
        );

        const signingUrls = await Promise.all(
            intervinientes.map(async (i: any) => {
                const url = await getSigningUrl(config, agreement.id, i.email);
                return { email: i.email, url };
            })
        );

        const client = await createAuthenticatedClient();
        await client.database
            .from("nda_agreements")
            .update({
                estado: "enviado",
                notas: `Adobe Sign Agreement ID: ${agreement.id}`,
            })
            .eq("id", ndaId);

        return NextResponse.json({
            success: true,
            agreementId: agreement.id,
            signingUrls,
            message: "NDA enviado para firma electrónica",
        });
    } catch (error: any) {
        console.error("Error sending to Adobe Sign:", error);
        return NextResponse.json(
            { error: `Error enviando a Adobe Sign: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const client = await createAuthenticatedClient();
        const { data: ndas, error } = await client.database
            .from("nda_agreements")
            .select(`
                *,
                nda_intervinientes (*)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json(
                { error: "Error al obtener los NDAs" },
                { status: 500 }
            );
        }

        return NextResponse.json({ ndas });
    } catch (error) {
        console.error("Error fetching NDAs:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, estado } = body;

        if (!id) {
            return NextResponse.json(
                { error: "ID es requerido" },
                { status: 400 }
            );
        }

        const client = await createAuthenticatedClient();
        const { data, error } = await client.database
            .from("nda_agreements")
            .update({ estado, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Error actualizando NDA" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, nda: data });
    } catch (error) {
        console.error("Error updating NDA:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}