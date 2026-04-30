import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as pg from 'pg';

const pool = new pg.Pool({
  host: process.env.NEON_HOST || 'ep-plain-fog-al6rviiz-pooler.c-3.eu-central-1.aws.neon.tech',
  port: 5432,
  user: process.env.NEON_USER || 'neondb_owner',
  password: process.env.NEON_PASSWORD || 'npg_BeHqsl30DKZA',
  database: process.env.NEON_DATABASE || 'neondb',
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      propertiesResult,
      investorsResult,
      documentsResult,
      signalsResult,
      recentPropertiesResult,
      signalsBySourceResult,
    ] = await Promise.all([
      pool.query<{ count: string; avg_price: string | null }>(`SELECT COUNT(*), AVG(price::numeric) FROM properties WHERE price IS NOT NULL`),
      pool.query<{ count: string }>(`SELECT COUNT(*) FROM investors`),
      pool.query<{ count: string }>(`SELECT COUNT(*) FROM documents`),
      pool.query<{ count: string; avg_score: string | null }>(`SELECT COUNT(*), AVG(alea_score) FROM signals`),
      pool.query(`SELECT id, title, price, status, asset_type, location_hint, created_at FROM properties ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT source, COUNT(*) as count, AVG(alea_score) as avg_score FROM signals GROUP BY source ORDER BY count DESC`),
    ]);

    const properties = parseInt(propertiesResult.rows[0].count);
    const investors = parseInt(investorsResult.rows[0].count);
    const documents = parseInt(documentsResult.rows[0].count);
    const signals = parseInt(signalsResult.rows[0].count);
    const avgPrice = propertiesResult.rows[0].avg_price ? parseFloat(propertiesResult.rows[0].avg_price) : null;
    const avgSignalScore = signalsResult.rows[0].avg_score ? parseFloat(signalsResult.rows[0].avg_score) : null;

    return NextResponse.json({
      stats: {
        properties,
        investors,
        documents,
        signals,
        avgPrice,
        avgSignalScore,
        totalPortfolioValue: avgPrice && properties ? avgPrice * properties : null,
      },
      recentProperties: recentPropertiesResult.rows,
      signalsBySource: signalsBySourceResult.rows,
      scanner_version: '2.0.0',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
