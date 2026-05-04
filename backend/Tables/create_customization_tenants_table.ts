import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface TableExistsResult {
  exists: boolean;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Creating customization_tenants table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS customization_tenants (
        id SERIAL PRIMARY KEY,
        customization_id INT REFERENCES customization(id) ON DELETE CASCADE,
        tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    const exists = await client.query<TableExistsResult>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'customization_tenants'
      ) AS exists
    `);

    console.log('customization_tenants table exists:', exists.rows[0]?.exists);

    const cols = await client.query<ColumnInfo>(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'customization_tenants'
      ORDER BY ordinal_position
    `);

    console.log('Columns:', JSON.stringify(cols.rows, null, 2));

  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});