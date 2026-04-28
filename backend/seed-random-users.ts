import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from './src/config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
}

interface UserSeed {
  username:  string;
  email:     string;
  password:  string;
  contactNo: string;
}

const FIRST_NAMES = [
  'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Brown', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young',
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPhone(): string {
  let phone = '';
  for (let i = 0; i < 10; i += 1) {
    phone += randInt(0, 9).toString();
  }
  return phone;
}

function randomUsername(index: number): string {
  const first = FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)]!.toLowerCase();
  const last  = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)]!.toLowerCase();
  return `${first}_${last}_${index}`;
}

async function main(): Promise<void> {
  const requestedCount = Number.parseInt(process.argv[2] || '50', 10);
  const count = Number.isNaN(requestedCount) || requestedCount <= 0 ? 50 : requestedCount;

  // Get last user id
  const [lastUserRows] = await pool.execute<UserRow[]>(
    'SELECT `id` FROM `User` ORDER BY `id` DESC LIMIT 1'
  );
  const lastUser = lastUserRows[0] ?? null;
  const startId  = lastUser ? lastUser.id + 1 : 1;

  const hashedPassword = await bcrypt.hash('password123', 10);
  const batchTime      = Date.now();

  const users: UserSeed[] = Array.from({ length: count }, (_, i) => {
    const username = randomUsername(i + 1);
    return {
      username,
      email:     `${username}_${batchTime}_${i + 1}@gmail.com`,
      password:  hashedPassword,
      contactNo: randomPhone(),
    };
  });

  // Insert users one by one (MySQL doesn't support createMany like Prisma)
  let insertedCount = 0;
  for (const user of users) {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO \`User\` (\`username\`, \`email\`, \`password\`, \`contactNo\`)
       VALUES (?, ?, ?, ?)`,
      [user.username, user.email, user.password, user.contactNo]
    );
    insertedCount++;
  }

  console.log(
    `Inserted ${insertedCount} users successfully. IDs: ${startId} to ${startId + count - 1}`
  );
}

main()
  .catch((error: unknown) => {
    console.error('Failed to seed users:', error);
    process.exitCode = 1;
  })
  .finally(async (): Promise<void> => {
    await pool.end();
  });