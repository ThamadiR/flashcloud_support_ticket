
import mysql from 'mysql2/promise';
import 'dotenv/config';

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'passw0rd',
    database: process.env.DB_NAME || 'support_db',
  });

  try {
    const [tables] = await connection.execute<mysql.RowDataPacket[]>('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log('Tables in database:', tableNames);

    const summary = [];
    for (const tableName of tableNames) {
      const [countRows] = await connection.execute<mysql.RowDataPacket[]>(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      const count = countRows[0].count;
      summary.push({ Table: tableName, Count: count });
      
      console.log(`\n--- Table: ${tableName} (Total: ${count}) ---`);
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(`SELECT * FROM \`${tableName}\` LIMIT 2`);
      console.log(JSON.stringify(rows, null, 2));
    }
    console.log('\n=== Database Summary ===');
    console.table(summary);

  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
