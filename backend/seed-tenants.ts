import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface CompanyRow {
  id: number;
  name: string;
}

interface TenantSeed {
  name: string;
  description: string;
}

interface CountRow {
  total: number;
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const companiesResult = await client.query<CompanyRow>(
      'SELECT id, name FROM "companyList" ORDER BY id ASC LIMIT 8'
    );

    const companies: CompanyRow[] = companiesResult.rows;
    if (companies.length === 0) {
      console.log('No companies found. Add companies first, then run this script again.');
      return;
    }

    let inserted: number = 0;

    for (const company of companies) {
      const tenants: TenantSeed[] = [
        {
          name: `${company.name} Tenant Alpha`,
          description: `Primary tenant for ${company.name}`,
        },
        {
          name: `${company.name} Tenant Beta`,
          description: `Secondary tenant for ${company.name}`,
        },
      ];

      for (const tenant of tenants) {
        await client.query(
          'INSERT INTO "tenants" (company_id, name, description) VALUES ($1, $2, $3)',
          [company.id, tenant.name, tenant.description]
        );
        inserted += 1;
      }
    }

    const countResult = await client.query<CountRow>(
      'SELECT COUNT(*)::int AS total FROM "tenants"'
    );
    const total: number = countResult.rows[0]?.total ?? 0;

    console.log(`Inserted ${inserted} tenant rows.`);
    console.log(`Total tenants in table: ${total}`);

  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error('Error seeding tenants:', error);
  process.exit(1);
});