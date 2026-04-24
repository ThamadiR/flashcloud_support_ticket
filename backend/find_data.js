const { Client } = require('pg');

async function checkDatabase(dbName) {
  const client = new Client({
    connectionString: `postgresql://postgres:pasw0rd@localhost:5432/${dbName}?schema=public`
  });
  
  try {
    await client.connect();
    console.log(`\n\n=== CHECKING DATABASE [${dbName}] ===`);
    
    // Check User table
    try {
      const res = await client.query('SELECT * FROM "User"');
      console.log(`Found ${res.rows.length} rows in 'User' table inside ${dbName}.`);
      if (res.rows.length > 0) console.log('Data:', res.rows.slice(0,2));
    } catch(e) { console.log(`No 'User' table in ${dbName}.`); }

    // Check Management table
    try {
      const res2 = await client.query('SELECT * FROM "Management"');
      console.log(`Found ${res2.rows.length} rows in 'Management' table inside ${dbName}.`);
      if (res2.rows.length > 0) console.log('Data:', res2.rows.slice(0,2));
    } catch(e) { console.log(`No 'Management' table in ${dbName}.`); }

  } catch (err) {
    console.error(`Could not connect to ${dbName}:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  await checkDatabase('test');
  await checkDatabase('postgres');
  console.log('\nDone scanning databases!');
}

main();
