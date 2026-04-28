import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:pasw0rd@localhost:5432/postgres?schema=public',
});

async function run(): Promise<void> {
  try {
    await pool.query(
      'ALTER TABLE "public"."Management" ADD COLUMN IF NOT EXISTS "contactNo" text'
    );
    console.log('Column added successfully.');
  } catch (e: unknown) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();