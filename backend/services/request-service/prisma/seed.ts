import { PrismaClient, RequestStatusHistoryAction } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.requestStatusHistory.deleteMany();
  await prisma.requestAttachment.deleteMany();
  await prisma.request.deleteMany();

  const draftRequest = await prisma.request.create({
    data: {
      buyerId: 'buyer-001',
      title: 'Need industrial storage racks',
      description: 'Looking for heavy duty warehouse racks for a small fulfillment center.',
      categoryId: 'warehouse-equipment',
      budgetMin: 1800,
      budgetMax: 3500,
      currency: 'USD',
      location: 'Shymkent',
      deadlineAt: new Date('2026-04-25T09:00:00.000Z'),
      isNegotiable: true,
      statusHistory: {
        create: {
          actorId: 'buyer-001',
          action: RequestStatusHistoryAction.created,
          toStatus: 'draft',
          note: 'Seeded draft request'
        }
      }
    }
  });

  const publishedRequest = await prisma.request.create({
    data: {
      buyerId: 'buyer-002',
      title: 'Request for branded packaging boxes',
      description: 'Need custom printed packaging boxes for cosmetics products.',
      categoryId: 'packaging',
      budgetMin: 900,
      budgetMax: 1600,
      currency: 'USD',
      location: 'Astana',
      deadlineAt: new Date('2026-04-20T12:00:00.000Z'),
      isNegotiable: false,
      status: 'published',
      publishedAt: new Date('2026-03-25T10:00:00.000Z'),
      attachments: {
        create: {
          fileName: 'box-dimensions.pdf',
          fileUrl: 'https://files.example.com/box-dimensions.pdf',
          mimeType: 'application/pdf'
        }
      },
      statusHistory: {
        create: [
          {
            actorId: 'buyer-002',
            action: RequestStatusHistoryAction.created,
            toStatus: 'draft',
            note: 'Seeded and created'
          },
          {
            actorId: 'buyer-002',
            action: RequestStatusHistoryAction.published,
            fromStatus: 'draft',
            toStatus: 'published',
            note: 'Seeded published request'
          }
        ]
      }
    }
  });

  await prisma.request.create({
    data: {
      buyerId: 'buyer-003',
      title: 'Need 100 restaurant table sets',
      description: 'Bulk procurement for restaurant tables and matching chairs.',
      categoryId: 'furniture',
      budgetMin: 12000,
      budgetMax: 18000,
      currency: 'USD',
      location: 'Almaty',
      deadlineAt: new Date('2026-04-18T15:00:00.000Z'),
      isNegotiable: true,
      status: 'has_offers',
      publishedAt: new Date('2026-03-24T08:30:00.000Z'),
      offerCount: 3,
      statusHistory: {
        create: [
          {
            actorId: 'buyer-003',
            action: RequestStatusHistoryAction.created,
            toStatus: 'draft',
            note: 'Seeded and created'
          },
          {
            actorId: 'buyer-003',
            action: RequestStatusHistoryAction.published,
            fromStatus: 'draft',
            toStatus: 'published',
            note: 'Published before receiving offers'
          },
          {
            actorId: 'system',
            action: RequestStatusHistoryAction.moved_to_has_offers,
            fromStatus: 'published',
            toStatus: 'has_offers',
            note: 'Offer count synced from offer-service integration placeholder'
          }
        ]
      }
    }
  });

  await prisma.requestAttachment.create({
    data: {
      requestId: draftRequest.id,
      fileName: 'rack-layout.png',
      fileUrl: 'https://files.example.com/rack-layout.png',
      mimeType: 'image/png'
    }
  });

  console.log(`Seeded requests: ${draftRequest.id}, ${publishedRequest.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
