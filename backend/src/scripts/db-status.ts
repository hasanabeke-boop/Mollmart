import prisma from '../config/prisma';
import { getDatabaseStats } from '../lib/databaseOps';

async function main(): Promise<void> {
  const stats = await getDatabaseStats();
  console.log(JSON.stringify(stats, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
