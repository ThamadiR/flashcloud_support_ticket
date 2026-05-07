
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
    const tables = ['companyList', 'servers', 'tenants', 'sip_configs'];
    for (const table of tables) {
      console.log(`Standardizing table: ${table}`);
      
      // Update existing NULL created_at to current time
      await connection.query(`UPDATE \`${table}\` SET created_at = NOW() WHERE created_at IS NULL OR created_at = ''`);
      
      // Modify column to be DATETIME and NOT NULL with DEFAULT CURRENT_TIMESTAMP
      // We use MODIFY because the column already exists
      try {
        await connection.query(`ALTER TABLE \`${table}\` MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        console.log(`Column created_at standardized for ${table}`);
      } catch (err: any) {
        console.error(`Error standardizing ${table}:`, err.message);
        // If it fails because it's a varchar, we might need to convert it first
        if (err.message.includes('Incorrect datetime value')) {
             console.log(`Attempting conversion for ${table}...`);
             await connection.query(`ALTER TABLE \`${table}\` MODIFY COLUMN created_at VARCHAR(255)`);
             await connection.query(`UPDATE \`${table}\` SET created_at = NOW() WHERE created_at NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}'`);
             await connection.query(`ALTER TABLE \`${table}\` MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        }
      }
    }
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
