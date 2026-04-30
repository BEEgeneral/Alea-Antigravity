import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const users = await getSql()`SELECT id, name FROM users WHERE email = ${normalizedEmail}`

    if (!users[0]) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
    }

    const user = users[0]

    // Invalidate any existing reset tokens for this email
    await getSql()`UPDATE password_reset_tokens SET used = true WHERE email = ${normalizedEmail}`

    // Create new reset token
    const tokenId = crypto.randomUUID()
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await getSql()`
      INSERT INTO password_reset_tokens (id, email, token, expires_at, used)
      VALUES (${tokenId}, ${normalizedEmail}, ${token}, ${expiresAt}, false)
    `

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/reset-password?token=${token}`

    // Send email
    await getResend().emails.send({
      from: 'Alea Signature <noreply@aleasignature.com>',
      to: normalizedEmail,
      subject: 'Restablecer contraseña — Alea Signature',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; letter-spacing: 0.1em;">Aleasignature.</h1>
          </div>
          <h2 style="font-size: 20px; margin-bottom: 16px;">Restablecer Contraseña</h2>
          <p style="color: #666; line-height: 1.6;">
            Hola ${user.name || 'tu cuenta'},<br/><br/>
            Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; letter-spacing: 0.05em;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            Si no solicitaste este cambio, puedes ignorar este email. El enlace expira en 1 hora.<br/>
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

