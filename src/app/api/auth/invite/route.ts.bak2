import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const { token, password, name } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    const { data: invitation, error: fetchError } = await insforge
      .database
      .from('pending_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    if (invitation.accepted) {
      return NextResponse.json(
        { error: 'Invitation already accepted' },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    const { data: authData, error: signUpError } = await insforge.auth.signUp({
      email: invitation.email,
      password,
      name: name || invitation.email.split('@')[0]
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (authData?.user) {
      await insforge
        .database
        .from('pending_invitations')
        .update({ accepted: true })
        .eq('id', invitation.id);

      const { error: profileError } = await insforge.database.from('user_profiles').insert({
        id: authData.user.id,
        role: invitation.role,
        is_active: true,
        is_approved: true
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. You can now login.'
    });
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const { data: invitation, error } = await insforge
      .database
      .from('pending_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    if (invitation.accepted) {
      return NextResponse.json({ error: 'Invitation already accepted', accepted: true }, { status: 400 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      role: invitation.role
    });
  } catch (error: any) {
    console.error('Check invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}