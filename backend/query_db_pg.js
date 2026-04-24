
const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();

    console.log("--- companyList ---");
    const companyRes = await client.query("SELECT * FROM \"companyList\" LIMIT 5");
    const companyCountRes = await client.query("SELECT COUNT(*) FROM \"companyList\"");
    console.log(`Count: ${companyCountRes.rows[0].count}`);
    console.log(JSON.stringify(companyRes.rows, null, 2));

    console.log("\n--- company_servers ---");
    const serverRes = await client.query("SELECT * FROM company_servers LIMIT 5");
    const serverCountRes = await client.query("SELECT COUNT(*) FROM company_servers");
    console.log(`Count: ${serverCountRes.rows[0].count}`);
    console.log(JSON.stringify(serverRes.rows, null, 2));

    console.log("\n--- Management ---");
    const userRes = await client.query("SELECT * FROM \"Management\" LIMIT 5");
    const userCountRes = await client.query("SELECT COUNT(*) FROM \"Management\"");
    console.log(`Count: ${userCountRes.rows[0].count}`);
    console.log(JSON.stringify(userRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
