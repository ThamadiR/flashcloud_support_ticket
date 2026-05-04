import { Client } from 'pg';
import dotenv from 'dotenv';
interface TableExistsResult {
  exists: boolean;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
}

dotenv.config();

async function main(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Creating sip_configs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "sip_configs" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "sip_count" INTEGER,
        "sip_provider" VARCHAR(255),
        "sip_channel_count" INTEGER,
        "sip_description" TEXT,
        "license_count" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "sip_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);

    const exists = await client.query<TableExistsResult>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'sip_configs'
      ) AS exists
    `);

    console.log('sip_configs table exists:', exists.rows[0]?.exists);

    const columns = await client.query<ColumnInfo>(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sip_configs'
      ORDER BY ordinal_position
    `);

    console.log('Columns:', JSON.stringify(columns.rows, null, 2));

  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});