import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { OrderListItem, SalesOrder } from '@slotted/demo-nexora-backend';

import {
  RecordProgress,
  type ProgressState,
  type ProgressStep,
} from '../record-progress/record-progress';
import { ORDER_STATUS_LABEL } from './order-labels';

type OrderLike = Pick<
  OrderListItem | SalesOrder,
  'status' | 'approvalStatus' | 'allocationStatus' | 'fulfillmentStatus' | 'invoiceStatus'
>;

const ORDER_OF: Record<string, number> = {
  draft: 0,
  approval: 1,
  confirmed: 2,
  shipped: 3,
  closed: 4,
};

/**
 * Where an order stands in its cycle (§59), as the steps `app-record-progress`
 * draws: written, approved, reserved, shipped, invoiced.
 */
@Component({
  selector: 'app-order-progress',
  imports: [RecordProgress],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-record-progress
      [steps]="steps()"
      [sentence]="sentence()"
      [word]="word()"
      [stopped]="stopped() === 'cancelled' ? 'danger' : stopped() === 'hold' ? 'warning' : null"
      [compact]="compact()"
      [sentenceLines]="sentenceLines()"
      [stepLines]="stepLines()"
    />
  `,
})
export class OrderProgress {
  readonly order = input.required<OrderLike>();
  /** In a grid cell the steps carry no words: the state above them says where they are. */
  readonly compact = input(false);
  /** The lines the record page reserves for the sentence while the order is read, kept once it has loaded. */
  readonly sentenceLines = input(0);
  /** The lines a step's label and detail take at least, for the same reason. */
  readonly stepLines = input(0);

  readonly stopped = computed(() => {
    const order = this.order();
    if (order.status === 'cancelled') return 'cancelled';
    if (order.status === 'on_hold') return 'hold';
    return null;
  });

  readonly word = computed(() => {
    const order = this.order();
    return ORDER_STATUS_LABEL[order.status] ?? order.status;
  });

  readonly steps = computed<readonly ProgressStep[]>(() => {
    const order = this.order();
    const reached = ORDER_OF[stage(order)] ?? 0;
    const stopped = this.stopped();
    const state = (key: string): ProgressState => {
      const index = ORDER_OF[key] ?? 0;
      if (stopped !== null && index === reached) return 'stopped';
      if (index < reached) return 'done';
      if (index === reached) return 'current';
      return 'todo';
    };
    return [
      { key: 'draft', label: 'Written', state: state('draft') },
      {
        key: 'approval',
        label: 'Approval',
        state: state('approval'),
        // A detail of one or two words: a fifth of a phone holds it in two lines, which the record reserves.
        ...(order.approvalStatus === 'pending'
          ? { detail: 'Waiting' }
          : order.approvalStatus === 'rejected'
            ? { detail: 'Rejected' }
            : order.approvalStatus === 'not_required'
              ? { detail: 'Not required' }
              : {}),
      },
      {
        key: 'confirmed',
        label: 'Reserved',
        state: state('confirmed'),
        ...(order.allocationStatus === 'partially_allocated'
          ? { detail: 'Part reserved' }
          : order.allocationStatus === 'unallocated' && order.status === 'confirmed'
            ? { detail: 'Nothing yet' }
            : {}),
      },
      {
        key: 'shipped',
        label: 'Shipped',
        state: state('shipped'),
        ...(order.fulfillmentStatus === 'partially_fulfilled'
          ? { detail: 'Part shipped' }
          : {}),
      },
      {
        key: 'closed',
        label: 'Invoiced',
        state: state('closed'),
        ...(order.invoiceStatus === 'partially_invoiced' ? { detail: 'Part invoiced' } : {}),
      },
    ];
  });

  /** One sentence for what the order is waiting on, which is what the reader came for. */
  readonly sentence = computed(() => {
    const order = this.order();
    if (order.status === 'cancelled') return 'This order was cancelled; nothing further will ship.';
    if (order.status === 'on_hold') return 'Held: nothing ships until the hold is released.';
    if (order.approvalStatus === 'pending')
      return 'Waiting on an approval before anything is reserved.';
    if (order.status === 'draft')
      return 'A draft: submit it to reserve stock and start fulfilment.';
    if (order.fulfillmentStatus === 'fulfilled' && order.invoiceStatus !== 'invoiced')
      return 'Everything has shipped; the invoice is next.';
    if (order.status === 'closed') return 'Shipped, invoiced and closed.';
    if (order.allocationStatus === 'partially_allocated')
      return 'Part of the quantity is reserved; the rest waits on stock.';
    return 'Confirmed and moving through fulfilment.';
  });
}

/** The furthest step the order has reached, which is where its bar stops. */
function stage(order: OrderLike): string {
  if (order.status === 'draft') return 'draft';
  if (order.status === 'pending_approval' || order.approvalStatus === 'pending') return 'approval';
  if (order.status === 'closed' || order.invoiceStatus === 'invoiced') return 'closed';
  if (order.fulfillmentStatus !== 'unfulfilled') return 'shipped';
  return 'confirmed';
}
