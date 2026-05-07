import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'support_db';
const DB_PORT = Number(process.env.DB_PORT ?? '3306');

async function main() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
  });

  console.log('Connected to MySQL');

  const [columns] = await connection.execute('SHOW COLUMNS FROM `Management`');
  console.log('Columns in Management table:');
  console.table(columns);

  await connection.end();
}

main().catch(console.error);
