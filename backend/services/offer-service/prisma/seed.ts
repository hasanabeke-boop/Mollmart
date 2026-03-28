import { PrismaClient, OfferStatusHistoryAction } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.offerStatusHistory.deleteMany();
  await prisma.offer.deleteMany();

  const submitted = await prisma.offer.create({
    data: {
      requestId: 'request-published-001',
      sellerId: 'seller-001',
      price: 3100,
      currency: 'USD',
      message: 'Can deliver in 10 business days with setup support.',
      deliveryDays: 10,
      warrantyInfo: '12 months on defects',
      statusHistory: {
        create: {
          actorId: 'seller-001',
          action: OfferStatusHistoryAction.created,
          toStatus: 'submitted',
          note: 'Seeded submitted offer'
        }
      }
    }
  });

  await prisma.offer.create({
    data: {
      requestId: 'request-published-001',
      sellerId: 'seller-002',
      price: 2950,
      currency: 'USD',
      message: 'Lower unit cost with split delivery option.',
      deliveryDays: 14,
      status: 'updated',
      statusHistory: {
        create: [
          {
            actorId: 'seller-002',
            action: OfferStatusHistoryAction.created,
            toStatus: 'submitted',
            note: 'Created seeded offer'
          },
          {
            actorId: 'seller-002',
            action: OfferStatusHistoryAction.updated,
            fromStatus: 'submitted',
            toStatus: 'updated',
            note: 'Updated seeded offer'
          }
        ]
      }
    }
  });

  await prisma.offer.create({
    data: {
      requestId: 'request-accepted-002',
      sellerId: 'seller-003',
      price: 12000,
      currency: 'USD',
      message: 'Bulk furniture package with installation included.',
      deliveryDays: 21,
      warrantyInfo: '24 months warranty',
      status: 'accepted',
      acceptedAt: new Date('2026-03-27T12:00:00.000Z'),
      statusHistory: {
        create: [
          {
            actorId: 'seller-003',
            action: OfferStatusHistoryAction.created,
            toStatus: 'submitted'
          },
          {
            actorId: 'buyer-003',
            action: OfferStatusHistoryAction.accepted,
            fromStatus: 'submitted',
            toStatus: 'accepted',
            note: 'Accepted seeded offer'
          }
        ]
      }
    }
  });

  console.log(`Seeded offers including ${submitted.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
