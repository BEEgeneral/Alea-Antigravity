const ADOBE_SIGN_BASE_URL = "https://secure.na1.adobesign.com";

interface AdobeSignConfig {
  clientId: string;
  accessToken: string;
}

interface TransientDocumentResponse {
  transientDocumentId: string;
}

interface AgreementCreationResponse {
  id: string;
  status: string;
  signingUrls?: {
    signingUrl: string;
    email: string;
  }[];
}

export async function uploadTransientDocument(
  config: AdobeSignConfig,
  pdfBase64: string,
  fileName: string
): Promise<string> {
  const buffer = Buffer.from(pdfBase64, "base64");

  const response = await fetch(
    `${ADOBE_SIGN_BASE_URL}/api/rest/v6/transientDocuments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/pdf",
        "Content-Disposition": `file; filename="${fileName}"`,
      },
      body: buffer,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error uploading transient document: ${error}`);
  }

  const data = await response.json();
  return data.transientDocumentId;
}

export async function createAgreement(
  config: AdobeSignConfig,
  transientDocumentId: string,
  fileName: string,
  signers: { email: string; name: string }[]
): Promise<AgreementCreationResponse> {
  const agreementData = {
    fileInfos: [
      {
        transientDocumentId: transientDocumentId,
      },
    ],
    name: fileName,
    participantSetsInfo: signers.map((signer, index) => ({
      memberInfos: [
        {
          email: signer.email,
          name: signer.name,
        },
      ],
      order: index + 1,
      role: "SIGNER",
    })),
    signatureType: "ESIGN",
    state: "IN_PROCESS",
    message: "Por favor, firme el Acuerdo de Confidencialidad NDA de Alea Signature.",
  };

  const response = await fetch(
    `${ADOBE_SIGN_BASE_URL}/api/rest/v6/agreements`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agreementData),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error creating agreement: ${error}`);
  }

  const data = await response.json();
  return data;
}

export async function getAgreementStatus(
  config: AdobeSignConfig,
  agreementId: string
): Promise<{ status: string; signedDocumentUrl?: string }> {
  const response = await fetch(
    `${ADOBE_SIGN_BASE_URL}/api/rest/v6/agreements/${agreementId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error getting agreement status: ${error}`);
  }

  const data = await response.json();
  return {
    status: data.status,
    signedDocumentUrl: data.signedDocumentUrl,
  };
}

export async function getSigningUrl(
  config: AdobeSignConfig,
  agreementId: string,
  signerEmail: string
): Promise<string | null> {
  const response = await fetch(
    `${ADOBE_SIGN_BASE_URL}/api/rest/v6/agreements/${agreementId}/signingUrls`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const urls = data.signingUrlSetInfos?.[0]?.signingUrls || [];
  const signerUrl = urls.find(
    (url: any) =>
      url.signers?.some((s: any) => s.email === signerEmail) ||
      url.email === signerEmail
  );

  return signerUrl?.signingUrl || null;
}
