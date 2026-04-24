const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tenants (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES public."companyList"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const tables = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const hasTenants = tables.rows.some((row) => row.table_name === 'tenants');

    console.log('DATABASE_URL target is connected successfully.');
    console.log('public.tenants exists:', hasTenants);
    console.log('public tables:', tables.rows.map((r) => r.table_name).join(', '));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error ensuring tenants table:', error);
  process.exit(1);
});
