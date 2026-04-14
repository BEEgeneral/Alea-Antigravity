import { NextRequest, NextResponse } from 'next/server';
import { insforge, getUserProfile } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name: name || email.split('@')[0]
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.error },
        { status: 400 }
      );
    }

    if (!data?.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const { error: profileError } = await insforge.database.from('profiles').insert({
      id: data.user.id,
      role: 'investor',
      is_active: true,
      is_approved: false
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return NextResponse.json({
      user: data.user,
      requireEmailVerification: data.requireEmailVerification,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}