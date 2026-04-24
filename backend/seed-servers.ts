import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const LABELS = ['Primary', 'Replica', 'Analytics', 'Backup'];

const buildIpAddress = (companyIndex: number, serverIndex: number) => {
  const thirdOctet = ((companyIndex + 1) % 250) + 1;
  const fourthOctet = ((serverIndex + 10) % 250) + 1;
  return `10.20.${thirdOctet}.${fourthOctet}`;
};

async function main(): Promise<void> {
  try {
    const companyResult = await pool.query('SELECT id, name FROM "companyList" ORDER BY id ASC');
    const companies = companyResult.rows as Array<{ id: number; name: string }>;

    if (companies.length === 0) {
      console.log('No companies found. Add companies first, then run this script again.');
      return;
    }

    console.log(`Found ${companies.length} companies. Re-seeding servers table...`);

    await pool.query('DELETE FROM "servers"');

    let insertedCount = 0;

    for (let companyIndex = 0; companyIndex < companies.length; companyIndex += 1) {
      const company = companies[companyIndex];

      for (let serverIndex = 0; serverIndex < 3; serverIndex += 1) {
        const label = `${LABELS[serverIndex % LABELS.length]}-${company.name}`;
        const ipAddress = buildIpAddress(companyIndex, serverIndex);

        await pool.query(
          'INSERT INTO "servers" (company_id, ip_address, label) VALUES ($1, $2::inet, $3)',
          [company.id, ipAddress, label]
        );

        insertedCount += 1;
      }
    }

    console.log(`Inserted ${insertedCount} server rows successfully.`);
  } catch (error) {
    console.error('Error seeding servers:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
