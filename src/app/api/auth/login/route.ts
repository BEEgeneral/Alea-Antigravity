import { NextRequest, NextResponse } from "next/server"
import { signIn } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  try {
    await signIn("resend", { email, redirect: false })
    return NextResponse.json({ success: true, message: "Magic link sent" })
  } catch (err) {
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 })
  }
}
