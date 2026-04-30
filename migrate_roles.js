const { Pool } = require('pg');
const fs = require('fs');

const envContent = fs.readFileSync('/opt/data/Alea-Antigravity/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const pool = new Pool({
  host: env.NEON_HOST,
  port: parseInt(env.NEON_PORT) || 5432,
  user: env.NEON_USER,
  password: env.NEON_PASSWORD,
  database: env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    // Check if investor_interests exists
    const exists = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'investor_interests';
    `);
    
    if (exists.rows.length === 0) {
      console.log('investor_interests does not exist - creating...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS investor_interests (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          investor_id UUID,
          property_id UUID,
          lead_id UUID,
          signal_id UUID,
          role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'both')),
          match_score numeric,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `);
      console.log('Created investor_interests table');
    } else {
      // Add role column if not exists
      await pool.query(`
        ALTER TABLE investor_interests 
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer' 
        CHECK (role IN ('buyer', 'seller', 'both'));
      `);
      console.log('OK: role column added to investor_interests');
    }
    
    const r = await pool.query('SELECT COUNT(*) FROM investor_interests');
    console.log('investor_interests rows:', r.rows[0].count);
  } catch(e) {
    console.error('ERR:', e.message);
  } finally {
    pool.end();
  }
}
migrate();
