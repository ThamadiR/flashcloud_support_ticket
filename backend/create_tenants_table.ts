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
    console.log('Creating tenants table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "tenants_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companyList"("id") ON DELETE CASCADE
      );
    `);

    const exists = await client.query<TableExistsResult>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tenants'
      ) AS exists`
    );

    console.log('tenants table exists:', exists.rows[0]?.exists);

    const cols = await client.query<ColumnInfo>(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'tenants'
       ORDER BY ordinal_position`
    );

    console.log('Columns:', JSON.stringify(cols.rows, null, 2));

  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});