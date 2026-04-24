
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log("--- companyList ---");
  const companyCount = await prisma.company.count();
  const companies = await prisma.company.findMany({ take: 5 });
  console.log(`Count: ${companyCount}`);
  console.log(JSON.stringify(companies, null, 2));

  console.log("\n--- company_servers ---");
  const serverCount = await prisma.companyServer.count();
  const servers = await prisma.companyServer.findMany({ take: 5 });
  console.log(`Count: ${serverCount}`);
  console.log(JSON.stringify(servers, null, 2));

  console.log("\n--- Management (User) ---");
  const userCount = await prisma.user.count();
  const users = await prisma.user.findMany({ take: 5 });
  console.log(`Count: ${userCount}`);
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
