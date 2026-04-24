import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  const first = FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)].toLowerCase();
  const last = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)].toLowerCase();
  return `${first}_${last}_${index}`;
}

async function main(): Promise<void> {
  const requestedCount = Number.parseInt(process.argv[2] || '50', 10);
  const count = Number.isNaN(requestedCount) || requestedCount <= 0 ? 50 : requestedCount;

  const lastUser = await prisma.user.findFirst({ orderBy: { id: 'desc' } });
  const startId = lastUser ? lastUser.id + 1 : 1;

  const hashedPassword = await bcrypt.hash('password123', 10);
  const batchTime = Date.now();

  const users = Array.from({ length: count }, (_, i) => {
    const id = startId + i;
    const username = randomUsername(i + 1);

    return {
      id,
      username,
      email: `${username}_${batchTime}_${i + 1}@gmail.com`,
      password: hashedPassword,
      contactNo: randomPhone(),
    };
  });

  await prisma.user.createMany({ data: users });
  console.log(`Inserted ${count} users successfully. IDs: ${startId} to ${startId + count - 1}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed users:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
