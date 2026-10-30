import {
  NexoraApiError,
  type ApprovalEvaluation,
  type ApprovalRequest,
  type ApprovalStep,
  type Money,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import { finalize, load, metadata, open, transition, Validator } from './helpers';
import { approvalListItem, type ApprovalListItem } from '../resources/platform';

/** Section 67 — the generic approval engine shared by every module. */
export function createApprovalRequest(
  tx: Transaction,
  input: {
    targetType: ApprovalRequest['targetType'];
    targetId: string;
    targetNumber: string;
    evaluation: ApprovalEvaluation;
    requestedBy: string;
    amount?: Money;
  },
): ApprovalRequest {
  const runtime = tx.runtime;
  const id = runtime.store.nextId('approvalRequest');
  const steps: ApprovalStep[] = input.evaluation.steps.map((step, index) => {
    const assignee = defaultApprover(runtime, step.requiredRole, input.requestedBy);
    return {
      id: runtime.store.nextId('approvalStep'),
      sequence: step.sequence,
      requiredRole: step.requiredRole,
      status: 'pending',
      ...(assignee ? { assignedUserId: assignee } : {}),
      ...(index >= 0 ? {} : {}),
    };
  });
  const request: ApprovalRequest = {
    id,
    organizationId: runtime.store.dataset.organization.id,
    targetType: input.targetType,
    targetId: input.targetId,
    targetNumber: input.targetNumber,
    policyCode: input.evaluation.policyCode,
    reasons: input.evaluation.reasons,
    status: 'pending',
    requestedBy: input.requestedBy,
    requestedAt: tx.occurredAt,
    steps,
    metadata: metadata(tx, id),
    ...(input.amount ? { amount: input.amount } : {}),
  };
  tx.create('approvalRequests', request);
  tx.audit('approval.requested', 'approval_request', id, { nextVersion: 1 });
  for (const step of steps) {
    if (step.assignedUserId && step.sequence === 1)
      tx.notify(
        step.assignedUserId,
        'action_required',
        `Approval requested: ${input.targetNumber}`,
        input.evaluation.reasons.join('; '),
        { type: 'approval_request', id },
      );
  }
  return request;
}

function defaultApprover(
  runtime: ApiRuntime,
  roleKey: string,
  excludeUserId: string,
): string | undefined {
  // The persona who holds the role first, then its stand-in: Priya Shah's own write-off request
  // is assigned to the finance controller, who is a seeded user the persona switcher offers.
  const personasByRole: Record<string, string[]> = {
    sales_manager: ['sofia-ramirez'],
    finance_manager: ['priya-shah', 'finance-controller'],
    procurement_manager: ['procurement-lead'],
    warehouse_manager: ['jordan-wells'],
  };
  for (const personaKey of personasByRole[roleKey] ?? []) {
    const personaId = runtime.store.seed.personaUserIds.get(personaKey);
    if (
      personaId &&
      personaId !== excludeUserId &&
      runtime.authorization.hasRole(personaId, roleKey)
    )
      return personaId;
  }
  for (const assignment of runtime.store.dataset.roleAssignments.values()) {
    const role = runtime.store.dataset.roles.get(assignment.roleId);
    if (!role || role.name.toLowerCase().replace(/ /g, '_') !== roleKey) continue;
    if (assignment.userId === excludeUserId) continue;
    if (runtime.store.dataset.users.get(assignment.userId)?.status !== 'active') continue;
    return assignment.userId;
  }
  return undefined;
}

/** Cancels a pending request when its target is cancelled or materially edited (section 67.4). */
export function cancelApproval(
  tx: Transaction,
  requestId: string | undefined,
  reason: string,
): void {
  if (!requestId) return;
  const request = tx.runtime.store.dataset.approvalRequests.get(requestId);
  if (!request || request.status !== 'pending') return;
  tx.touch('approvalRequests', request);
  request.status = 'cancelled';
  request.decidedAt = tx.occurredAt;
  for (const step of request.steps) if (step.status === 'pending') step.status = 'skipped';
  finalize(tx, 'approvalRequests', request, 'approval.cancelled', 'approval_request', ['status'], {
    reason,
  });
}

export interface ApprovalDecisionHooks {
  onApproved: (tx: Transaction, request: ApprovalRequest) => void;
  onRejected: (tx: Transaction, request: ApprovalRequest, reason: string) => void;
  onChangesRequested: (tx: Transaction, request: ApprovalRequest, reason: string) => void;
}

export function createApprovalCommands(
  runtime: ApiRuntime,
  hooks: () => Record<ApprovalRequest['targetType'], ApprovalDecisionHooks>,
) {
  const actionableStep = (request: ApprovalRequest): ApprovalStep => {
    const user = runtime.actor;
    if (request.status !== 'pending')
      throw new NexoraApiError(
        'APPROVAL_ALREADY_DECIDED',
        `Approval request ${request.id} is already ${request.status}`,
      );
    if (request.requestedBy === user.id)
      throw new NexoraApiError('FORBIDDEN', 'A requester cannot decide their own approval', {
        details: { code: 'SELF_APPROVAL_FORBIDDEN' },
      });
    const pending = request.steps
      .filter((step) => step.status === 'pending')
      .sort((a, b) => a.sequence - b.sequence);
    const lowest = pending[0];
    if (!lowest) throw new NexoraApiError('APPROVAL_ALREADY_DECIDED', 'No pending step remains');
    const step = pending.find(
      (candidate) =>
        candidate.sequence === lowest.sequence &&
        (candidate.assignedUserId === user.id ||
          runtime.authorization.hasRole(user.id, candidate.requiredRole)),
    );
    if (!step)
      throw new NexoraApiError(
        'FORBIDDEN',
        `The current step requires the ${lowest.requiredRole.replace('_', ' ')} role`,
      );
    return step;
  };

  return {
    approve: (
      id: string,
      input: { comment?: string } = {},
      options?: MutationOptions,
    ): Promise<ApprovalListItem> =>
      runtime.command('POST /approvals/:id/approve', options, { id, input }, (tx) => {
        const request = load(runtime, 'approvalRequests', id, 'Approval request');
        const step = actionableStep(request);
        if (
          runtime.fireConflictOnce(`approval:${id}`) &&
          runtime.store.dataset.fixtures.get('edge.conflict.stale_version') === request.targetId
        ) {
          throw new NexoraApiError(
            'APPROVAL_ALREADY_DECIDED',
            'This approval was decided by another approver a moment ago. Refresh and review the outcome.',
          );
        }
        open(tx, 'approvalRequests', id, 'Approval request', options);
        step.status = 'approved';
        step.decidedBy = tx.actor.id;
        step.decidedAt = tx.occurredAt;
        if (input.comment) step.comment = input.comment.trim();
        const remaining = request.steps.some((candidate) => candidate.status === 'pending');
        if (!remaining) {
          request.status = 'approved';
          request.decidedAt = tx.occurredAt;
        } else {
          const nextSequence = Math.min(
            ...request.steps
              .filter((candidate) => candidate.status === 'pending')
              .map((candidate) => candidate.sequence),
          );
          for (const next of request.steps)
            if (next.status === 'pending' && next.sequence === nextSequence && next.assignedUserId)
              tx.notify(
                next.assignedUserId,
                'action_required',
                `Approval requested: ${request.targetNumber}`,
                request.reasons.join('; '),
                { type: 'approval_request', id },
              );
        }
        finalize(
          tx,
          'approvalRequests',
          request,
          remaining ? 'approval.step_approved' : 'approval.approved',
          'approval_request',
          ['steps', 'status'],
        );
        if (!remaining) hooks()[request.targetType].onApproved(tx, request);
        tx.notify(
          request.requestedBy,
          remaining ? 'info' : 'success',
          remaining ? `${request.targetNumber}: step approved` : `${request.targetNumber} approved`,
          input.comment?.trim() ?? '',
          { type: 'approval_request', id },
        );
        return approvalListItem(runtime, request);
      }),

    reject: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<ApprovalListItem> =>
      runtime.command('POST /approvals/:id/reject', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        const request = load(runtime, 'approvalRequests', id, 'Approval request');
        const step = actionableStep(request);
        open(tx, 'approvalRequests', id, 'Approval request', options);
        step.status = 'rejected';
        step.decidedBy = tx.actor.id;
        step.decidedAt = tx.occurredAt;
        step.comment = input.reason.trim();
        for (const other of request.steps) if (other.status === 'pending') other.status = 'skipped';
        request.status = 'rejected';
        request.decidedAt = tx.occurredAt;
        finalize(tx, 'approvalRequests', request, 'approval.rejected', 'approval_request', [
          'steps',
          'status',
        ]);
        hooks()[request.targetType].onRejected(tx, request, input.reason.trim());
        tx.notify(
          request.requestedBy,
          'warning',
          `${request.targetNumber} rejected`,
          input.reason.trim(),
          { type: 'approval_request', id },
        );
        return approvalListItem(runtime, request);
      }),

    requestChanges: (
      id: string,
      input: { reason: string },
      options?: MutationOptions,
    ): Promise<ApprovalListItem> =>
      runtime.command('POST /approvals/:id/request-changes', options, { id, input }, (tx) => {
        new Validator().required('reason', input.reason).throwIfAny();
        const request = load(runtime, 'approvalRequests', id, 'Approval request');
        const step = actionableStep(request);
        open(tx, 'approvalRequests', id, 'Approval request', options);
        step.comment = input.reason.trim();
        step.status = 'skipped';
        step.decidedBy = tx.actor.id;
        step.decidedAt = tx.occurredAt;
        for (const other of request.steps) if (other.status === 'pending') other.status = 'skipped';
        request.status = 'changes_requested';
        request.decidedAt = tx.occurredAt;
        finalize(
          tx,
          'approvalRequests',
          request,
          'approval.changes_requested',
          'approval_request',
          ['steps', 'status'],
        );
        hooks()[request.targetType].onChangesRequested(tx, request, input.reason.trim());
        tx.notify(
          request.requestedBy,
          'action_required',
          `${request.targetNumber}: changes requested`,
          input.reason.trim(),
          { type: 'approval_request', id },
        );
        return approvalListItem(runtime, request);
      }),
  };
}

export function assertNotDecided(request: ApprovalRequest): void {
  if (request.status !== 'pending')
    throw transition('Approval request', request.status, 'be decided');
}
