import { pool } from "../src/config/db";

async function main() {
  try {
    const [tables] = await pool.query("SHOW TABLES");
    console.log("Tables in database:", tables);
    const [desc] = await pool.query("DESCRIBE companyList");
    console.log("Columns in companyList:", desc);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
