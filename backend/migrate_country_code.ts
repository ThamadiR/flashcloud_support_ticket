import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'support_db',
  });

  try {
    console.log('Adding countryCode column to Management table...');
    await connection.execute('ALTER TABLE `Management` ADD COLUMN `countryCode` VARCHAR(10) DEFAULT NULL AFTER `country`');
    console.log('Migration successful!');
  } catch (error: any) {
    if (error.code === 'ER_DUP_COLUMN_NAMES') {
      console.log('Column countryCode already exists.');
    } else {
      console.error('Migration failed:', error.message);
    }
  } finally {
    await connection.end();
  }
}

migrate();
