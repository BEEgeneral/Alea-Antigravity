import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const results = await getSql()`
      SELECT * FROM password_reset_tokens
      WHERE token = ${token} AND used = false AND expires_at > NOW()
    `

    if (!results[0]) {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find valid token
    const tokens = await getSql()`
      SELECT * FROM password_reset_tokens
      WHERE token = ${token} AND used = false AND expires_at > NOW()
    `

    if (!tokens[0]) {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 400 })
    }

    const resetRecord = tokens[0]

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await getSql()`
      UPDATE users SET password_hash = ${hashedPassword}, updated_at = NOW()
      WHERE email = ${resetRecord.email}
    `

    // Mark token as used
    await getSql()`UPDATE password_reset_tokens SET used = true WHERE id = ${resetRecord.id}`

    return NextResponse.json({ success: true, message: 'Password updated successfully.' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
