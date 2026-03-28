import { PrismaClient, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.sellerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.userProfile.deleteMany();

  await prisma.userProfile.create({
    data: {
      userId: 'seller-001',
      role: 'seller',
      fullName: 'Aruzhan Trade LLP',
      phone: '+77010000001',
      city: 'Almaty',
      avatarUrl: 'https://images.example.com/seller-001.png',
      sellerProfile: {
        create: {
          displayName: 'Aruzhan Supplies',
          description: 'Bulk office and packaging supplier.',
          businessType: 'llp',
          website: 'https://aruzhan.example.com',
          instagramUrl: 'https://instagram.com/aruzhan_supplies',
          verificationStatus: VerificationStatus.verified,
          ratingAverage: 4.8,
          completedDealsCount: 37
        }
      }
    }
  });

  await prisma.userProfile.create({
    data: {
      userId: 'buyer-001',
      role: 'buyer',
      fullName: 'Nurbolat S.',
      phone: '+77010000002',
      city: 'Astana',
      avatarUrl: 'https://images.example.com/buyer-001.png',
      buyerProfile: {
        create: {
          displayName: 'Nurbolat Procurement',
          city: 'Astana',
          preferencesJson: {
            preferredCategories: ['furniture', 'packaging'],
            preferredCurrency: 'USD'
          }
        }
      }
    }
  });

  await prisma.userProfile.create({
    data: {
      userId: 'seller-002',
      role: 'seller',
      fullName: 'Steppe Furniture Co.',
      city: 'Shymkent',
      sellerProfile: {
        create: {
          displayName: 'Steppe Furniture',
          description: 'Restaurant and office furnishing specialist.',
          businessType: 'sole_proprietor',
          verificationStatus: VerificationStatus.pending,
          ratingAverage: 4.2,
          completedDealsCount: 8
        }
      }
    }
  });

  console.log('Seeded profile-service data');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
