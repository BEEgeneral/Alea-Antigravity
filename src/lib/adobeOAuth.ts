const ADOBE_AUTH_BASE_URL = "https://secure.na1.adobesign.com";
const ADOBE_OAUTH_URL = "https://ims-na1.adobesign.com/oauth";

export interface AdobeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getAdobeAuthUrl(redirectUri: string, clientId: string): string {
  const scopes = "openid,creative_sdk,additional_info.projectedProductContext";
  const state = generateState();

  return `${ADOBE_OAUTH_URL}/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<AdobeTokens> {
  const response = await fetch(`${ADOBE_OAUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error exchanging code for tokens: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<AdobeTokens> {
  const response = await fetch(`${ADOBE_OAUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error refreshing token: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60000;
}

function generateState(): string {
  return Math.random().toString(36).substring(2, 15);
}
