const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log("Creating servers table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "servers" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "ip_address" INET NOT NULL,
        "label" VARCHAR(100),
        "created_at" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "servers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companyList"("id") ON DELETE CASCADE
      );
    `);

    const exists = await client.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'servers'
      ) AS exists`
    );

    console.log("servers table exists:", exists.rows[0].exists);

    const cols = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'servers' 
       ORDER BY ordinal_position`
    );
    console.log("Columns:", JSON.stringify(cols.rows, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
