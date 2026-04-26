import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import { runRadarScan, type SignalSource } from '@/lib/radar/scanner';

/**
 * POST /api/radar/scan
 * Trigger RADAR Alea scanner for all or specific sources
 * 
 * Body (optional):
 *   sources: SignalSource[] - ['boe', 'concursos', 'boletin_urbanistico']
 * 
 * Called by: Cron job (n8n/cronjob) every hour
 */
export async function POST(req: Request) {
  try {
    // Allow internal calls (cron) without full auth
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'radar-cron-secret';
    
    let isAuthorized = false;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token === cronSecret) {
        isAuthorized = true;
      } else {
        // Try user auth
        try {
          const client = await createAuthenticatedClient(req as any);
          const { data: { user } } = await client.auth.getCurrentUser();
          isAuthorized = !!user;
        } catch {
          isAuthorized = false;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sources = body.sources as SignalSource[] | undefined;

    // Run scanner
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

  } catch (error: any) {
    ;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/radar/scan
 * Get scanner status and last scan results
 */
export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent signals by source
    const { data: recentSignals, error } = await client
      .database
      .from('signals')
      .select('source, status, alea_score, detected_at')
      .order('detected_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Aggregate by source
    const bySource: Record<string, { total: number; high_score: number; last_24h: number }> = {};
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const signal of recentSignals || []) {
      if (!bySource[signal.source]) {
        bySource[signal.source] = { total: 0, high_score: 0, last_24h: 0 };
      }
      bySource[signal.source].total++;
      if (signal.alea_score >= 65) bySource[signal.source].high_score++;
      if (signal.detected_at > oneDayAgo) bySource[signal.source].last_24h++;
    }

    return NextResponse.json({
      sources: bySource,
      total_signals: recentSignals?.length || 0,
      scanner_version: '1.0.0',
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
