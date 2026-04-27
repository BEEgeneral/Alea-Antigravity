import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.NEON_HOST || 'ep-plain-fog-al6rviiz-pooler.c-3.eu-central-1.aws.neon.tech',
  port: parseInt(process.env.NEON_PORT || '5432', 10),
  user: process.env.NEON_USER || 'neondb_owner',
  password: process.env.NEON_PASSWORD,
  database: process.env.NEON_DATABASE || 'neondb',
  ssl: { rejectUnauthorized: false },
});

export default pool;
