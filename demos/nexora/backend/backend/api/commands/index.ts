import { SYSTEM_ACTOR_ID, type ApprovalRequest } from '../../domain';
import { Transaction, type ApiRuntime, type WorkflowEvent } from '../runtime';
import type { SalesReadModels } from '../resources/sales';
import { createApprovalCommands, type ApprovalDecisionHooks } from './approvals';
import { createAutomation } from './automation';
import { createCrmCommands } from './crm';
import { createFinanceCommands } from './finance';
import { createFulfillmentCommands } from './fulfillment';
import { createInventoryCommands } from './inventory';
import { createPlatformCommands } from './platform';
import { createProcurementCommands } from './procurement';
import { createSalesCommands } from './sales';
import { createSupportCommands } from './support';

/** Section 79 — the canonical domain operation catalog, grouped by module. */
export function createCommands(runtime: ApiRuntime, models: SalesReadModels) {
  const crm = createCrmCommands(runtime);
  const sales = createSalesCommands(runtime, models);
  const fulfillment = createFulfillmentCommands(runtime, sales);
  const inventory = createInventoryCommands(runtime);
  const procurement = createProcurementCommands(runtime, inventory);
  const finance = createFinanceCommands(runtime, sales);
  const support = createSupportCommands(runtime);
  const platform = createPlatformCommands(runtime);
  const hooks: Record<ApprovalRequest['targetType'], ApprovalDecisionHooks> = {
    sales_order: sales.hooks.sales_order,
    quote: sales.hooks.quote,
    purchase_order: procurement.hooks.purchase_order,
    invoice_write_off: finance.hooks.invoice_write_off,
    cycle_count: inventory.hooks.cycle_count,
  };
  const approvals = createApprovalCommands(runtime, () => hooks);
  const automation = createAutomation(runtime, {
    ...crm.services,
    ...sales.services,
    ...support.services,
    ...procurement.services,
    ...platform.services,
  });
  runtime.afterCommand = automation.dispatch;

  const systemActor = () => runtime.store.dataset.users.get(SYSTEM_ACTOR_ID) ?? runtime.actor;

  /** Runs `work` in a transaction of the system actor and the workflows its events trigger. */
  const asSystem = <T>(work: (tx: Transaction) => T): { value: T; runs: number } => {
    const tx = new Transaction(runtime, systemActor(), runtime.correlationId());
    const before = runtime.store.dataset.workflowRuns.size;
    try {
      const value = runtime.store.batch(() => {
        const result = work(tx);
        automation.dispatch(tx);
        return result;
      });
      return { value, runs: runtime.store.dataset.workflowRuns.size - before };
    } catch (error) {
      tx.rollback();
      throw error;
    }
  };

  /** Section 69.5 and 68.5 — time-derived transitions evaluated when the demo clock moves. */
  const onClockAdvanced = (): {
    expiredQuotes: number;
    closedTickets: number;
    workflowRuns: number;
  } => {
    const overdue = runtime.projections.refreshCollectionStates();
    const { value, runs } = asSystem((tx) => {
      const expiredQuotes = sales.quotes.expire(tx);
      const closedTickets = support.autoClose(tx);
      for (const order of runtime.store.dataset.salesOrders.values()) {
        if (order.status === 'confirmed' || order.status === 'on_hold')
          runtime.projections.recalculateOrder(order);
      }
      runtime.store.invalidate('salesOrders');
      automation.overdueEvents(tx, overdue);
      automation.evaluateSchedules(tx);
      return { expiredQuotes, closedTickets };
    });
    return { ...value, workflowRuns: runs };
  };

  /**
   * Section 69.5 — on initialization, the schedules that fell due since they
   * were last evaluated; and the events a scenario wrote as facts (an
   * escalation of the support incident), run as if their command had.
   */
  const onInitialized = (events: Omit<WorkflowEvent, 'id' | 'depth' | 'causedBy'>[] = []): number =>
    asSystem((tx) => {
      for (const [index, event] of events.entries())
        tx.enqueue({
          ...event,
          id: `scenario:${runtime.store.metadata.scenarioId}:${index}`,
          depth: 1,
          causedBy: SYSTEM_ACTOR_ID,
        });
      automation.evaluateSchedules(tx);
    }).runs;

  return {
    customers: crm,
    quotes: sales.quotes,
    orders: sales.orders,
    shipments: fulfillment.shipments,
    returns: fulfillment.returns,
    inventory: {
      adjust: inventory.adjust,
      transfers: inventory.transfers,
      cycleCounts: inventory.cycleCounts,
    },
    suppliers: procurement.suppliers,
    purchaseOrders: procurement.purchaseOrders,
    invoices: finance.invoices,
    payments: finance.payments,
    creditMemos: finance.creditMemos,
    refunds: finance.refunds,
    bankTransactions: finance.bankTransactions,
    tickets: support,
    approvals,
    workflows: platform.workflows,
    notifications: platform.notifications,
    tasks: platform.tasks,
    savedViews: platform.savedViews,
    imports: platform.imports,
    onClockAdvanced,
    onInitialized,
    automation,
  };
}

export type Commands = ReturnType<typeof createCommands>;
