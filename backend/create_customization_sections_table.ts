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
    console.log('Creating customization_sections table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS customization_sections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);

    const exists = await client.query<TableExistsResult>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'customization_sections'
      ) AS exists
    `);

    console.log('customization_sections table exists:', exists.rows[0]?.exists);

    const cols = await client.query<ColumnInfo>(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'customization_sections'
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