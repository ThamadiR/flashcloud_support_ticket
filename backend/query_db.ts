

import mysql from 'mysql2/promise';
import 'dotenv/config';

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'pasw0rd',
    database: process.env.DB_NAME || 'postgres',
  });

  console.log('--- companyList ---');
  const [companyCountRows] = await connection.execute<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM companyList');
  const companyCount = companyCountRows[0]?.count;
  const [companies] = await connection.execute('SELECT * FROM companyList LIMIT 5');
  console.log(`Count: ${companyCount}`);
  console.log(JSON.stringify(companies, null, 2));

  console.log('\n--- company_servers ---');
  const [serverCountRows] = await connection.execute<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM companyServer');
  const serverCount = serverCountRows[0]?.count;
  const [servers] = await connection.execute('SELECT * FROM companyServer LIMIT 5');
  console.log(`Count: ${serverCount}`);
  console.log(JSON.stringify(servers, null, 2));

  console.log('\n--- Management (User) ---');
  const [userCountRows] = await connection.execute<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM user');
  const userCount = userCountRows[0]?.count;
  const [users] = await connection.execute('SELECT * FROM user LIMIT 5');
  console.log(`Count: ${userCount}`);
  console.log(JSON.stringify(users, null, 2));

  await connection.end();
}

main().catch((e) => {
  console.error(e);
});