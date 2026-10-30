import {
  notFound,
  type Address,
  type Contact,
  type ContractPrice,
  type Customer,
  type CustomerFinancialSummary,
  type CustomerNote,
} from '../../domain';
import {
  fields,
  runListQuery,
  type ListQuery,
  type ListResponse,
  type ResourceDefinition,
} from '../query';
import type { ApiRuntime } from '../runtime';

export interface CustomerListItem extends Customer {
  accountOwnerName: string;
  salesTeamName: string;
  primaryContactName?: string;
  city?: string;
  region?: string;
  summary: CustomerFinancialSummary;
}

export interface CustomerDetail {
  customer: CustomerListItem;
  contacts: Contact[];
  addresses: Address[];
  notes: CustomerNote[];
  contractPrices: ContractPrice[];
  recentOrders: {
    id: string;
    orderNumber: string;
    orderDate: string;
    status: string;
    fulfillmentStatus: string;
    total: Customer['creditLimit'];
  }[];
  openInvoices: {
    id: string;
    invoiceNumber?: string;
    issueDate: string;
    dueDate: string;
    outstanding: Customer['creditLimit'];
    collectionState: string;
  }[];
  openTickets: {
    id: string;
    ticketNumber: string;
    subject: string;
    priority: string;
    status: string;
  }[];
}

export function customerListItem(runtime: ApiRuntime, customer: Customer): CustomerListItem {
  const { dataset } = runtime.store;
  const owner = dataset.users.get(customer.accountOwnerId);
  const team = dataset.teams.get(customer.salesTeamId);
  const contact = customer.primaryContactId
    ? dataset.contacts.get(customer.primaryContactId)
    : undefined;
  const address = customer.billingAddressId
    ? dataset.addresses.get(customer.billingAddressId)
    : undefined;
  return {
    ...customer,
    accountOwnerName: owner?.displayName ?? customer.accountOwnerId,
    salesTeamName: team?.name ?? customer.salesTeamId,
    summary: runtime.projections.customerSummary(customer.id),
    ...(contact ? { primaryContactName: contact.displayName } : {}),
    ...(address ? { city: address.city, region: address.region } : {}),
  };
}

export const customerResource: ResourceDefinition<CustomerListItem> = {
  fields: fields<CustomerListItem>({
    id: ['string', (item) => item.id],
    accountNumber: ['string', (item) => item.accountNumber],
    displayName: ['string', (item) => item.displayName],
    legalName: ['string', (item) => item.legalName],
    status: ['enum', (item) => item.status],
    segment: ['enum', (item) => item.segment],
    regionCode: ['enum', (item) => item.regionCode],
    preferredCurrency: ['enum', (item) => item.preferredCurrency],
    health: ['enum', (item) => item.health],
    industry: ['string', (item) => item.industry],
    accountOwnerId: ['string', (item) => item.accountOwnerId],
    accountOwnerName: ['string', (item) => item.accountOwnerName],
    salesTeamId: ['string', (item) => item.salesTeamId],
    paymentTermsCode: ['enum', (item) => item.paymentTermsCode],
    priceListId: ['string', (item) => item.priceListId],
    creditLimit: ['money', (item) => item.creditLimit],
    customerSince: ['date', (item) => item.customerSince],
    region: ['string', (item) => item.region],
    city: ['string', (item) => item.city],
    tags: ['array', (item) => item.tags],
    grossReceivables: ['money', (item) => item.summary.grossReceivables],
    overdueReceivables: ['money', (item) => item.summary.overdueReceivables],
    creditExposure: ['money', (item) => item.summary.creditExposure],
    creditUtilizationBps: ['number', (item) => item.summary.creditUtilizationBps],
    lifetimeRevenue: ['money', (item) => item.summary.lifetimeRevenue],
    ordersLast12Months: ['number', (item) => item.summary.ordersLast12Months],
    openOrderCount: ['number', (item) => item.summary.openOrderCount],
    openTicketCount: ['number', (item) => item.summary.openTicketCount],
    updatedAt: ['datetime', (item) => item.metadata.updatedAt],
    createdAt: ['datetime', (item) => item.metadata.createdAt],
    archived: ['boolean', (item) => item.metadata.archivedAt !== undefined],
  }),
  search: (item) => [
    item.displayName,
    item.legalName,
    item.accountNumber,
    item.primaryContactName,
    item.city,
  ],
  defaultSort: 'displayName',
};

export function listCustomers(
  runtime: ApiRuntime,
  query: ListQuery,
): ListResponse<CustomerListItem> {
  runtime.require('customers.view');
  const items: CustomerListItem[] = [];
  const includeArchived = query.filter?.['archived'] !== undefined;
  for (const customer of runtime.store.dataset.customers.values()) {
    if (!includeArchived && customer.metadata.archivedAt) continue;
    items.push(customerListItem(runtime, customer));
  }
  return runListQuery(items, customerResource, query);
}

export function getCustomer(runtime: ApiRuntime, id: string): CustomerDetail {
  runtime.require('customers.view');
  const customer = runtime.store.dataset.customers.get(id);
  if (!customer) throw notFound('Customer', id);
  const { indexes, store } = runtime;
  const actor = runtime.actor;
  const notes = indexes.notesByCustomer.get(id).filter((note) => {
    if (note.visibility === 'organization') return true;
    if (note.visibility === 'private') return note.authorId === actor.id;
    const teamIds = store.dataset.teamMemberships
      .filter((membership) => membership.userId === actor.id)
      .map((membership) => membership.teamId);
    return (
      note.authorId === actor.id ||
      (note.teamId !== undefined && teamIds.includes(note.teamId)) ||
      runtime.can('roles.manage')
    );
  });
  const recentOrders = indexes.ordersByCustomer
    .get(id)
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
    .slice(0, 10)
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total,
    }));
  const openInvoices = indexes.invoicesByCustomer
    .get(id)
    .filter((invoice) => invoice.lifecycle === 'open' && invoice.outstanding.minor > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((invoice) => ({
      id: invoice.id,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      outstanding: invoice.outstanding,
      collectionState: invoice.collectionState,
      ...(invoice.invoiceNumber ? { invoiceNumber: invoice.invoiceNumber } : {}),
    }));
  const openTickets = indexes.ticketsByCustomer
    .get(id)
    .filter((ticket) => ticket.status !== 'closed' && ticket.status !== 'resolved')
    .map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      priority: ticket.priority,
      status: ticket.status,
    }));
  return {
    customer: customerListItem(runtime, customer),
    contacts: indexes.contactsByCustomer
      .get(id)
      .slice()
      .sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) || a.displayName.localeCompare(b.displayName),
      ),
    addresses: indexes.addressesByOwner.get(id),
    notes: notes.sort(
      (a, b) =>
        Number(b.isPinned) - Number(a.isPinned) ||
        b.metadata.createdAt.localeCompare(a.metadata.createdAt),
    ),
    contractPrices: indexes.contractPricesByCustomer.get(id),
    recentOrders,
    openInvoices,
    openTickets,
  };
}
