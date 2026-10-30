import { inject, type Type } from '@angular/core';
import type { ResolveFn, Routes } from '@angular/router';

import { sessionReady, signedOut } from './core/nav/guards';
import { SessionStore } from './core/session/session.store';
import { NAV_MODULES } from './core/nav/nav.model';
import { isLazy, lazyPage, PermissionGate, type LazyPage } from './core/nav/permission-gate';
import { NotFoundPage } from './pages/not-found/not-found-page';
import { PlaceholderPage } from './pages/placeholder/placeholder-page';
import { SignInPage } from './pages/sign-in/sign-in-page';
import { ShellLayout } from './shell/shell-layout';

const strip = (path: string) => path.replace(/^\//, '');

/**
 * The destinations with a screen; the rest open on the placeholder until their
 * slice. Every screen is fetched when first opened, so the initial bundle holds the shell and the
 * backend and stays inside the budget `angular.json` states.
 */
const PAGES: Record<string, Type<unknown> | LazyPage> = {
  '/crm/customers': lazyPage(() => import('./pages/customers/customers-page').then((m) => m.CustomersPage)),
  '/crm/customers/new': lazyPage(() => import('./pages/customers/new-customer-page').then((m) => m.NewCustomerPage)),
  '/crm/customers/:id': lazyPage(() => import('./pages/customers/customer-page').then((m) => m.CustomerPage)),
  '/crm/contacts': lazyPage(() => import('./pages/contacts/contacts-page').then((m) => m.ContactsPage)),
  '/crm/imports': lazyPage(() => import('./pages/imports/import-page').then((m) => m.ImportPage)),
  '/crm/imports/:id': lazyPage(() => import('./pages/imports/import-page').then((m) => m.ImportPage)),
  '/sales/orders': lazyPage(() => import('./pages/orders/orders-page').then((m) => m.OrdersPage)),
  '/sales/orders/:id': lazyPage(() => import('./pages/orders/order-page').then((m) => m.OrderPage)),
  '/sales/approvals': lazyPage(() => import('./pages/approvals/approvals-page').then((m) => m.ApprovalsPage)),
  '/sales/quotes': lazyPage(() => import('./pages/quotes/quotes-page').then((m) => m.QuotesPage)),
  '/sales/quotes/new': lazyPage(() => import('./pages/quotes/new-quote-page').then((m) => m.NewQuotePage)),
  '/sales/quotes/:id': lazyPage(() => import('./pages/quotes/quote-page').then((m) => m.QuotePage)),
  '/catalog/products': lazyPage(() => import('./pages/catalog/products-page').then((m) => m.ProductsPage)),
  '/catalog/products/:id': lazyPage(() => import('./pages/catalog/product-page').then((m) => m.ProductPage)),
  '/catalog/skus': lazyPage(() => import('./pages/catalog/skus-page').then((m) => m.SkusPage)),
  '/catalog/skus/:id': lazyPage(() => import('./pages/catalog/sku-page').then((m) => m.SkuPage)),
  '/catalog/categories': lazyPage(() => import('./pages/catalog/categories-page').then((m) => m.CategoriesPage)),
  '/catalog/price-lists': lazyPage(() => import('./pages/catalog/price-lists-page').then((m) => m.PriceListsPage)),
  '/inventory/overview': lazyPage(() => import('./pages/inventory/overview-page').then((m) => m.OverviewPage)),
  '/inventory/stock': lazyPage(() => import('./pages/inventory/stock-page').then((m) => m.StockPage)),
  '/inventory/stock/:id': lazyPage(() => import('./pages/inventory/position-page').then((m) => m.PositionPage)),
  '/inventory/warehouses': lazyPage(() => import('./pages/inventory/warehouses-page').then((m) => m.WarehousesPage)),
  '/inventory/warehouses/:id': lazyPage(() => import('./pages/inventory/warehouse-page').then((m) => m.WarehousePage)),
  '/inventory/movements': lazyPage(() => import('./pages/inventory/movements-page').then((m) => m.MovementsPage)),
  '/inventory/movements/:id': lazyPage(() => import('./pages/inventory/movements-page').then((m) => m.MovementsPage)),
  '/inventory/transfers': lazyPage(() => import('./pages/inventory/transfers-page').then((m) => m.TransfersPage)),
  '/inventory/transfers/new': lazyPage(() => import('./pages/inventory/new-transfer-page').then((m) => m.NewTransferPage)),
  '/inventory/transfers/:id': lazyPage(() => import('./pages/inventory/transfer-page').then((m) => m.TransferPage)),
  '/inventory/cycle-counts': lazyPage(() => import('./pages/inventory/cycle-counts-page').then((m) => m.CycleCountsPage)),
  '/inventory/cycle-counts/new': lazyPage(() => import('./pages/inventory/new-cycle-count-page').then((m) => m.NewCycleCountPage)),
  '/inventory/cycle-counts/:id': lazyPage(() => import('./pages/inventory/cycle-count-page').then((m) => m.CycleCountPage)),
  '/procurement/suppliers': lazyPage(() => import('./pages/procurement/suppliers-page').then((m) => m.SuppliersPage)),
  '/procurement/suppliers/new': lazyPage(() => import('./pages/procurement/new-supplier-page').then((m) => m.NewSupplierPage)),
  '/procurement/suppliers/:id': lazyPage(() => import('./pages/procurement/supplier-page').then((m) => m.SupplierPage)),
  '/procurement/purchase-orders': lazyPage(() => import('./pages/procurement/purchase-orders-page').then((m) => m.PurchaseOrdersPage)),
  '/procurement/purchase-orders/new': lazyPage(() => import('./pages/procurement/new-purchase-order-page').then((m) => m.NewPurchaseOrderPage)),
  '/procurement/purchase-orders/:id': lazyPage(() => import('./pages/procurement/purchase-order-page').then((m) => m.PurchaseOrderPage)),
  '/procurement/receiving': lazyPage(() => import('./pages/procurement/receiving-page').then((m) => m.ReceivingPage)),
  // No endpoint lists goods receipts: a receipt's one address is the receiving destination's `:id`.
  '/procurement/receiving/:id': lazyPage(() => import('./pages/procurement/goods-receipt-page').then((m) => m.GoodsReceiptPage)),
  '/finance/overview': lazyPage(() => import('./pages/finance/overview-page').then((m) => m.FinanceOverviewPage)),
  '/finance/invoices': lazyPage(() => import('./pages/finance/invoices-page').then((m) => m.InvoicesPage)),
  '/finance/invoices/:id': lazyPage(() => import('./pages/finance/invoice-page').then((m) => m.InvoicePage)),
  // Credit memos have no destination of their own: they live under Invoices, before its `:id`.
  '/finance/invoices/credit-memos': lazyPage(() => import('./pages/finance/credit-memos-page').then((m) => m.CreditMemosPage)),
  '/finance/invoices/credit-memos/new': lazyPage(() => import('./pages/finance/new-credit-memo-page').then((m) => m.NewCreditMemoPage)),
  '/finance/invoices/credit-memos/:id': lazyPage(() => import('./pages/finance/credit-memo-page').then((m) => m.CreditMemoPage)),
  '/finance/payments': lazyPage(() => import('./pages/finance/payments-page').then((m) => m.PaymentsPage)),
  '/finance/payments/new': lazyPage(() => import('./pages/finance/record-payment-page').then((m) => m.RecordPaymentPage)),
  '/finance/payments/:id': lazyPage(() => import('./pages/finance/payment-page').then((m) => m.PaymentPage)),
  '/finance/reconciliation': lazyPage(() => import('./pages/finance/reconciliation-page').then((m) => m.ReconciliationPage)),
  // A bank transaction is read in the workspace: its `:id` is the one the workspace has open.
  '/finance/reconciliation/:id': lazyPage(() => import('./pages/finance/reconciliation-page').then((m) => m.ReconciliationPage)),
  '/support/inbox': lazyPage(() => import('./pages/support/inbox-page').then((m) => m.InboxPage)),
  // A ticket is read in the inbox: its `:id` is the one the inbox has open.
  '/support/inbox/:id': lazyPage(() => import('./pages/support/inbox-page').then((m) => m.InboxPage)),
  '/support/inbox/new': lazyPage(() => import('./pages/support/new-ticket-page').then((m) => m.NewTicketPage)),
  '/automations/workflows': lazyPage(() => import('./pages/automations/workflows-page').then((m) => m.WorkflowsPage)),
  '/automations/workflows/new': lazyPage(() => import('./pages/automations/new-workflow-page').then((m) => m.NewWorkflowPage)),
  '/automations/workflows/:id': lazyPage(() => import('./pages/automations/workflow-page').then((m) => m.WorkflowPage)),
  // The execution history of §15, one workflow's runs under its record.
  '/automations/workflows/:id/runs': lazyPage(() => import('./pages/automations/workflow-runs-page').then((m) => m.WorkflowRunsPage)),
  // Section 16's reports: one page draws the six, by the route it stands on.
  ...Object.fromEntries(
    ['executive', 'sales', 'inventory', 'procurement', 'finance', 'support'].map((key) => [
      `/analytics/${key}`,
      lazyPage(() => import('./pages/analytics/report-page').then((m) => m.ReportPage)),
    ]),
  ),
};

/**
 * Fetches every lazy page once the shell has painted. The gate draws nothing
 * while a page's chunk is on its way — the page's own placeholders live in the
 * chunk — so the chunks are taken ahead of the first visit instead, outside
 * the initial bundle.
 */
export function preloadLazyPages(): void {
  for (const page of Object.values(PAGES)) if (isLazy(page)) void page.load();
}

/**
 * What a destination fetches before it draws: the chart engine's chunks, ahead
 * of the first chart. The loader itself is imported on demand, so the initial
 * bundle carries neither the engine nor the chart family.
 */
const RESOLVERS: Record<string, Record<string, ResolveFn<unknown>>> = {
  '/inventory/overview': {
    chart: () =>
      import('@slotted/core/chart-echarts').then((engine) => engine.preloadChartEngine(['bar'])),
  },
  '/procurement/receiving': {
    chart: () =>
      import('@slotted/core/chart-echarts').then((engine) => engine.preloadChartEngine(['bar'])),
  },
  '/finance/overview': {
    chart: () =>
      import('@slotted/core/chart-echarts').then((engine) => engine.preloadChartEngine(['bar'])),
  },
  ...Object.fromEntries(
    ['executive', 'sales', 'inventory', 'procurement', 'finance', 'support'].map((key) => [
      `/analytics/${key}`,
      {
        chart: () =>
          import('@slotted/core/chart-echarts').then((engine) => engine.preloadChartEngine(['bar', 'line'])),
      },
    ]),
  ),
};

const gate = (path: string, title: string, permissions: string[] = [], requires: string[] = []) => {
  const page = PAGES[path] ?? PlaceholderPage;
  // A lazy page's chunk is a resolver: the route activates with its page, and never draws an empty gate.
  const resolve = {
    ...(RESOLVERS[path] ?? {}),
    ...(isLazy(page) ? { pageComponent: () => page.load() } : {}),
  };
  return {
    path: strip(path),
    component: PermissionGate,
    title,
    data: { permissions, requires, page, title, path },
    ...(Object.keys(resolve).length > 0 ? { resolve } : {}),
  };
};

/** Every destination of the Appendix A route map, gated by the module's or its own permission. */
const moduleRoutes: Routes = NAV_MODULES.flatMap((m) => {
  if (m.id === 'home') return [];
  if (m.destinations.length === 0) return [gate(m.path, m.label, m.permissions)];
  return [
    {
      path: strip(m.path),
      pathMatch: 'full' as const,
      // The module opens on the first destination the reader may open: a representative sent to
      // /finance reads the invoices, not the overview their role does not hold.
      redirectTo: () => {
        const session = inject(SessionStore);
        const open = m.destinations.find(
          (x) =>
            ((x.permissions ?? m.permissions ?? []).length === 0 || session.canAny(...(x.permissions ?? m.permissions ?? []))) &&
            (x.requires ?? []).every((p) => session.can(p)),
        );
        return strip((open ?? m.destinations[0]!).path);
      },
    },
    ...m.destinations.flatMap((x) => [
      gate(x.path, x.label, x.permissions ?? m.permissions, x.requires),
      // A destination with no record of its own leaves `:id` to the not-found page.
      ...(x.record === false
        ? []
        : [gate(`${x.path}/:id`, x.label, x.permissions ?? m.permissions, x.requires)]),
    ]),
  ];
});

export const routes: Routes = [
  { path: 'sign-in', component: SignInPage, title: 'Sign in', canMatch: [signedOut] },
  {
    path: '',
    component: ShellLayout,
    canMatch: [sessionReady],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard-page').then((m) => m.DashboardPage),
        title: 'Dashboard',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications-page').then((m) => m.NotificationsPage),
        title: 'Notifications',
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile-page').then((m) => m.ProfilePage),
        title: 'Your profile',
      },
      {
        path: 'settings/preferences',
        loadComponent: () =>
          import('./pages/preferences/preferences-page').then((m) => m.PreferencesPage),
        title: 'Preferences',
      },
      // Before the module's own `:id`, which would take `new` for an account number.
      gate('/crm/customers/new', 'New customer', ['customers.create']),
      gate('/sales/quotes/new', 'New quote', ['quotes.create']),
      gate('/inventory/transfers/new', 'New transfer', ['inventory.transfer']),
      gate('/inventory/cycle-counts/new', 'Plan a count', ['inventory.cycle_count']),
      gate('/procurement/suppliers/new', 'New supplier', ['suppliers.manage']),
      gate('/procurement/purchase-orders/new', 'New purchase order', ['purchase_orders.create']),
      gate('/finance/payments/new', 'Record payment', ['payments.record']),
      gate('/finance/invoices/credit-memos/new', 'New credit memo', ['credit_memos.create']),
      gate('/finance/invoices/credit-memos', 'Credit memos', ['credit_memos.view']),
      gate('/finance/invoices/credit-memos/:id', 'Credit memo', ['credit_memos.view']),
      gate('/support/inbox/new', 'New ticket', ['support.create']),
      gate('/automations/workflows/new', 'New workflow', ['workflows.create']),
      gate('/automations/workflows/:id/runs', 'Run history', ['workflows.view']),
      ...moduleRoutes,
      { path: '**', component: NotFoundPage, title: 'Not found' },
    ],
  },
];
