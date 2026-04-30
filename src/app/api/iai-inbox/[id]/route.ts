import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";
import { createAuthenticatedClient } from "@/lib/insforge";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const { data: authData, error: authError } = await client.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { id } = await params;
    const { action, entity_type, notes } = await req.json();

    // Fetch suggestion
    const suggestionResult = await pool.query(
      "SELECT * FROM iai_inbox_suggestions WHERE id = $1",
      [id]
    );
    const suggestion = suggestionResult.rows[0];

    if (!suggestion) {
      return NextResponse.json({ error: "Sugerencia no encontrada" }, { status: 404 });
    }

    let created: any = null;

    if (action === "approve" || action === "reject") {
      const newStatus = action === "approve" ? "approved" : "rejected";
      await pool.query(
        `UPDATE iai_inbox_suggestions SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3`,
        [newStatus, authData.user.id, id]
      );
    } else if (action === "create_lead" || action === "create_property" || action === "create_investor") {
      // Create CRM entity based on suggestion type
      if (entity_type === "investor" || entity_type === "lead") {
        const result = await pool.query(
          `INSERT INTO investors (email, full_name, phone, budget_min, budget_max, kyc_status, source)
           VALUES ($1, $2, $3, $4, $5, 'pending', 'email_intelligence')
           RETURNING id`,
          [
            suggestion.sender_email,
            suggestion.extracted_data?.contact_name || suggestion.extracted_data?.vendor_name || suggestion.sender_email.split("@")[0],
            suggestion.extracted_data?.contact_phone || null,
            suggestion.extracted_data?.price ? suggestion.extracted_data.price * 0.7 : null,
            suggestion.extracted_data?.price || null,
          ]
        );
        if (result.rows.length > 0) {
          created = { type: "investor", id: result.rows[0].id };
        }
      } else if (entity_type === "property") {
        const result = await pool.query(
          `INSERT INTO properties (title, address, asset_type, price, size_sqm, is_off_market, is_published, source)
           VALUES ($1, $2, $3, $4, $5, true, false, 'email_intelligence')
           RETURNING id`,
          [
            suggestion.extracted_data?.title || suggestion.original_email_subject,
            suggestion.extracted_data?.address || "Por confirmar",
            suggestion.extracted_data?.type || "Otro",
            suggestion.extracted_data?.price || 0,
            suggestion.extracted_data?.meters || null,
          ]
        );
        if (result.rows.length > 0) {
          created = { type: "property", id: result.rows[0].id };
        }
      } else if (entity_type === "lead") {
        const result = await pool.query(
          `INSERT INTO leads (name, email, phone, source, status, notes)
           VALUES ($1, $2, $3, 'email_intelligence', 'new', $4)
           RETURNING id`,
          [
            suggestion.extracted_data?.contact_name || suggestion.original_email_subject,
            suggestion.sender_email,
            suggestion.extracted_data?.contact_phone || null,
            notes || null,
          ]
        );
        if (result.rows.length > 0) {
          created = { type: "lead", id: result.rows[0].id };
        }
      }

      // Mark suggestion as approved
      await pool.query(
        `UPDATE iai_inbox_suggestions SET status = 'approved', approved_by = $1, approved_at = NOW() WHERE id = $2`,
        [authData.user.id, id]
      );
    }

    return NextResponse.json({ success: true, created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing suggestion ID" }, { status: 400 });
    }

    const updates: string[] = [];
    const paramsList: any[] = [];
    let i = 1;

    if (status) {
      updates.push(`status = $${i++}`);
      paramsList.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${i++}`);
      paramsList.push(notes);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    paramsList.push(id);

    const result = await pool.query(
      `UPDATE iai_inbox_suggestions SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      paramsList
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    return NextResponse.json({ suggestion: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
