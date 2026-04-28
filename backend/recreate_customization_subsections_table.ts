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

interface OldTableExistsRow {
  exists: boolean;
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Recreating customization_subsections table...');

    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS customization_subsections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);

    await client.query(`
      ALTER TABLE customization_subsections
      ADD COLUMN IF NOT EXISTS section_id INT;
    `);

    await client.query(`
      ALTER TABLE customization_subsections
      DROP CONSTRAINT IF EXISTS customization_subsections_section_id_fkey;
    `);

    await client.query(`
      ALTER TABLE customization_subsections
      DROP COLUMN IF EXISTS description,
      DROP COLUMN IF EXISTS created_at;
    `);

    await client.query(`
      ALTER TABLE customization_subsections
      ADD CONSTRAINT customization_subsections_section_id_fkey
      FOREIGN KEY (section_id) REFERENCES customization_sections(id) ON DELETE CASCADE;
    `);

    const oldTableExists = await client.query<OldTableExistsRow>(`
      SELECT to_regclass('public.customization_subsectionss') IS NOT NULL AS exists
    `);

    if (oldTableExists.rows[0]?.exists) {
      await client.query(`
        INSERT INTO customization_subsections (id, section_id, name)
        SELECT id, NULL, name
        FROM customization_subsectionss
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    await client.query(`
      DO $$
      DECLARE
        max_id bigint;
      BEGIN
        SELECT MAX(id) INTO max_id FROM customization_subsections;
        IF max_id IS NULL THEN
          PERFORM setval(pg_get_serial_sequence('customization_subsections', 'id'), 1, false);
        ELSE
          PERFORM setval(pg_get_serial_sequence('customization_subsections', 'id'), max_id, true);
        END IF;
      END
      $$;
    `);

    await client.query(`
      ALTER TABLE customization
      DROP CONSTRAINT IF EXISTS customization_subsection_id_fkey;
    `);

    await client.query(`
      ALTER TABLE customization
      ADD CONSTRAINT customization_subsection_id_fkey
      FOREIGN KEY (subsection_id) REFERENCES customization_subsections(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    if (oldTableExists.rows[0]?.exists) {
      await client.query(`DROP TABLE IF EXISTS customization_subsectionss;`);
    }

    await client.query('COMMIT');

    const exists = await client.query<TableExistsResult>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'customization_subsections'
      ) AS exists
    `);

    console.log('customization_subsections table exists:', exists.rows[0]?.exists);

    const cols = await client.query<ColumnInfo>(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'customization_subsections'
      ORDER BY ordinal_position
    `);

    console.log('Columns:', JSON.stringify(cols.rows, null, 2));

  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});