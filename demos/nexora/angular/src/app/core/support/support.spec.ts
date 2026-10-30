import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NexoraApiError, type NexoraApi } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { NotificationsStore } from '../activity/notifications.store';
import { SearchService } from '../search/search.service';
import { SessionStore } from '../session/session.store';
import {
  businessSpan,
  clockWords,
  INBOX_ROUTE,
  queueFor,
  reopenPermission,
  statusAllows,
  type TicketListItem,
} from './support.model';
import { TicketStore } from './ticket.store';
import { inboxQuery, SupportQueuesStore, TicketsStore } from './tickets.store';

describe('the support module', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('aisha-grant');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  async function openTicket(): Promise<TicketListItem> {
    const answer = await api.support.tickets.list({ pageSize: 25, filter: { status: { eq: 'open' } } });
    return answer.data[0]!;
  }

  describe('business time', () => {
    it('says a span in minutes, hours and ten-hour business days, never as raw minutes', () => {
      expect(businessSpan(45)).toBe('45 min');
      expect(businessSpan(80)).toBe('1 h 20 min');
      expect(businessSpan(120)).toBe('2 h');
      expect(businessSpan(600)).toBe('1 business day');
      expect(businessSpan(1_380)).toBe('2 business days 3 h');
      expect(businessSpan(-95)).toBe('1 h 35 min');
    });

    it('says a running clock with its due hour, a breached one by how much, and a paused one as stopped', () => {
      const due = () => 'Tue 09:15';
      expect(clockWords({ state: 'at_risk', remaining: 50, dueAt: '' }, due)).toBe(
        '50 min of business time left · due Tue 09:15',
      );
      expect(clockWords({ state: 'breached', remaining: -130, dueAt: '' }, due)).toBe(
        'Passed by 2 h 10 min of business time · was due Tue 09:15',
      );
      expect(clockWords({ state: 'paused', remaining: 300, dueAt: '' }, due)).toBe(
        'Stopped while the ticket waits on the customer',
      );
    });
  });

  describe('the commands a status allows (§68.5)', () => {
    it('draws only the transitions the backend accepts', () => {
      expect(statusAllows('escalate', 'pending_customer')).toBe(false);
      expect(statusAllows('escalate', 'pending_internal')).toBe(true);
      expect(statusAllows('pendingCustomer', 'new')).toBe(false);
      expect(statusAllows('close', 'open')).toBe(false);
      expect(statusAllows('close', 'resolved')).toBe(true);
      expect(statusAllows('reply', 'closed')).toBe(false);
      expect(statusAllows('reopen', 'escalated')).toBe(false);
    });

    it('gives an agent the commands of an open ticket and a sales manager none of them', async () => {
      const store = TestBed.inject(TicketStore);
      const ticket = await openTicket();
      await store.select(ticket.id);
      for (const command of ['reply', 'note', 'assign', 'escalate', 'resolve', 'pendingCustomer'] as const)
        expect(store.can(command), command).toBe(true);
      expect(store.can('reopen')).toBe(false);
      expect(store.can('close')).toBe(false);

      await signIn('sofia-ramirez');
      await store.load();
      for (const command of ['reply', 'note', 'assign', 'escalate', 'resolve'] as const)
        expect(store.can(command), command).toBe(false);
    });

    it('states that a reopen past seven days is a Support Manager’s, and gives it to the support lead', async () => {
      const store = TestBed.inject(TicketStore);
      const ticket = await openTicket();
      const resolved = await api.support.tickets.resolve(
        ticket.id,
        { resolutionCode: 'resolved_information' },
        { ifMatch: ticket.metadata.version },
      );
      const today = TestBed.inject(SessionStore).session()!.demo.today;
      expect(reopenPermission(resolved.ticket, today)).toBe('support.change_status');
      await api.demo.advanceClock(24 * 9);
      await signIn('aisha-grant');
      await store.select(ticket.id);
      const later = TestBed.inject(SessionStore).session()!.demo.today;
      expect(reopenPermission(store.ticket()!, later)).toBe('support.manage');
      expect(store.can('reopen')).toBe(false);

      await signIn('support-lead');
      await store.load();
      expect(store.can('reopen')).toBe(true);
    });
  });

  describe('the composer', () => {
    it('keeps a reply that met a transport failure, and empties it once the backend holds it', async () => {
      const store = TestBed.inject(TicketStore);
      const ticket = await openTicket();
      await store.select(ticket.id);
      store.write('reply', 'The carrier confirmed a redelivery tomorrow.');
      vi.spyOn(api.support.tickets, 'reply').mockRejectedValueOnce(
        new NexoraApiError('SERVICE_UNAVAILABLE', 'down', { status: 503 }),
      );
      expect(await store.reply()).toBe(false);
      expect(store.failure()?.kind).toBe('transport');
      expect(store.draft().reply).toBe('The carrier confirmed a redelivery tomorrow.');

      expect(await store.reply()).toBe(true);
      expect(store.draft().reply).toBe('');
      expect(store.detail()!.messages.some((message) => message.body === 'The carrier confirmed a redelivery tomorrow.')).toBe(true);
    });

    it('reads the ticket again on a conflict, says so, and keeps what was written', async () => {
      const store = TestBed.inject(TicketStore);
      const ticket = await openTicket();
      await store.select(ticket.id);
      // The in-memory backend hands its records out by reference: the number is read now.
      const read = store.ticket()!.metadata.version;
      store.write('reply', 'Checking with the warehouse.');
      // Another agent changes the ticket while the page holds the old version.
      await api.support.tickets.internalNote(ticket.id, { body: 'Seen.' }, { ifMatch: read });
      expect(await store.reply()).toBe(false);
      expect(store.failure()?.kind).toBe('conflict');
      expect(store.ticket()!.metadata.version).toBeGreaterThan(read);
      expect(store.draft().reply).toBe('Checking with the warehouse.');
    });

    it('keeps a draft per ticket while the reader moves between them', async () => {
      const store = TestBed.inject(TicketStore);
      const [first, second] = (await api.support.tickets.list({ pageSize: 25 })).data;
      await store.select(first!.id);
      store.write('reply', 'For the first.');
      await store.select(second!.id);
      expect(store.draft().reply).toBe('');
      await store.select(first!.id);
      expect(store.draft().reply).toBe('For the first.');
    });
  });

  describe('visibility (§68.6)', () => {
    it('never hands an internal note to a reader who does not answer the customer', async () => {
      const store = TestBed.inject(TicketStore);
      const id = api.demo.fixtures()['flagship.ticket.meridian'] as string;
      const ticket = await api.support.tickets.get(id);
      await api.support.tickets.internalNote(id, { body: 'Carrier claim filed.' }, { ifMatch: ticket.ticket.metadata.version });
      await store.select(id);
      expect(store.detail()!.messages.some((message) => message.visibility === 'internal')).toBe(true);

      await signIn('sofia-ramirez');
      await store.load();
      expect(store.detail()!.messages.every((message) => message.visibility === 'public')).toBe(true);
    });
  });

  describe('the queues', () => {
    it('counts each queue as the rows it opens on, and the navigation draws the reader’s own', async () => {
      const queues = TestBed.inject(SupportQueuesStore);
      await queues.load();
      const list = TestBed.inject(TicketsStore);
      const user = TestBed.inject(SessionStore).user()!.id;
      for (const key of ['open', 'mine', 'unassigned', 'breached']) {
        await list.load(inboxQuery(queueFor(key, user)!));
        expect(queues.counts()![key], key).toBe(list.total());
      }
      expect(queues.mine()).toBe(queues.counts()!['mine']);

      await signIn('sofia-ramirez');
      expect(queues.mine()).toBeNull();
    });

    it('opens the unassigned queue on tickets nobody holds', async () => {
      const list = TestBed.inject(TicketsStore);
      await list.load(inboxQuery(queueFor('unassigned', null)!));
      expect(list.rows().every((row) => row.assigneeId === undefined)).toBe(true);
    });
  });

  describe('one address for a ticket', () => {
    it('is the inbox’s :id from the search and from a notification', async () => {
      const id = api.demo.fixtures()['flagship.ticket.meridian'] as string;
      const search = TestBed.inject(SearchService);
      expect(search.routeFor({ type: 'ticket', id } as Parameters<SearchService['routeFor']>[0])).toBe(
        `${INBOX_ROUTE}/${id}`,
      );
      const notifications = TestBed.inject(NotificationsStore);
      expect(
        notifications.routeFor({ entityType: 'support_ticket', entityId: id } as Parameters<
          NotificationsStore['routeFor']
        >[0]),
      ).toBe(`${INBOX_ROUTE}/${id}`);
    });
  });
});
