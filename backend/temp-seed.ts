import pool from './src/config/db';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Seeding companies...");
  const companyResults: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const name = `Dummy Company ${i}`;
    const description = `Description for Dummy Company ${i}`;
    const email = `contact${i}@dummycompany.com`;
    const tenantCount = Math.floor(Math.random() * 100);

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO company (name, description, email, tenantCount) VALUES (?, ?, ?, ?)',
      [name, description, email, tenantCount]
    );
    companyResults.push({ id: result.insertId, name, description, email, tenantCount });
  }

  console.log("Seeding users...");
  const userResults: any[] = [];
  for (let i = 1; i <= 50; i++) {
    const username = `dummyuser${i}`;
    const email = `dummyuser${i}@gmail.com`;
    const contactNo = `123456789${i.toString().padStart(2, '0')}`;
    const role = "NON_ADMIN";

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO user (username, email, password, contactNo, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, contactNo, role]
    );
    userResults.push({ id: result.insertId, username, email, contactNo, role });
  }

  console.log("Counts after insertion:");
  const [companyCountRows] = await pool.execute<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM company');
  const [userCountRows] = await pool.execute<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM user');
  
  console.log(`Total companies: ${companyCountRows[0]?.count}`);
  console.log(`Total users: ${userCountRows[0]?.count}`);

  console.log("\nSample of inserted companies:");
  console.log(companyResults.slice(0, 3));

  console.log("\nSample of inserted users:");
  console.log(userResults.slice(0, 3));
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
