const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Create tenants table using the existing companyList table in this database.
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tenants (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES public."companyList"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const companiesResult = await client.query(
      'SELECT id, name FROM public."companyList" ORDER BY id ASC LIMIT 10'
    );

    const companies = companiesResult.rows;
    if (companies.length === 0) {
      console.log('tenants table created, but no companies found to seed tenant rows.');
      return;
    }

    // Keep reruns predictable by clearing existing tenant rows first.
    await client.query('DELETE FROM public.tenants');

    let inserted = 0;
    for (const company of companies) {
      const rows = [
        {
          name: `${company.name} Tenant Alpha`,
          description: `Primary tenant for ${company.name}`,
        },
        {
          name: `${company.name} Tenant Beta`,
          description: `Secondary tenant for ${company.name}`,
        },
      ];

      for (const row of rows) {
        await client.query(
          'INSERT INTO public.tenants (company_id, name, description) VALUES ($1, $2, $3)',
          [company.id, row.name, row.description]
        );
        inserted += 1;
      }
    }

    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tenants'
      ) AS exists
    `);

    const totalResult = await client.query('SELECT COUNT(*)::int AS total FROM public.tenants');

    console.log('tenants table exists:', tableExistsResult.rows[0].exists);
    console.log('inserted tenant rows:', inserted);
    console.log('total tenant rows:', totalResult.rows[0].total);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error creating/seeding tenants:', error);
  process.exit(1);
});
