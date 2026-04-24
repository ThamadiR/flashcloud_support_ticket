const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Seeding companies...");
  const companyResults = [];
  for (let i = 1; i <= 10; i++) {
    const company = await prisma.company.create({
      data: {
        name: `Dummy Company ${i}`,
        description: `Description for Dummy Company ${i}`,
        email: `contact${i}@dummycompany.com`,
        tenantCount: Math.floor(Math.random() * 100),
      },
    });
    companyResults.push(company);
  }

  console.log("Seeding users...");
  const userResults = [];
  for (let i = 1; i <= 50; i++) {
    const user = await prisma.user.create({
      data: {
        username: `dummyuser${i}`,
        email: `dummyuser${i}@gmail.com`,
        password: passwordHash,
        contactNo: `123456789${i.toString().padStart(2, '0')}`,
        role: "NON_ADMIN",
      },
    });
    userResults.push(user);
  }

  console.log("Counts after insertion:");
  const companyCount = await prisma.company.count();
  const userCount = await prisma.user.count();
  console.log(`Total companies: ${companyCount}`);
  console.log(`Total users: ${userCount}`);

  console.log("\nSample of inserted companies:");
  console.log(companyResults.slice(0, 3));

  console.log("\nSample of inserted users:");
  console.log(userResults.slice(0, 3));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
