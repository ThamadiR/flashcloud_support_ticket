const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Sending insert...');
    const user = await prisma.user.create({
      data: {
        username: 'testuser3',
        email: 'test3' + Date.now() + '@example.com',
        password: 'abc'
      }
    });
    console.log('SUCCESS! User inserted: ', user);
  } catch(e) {
    console.error('ERROR OCCURRED:');
    console.error(e.message);
  }
}
main();
