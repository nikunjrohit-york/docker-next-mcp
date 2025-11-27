const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSettings.findMany();
  console.log('System settings:', settings);
}

main()
  .catch((_e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
