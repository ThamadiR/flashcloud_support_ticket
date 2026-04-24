const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:pasw0rd@localhost:5432/postgres?schema=public' });

async function run() {
  try {
     await pool.query('ALTER TABLE "public"."Management" ADD COLUMN IF NOT EXISTS "contactNo" text');
     console.log('Column added successfully.');
  } catch(e) {
     console.error(e);
  } finally {
     pool.end();
  }
}
run();
