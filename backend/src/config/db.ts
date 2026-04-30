import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const DB_HOST: string = process.env.DB_HOST || 'localhost';
const DB_USER: string = process.env.DB_USER || 'root';
const DB_PASS: string = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const DB_NAME: string = process.env.DB_NAME || 'support_db';
const DB_PORT: number = Number(process.env.DB_PORT ?? '3306');

const pool: Pool = mysql.createPool({
  host:               DB_HOST,
  user:               DB_USER,
  password:           DB_PASS,
  database:           DB_NAME,
  port:               DB_PORT,
  waitForConnections: true,
  connectionLimit:    10,
});

export { pool };
export default pool;