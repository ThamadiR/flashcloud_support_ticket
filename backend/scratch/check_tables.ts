
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'support_db',
  });

  try {
    const tables = ['servers', 'tenants', 'sip_configs'];
    for (const table of tables) {
      console.log(`Fixing table: ${table}`);
      // Delete any row with ID 0 first
      await connection.query(`DELETE FROM \`${table}\` WHERE id = 0`);
      // Add AUTO_INCREMENT
      await connection.query(`ALTER TABLE \`${table}\` MODIFY COLUMN id INT AUTO_INCREMENT`);
      console.log(`AUTO_INCREMENT added to ${table}.id`);
    }
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
