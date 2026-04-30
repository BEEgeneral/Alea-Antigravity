import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.NEON_HOST,
  port: parseInt(process.env.NEON_PORT || '5432', 10),
  user: process.env.NEON_USER,
  password: process.env.NEON_PASSWORD,
  database: process.env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false },
});

export default pool;
