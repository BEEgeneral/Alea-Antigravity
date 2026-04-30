const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');

async function createAdmin() {
  // Read env from .env.local
  const envContent = fs.readFileSync('/opt/data/Alea-Antigravity/.env.local', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
  });

  const host = env.NEON_HOST;
  const port = env.NEON_PORT;
  const user = env.NEON_USER;
  const password = env.NEON_PASSWORD;
  const database = env.NEON_DATABASE;

  console.log('Connecting to:', `postgresql://${user}:***@${host}:${port}/${database}`);
  
  const sql = neon(`postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`);
  
  const email = 'beenocode@gmail.com';
  const name = 'BEEgeneral';
  const role = 'admin';
  const passwordPlain = 'Gala@1998';
  const hashedPassword = await bcrypt.hash(passwordPlain, 12);
  
  // Check if exists
  const existing = await sql`SELECT id, email, role FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing[0]) {
    await sql`UPDATE users SET password_hash = ${hashedPassword}, role = ${role}, is_active = true, is_approved = true, updated_at = NOW() WHERE email = ${email.toLowerCase()}`;
    console.log('Updated existing user to admin:', email, '| role:', role);
  } else {
    const userId = crypto.randomUUID();
    await sql`INSERT INTO users (id, email, name, password_hash, role, is_active, is_approved, created_at, updated_at) VALUES (${userId}, ${email.toLowerCase()}, ${name}, ${hashedPassword}, ${role}, true, true, NOW(), NOW())`;
    console.log('Created admin user:', email, '| role:', role);
  }
}

createAdmin().catch(console.error);
