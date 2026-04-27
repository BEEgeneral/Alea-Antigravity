import { NextResponse } from 'next/server';
import { runRadarScan, getSignals, type SignalSource } from '@/lib/radar/scanner';
import { auth } from '@/lib/auth';

const CRON_SECRET = process.env.CRON_SECRET || 'radar-cron-secret';

/**
 * POST /api/radar/scan
 * Trigger RADAR Alea scanner for all or specific sources
 *
 * Body (optional):
 *   sources: SignalSource[] - ['boe', 'concursos', 'boletin_urbanistico']
 *
 * Auth: Bearer token (CRON_SECRET) OR valid NextAuth session
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const session = await auth();

    const isCron = authHeader?.replace('Bearer ', '') === CRON_SECRET;
    const isAuthed = !!session?.user;

    if (!isCron && !isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sources = body.sources as SignalSource[] | undefined;

    const results = await runRadarScan(sources);

    const totalFound = results.reduce((sum, r) => sum + r.signals_found, 0);
    const totalCreated = results.reduce((sum, r) => sum + r.signals_created, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: true,
      summary: {
        total_signals_found: totalFound,
        total_signals_created: totalCreated,
        sources_scanned: results.length,
        errors: totalErrors,
      },
      results,
      scanned_at: new Date().toISOString(),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/radar/scan
 * Get scanner status and last scan results
 * Auth: NextAuth session required
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') as SignalSource | null;
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const signals = await getSignals({
      source: source || undefined,
      status: status || undefined,
      limit,
      minScore,
    });

    const bySource: Record<string, { total: number; high_score: number; last_24h: number }> = {};
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const signal of signals) {
      const raw = signal.raw_data as Record<string, unknown> | undefined;
      if (!bySource[signal.source]) {
        bySource[signal.source] = { total: 0, high_score: 0, last_24h: 0 };
      }
      bySource[signal.source].total++;
      if ((raw?.alea_score as number) >= 65) bySource[signal.source].high_score++;
      const createdAt = raw?.created_at as string | undefined;
      if (createdAt && new Date(createdAt) > oneDayAgo) bySource[signal.source].last_24h++;
    }

    return NextResponse.json({
      signals,
      sources: bySource,
      total_signals: signals.length,
      scanner_version: '2.0.0',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
