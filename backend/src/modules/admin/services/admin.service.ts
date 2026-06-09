import {
  Category,
  ContentFlagStatus,
  ModerationCaseStatus,
  ModerationTargetType
} from '@prisma/client';
import { AuthUser } from '../types/express';
import {
  BlockUserInput,
  CreateCategoryInput,
  CreateModerationCaseInput,
  ModerationCaseListQuery,
  SubmitContentReportInput,
  UpdateCategoryInput,
  UpdateModerationCaseInput
} from '../types/admin';
import { badRequest, conflict, notFound } from '../utils/apiError';
import {
  AdminRepositoryLike,
  ModerationCaseWithActions
} from '../repositories/admin.repository';
import { AdminEventPublisherLike } from './admin-event.service';

export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepositoryLike,
    private readonly adminEventPublisher: AdminEventPublisherLike
  ) {}

  async createCategory(user: AuthUser, input: CreateCategoryInput): Promise<Category> {
    void user;
    const category = await this.adminRepository.createCategory({
      name: input.name.trim(),
      slug: input.slug.trim(),
      isActive: input.isActive ?? true,
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {})
    });

    await this.adminEventPublisher.publishCategoryUpdated(category);
    return category;
  }

  async listCategories(): Promise<Category[]> {
    return this.adminRepository.listCategories();
  }

  async updateCategory(user: AuthUser, categoryId: string, input: UpdateCategoryInput): Promise<Category> {
    void user;
    const category = await this.adminRepository.updateCategory(categoryId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId.length > 0 ? input.parentId : null } : {})
    });

    await this.adminEventPublisher.publishCategoryUpdated(category);
    return category;
  }

  async createModerationCase(user: AuthUser, input: CreateModerationCaseInput): Promise<ModerationCaseWithActions> {
    const moderationCase = await this.adminRepository.createModerationCase({
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim(),
      createdBy: user.id,
      ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {})
    });

    await this.adminRepository.upsertContentFlag({
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim(),
      createdBy: user.id,
      status: 'active'
    });

    await this.adminEventPublisher.publishModerationCaseCreated(moderationCase);
    return moderationCase;
  }

  async submitContentReport(
    user: AuthUser,
    input: SubmitContentReportInput
  ): Promise<{ id: string; status: ModerationCaseStatus }> {
    const targetId = input.targetId.trim();
    const targetType = input.targetType as ModerationTargetType;
    const target = await this.adminRepository.findReportTarget(targetType, targetId);
    if (target == null) {
      throw notFound('Content not found');
    }
    if (target.ownerId === user.id) {
      throw badRequest('You cannot report your own content');
    }

    const existing = await this.adminRepository.findOpenModerationCaseByReporter(
      targetType,
      targetId,
      user.id
    );
    if (existing != null) {
      throw conflict('You already reported this content');
    }

    const moderationCase = await this.createModerationCase(user, {
      targetType,
      targetId,
      reason: input.reason.trim()
    });

    return { id: moderationCase.id, status: moderationCase.status };
  }

  async listModerationCases(query: ModerationCaseListQuery): Promise<ModerationCaseWithActions[]> {
    return this.adminRepository.listModerationCases(query);
  }

  async updateModerationCase(
    user: AuthUser,
    moderationCaseId: string,
    input: UpdateModerationCaseInput
  ): Promise<ModerationCaseWithActions> {
    const existing = await this.adminRepository.findModerationCaseById(moderationCaseId);
    if (existing == null) {
      throw notFound('Moderation case not found');
    }

    const nextStatus = input.status ?? existing.status;
    const isResolving = nextStatus === 'resolved' || nextStatus === 'dismissed';

    if (isResolving && (input.resolutionNote == null || input.resolutionNote.trim().length === 0)) {
      throw badRequest('resolutionNote is required when resolving or dismissing a moderation case');
    }

    const actionType = input.actionType ?? (isResolving ? 'note' : 'note');

    const updated = await this.adminRepository.updateModerationCase(
      moderationCaseId,
      {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo.length > 0 ? input.assignedTo : null } : {}),
        ...(input.resolutionNote !== undefined ? { resolutionNote: input.resolutionNote.trim() } : {}),
        ...(isResolving ? { resolvedAt: new Date() } : {})
      },
      {
        actionType:
          actionType === 'hide_content'
            ? 'hide_content'
            : actionType === 'unhide_content'
              ? 'unhide_content'
              : isResolving
                ? 'resolve_case'
                : 'note',
        actorId: user.id,
        note: input.resolutionNote?.trim()
      }
    );

    if (input.actionType === 'hide_content' || input.actionType === 'unhide_content') {
      await this.adminRepository.upsertContentFlag({
        targetType: existing.targetType,
        targetId: existing.targetId,
        reason: existing.reason,
        createdBy: existing.createdBy,
        status: input.actionType === 'hide_content' ? ContentFlagStatus.hidden : ContentFlagStatus.cleared,
        hiddenBy: input.actionType === 'hide_content' ? user.id : null,
        hiddenAt: input.actionType === 'hide_content' ? new Date() : null
      });
      await this.adminRepository.applyContentVisibilityChange(
        existing.targetType,
        existing.targetId,
        input.actionType === 'hide_content'
      );
    }

    if (isResolving) {
      await this.adminEventPublisher.publishModerationCaseResolved(updated);
    }

    return updated;
  }

  async blockUser(user: AuthUser, targetUserId: string, input: BlockUserInput) {
    const blockedUser = await this.adminRepository.blockUser(targetUserId, input.reason.trim(), user.id);

    await this.adminRepository.upsertContentFlag({
      targetType: ModerationTargetType.user,
      targetId: targetUserId,
      reason: input.reason.trim(),
      createdBy: user.id,
      status: 'hidden',
      hiddenBy: user.id,
      hiddenAt: new Date()
    });

    await this.adminEventPublisher.publishUserBlocked(blockedUser);
    return blockedUser;
  }

  async unblockUser(targetUserId: string) {
    const blockedUser = await this.adminRepository.unblockUser(targetUserId);
    if (blockedUser == null) {
      throw notFound('Blocked user record not found');
    }

    await this.adminRepository.upsertContentFlag({
      targetType: ModerationTargetType.user,
      targetId: targetUserId,
      reason: blockedUser.reason,
      createdBy: blockedUser.blockedBy,
      status: 'cleared',
      hiddenBy: null,
      hiddenAt: null
    });

    await this.adminEventPublisher.publishUserUnblocked(blockedUser);
    return blockedUser;
  }

  async getDashboardSummary() {
    return this.adminRepository.getDashboardSummary();
  }

  async listRequests(page: number, limit: number, q?: string) {
    return this.adminRepository.listRequestsForAdmin(page, limit, q);
  }

  async deleteRequest(_user: AuthUser, requestId: string): Promise<void> {
    const deleted = await this.adminRepository.deleteRequestById(requestId);
    if (!deleted) {
      throw notFound('Request not found');
    }
  }
}

export default AdminService;
