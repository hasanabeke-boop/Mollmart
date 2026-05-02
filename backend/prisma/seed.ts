import prisma from '../src/config/prisma';

async function main(): Promise<void> {
  await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics'
    }
  });

  await prisma.category.upsert({
    where: { slug: 'home' },
    update: {},
    create: {
      name: 'Home',
      slug: 'home'
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
