import { Pool } from 'pg';

const pool = new Pool({
  host: 'ep-plain-fog-al6rviiz-pooler.c-3.eu-central-1.aws.neon.tech',
  port: 5432,
  user: 'neondb_owner',
  password: 'npg_BeHqsl30DKZA',
  database: 'neondb',
  ssl: { rejectUnauthorized: false },
});

export default pool;
