import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface DbInfoRow {
  database_name: string;
  current_schema: string;
  current_user: string;
}

interface TableMatchRow {
  table_schema: string;
  table_name: string;
}

interface ColumnInfoRow {
  column_name: string;
  data_type: string;
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const dbInfo = await client.query<DbInfoRow>(`
      SELECT
        current_database() AS database_name,
        current_schema()   AS current_schema,
        current_user       AS current_user
    `);

    const tableMatches = await client.query<TableMatchRow>(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name ILIKE '%tenant%'
      ORDER BY table_schema, table_name
    `);

    const tenantsColumns = await client.query<ColumnInfoRow>(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tenants'
      ORDER BY ordinal_position
    `);

    console.log('DB_INFO',                JSON.stringify(dbInfo.rows[0],        null, 2));
    console.log('TENANT_TABLE_MATCHES',   JSON.stringify(tableMatches.rows,     null, 2));
    console.log('TENANTS_COLUMNS_PUBLIC', JSON.stringify(tenantsColumns.rows,   null, 2));

  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error('INSPECT_ERROR', error);
  process.exit(1);
});