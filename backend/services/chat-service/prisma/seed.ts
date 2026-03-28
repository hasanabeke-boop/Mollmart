import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.messageReadState.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();

  const conversation = await prisma.conversation.create({
    data: {
      requestId: 'request-published-001',
      offerId: 'offer-seeded-001',
      buyerId: 'buyer-002',
      sellerId: 'seller-001',
      lastMessageAt: new Date('2026-03-27T09:00:00.000Z'),
      messages: {
        create: [
          {
            senderId: 'buyer-002',
            senderRole: 'buyer',
            body: 'Can you confirm delivery timing for this request?',
            createdAt: new Date('2026-03-27T08:30:00.000Z')
          },
          {
            senderId: 'seller-001',
            senderRole: 'seller',
            body: 'Yes, we can deliver within 10 business days.',
            createdAt: new Date('2026-03-27T09:00:00.000Z'),
            readStates: {
              create: {
                userId: 'buyer-002',
                readAt: new Date('2026-03-27T09:30:00.000Z')
              }
            }
          }
        ]
      }
    },
    include: {
      messages: true
    }
  });

  await prisma.conversation.create({
    data: {
      requestId: 'request-published-001',
      buyerId: 'buyer-002',
      sellerId: 'seller-002',
      status: 'active'
    }
  });

  console.log(`Seeded conversation ${conversation.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
