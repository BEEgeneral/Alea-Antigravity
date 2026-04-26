import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST() {
  try {
    const { error } = await insforge.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('insforge_token');
    return response;
  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}