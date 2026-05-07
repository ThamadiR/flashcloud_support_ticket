import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function addColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '192.168.10.3',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'passw0rd',
    database: process.env.DB_NAME || 'support_db',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    console.log('Adding country and countryCode columns...');
    await connection.execute('ALTER TABLE Management ADD COLUMN IF NOT EXISTS country VARCHAR(255), ADD COLUMN IF NOT EXISTS countryCode VARCHAR(10);');
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

addColumns();
