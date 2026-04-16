import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    return NextResponse.json({
        ip: forwardedFor || realIp || cfConnectingIp || 'unknown',
        headers: {
            'x-forwarded-for': forwardedFor,
            'x-real-ip': realIp,
            'cf-connecting-ip': cfConnectingIp
        },
        timestamp: new Date().toISOString()
    });
}