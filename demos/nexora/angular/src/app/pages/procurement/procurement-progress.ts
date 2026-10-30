import type {
  ApprovalEvaluation,
  ApprovalRequest,
  PurchaseOrderListItem,
} from '@slotted/demo-nexora-backend';

import { formatDate } from '../../core/catalog/catalog.model';
import {
  percentFromBps,
  PROCUREMENT_APPROVAL_USD,
  roleWords,
  stepsWords,
} from '../../core/procurement/procurement.model';
import type { ProgressState, ProgressStep } from '../record-progress/record-progress';

const ORDER: Record<string, number> = {
  draft: 0,
  pending_approval: 1,
  approved: 2,
  sent: 3,
  acknowledged: 3,
  partially_received: 3,
  received: 3,
  closed: 3,
};

function stateOf(index: number, reached: number, stopped: boolean, complete: boolean): ProgressState {
  if (stopped && index === reached) return 'stopped';
  if (index < reached || (complete && index === reached)) return 'done';
  if (index === reached) return 'current';
  return 'todo';
}

/** The role the current step of a pending approval waits on, in an operator's words. */
export function waitingOn(approval: ApprovalRequest | null | undefined): string | null {
  if (!approval || approval.status !== 'pending') return null;
  const step = approval.steps
    .filter((candidate) => candidate.status === 'pending')
    .sort((a, b) => a.sequence - b.sequence)[0];
  return step ? `a ${roleWords(step.requiredRole)}` : null;
}

/**
 * A purchase order's cycle (§65.3, §65.6): drafted, approved, sent, received.
 * The supplier's acknowledgement is said on the sent step; an order closed
 * short ends on the received step with what it says; a cancelled order stops
 * on the step it was cancelled from.
 */
export function purchaseOrderSteps(
  po: PurchaseOrderListItem,
  approval: ApprovalRequest | null | undefined,
): readonly ProgressStep[] {
  const cancelled = po.status === 'cancelled';
  const reached = cancelled ? (po.sentAt ? 3 : po.approvalRequestId ? 1 : 0) : (ORDER[po.status] ?? 0);
  const complete = po.status === 'received' || po.status === 'closed';
  const state = (index: number) => stateOf(index, reached, cancelled, complete);
  const waiting = waitingOn(approval);
  const approvalDetail =
    waiting !== null
      ? // The role alone: the step is the current one, and a phone's quarter holds two lines of detail.
        waiting.charAt(0).toUpperCase() + waiting.slice(1)
      : approval?.status === 'approved' && approval.decidedAt
        ? `Approved ${formatDate(approval.decidedAt)}`
        : reached >= 2 && !po.approvalRequestId
          ? 'No approval needed'
          : undefined;
  const sentDetail = po.supplierAcknowledgedAt
    ? `Acknowledged ${formatDate(po.supplierAcknowledgedAt)}`
    : po.sentAt
      ? formatDate(po.sentAt)
      : undefined;
  const receivedDetail =
    po.status === 'closed'
      ? 'Closed short'
      : po.status === 'received'
        ? 'In full'
        : po.receivedShareBps > 0 && !cancelled
          ? `${percentFromBps(po.receivedShareBps)} through the door`
          : reached === 3 && !cancelled
            ? `Expected ${formatDate(po.expectedDate)}`
            : undefined;
  return [
    {
      key: 'draft',
      label: 'Drafted',
      state: state(0),
      detail: cancelled && reached === 0 ? 'Cancelled' : formatDate(po.createdBusinessDate),
    },
    {
      key: 'approved',
      label: 'Approved',
      state: state(1),
      ...(cancelled && reached === 1 ? { detail: 'Cancelled' } : approvalDetail ? { detail: approvalDetail } : {}),
    },
    { key: 'sent', label: 'Sent', state: state(2), ...(sentDetail ? { detail: sentDetail } : {}) },
    {
      key: 'received',
      label: 'Received',
      state: state(3),
      ...(cancelled && reached === 3 ? { detail: 'Cancelled' } : receivedDetail ? { detail: receivedDetail } : {}),
    },
  ];
}

/**
 * One sentence for what the order waits on and what happens next (RP-06). On a
 * draft it says what the submit will ask for — computed where the reader may
 * see the cost, and as the rule where they may not (FM-11).
 */
export function purchaseOrderSentence(
  po: PurchaseOrderListItem,
  approval: ApprovalRequest | null | undefined,
  preview: ApprovalEvaluation | null,
  supplierActive: boolean,
): string {
  const to = po.warehouseCode;
  const late = po.daysLate > 0 ? ` It is ${po.daysLate} ${po.daysLate === 1 ? 'day' : 'days'} past its expected date.` : '';
  switch (po.status) {
    case 'draft':
      if (!supplierActive)
        return `A draft. ${po.supplierName} is not active, so the draft cannot be submitted until the supplier is.`;
      if (preview === null)
        return `A draft. Submitting approves it at once unless it is worth US$${PROCUREMENT_APPROVAL_USD.toLocaleString('en-US')} or more with freight, the supplier is conditional, or a unit cost is more than 15% above the last one accepted — then it waits on a Procurement Manager.`;
      return preview.required
        ? `A draft. Submitting sends it to ${stepsWords(preview)} for approval: ${preview.reasons.join('; ')}.`
        : 'A draft. Submitting approves it at once: it is under US$25,000 with freight, the supplier is not conditional and no unit cost rose more than 15% over the last one accepted.';
    case 'pending_approval': {
      const who = waitingOn(approval);
      return `Waiting on ${who ?? 'an approver'}. It can be sent once every step approves; a rejection or a request for changes returns it to draft. The steps stand under the order's lines.`;
    }
    case 'approved':
      return `Approved and not yet sent. Sending it commits the order with ${po.supplierName}; changing its lines or freight before then withdraws the approval.`;
    case 'sent':
      return `Sent to ${po.supplierName}, expected at ${to} on ${formatDate(po.expectedDate)}; the supplier has not acknowledged it yet.${late}`;
    case 'acknowledged':
      return `Acknowledged by ${po.supplierName}, expected at ${to} on ${formatDate(po.expectedDate)}.${late}`;
    case 'partially_received':
      return `Part received at ${to}: ${percentFromBps(po.receivedShareBps)} of the ordered quantity has come through. The rest stays open until it arrives or the order is closed short.${late}`;
    case 'received':
      return `Received at ${to}. Every line reached 95% of its order, so nothing more is expected.`;
    case 'closed':
      return 'Closed short: what had not arrived is no longer expected, and each line now orders what was received.';
    default:
      return 'Cancelled before anything entered the stock: no stock moved.';
  }
}
