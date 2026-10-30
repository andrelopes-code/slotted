import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  NexoraApiError,
  WORKFLOW_RUN_ERROR_CODES,
  operatorsFor,
  type ConditionNode,
  type NexoraApi,
} from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { routes } from '../../app.routes';
import { RuleBuilder } from '../../pages/automations/rule-builder';
import { TasksPopover } from '../../shell/banner/tasks-popover';
import { activityActor, activityRun } from '../activity/activity-actor';
import { entityRoute } from '../activity/entity-route';
import { NotificationsStore } from '../activity/notifications.store';
import { TasksStore } from '../activity/tasks.store';
import { SessionStore } from '../session/session.store';
import { keyboardTarget, moveNode, moveRefusal, pathKey } from './condition-tree';
import { NewWorkflowStore } from './new-workflow.store';
import { WorkflowCatalogStore } from './workflow-catalog.store';
import { blankDefinition, WorkflowDraft } from './workflow-draft';
import { RUN_ERROR_WORDS, operatorWords, valueWords } from './workflow.model';
import { WorkflowStore } from './workflow.store';

const leaf = (value: number): ConditionNode => ({ type: 'condition', field: 'order.lineCount', operator: 'gte', value });
const group = (operator: 'and' | 'or', ...children: ConditionNode[]): ConditionNode => ({ type: 'group', operator, children });

describe('the automation module', () => {
  let api: NexoraApi;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend(), provideRouter(routes)] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    api = await resetTestBackend();
    await signIn('maya-chen');
  });

  async function signIn(persona: string): Promise<void> {
    await signInAs(persona);
    await TestBed.inject(SessionStore).load();
  }

  async function draftOn(trigger: 'order.confirmed' | 'ticket.escalated' = 'order.confirmed'): Promise<WorkflowDraft> {
    const catalog = TestBed.inject(WorkflowCatalogStore);
    await catalog.ensure();
    const draft = new WorkflowDraft(catalog.catalog);
    draft.load({ ...blankDefinition(TestBed.inject(SessionStore).user()!.id), name: 'Checked' });
    draft.setTrigger(trigger);
    return draft;
  }

  describe('the condition tree (§69.2)', () => {
    it('moves a node by the same rules for the keyboard and the pointer', () => {
      const tree = group('and', leaf(1), group('or', leaf(2), leaf(3)), leaf(4));
      expect(keyboardTarget(tree, [0], 'up')).toBeNull();
      expect(keyboardTarget(tree, [0], 'down')).toEqual({ parent: [], index: 2 });
      expect(keyboardTarget(tree, [2], 'into-previous')).toEqual({ parent: [1], index: 2 });
      expect(keyboardTarget(tree, [1, 0], 'out')).toEqual({ parent: [], index: 2 });
      const moved = moveNode(tree, [2], [1], 2)!;
      expect(moved.path).toEqual([1, 2]);
      expect((moved.tree as Extract<ConditionNode, { type: 'group' }>).children).toHaveLength(2);
      // A row moved down past a later group lands inside the group it was dropped in.
      const down = moveNode(tree, [0], [1], 0)!;
      expect(down.path).toEqual([0, 0]);
    });

    it('refuses a group into itself, and a level past the fifth', () => {
      const deep = group('and', group('or', group('and', group('or', group('and', leaf(1))))), group('and', leaf(2)));
      expect(moveRefusal(deep, [0], [0, 0], 0)).toBe('into-itself');
      // Level 2 holding a group four levels tall would reach level six.
      expect(moveRefusal(deep, [0], [1], 0)).toBe('too-deep');
      expect(moveRefusal(deep, [1], [0, 0], 0)).toBeNull();
      expect(moveRefusal(deep, [1], [], 1)).toBe('same-place');
    });

    it('marks an empty group, a sixth level and a fifty-first condition at their node, before any request', async () => {
      const draft = await draftOn();
      draft.addGroup([]);
      draft.remove([0, 0]);
      expect(draft.saveIssues().nodes.get('0')?.[0]).toContain('is empty');
      let tree: ConditionNode = leaf(1);
      for (let level = 0; level < 6; level += 1) tree = group('and', tree);
      draft.replace([], tree);
      expect([...draft.saveIssues().nodes.keys()]).toContain(pathKey([0, 0, 0, 0, 0]));
      draft.replace([], group('or', ...Array.from({ length: 51 }, (_, index) => leaf(index))));
      expect(draft.saveIssues().nodes.get('')?.join(' ')).toContain('at most 50');
    });

    it('offers each field the operators its type answers, and nothing that takes no value a value', () => {
      const text = { path: 'order.customerPoNumber', label: 'PO', group: 'Order', type: 'text' as const, optional: true };
      expect(operatorsFor(text)).not.toContain('gt');
      expect(operatorsFor(text)).toContain('is_empty');
      expect(operatorsFor({ path: 'order.totalUsd', label: 'Total', group: 'Order', type: 'money' })).not.toContain('contains');
      expect(operatorsFor({ path: 'customer.segment', label: 'Segment', group: 'Customer', type: 'enum' })).toEqual(['eq', 'neq', 'in', 'not_in']);
      expect(operatorWords('contains', { path: 'x', label: 'Tags', group: 'Order', type: 'tags' })).toBe('includes');
      expect(valueWords({ path: 'x', label: 'Credit', group: 'Customer', type: 'bps' }, 8_250)).toBe('82.5%');
      expect(valueWords({ path: 'x', label: 'Total', group: 'Order', type: 'money' }, 5_000_000)).toBe('$50,000');
    });

    it('says every code a run is written with', () => {
      for (const code of WORKFLOW_RUN_ERROR_CODES) expect(RUN_ERROR_WORDS[code].length).toBeGreaterThan(10);
    });
  });

  describe('the Rule Builder', () => {
    async function render() {
      const draft = await draftOn();
      draft.replace([], group('and', leaf(1), group('or', leaf(2), leaf(3))));
      const fixture = TestBed.createComponent(RuleBuilder);
      fixture.componentRef.setInput('draft', draft);
      fixture.detectChanges();
      await fixture.whenStable();
      return { draft, fixture, host: fixture.nativeElement as HTMLElement };
    }

    it('says each level’s join in words, and what remains before the limits', async () => {
      const { host } = await render();
      expect(host.querySelectorAll('.joiner')[0]?.textContent?.trim()).toBe('and');
      expect(host.querySelector('[data-testid="group-1"]')?.getAttribute('aria-label')).toContain('any of the following, level 2');
      expect(host.querySelector('[data-testid="remaining"]')?.textContent).toContain('3 of 50 conditions, 2 of 5 levels');
    });

    it('moves a condition from its menu and keeps the focus on it', async () => {
      const { draft, fixture } = await render();
      fixture.componentInstance.moveBy([0], 'into-previous');
      expect(fixture.componentInstance.moveBlocked([0], 'into-previous')).toBe('The row above is not a group.');
      fixture.componentInstance.moveBy([0], 'down');
      fixture.detectChanges();
      expect(pathKey(draft.focusPath()!)).toBe('1');
      expect(fixture.componentInstance.announcement()).toContain('Moved condition 1 to condition 2');
    });

    it('drags a condition by its grip into a group, and refuses a group dropped into itself', async () => {
      const { draft, fixture, host } = await render();
      const grip = host.querySelector('[data-testid="condition-0"] .grip') as HTMLElement;
      const target = host.querySelector('[data-testid="condition-1.1"] [data-drop-row]') as HTMLElement;
      target.getBoundingClientRect = () => ({ top: 100, height: 40, bottom: 140, left: 0, right: 400, width: 400, x: 0, y: 100, toJSON: () => ({}) });
      // jsdom does no hit testing: the row under the pointer is named for it.
      let under: Element = target;
      Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => under });
      const pointer = (type: string, y: number) =>
        new PointerEvent(type, { bubbles: true, button: 0, pointerId: 7, clientX: 10, clientY: y });
      grip.dispatchEvent(pointer('pointerdown', 0));
      document.dispatchEvent(pointer('pointermove', 130));
      fixture.detectChanges();
      expect(target.getAttribute('data-drop')).toBe('after');
      document.dispatchEvent(pointer('pointerup', 130));
      fixture.detectChanges();
      const tree = draft.definition().conditions as Extract<ConditionNode, { type: 'group' }>;
      expect(tree.children).toHaveLength(1);
      expect((tree.children[0] as Extract<ConditionNode, { type: 'group' }>).children).toHaveLength(3);

      // The group, dragged by its own grip over one of its own rows, stays where it was.
      const groupGrip = host.querySelector('[data-testid="group-0"] .grip') as HTMLElement;
      const inner = host.querySelector('[data-testid="condition-0.0"] [data-drop-row]') as HTMLElement;
      inner.getBoundingClientRect = target.getBoundingClientRect;
      under = inner;
      groupGrip.dispatchEvent(pointer('pointerdown', 0));
      document.dispatchEvent(pointer('pointermove', 110));
      fixture.detectChanges();
      expect(inner.hasAttribute('data-drop-refused')).toBe(true);
      document.dispatchEvent(pointer('pointerup', 110));
      expect(draft.definition().conditions).toEqual(tree);
      expect(fixture.componentInstance.announcement()).toContain('A group cannot go inside itself');
      delete (document as { elementFromPoint?: unknown }).elementFromPoint;
    });
  });

  describe('the workflow record', () => {
    const errorWorkflow = () =>
      api.store.dataset.workflowRuns.get(api.demo.fixtures()['edge.workflow.failed_run']!)!.workflowId;

    it('draws the commands each state allows, and none for a reader', async () => {
      const store = TestBed.inject(WorkflowStore);
      const byStatus = new Map([...api.store.dataset.workflows.values()].map((workflow) => [workflow.status, workflow.id]));
      const expected: Record<string, string[]> = {
        active: ['pause', 'archive'],
        error: ['activate', 'pause', 'archive'],
        draft: ['activate', 'archive'],
        paused: ['activate', 'archive'],
        archived: [],
      };
      for (const [status, id] of byStatus) {
        await store.open(id);
        expect([...store.commands()], status).toEqual(expected[status]);
      }
      await signIn('owen-price');
      await store.open(byStatus.get('active')!);
      expect(store.commands()).toEqual([]);
      expect(store.canEdit()).toBe(false);
    });

    it('keeps what the reader wrote through a 503, and saves it on the next try', async () => {
      const store = TestBed.inject(WorkflowStore);
      await store.open(errorWorkflow());
      store.startEdit();
      store.draft.patch({ name: 'Hold confirmed orders past the credit limit' });
      store.draft.replace([0], { type: 'condition', field: 'order.status', operator: 'eq', value: 'confirmed' });
      const update = vi
        .spyOn(api.workflows, 'update')
        .mockRejectedValueOnce(new NexoraApiError('SERVICE_UNAVAILABLE', 'down', { retryable: true }));
      expect(await store.save()).toBe(false);
      expect(store.failure()?.kind).toBe('transport');
      expect(store.draft.definition().name).toBe('Hold confirmed orders past the credit limit');
      expect(await store.save()).toBe(true);
      expect(update).toHaveBeenCalledTimes(2);
      expect(store.workflow()?.status).toBe('paused');
      expect(store.workflow()?.name).toBe('Hold confirmed orders past the credit limit');
    });

    it('answers a version someone else moved past with what moved, and keeps the reader’s draft', async () => {
      const store = TestBed.inject(WorkflowStore);
      const id = errorWorkflow();
      await store.open(id);
      store.startEdit();
      store.draft.patch({ name: 'Mine' });
      const stored = api.store.dataset.workflows.get(id)!;
      await api.workflows.update(id, { description: 'Theirs' }, { ifMatch: stored.metadata.version });
      expect(await store.save()).toBe(false);
      expect(store.failure()?.kind).toBe('conflict');
      expect(store.conflict()?.map((field) => field.label)).toContain('Description');
      expect(store.draft.definition().name).toBe('Mine');
      expect(await store.keepMine()).toBe(true);
      const after = api.store.dataset.workflows.get(id)!;
      expect(after.name).toBe('Mine');
      expect(after.description).toBe('Theirs');
    });

    it('refuses a definition in the browser before the backend would, and keeps the create draft when the page is left', async () => {
      const store = TestBed.inject(NewWorkflowStore);
      await store.open();
      store.draft.patch({ name: 'Escalations' });
      store.draft.setTrigger('ticket.escalated');
      store.draft.addGroup([]);
      store.draft.remove([0, 0]);
      const create = vi.spyOn(api.workflows, 'create');
      expect(await store.create(false)).toBeNull();
      expect(create).not.toHaveBeenCalled();
      expect(store.draft.saveIssues().nodes.get('0')).toBeDefined();
      await store.open();
      expect(store.draft.definition().name).toBe('Escalations');
    });
  });

  describe('what a run leaves for people', () => {
    it('opens a run’s record, its notification and its task at the record’s own address', async () => {
      const sofia = api.store.seed.personaUserIds.get('sofia-ramirez')!;
      const created = await api.workflows.create({
        name: 'Tell Sofia of every escalation',
        trigger: { type: 'ticket.escalated' },
        conditions: { type: 'group', operator: 'and', children: [{ type: 'condition', field: 'customer.creditUtilizationBps', operator: 'gte', value: 0 }] },
        actions: [
          { type: 'send_notification', config: { recipient: sofia, title: 'Escalated' } },
          { type: 'create_task', config: { assignee: sofia, title: 'Call the customer' } },
        ],
      });
      await api.workflows.activate(created.id, { ifMatch: created.metadata.version });
      await signIn('aisha-grant');
      const ticket = (await api.support.tickets.list({ pageSize: 25, filter: { status: { eq: 'open' } } })).data[0]!;
      await api.support.tickets.escalate(ticket.id, { reason: 'Line down' }, { ifMatch: ticket.metadata.version });
      const run = [...api.store.dataset.workflowRuns.values()].find((entry) => entry.workflowId === created.id)!;
      expect(run.status).toBe('succeeded');
      expect(entityRoute(run.affectedEntityType, run.affectedEntityId)).toBe(`/support/inbox/${ticket.id}`);

      await signIn('sofia-ramirez');
      const notifications = TestBed.inject(NotificationsStore);
      await notifications.loadPage();
      const notice = notifications.items().find((item) => item.title === 'Escalated')!;
      expect(notifications.routeFor(notice)).toBe(`/support/inbox/${ticket.id}`);
      const taskNotice = notifications.items().find((item) => item.title === 'New task: Call the customer')!;
      expect(notifications.routeFor(taskNotice)).toBe(`/support/inbox/${ticket.id}`);
      const tasks = TestBed.inject(TasksStore);
      await tasks.refresh();
      const task = tasks.items().find((item) => item.title === 'Call the customer')!;
      const popover = TestBed.runInInjectionContext(() => new TasksPopover());
      expect(popover.routeOf(task)).toBe(`/support/inbox/${ticket.id}`);
      expect(popover.describe(task)).toContain('from a workflow');
      // A record type with no screen is said, not linked.
      expect(entityRoute('cycle_count_line', 'x')).toBeNull();
    });

    it('names the workflow that wrote an activity entry, and opens its run', async () => {
      const created = await api.workflows.create({
        name: 'Hold escalated accounts',
        trigger: { type: 'ticket.escalated' },
        conditions: { type: 'group', operator: 'and', children: [{ type: 'condition', field: 'customer.creditUtilizationBps', operator: 'gte', value: 0 }] },
        actions: [{ type: 'place_customer_on_hold', config: { reason: 'Escalated by support' } }],
      });
      await api.workflows.activate(created.id, { ifMatch: created.metadata.version });
      await signIn('aisha-grant');
      const ticket = (await api.support.tickets.list({ pageSize: 50, filter: { status: { eq: 'open' } } })).data.find(
        (candidate) => api.store.dataset.customers.get(candidate.customerId)?.status === 'active',
      )!;
      await api.support.tickets.escalate(ticket.id, { reason: 'Down' }, { ifMatch: ticket.metadata.version });
      const entry = (await api.customers.activity(ticket.customerId, { limit: 20 })).data.find(
        (event) => event.type === 'customer.status_changed',
      )!;
      expect(activityActor(entry)).toBe('Workflow “Hold escalated accounts”');
      expect(activityRun(entry)?.path).toBe(`/automations/workflows/${created.id}/runs`);
      const person = (await api.customers.activity(ticket.customerId, { limit: 20 })).data.find((event) => event.type === 'ticket.escalated');
      if (person) expect(activityActor(person)).toBe(person.actorName);
    });
  });
});
