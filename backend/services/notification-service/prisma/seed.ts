import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.notification.deleteMany();

  await prisma.notification.createMany({
    data: [
      {
        userId: 'buyer-001',
        type: 'offer_created',
        title: 'New offer received',
        body: 'A seller submitted a new offer for your request.',
        referenceType: 'offer',
        referenceId: 'offer-seeded-001',
        dedupeKey: 'offer-created-offer-seeded-001-buyer-001'
      },
      {
        userId: 'seller-001',
        type: 'chat_message_created',
        title: 'New chat message',
        body: 'You received a new message in a marketplace conversation.',
        referenceType: 'conversation',
        referenceId: 'conv-seeded-001',
        dedupeKey: 'chat-message-msg-seeded-001-seller-001',
        isRead: true,
        readAt: new Date('2026-03-28T08:30:00.000Z')
      }
    ]
  });

  console.log('Seeded notification-service data');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
