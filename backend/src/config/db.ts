import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool: Pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'passw0rd',
  database:           process.env.DB_NAME     || 'support_db',
  waitForConnections: true,
  connectionLimit:    10,
});

export default pool;