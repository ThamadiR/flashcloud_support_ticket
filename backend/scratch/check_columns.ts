import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '192.168.10.3',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'passw0rd',
    database: process.env.DB_NAME || 'support_db',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    const [rows] = await connection.execute('DESCRIBE Management');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

checkColumns();
