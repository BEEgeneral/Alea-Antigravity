import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { auth } from '@/lib/auth'

// Auth guard — only admin can invite
async function requireAdmin(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autenticado', status: 401 }
  }
  const role = (session.user as any)?.role
  const email = (session.user as any)?.email?.toLowerCase()
  const isGodMode = email === 'beenocode@gmail.com' || email === 'albertogala@beenocode.com'
  if (role !== 'admin' && !isGodMode) {
    return { error: 'Solo administradores pueden invitar usuarios', status: 403 }
  }
  return null
}

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    // Support both admin token auth and simple email+role for now
    const body = await request.json()
    const { email, role, name } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const tempPassword = randomBytes(8).toString('base64').slice(0, 12)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Check if user already exists
    const existing = await getSql()`SELECT id FROM users WHERE email = ${normalizedEmail}`

    if (existing[0]) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 })
    }

    // Create user directly
    const userId = crypto.randomUUID()
    await getSql()`
      INSERT INTO users (id, email, name, password_hash, role, is_active, is_approved, created_at, updated_at)
      VALUES (${userId}, ${normalizedEmail}, ${name || normalizedEmail.split('@')[0]}, ${hashedPassword}, ${role}, true, true, NOW(), NOW())
    `

    // Send credentials email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://aleasignature.com'}/login`
    await getResend().emails.send({
      from: 'Alea Signature <noreply@aleasignature.com>',
      to: normalizedEmail,
      subject: 'Tu cuenta en Alea Signature — Credenciales de acceso',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; letter-spacing: 0.1em;">Aleasignature.</h1>
          </div>
          <h2 style="font-size: 20px; margin-bottom: 16px;">Bienvenido/a, ${name || normalizedEmail.split('@')[0]}</h2>
          <p style="color: #666; line-height: 1.6;">
            Has sido dado/a de alta como <strong>${role}</strong> en Alea Signature. Aquí están tus credenciales de acceso:
          </p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Email</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; word-break: break-all;">${normalizedEmail}</p>
            <p style="margin: 0 0 8px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Contraseña Temporal</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold; font-family: monospace;">${tempPassword}</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; letter-spacing: 0.05em;">
              Iniciar Sesión
            </a>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            <strong>Importante:</strong> Esta contraseña es temporal. Te recomendamos cambiarla inmediatamente después de iniciar sesión.
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario creado y credenciales enviadas.',
      email: normalizedEmail,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const result = await getSql()`SELECT * FROM pending_invitations WHERE token = ${token}`

    if (!result[0]) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    const invitation = result[0]

    if (invitation.accepted) {
      return NextResponse.json({ error: 'Invitation already accepted', accepted: true }, { status: 400 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
