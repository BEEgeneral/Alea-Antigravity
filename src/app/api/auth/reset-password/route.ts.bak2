import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const { newPassword, otp } = await request.json();

    if (!newPassword || !otp) {
      return NextResponse.json(
        { error: 'New password and OTP token are required' },
        { status: 400 }
      );
    }

    const { data, error } = await insforge.auth.resetPassword({
      newPassword,
      otp
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}