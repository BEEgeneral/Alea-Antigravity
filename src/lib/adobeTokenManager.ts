import { insforge } from "@/lib/insforge-server";
import { AdobeTokens, refreshAccessToken, isTokenExpired } from "./adobeOAuth";

const ADOBE_CLIENT_ID = process.env.ADOBE_SIGN_CLIENT_ID!;
const ADOBE_CLIENT_SECRET = process.env.ADOBE_CLIENT_SECRET!;

export async function getAdobeTokens(): Promise<AdobeTokens | null> {
  try {
    const { data, error } = await insforge.database
      .from("settings")
      .select("value")
      .eq("key", "adobe_tokens")
      .single();

    if (error || !data?.value) {
      return null;
    }

    const tokens: AdobeTokens = JSON.parse(data.value);
    return tokens;
  } catch (err) {
    console.error("Error getting Adobe tokens:", err);
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getAdobeTokens();

  if (!tokens) {
    return null;
  }

  if (!isTokenExpired(tokens.expiresAt)) {
    return tokens.accessToken;
  }

  try {
    const newTokens = await refreshAccessToken(
      tokens.refreshToken,
      ADOBE_CLIENT_ID,
      ADOBE_CLIENT_SECRET
    );

    await saveAdobeTokens(newTokens);

    return newTokens.accessToken;
  } catch (err) {
    console.error("Error refreshing Adobe token:", err);
    return null;
  }
}

export async function saveAdobeTokens(tokens: AdobeTokens): Promise<void> {
  await insforge.database
    .from("settings")
    .upsert({
      key: "adobe_tokens",
      value: JSON.stringify(tokens),
      updated_at: new Date().toISOString(),
    })
    .eq("key", "adobe_tokens");
}

export async function isAdobeConnected(): Promise<boolean> {
  const tokens = await getAdobeTokens();
  return tokens !== null;
}

export async function disconnectAdobe(): Promise<void> {
  await insforge.database
    .from("settings")
    .delete()
    .eq("key", "adobe_tokens");
}
