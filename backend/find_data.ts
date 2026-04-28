import { Client } from 'pg';

interface UserRow {
  [key: string]: unknown;
}

interface ManagementRow {
  [key: string]: unknown;
}

async function checkDatabase(dbName: string): Promise<void> {
  const client = new Client({
    connectionString: `postgresql://postgres:pasw0rd@localhost:5432/${dbName}?schema=public`
  });

  try {
    await client.connect();
    console.log(`\n\n=== CHECKING DATABASE [${dbName}] ===`);

    // Check User table
    try {
      const res = await client.query<UserRow>('SELECT * FROM "User"');
      console.log(`Found ${res.rows.length} rows in 'User' table inside ${dbName}.`);
      if (res.rows.length > 0) console.log('Data:', res.rows.slice(0, 2));
    } catch {
      console.log(`No 'User' table in ${dbName}.`);
    }

    // Check Management table
    try {
      const res2 = await client.query<ManagementRow>('SELECT * FROM "Management"');
      console.log(`Found ${res2.rows.length} rows in 'Management' table inside ${dbName}.`);
      if (res2.rows.length > 0) console.log('Data:', res2.rows.slice(0, 2));
    } catch {
      console.log(`No 'Management' table in ${dbName}.`);
    }

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Could not connect to ${dbName}:`, err.message);
    } else {
      console.error(`Could not connect to ${dbName}:`, err);
    }
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  await checkDatabase('test');
  await checkDatabase('postgres');
  console.log('\nDone scanning databases!');
}

main();