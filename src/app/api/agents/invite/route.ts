import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { auth } from '@/lib/auth';

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return { error: 'No autenticado', status: 401 };
  const role = (session.user as any)?.role;
  const email = (session.user as any)?.email?.toLowerCase();
  const isGodMode = email === 'beenocode@gmail.com' || email === 'albertogala@beenocode.com';
  if (role !== 'admin' && !isGodMode) return { error: 'Solo administradores', status: 403 };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const { full_name, email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email y rol son obligatorios' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tempPassword = randomBytes(8).toString('base64').slice(0, 12);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Check if user already exists
    const existing = await getSql()`SELECT id FROM users WHERE email = ${normalizedEmail}`;
    if (existing[0]) {
      return NextResponse.json({ error: 'Ya existe un usuario con este email.' }, { status: 400 });
    }

    // 1. Create user in Neon (users table — for NextAuth login)
    const userId = crypto.randomUUID();
    await getSql()`
      INSERT INTO users (id, email, name, password_hash, role, is_active, is_approved, created_at, updated_at)
      VALUES (${userId}, ${normalizedEmail}, ${full_name || normalizedEmail.split('@')[0]}, ${hashedPassword}, ${role}, true, true, NOW(), NOW())
    `;

    // 2. Create agent record in InsForge via REST
    let insforgeAgentId: string | null = null;
    try {
      const insforgeRes = await fetch(`${process.env.NEXT_PUBLIC_INSFORGE_URL}/collections/agents/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.INSFORGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          full_name: full_name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role,
          has_centurion_access: role === 'admin',
          is_approved: true,
          created_at: new Date().toISOString(),
        }),
      });
      if (!insforgeRes.ok) {
        console.error('[agent-invite] InsForge agent insert failed:', await insforgeRes.text());
      }
    } catch (insErr) {
      console.error('[agent-invite] InsForge insert error:', insErr);
    }

    // 3. Send credentials email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://aleasignature.com'}/login`;
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Alea Signature <noreply@aleasignature.com>',
        to: normalizedEmail,
        subject: 'Tu cuenta en Alea Signature — Credenciales de acceso',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; letter-spacing: 0.1em;">Aleasignature.</h1>
            </div>
            <h2 style="font-size: 20px; margin-bottom: 16px;">Bienvenido/a, ${full_name || normalizedEmail.split('@')[0]}</h2>
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
              <strong>Importante:</strong> Cambia la contraseña nada más iniciar sesión.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[agent-invite] Email send error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Agente creado. Credenciales enviadas al email.',
      userId,
    });
  } catch (error: any) {
    console.error('[agent-invite] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
