import { NextResponse } from "next/server";
import { isAdobeConnected } from "@/lib/adobeTokenManager";

export async function GET() {
  try {
    const connected = await isAdobeConnected();
    return NextResponse.json({ connected });
  } catch (error) {
    // Silently handle Adobe connection errors - endpoint is for status check
    return NextResponse.json({ connected: false });
  }
}
