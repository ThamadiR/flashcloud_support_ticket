import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Attempting to insert a test record...");
  try {
    const user = await prisma.user.create({
      data: {
        username: 'testuser2',
        email: 'test2' + Date.now() + '@example.com',
        password: 'abc'
      }
    });
    console.log('SUCCESS! Record inserted successfully:', user);
  } catch(e: any) {
    console.error('ERROR OCCURRED DURING INSERTION:');
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
