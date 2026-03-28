import AdminService from '../../src/services/admin.service';
import { AdminRepositoryLike } from '../../src/repositories/admin.repository';
import { AdminEventPublisherLike } from '../../src/services/admin-event.service';
import { AuthUser } from '../../src/types/express';

function makeModerationCase(overrides?: Record<string, unknown>) {
  const now = new Date('2026-03-28T09:00:00.000Z');

  return {
    id: 'case-1',
    targetType: 'request',
    targetId: 'request-1',
    reason: 'Suspicious content',
    status: 'open',
    createdBy: 'admin-1',
    assignedTo: 'admin-1',
    resolutionNote: null,
    createdAt: now,
    resolvedAt: null,
    actions: [],
    ...overrides
  };
}

function createRepositoryMock(): jest.Mocked<AdminRepositoryLike> {
  return {
    createCategory: jest.fn(async (data) => ({
      id: 'cat-1',
      name: data.name,
      slug: data.slug,
      parentId: data.parentId ?? null,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    listCategories: jest.fn(async () => []),
    updateCategory: jest.fn(async () => ({
      id: 'cat-1',
      name: 'Updated',
      slug: 'updated',
      parentId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    createModerationCase: jest.fn(async () => makeModerationCase() as never),
    listModerationCases: jest.fn(async () => []),
    findModerationCaseById: jest.fn(async () => makeModerationCase() as never),
    updateModerationCase: jest.fn(async () =>
      makeModerationCase({
        status: 'resolved',
        resolutionNote: 'Resolved'
      }) as never
    ),
    upsertContentFlag: jest.fn(async () => ({
      id: 'flag-1',
      targetType: 'request',
      targetId: 'request-1',
      reason: 'Suspicious content',
      status: 'active',
      createdBy: 'admin-1',
      hiddenBy: null,
      hiddenAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    blockUser: jest.fn(async () => ({
      id: 'blocked-1',
      userId: 'user-1',
      reason: 'Violation',
      blockedBy: 'admin-1',
      blockedAt: new Date(),
      unblockedAt: null
    })),
    unblockUser: jest.fn(async () => ({
      id: 'blocked-1',
      userId: 'user-1',
      reason: 'Violation',
      blockedBy: 'admin-1',
      blockedAt: new Date(),
      unblockedAt: new Date()
    })),
    getDashboardSummary: jest.fn(async () => ({
      users: { blocked: 1, flagged: 2 },
      requests: { flagged: 3, hidden: 1 },
      offers: { flagged: 4, hidden: 2 },
      flags: { total: 9, active: 4 },
      moderation: { openCases: 2, inReviewCases: 1, resolvedCases: 3 },
      categories: { total: 5, active: 4 }
    }))
  };
}

function createEventPublisherMock(): jest.Mocked<AdminEventPublisherLike> {
  return {
    publishCategoryUpdated: jest.fn(async () => undefined),
    publishModerationCaseCreated: jest.fn(async () => undefined),
    publishModerationCaseResolved: jest.fn(async () => undefined),
    publishUserBlocked: jest.fn(async () => undefined),
    publishUserUnblocked: jest.fn(async () => undefined)
  };
}

describe('AdminService', () => {
  const admin: AuthUser = { id: 'admin-1', role: 'admin' };

  it('creates a category and emits an update event', async () => {
    const repository = createRepositoryMock();
    const events = createEventPublisherMock();
    const service = new AdminService(repository, events);

    const result = await service.createCategory(admin, {
      name: 'Furniture',
      slug: 'furniture'
    });

    expect(result.slug).toBe('furniture');
    expect(events.publishCategoryUpdated).toHaveBeenCalledTimes(1);
  });

  it('requires resolution note when resolving a moderation case', async () => {
    const service = new AdminService(createRepositoryMock(), createEventPublisherMock());

    await expect(
      service.updateModerationCase(admin, 'case-1', {
        status: 'resolved'
      })
    ).rejects.toThrow('resolutionNote is required when resolving or dismissing a moderation case');
  });

  it('blocks and unblocks users through moderation controls', async () => {
    const repository = createRepositoryMock();
    const events = createEventPublisherMock();
    const service = new AdminService(repository, events);

    await service.blockUser(admin, 'user-1', { reason: 'Violation' });
    await service.unblockUser('user-1');

    expect(repository.blockUser).toHaveBeenCalledWith('user-1', 'Violation', 'admin-1');
    expect(repository.unblockUser).toHaveBeenCalledWith('user-1');
    expect(events.publishUserBlocked).toHaveBeenCalledTimes(1);
    expect(events.publishUserUnblocked).toHaveBeenCalledTimes(1);
  });
});
