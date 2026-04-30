import { NextRequest, NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge-server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Registration is disabled. Please contact an administrator.' },
    { status: 403 }
  );
}