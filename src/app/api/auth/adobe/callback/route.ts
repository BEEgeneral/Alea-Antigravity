import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/adobeOAuth";
import { insforge } from "@/lib/insforge-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/praetorium?adobe_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/praetorium?adobe_error=no_code", request.url)
    );
  }

  const clientId = process.env.ADOBE_SIGN_CLIENT_ID;
  const clientSecret = process.env.ADOBE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/adobe/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/praetorium?adobe_error=missing_credentials", request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);

    await insforge.database
      .from("settings")
      .upsert({
        key: "adobe_tokens",
        value: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        }),
      })
      .eq("key", "adobe_tokens");

    return NextResponse.redirect(
      new URL("/praetorium?adobe_connected=true", request.url)
    );
  } catch (err) {
    console.error("Error exchanging tokens:", err);
    return NextResponse.redirect(
      new URL(`/praetorium?adobe_error=${encodeURIComponent("token_exchange_failed")}`, request.url)
    );
  }
}
