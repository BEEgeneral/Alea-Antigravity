import { NextResponse } from 'next/server';

const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

export function rateLimit(ip: string): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const key = `rate_${ip}`;
    const current = rateLimitStore.get(key);

    if (!current || now - current.timestamp > WINDOW_MS) {
        rateLimitStore.set(key, { count: 1, timestamp: now });
        return { success: true, remaining: MAX_REQUESTS - 1, reset: WINDOW_MS };
    }

    if (current.count >= MAX_REQUESTS) {
        return { success: false, remaining: 0, reset: WINDOW_MS - (now - current.timestamp) };
    }

    current.count++;
    return { success: true, remaining: MAX_REQUESTS - current.count, reset: WINDOW_MS - (now - current.timestamp) };
}

export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (realIP) {
        return realIP;
    }
    return 'anonymous';
}

export function checkRateLimit(request: Request): NextResponse | null {
    const ip = getClientIP(request);
    const result = rateLimit(ip);

    if (!result.success) {
        return NextResponse.json(
            { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
            { 
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil(result.reset / 1000)),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(result.reset),
                }
            }
        );
    }

    return null;
}

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now - value.timestamp > WINDOW_MS * 2) {
            rateLimitStore.delete(key);
        }
    }
}, WINDOW_MS);
