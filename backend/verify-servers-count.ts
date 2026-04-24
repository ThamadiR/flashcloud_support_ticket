import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main(): Promise<void> {
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS total FROM "servers"');
    console.log(`servers_count=${result.rows[0]?.total ?? 0}`);
  } finally {
    await pool.end();
  }
}

main();
