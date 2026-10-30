import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FilterValue, NexoraApi, OrderListItem } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { OrderStore } from './order.store';
import { OrdersStore } from './orders.store';

describe('OrderStore', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  async function first(filter: Record<string, FilterValue>): Promise<OrderListItem> {
    const page = await api.orders.list({ filter, pageSize: 25 });
    const row = page.data[0];
    if (!row) throw new Error(`the seed holds no order for ${JSON.stringify(filter)}`);
    return row;
  }

  it('holds a confirmed order with a reason and releases it again', async () => {
    const store = TestBed.inject(OrderStore);
    await store.open((await first({ status: 'confirmed' })).id);

    const holding = store.hold('Waiting on the customer’s purchase order revision.');
    expect(store.busy()).toBe('hold');
    expect(await holding).toBe(true);
    expect(store.order()!.status).toBe('on_hold');
    expect(store.order()!.holdReason).toContain('purchase order');

    expect(await store.releaseHold()).toBe(true);
    expect(store.order()!.status).toBe('confirmed');
    expect(store.failure()).toBeNull();
  });

  it('cancels an order with its reason and releases what it reserved', async () => {
    const store = TestBed.inject(OrderStore);
    const order = await first({ status: 'confirmed', fulfillmentStatus: 'unfulfilled' });
    await store.open(order.id);

    expect(await store.cancel('The customer moved the project to next quarter.')).toBe(true);

    expect(store.order()!.status).toBe('cancelled');
    expect(store.order()!.cancellationReason).toContain('next quarter');
    expect(store.lines().every((line) => Number(line.reservedQuantity) === 0)).toBe(true);
  });

  it('says in the module’s words that a shipped order cannot be cancelled whole', async () => {
    const store = TestBed.inject(OrderStore);
    await store.open((await first({ fulfillmentStatus: 'partially_fulfilled' })).id);

    expect(await store.cancel('Cancelled by the customer.')).toBe(false);

    expect(store.failure()?.code).toBe('ORDER_HAS_FULFILLED_QUANTITY');
    expect(store.failure()?.message).toContain('Cancel what is left instead.');
    expect(store.order()!.status).not.toBe('cancelled');
  });

  /**
   * §53.11 and §78.2: a record that moved under the page is a conflict, and
   * the answer is to read it again — which is what the reader then sees.
   */
  it('answers a version someone else moved past by reading the order again', async () => {
    const store = TestBed.inject(OrderStore);
    const order = await first({ status: 'confirmed' });
    await store.open(order.id);
    const version = store.order()!.metadata.version;

    // Another writer, between the page's read and its command.
    await api.orders.hold(order.id, { reason: 'Credit review' }, { ifMatch: version });

    expect(await store.hold('Waiting on the customer.')).toBe(false);
    expect(store.failure()?.kind).toBe('conflict');
    expect(store.failure()?.code).toBe('STALE_VERSION');
    // The page now shows what the other writer did, not what the reader tried.
    expect(store.order()!.status).toBe('on_hold');
    expect(store.order()!.holdReason).toBe('Credit review');
  });

  it('tells a persona who may not hold an order that the command is not theirs', async () => {
    await signInAs('owen-price');
    await TestBed.inject(SessionStore).load();
    const store = TestBed.inject(OrderStore);
    await store.open((await first({ status: 'confirmed' })).id);

    expect(await store.hold('Auditing the account.')).toBe(false);
    expect(store.failure()?.kind).toBe('permission');
  });

  it('keeps the list in step with the record it changed', async () => {
    const list = TestBed.inject(OrdersStore);
    await list.load();
    const store = TestBed.inject(OrderStore);
    const order = await first({ status: 'confirmed' });
    await store.open(order.id);

    await store.hold('Waiting on the customer.');
    await list.reload();

    const row = list.rows().find((candidate) => candidate.id === order.id);
    if (row) expect(row.status).toBe('on_hold');
  });
});
