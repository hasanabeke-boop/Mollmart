import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.moderationAction.deleteMany();
  await prisma.moderationCase.deleteMany();
  await prisma.contentFlag.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.category.deleteMany();

  const furniture = await prisma.category.create({
    data: {
      name: 'Furniture',
      slug: 'furniture',
      isActive: true
    }
  });

  await prisma.category.create({
    data: {
      name: 'Office Furniture',
      slug: 'office-furniture',
      parentId: furniture.id,
      isActive: true
    }
  });

  const moderationCase = await prisma.moderationCase.create({
    data: {
      targetType: 'request',
      targetId: 'request-published-001',
      reason: 'Potentially misleading procurement details',
      createdBy: 'admin-001',
      assignedTo: 'admin-001',
      actions: {
        create: {
          actionType: 'note',
          actorId: 'admin-001',
          note: 'Initial moderation review opened'
        }
      }
    }
  });

  await prisma.contentFlag.create({
    data: {
      targetType: 'offer',
      targetId: 'offer-flagged-001',
      reason: 'Possible spam or suspicious pricing language',
      createdBy: 'admin-001',
      status: 'active'
    }
  });

  await prisma.blockedUser.create({
    data: {
      userId: 'seller-banned-001',
      reason: 'Repeated policy violations',
      blockedBy: 'admin-001'
    }
  });

  console.log(`Seeded admin-service data with case ${moderationCase.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
