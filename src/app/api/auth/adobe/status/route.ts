import { NextResponse } from "next/server";
import { isAdobeConnected } from "@/lib/adobeTokenManager";

export async function GET() {
  try {
    const connected = await isAdobeConnected();
    return NextResponse.json({ connected });
  } catch (error) {
    console.error("Error checking Adobe connection:", error);
    return NextResponse.json({ connected: false });
  }
}
