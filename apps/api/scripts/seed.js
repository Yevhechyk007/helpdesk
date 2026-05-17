'use strict';
// Run from apps/api: node scripts/seed.js
const postgres = require('postgres');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load root .env
const envPath = path.resolve(__dirname, '../../../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx === -1) return;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});

const conn = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;
const sql = postgres(conn, { max: 1 });

async function main() {
  const hash = await bcrypt.hash('password123', 12);

  await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES ('admin@helpdesk.dev', ${hash}, 'Admin', 'User', 'admin')
    ON CONFLICT (email) DO UPDATE
      SET password_hash = ${hash},
          role          = 'admin',
          is_active     = true,
          updated_at    = now()
  `;

  console.log('');
  console.log('  Seeded admin user:');
  console.log('    Email   : admin@helpdesk.dev');
  console.log('    Password: password123');
  console.log('    Role    : admin');
  console.log('');

  await sql.end();
}

main().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
