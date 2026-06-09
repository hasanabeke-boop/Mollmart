import { ModerationTargetType, PrismaClient } from '@prisma/client';

export async function listHiddenContentTargetIds(
  client: PrismaClient,
  targetType: ModerationTargetType
): Promise<string[]> {
  const rows = await client.contentFlag.findMany({
    where: { targetType, status: 'hidden' },
    select: { targetId: true }
  });
  return rows.map((row) => row.targetId);
}

export async function isContentHidden(
  client: PrismaClient,
  targetType: ModerationTargetType,
  targetId: string
): Promise<boolean> {
  const row = await client.contentFlag.findFirst({
    where: { targetType, targetId, status: 'hidden' },
    select: { id: true }
  });
  return row != null;
}
