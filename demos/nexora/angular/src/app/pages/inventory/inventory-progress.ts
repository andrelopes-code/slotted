import type { CycleCountListItem, TransferListItem } from '@slotted/demo-nexora-backend';

import { formatDate } from '../../core/catalog/catalog.model';
import type { ProgressState, ProgressStep } from '../record-progress/record-progress';

const TRANSFER_ORDER: Record<string, number> = {
  draft: 0,
  ready: 1,
  in_transit: 2,
  partially_received: 3,
  received: 3,
};

function stateOf(index: number, reached: number, stopped: boolean, complete: boolean): ProgressState {
  if (stopped && index === reached) return 'stopped';
  if (index < reached || (complete && index === reached)) return 'done';
  if (index === reached) return 'current';
  return 'todo';
}

/**
 * A transfer's cycle (§61.1): drafted, ready, shipped, received. A cancelled
 * transfer stops on the step it was cancelled from, which is always one of the
 * first two (§61.3).
 */
export function transferSteps(transfer: TransferListItem): readonly ProgressStep[] {
  const cancelled = transfer.status === 'cancelled';
  // A cancelled transfer was a draft or ready; the backend keeps no trace of which, so it stops on the first.
  const reached = cancelled ? 0 : (TRANSFER_ORDER[transfer.status] ?? 0);
  const complete = transfer.status === 'received';
  const state = (index: number) => stateOf(index, reached, cancelled, complete);
  return [
    { key: 'draft', label: 'Drafted', state: state(0), ...(cancelled ? { detail: 'Cancelled' } : {}) },
    { key: 'ready', label: 'Ready', state: state(1) },
    {
      key: 'shipped',
      label: 'Shipped',
      state: state(2),
      ...(transfer.shippedAt ? { detail: formatDate(transfer.shippedAt) } : {}),
    },
    {
      key: 'received',
      label: 'Received',
      state: state(3),
      ...(transfer.status === 'partially_received'
        ? { detail: 'Part received' }
        : transfer.receivedAt
          ? { detail: formatDate(transfer.receivedAt) }
          : {}),
    },
  ];
}

/** One sentence for what the transfer waits on (RP-06). */
export function transferSentence(transfer: TransferListItem): string {
  const from = transfer.sourceWarehouseCode;
  const to = transfer.destinationWarehouseCode;
  switch (transfer.status) {
    case 'draft':
      return `A draft. Marking it ready checks that ${from} holds every line today; the stock stays free for orders until it ships.`;
    case 'ready':
      return `Ready to leave ${from}. Shipping takes the stock out of ${from}; until then the transfer can still be cancelled.`;
    case 'in_transit':
      return `On its way to ${to}. It can no longer be cancelled: ${to} receives it line by line.`;
    case 'partially_received':
      return `${to} has received part of it; what is still outstanding stays open until it arrives.`;
    case 'received':
      return `Received in full at ${to}.`;
    default:
      return 'Cancelled before anything shipped: no stock moved.';
  }
}

const COUNT_ORDER: Record<string, number> = {
  planned: 0,
  in_progress: 1,
  submitted: 2,
  completed: 3,
};

/**
 * A cycle count's cycle (§62.1): planned, counted, submitted, completed. A
 * submission above the threshold waits on its approval on the third step.
 */
export function countSteps(
  count: CycleCountListItem,
  waitingOn: string | null,
): readonly ProgressStep[] {
  const cancelled = count.status === 'cancelled';
  const reached = cancelled
    ? count.submittedAt
      ? 2
      : count.startedAt
        ? 1
        : 0
    : (COUNT_ORDER[count.status] ?? 0);
  const complete = count.status === 'completed';
  const state = (index: number) => stateOf(index, reached, cancelled, complete);
  return [
    { key: 'planned', label: 'Planned', state: state(0), detail: formatDate(count.plannedDate) },
    {
      key: 'counting',
      label: 'Counted',
      state: state(1),
      ...(count.startedAt ? { detail: `Started ${formatDate(count.startedAt)}` } : {}),
    },
    {
      key: 'submitted',
      label: 'Submitted',
      state: state(2),
      ...(waitingOn !== null ? { detail: `Waiting on ${waitingOn}` } : {}),
    },
    {
      key: 'completed',
      label: 'Completed',
      state: state(3),
      ...(count.completedAt ? { detail: formatDate(count.completedAt) } : {}),
    },
  ];
}

export function countSentence(count: CycleCountListItem, waitingOn: string | null): string {
  switch (count.status) {
    case 'planned':
      return 'Planned. Starting it takes a snapshot of what Nexora holds for every line; the count is compared with that snapshot.';
    case 'in_progress':
      return 'Being counted. Nothing in the stock changes until the count is submitted.';
    case 'submitted':
      return waitingOn !== null
        ? `Submitted, and waiting on ${waitingOn}: the variance moves the stock by US$2,500 or more at standard cost. The count completes itself when it is approved.`
        : 'Submitted, and waiting on no approval: completing it writes one movement per variance.';
    case 'completed':
      return count.varianceLineCount > 0
        ? `Completed: ${count.varianceLineCount} ${count.varianceLineCount === 1 ? 'line' : 'lines'} moved the stock, one cycle-count movement each.`
        : 'Completed: every line matched what Nexora held, so no stock moved.';
    default:
      return 'Cancelled: no stock moved.';
  }
}
