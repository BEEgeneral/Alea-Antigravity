const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'ep-plain-fog-al6rviiz-pooler.c-3.eu-central-1.aws.neon.tech',
  port: 5432,
  user: 'neondb_owner',
  password: 'npg_BeHqsl30DKZA',
  database: 'neondb',
  ssl: { rejectUnauthorized: false },
  max: 3,
});

const data = JSON.parse(fs.readFileSync('/tmp/insforge_data.json', 'utf8'));

async function migrate() {
  let totalInserted = 0;
  let errors = [];

  for (const [table, rows] of Object.entries(data)) {
    if (!rows || rows.length === 0) continue;

    for (const row of rows) {
      try {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const colNames = columns.join(', ');

        const query = `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
        await pool.query(query, values);
        totalInserted++;
      } catch (e) {
        errors.push(`${table}: ${e.message.substring(0, 100)}`);
      }
    }
    console.log(`  ${table}: ${rows.length} rows`);
  }

  console.log(`\nTotal inserted: ${totalInserted}`);
  if (errors.length > 0) {
    console.log('Errors:', errors.slice(0, 5));
  }
  await pool.end();
}

migrate().catch(e => { console.error(e); pool.end(); });
