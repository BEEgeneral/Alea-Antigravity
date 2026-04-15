import { NextResponse } from "next/server";
import { getAdobeAuthUrl } from "@/lib/adobeOAuth";

export async function GET() {
  const clientId = process.env.ADOBE_SIGN_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Adobe Sign Client ID not configured" },
      { status: 500 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/adobe/callback`;
  const authUrl = getAdobeAuthUrl(redirectUri, clientId);

  return NextResponse.json({ authUrl });
}
