import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // InsForge email verification typically uses OTP or token in URL
    // Try using verifyEmail method if available
    const { data, error } = await (insforge.auth as any).verifyEmail({
      email,
      otp: token
    });

    if (error) {
      
      return NextResponse.json(
        { error: error.message || 'Failed to verify email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error: any) {
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
