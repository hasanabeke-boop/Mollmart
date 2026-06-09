import prisma from '../config/prisma';

async function main(): Promise<void> {
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Home', slug: 'home' },
    { name: 'Home & Furniture', slug: 'home-furniture' },
    { name: 'Fashion & Apparel', slug: 'fashion' },
    { name: 'Collectibles', slug: 'collectibles' },
    { name: 'Services', slug: 'services' },
    { name: 'Sustainability', slug: 'sustainability' },
    { name: 'Other', slug: 'other' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, isActive: true },
      create: category,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
