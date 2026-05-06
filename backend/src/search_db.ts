import { pool } from "./config/db";

async function searchDatabase() {
  try {
    const [tables] = await pool.query("SHOW TABLES");
    for (const tableRow of tables as any[]) {
      const tableName = Object.values(tableRow)[0] as string;
      try {
        const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = 640`);
        if ((rows as any[]).length > 0) {
          console.log(`Found 640 in ${tableName} (id column):`, rows);
        }
      } catch (e) {}
      
      try {
        const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE ticket_id = 640`);
        if ((rows as any[]).length > 0) {
          console.log(`Found 640 in ${tableName} (ticket_id column):`, rows);
        }
      } catch (e) {}

      try {
        const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE ticket_code LIKE '%640%'`);
        if ((rows as any[]).length > 0) {
          console.log(`Found 640 in ${tableName} (ticket_code column):`, rows);
        }
      } catch (e) {}
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

searchDatabase();
