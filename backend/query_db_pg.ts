import { Client } from 'pg';
import 'dotenv/config';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  console.log('--- companyList ---');
  try {
    const resCount = await client.query('SELECT COUNT(*) as count FROM \"company\"');
    const companyCount = resCount.rows[0].count;
    const resList = await client.query('SELECT * FROM \"company\" LIMIT 5');
    console.log(\Count: \\);
    console.log(JSON.stringify(resList.rows, null, 2));
  } catch (e) {
    console.error('Error querying company:', e.message);
  }

  console.log('\n--- company_servers ---');
  try {
    const resCount = await client.query('SELECT COUNT(*) as count FROM \"companyServer\"');
    const serverCount = resCount.rows[0].count;
    const resList = await client.query('SELECT * FROM \"companyServer\" LIMIT 5');
    console.log(\Count: \\);
    console.log(JSON.stringify(resList.rows, null, 2));
  } catch (e) {
    console.error('Error querying companyServer:', e.message);
  }

  console.log('\n--- Management (User) ---');
  try {
    const resCount = await client.query('SELECT COUNT(*) as count FROM \"user\"');
    const userCount = resCount.rows[0].count;
    const resList = await client.query('SELECT * FROM \"user\" LIMIT 5');
    console.log(\Count: \\);
    console.log(JSON.stringify(resList.rows, null, 2));
  } catch (e) {
    console.error('Error querying user:', e.message);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
});
