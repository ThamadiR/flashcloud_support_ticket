import { pool } from './config/db';

async function inspect() {
  try {
    const [tables]: any = await pool.query("SHOW TABLES");
    console.log("Tables in DB:", tables);
    
    for (const t of tables) {
      const tableName = Object.values(t)[0];
      if (String(tableName).toLowerCase().includes('company')) {
        console.log(`\nFound company table: ${tableName}`);
        const [cols]: any = await pool.query(`SHOW COLUMNS FROM \`${String(tableName)}\``);
        console.log(`Columns in ${tableName}:`, cols.map((c: any) => c.Field));
        
        const [rows]: any = await pool.query(`SELECT * FROM \`${String(tableName)}\` LIMIT 5`);
        console.log(`Sample rows in ${tableName}:`, rows);
      }
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    process.exit(0);
  }
}

inspect();
