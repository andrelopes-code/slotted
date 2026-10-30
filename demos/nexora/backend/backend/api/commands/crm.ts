import {
  type Address,
  type Contact,
  type Customer,
  type CustomerNote,
  type CustomerSegment,
  type PaymentTermsCode,
  type RegionCode,
  money,
  regionByCode,
} from '../../domain';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';
import {
  dollars,
  domainError,
  finalize,
  load,
  metadata,
  open,
  transition,
  trimmed,
  Validator,
} from './helpers';
import { customerListItem, type CustomerListItem } from '../resources/customers';

export interface CreateCustomerInput {
  displayName: string;
  legalName?: string;
  segment: CustomerSegment;
  industry: string;
  /** Defaults to 'US'. Sets `preferredCurrency`, the credit limit currency and the default price list of the region. */
  regionCode?: RegionCode;
  paymentTermsCode?: PaymentTermsCode;
  /** Minor units of the region currency. */
  creditLimitMinor?: number;
  priceListId?: string;
  accountOwnerId?: string;
  salesTeamId?: string;
  website?: string;
  employeeBand?: string;
  taxExempt?: boolean;
  tags?: string[];
  primaryContact?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    title?: string;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode?: string;
  };
}

export type UpdateCustomerInput = Partial<
  Pick<
    Customer,
    | 'displayName'
    | 'legalName'
    | 'segment'
    | 'industry'
    | 'paymentTermsCode'
    | 'priceListId'
    | 'accountOwnerId'
    | 'salesTeamId'
    | 'website'
    | 'employeeBand'
    | 'tags'
    | 'primaryContactId'
    | 'billingAddressId'
    | 'defaultShippingAddressId'
  >
> & {
  creditLimitMinor?: number;
  taxExempt?: boolean;
  status?: 'prospect' | 'active' | 'inactive';
};

export function createCrmCommands(runtime: ApiRuntime) {
  const standardList = (regionCode: RegionCode): string => {
    const lists = [...runtime.store.dataset.priceLists.values()];
    const region = regionByCode(regionCode);
    return (
      lists.find((list) => list.regionCode === regionCode && list.currency === region.currency)
        ?.id ??
      lists.find((list) => list.name === 'Standard')?.id ??
      (runtime.store.dataset.priceLists.keys().next().value as string)
    );
  };

  /**
   * Section 56: edits a customer. The interactive command and a workflow's
   * tag and assignment actions write through it (section 69.3).
   */
  const updateCustomer = (
    tx: Transaction,
    id: string,
    input: UpdateCustomerInput,
    options?: MutationOptions,
  ): CustomerListItem => {
    const customer = load(runtime, 'customers', id, 'Customer');
    tx.require('customers.edit', {
      ownerId: customer.accountOwnerId,
      teamId: customer.salesTeamId,
    });
    if (customer.status === 'closed') throw transition('Customer', customer.status, 'be edited');
    if (input.creditLimitMinor !== undefined) tx.require('customers.credit_edit');
    const validator = new Validator();
    if (input.displayName !== undefined) validator.required('displayName', input.displayName);
    if (input.segment !== undefined)
      validator.oneOf('segment', input.segment, [
        'smb',
        'mid_market',
        'enterprise',
        'strategic',
      ] as const);
    if (input.status !== undefined)
      validator.oneOf('status', input.status, ['prospect', 'active', 'inactive'] as const);
    if (input.primaryContactId !== undefined)
      validator.check(
        runtime.indexes.contactsByCustomer
          .get(id)
          .some((contact) => contact.id === input.primaryContactId),
        'primaryContactId',
        'NOT_FOUND',
        'primaryContactId must belong to the customer',
      );
    validator.throwIfAny();
    const before = { ...customer };
    open(tx, 'customers', id, 'Customer', options);
    const changed: string[] = [];
    const assign = <K extends keyof Customer>(key: K, value: Customer[K] | undefined): void => {
      if (value === undefined || value === customer[key]) return;
      customer[key] = value;
      changed.push(key);
    };
    assign('displayName', trimmed(input.displayName));
    assign('legalName', trimmed(input.legalName));
    assign('segment', input.segment);
    assign('industry', trimmed(input.industry));
    assign('paymentTermsCode', input.paymentTermsCode);
    assign('priceListId', input.priceListId);
    assign('accountOwnerId', input.accountOwnerId);
    assign('salesTeamId', input.salesTeamId);
    assign('website', trimmed(input.website));
    assign('employeeBand', trimmed(input.employeeBand));
    assign('tags', input.tags);
    assign('billingAddressId', input.billingAddressId);
    assign('defaultShippingAddressId', input.defaultShippingAddressId);
    if (
      input.creditLimitMinor !== undefined &&
      input.creditLimitMinor !== customer.creditLimit.minor
    ) {
      customer.creditLimit = money(input.creditLimitMinor, customer.preferredCurrency);
      changed.push('creditLimit');
    }
    if (input.taxExempt !== undefined) {
      const next = input.taxExempt
        ? { type: 'exempt' as const, exemptionReason: 'Exemption certificate on file' }
        : { type: 'taxable' as const };
      if (next.type !== customer.taxProfile.type) {
        customer.taxProfile = next;
        changed.push('taxProfile');
      }
    }
    if (input.status !== undefined && input.status !== customer.status) {
      if (customer.status === 'on_hold')
        throw transition('Customer', 'on_hold', 'change status without releasing the hold');
      tx.emit('customer.status_changed', { customerId: id, previousStatus: customer.status });
      customer.status = input.status;
      changed.push('status');
      tx.activityEvent({
        type: 'customer.status_changed',
        subjectType: 'customer',
        subjectId: id,
        subjectLabel: customer.displayName,
        customerId: id,
        summary: `${customer.displayName} is now ${input.status}`,
      });
    }
    if (
      input.primaryContactId !== undefined &&
      input.primaryContactId !== customer.primaryContactId
    ) {
      for (const contact of runtime.indexes.contactsByCustomer.get(id)) {
        if (contact.isPrimary && contact.id !== input.primaryContactId) {
          tx.touch('contacts', contact).isPrimary = false;
        }
        if (contact.id === input.primaryContactId) tx.touch('contacts', contact).isPrimary = true;
      }
      tx.dirty('contacts');
      customer.primaryContactId = input.primaryContactId;
      changed.push('primaryContactId');
    }
    finalize(tx, 'customers', customer, 'customer.updated', 'customer', changed, before);
    return customerListItem(runtime, customer);
  };

  /** Section 56.2: places a customer on hold — the interactive command and a workflow's action. */
  const holdCustomer = (
    tx: Transaction,
    id: string,
    reason: string,
    options?: MutationOptions,
  ): CustomerListItem => {
    tx.require('customers.credit_edit');
    new Validator().required('reason', reason).throwIfAny();
    const customer = open(tx, 'customers', id, 'Customer', options);
    if (customer.status !== 'active' && customer.status !== 'prospect')
      throw transition('Customer', customer.status, 'be placed on hold');
    tx.emit('customer.status_changed', { customerId: id, previousStatus: customer.status });
    customer.status = 'on_hold';
    customer.holdReason = reason.trim();
    customer.health = 'at_risk';
    finalize(tx, 'customers', customer, 'customer.hold_placed', 'customer', [
      'status',
      'holdReason',
      'health',
    ]);
    tx.activityEvent({
      type: 'customer.status_changed',
      subjectType: 'customer',
      subjectId: id,
      subjectLabel: customer.displayName,
      customerId: id,
      summary: `${customer.displayName} placed on hold — ${reason.trim()}`,
    });
    tx.notify(
      customer.accountOwnerId,
      'warning',
      `${customer.displayName} placed on hold`,
      reason.trim(),
      { type: 'customer', id },
    );
    return customerListItem(runtime, customer);
  };

  return {
    services: { updateCustomer, holdCustomer },
    create: (input: CreateCustomerInput, options?: MutationOptions): Promise<CustomerListItem> =>
      runtime.command('POST /customers', options, input, (tx) => {
        const actor = runtime.require('customers.create');
        const validator = new Validator()
          .required('displayName', input.displayName)
          .required('industry', input.industry)
          .oneOf('segment', input.segment, [
            'smb',
            'mid_market',
            'enterprise',
            'strategic',
          ] as const);
        if (input.creditLimitMinor !== undefined)
          validator.check(
            Number.isInteger(input.creditLimitMinor) && input.creditLimitMinor >= 0,
            'creditLimitMinor',
            'INVALID_VALUE',
            'creditLimitMinor must be a non-negative integer',
          );
        if (input.creditLimitMinor !== undefined && input.creditLimitMinor > 0)
          runtime.require('customers.credit_edit');
        validator.throwIfAny();
        const { dataset } = runtime.store;
        const ownerId = input.accountOwnerId ?? actor.id;
        const owner = dataset.users.get(ownerId);
        if (!owner)
          throw domainError('VALIDATION_FAILED', `Account owner ${ownerId} does not exist`);
        const teamId =
          input.salesTeamId ??
          dataset.teamMemberships.find(
            (membership) =>
              membership.userId === ownerId &&
              dataset.teams.get(membership.teamId)?.type === 'sales',
          )?.teamId ??
          [...dataset.teams.values()].find((team) => team.type === 'sales')?.id ??
          '';
        const regionCode = input.regionCode ?? 'US';
        const region = regionByCode(regionCode);
        const id = runtime.store.nextId('customer');
        const customer: Customer = {
          id,
          organizationId: dataset.organization.id,
          accountNumber: runtime.store.nextBusinessNumber('customer'),
          regionCode,
          legalName: trimmed(input.legalName) ?? input.displayName.trim(),
          displayName: input.displayName.trim(),
          status: 'prospect',
          segment: input.segment,
          industry: input.industry.trim(),
          accountOwnerId: ownerId,
          salesTeamId: teamId,
          paymentTermsCode: input.paymentTermsCode ?? 'NET_30',
          creditLimit: money(input.creditLimitMinor ?? 0, region.currency),
          priceListId: input.priceListId ?? standardList(regionCode),
          taxProfile: input.taxExempt
            ? { type: 'exempt', exemptionReason: 'Exemption certificate on file' }
            : { type: 'taxable' },
          preferredCurrency: region.currency,
          customerSince: runtime.store.today,
          health: 'healthy',
          tags: input.tags ?? [],
          metadata: metadata(tx, id),
          ...(trimmed(input.website) ? { website: trimmed(input.website) as string } : {}),
          ...(trimmed(input.employeeBand)
            ? { employeeBand: trimmed(input.employeeBand) as string }
            : {}),
        };
        tx.create('customers', customer);
        if (input.primaryContact) {
          const contactId = runtime.store.nextId('contact');
          const contact: Contact = {
            id: contactId,
            organizationId: dataset.organization.id,
            customerId: id,
            firstName: input.primaryContact.firstName.trim(),
            lastName: input.primaryContact.lastName.trim(),
            displayName: `${input.primaryContact.firstName.trim()} ${input.primaryContact.lastName.trim()}`,
            isPrimary: true,
            status: 'active',
            metadata: metadata(tx, contactId),
            ...(trimmed(input.primaryContact.email)
              ? { email: trimmed(input.primaryContact.email) as string }
              : {}),
            ...(trimmed(input.primaryContact.phone)
              ? { phone: trimmed(input.primaryContact.phone) as string }
              : {}),
            ...(trimmed(input.primaryContact.title)
              ? { title: trimmed(input.primaryContact.title) as string }
              : {}),
          };
          tx.create('contacts', contact);
          customer.primaryContactId = contactId;
        }
        if (input.billingAddress) {
          const addressId = runtime.store.nextId('address');
          const address: Address = {
            id: addressId,
            organizationId: dataset.organization.id,
            ownerType: 'customer',
            ownerId: id,
            type: 'billing',
            line1: input.billingAddress.line1.trim(),
            city: input.billingAddress.city.trim(),
            region: input.billingAddress.region.trim(),
            postalCode: input.billingAddress.postalCode.trim(),
            countryCode: input.billingAddress.countryCode ?? 'US',
            isDefault: true,
            metadata: metadata(tx, addressId),
            ...(trimmed(input.billingAddress.line2)
              ? { line2: trimmed(input.billingAddress.line2) as string }
              : {}),
          };
          tx.create('addresses', address);
          customer.billingAddressId = addressId;
          customer.defaultShippingAddressId = addressId;
        }
        tx.audit('customer.created', 'customer', id, { nextVersion: 1 });
        tx.activityEvent({
          type: 'customer.created',
          subjectType: 'customer',
          subjectId: id,
          subjectLabel: customer.displayName,
          customerId: id,
          summary: `${customer.displayName} created as a prospect`,
        });
        return customerListItem(runtime, customer);
      }),

    update: (
      id: string,
      input: UpdateCustomerInput,
      options?: MutationOptions,
    ): Promise<CustomerListItem> =>
      runtime.command('PATCH /customers/:id', options, { id, input }, (tx) =>
        updateCustomer(tx, id, input, options),
      ),

    /** Section 91.5 — archive rules. */
    archive: (id: string, options?: MutationOptions): Promise<CustomerListItem> =>
      runtime.command('POST /customers/:id/archive', options, { id }, (tx) => {
        const customer = load(runtime, 'customers', id, 'Customer');
        runtime.require('customers.archive');
        const openOrders = runtime.indexes.ordersByCustomer
          .get(id)
          .filter(
            (order) =>
              order.status === 'confirmed' ||
              order.status === 'on_hold' ||
              order.status === 'pending_approval',
          );
        const openInvoices = runtime.indexes.invoicesByCustomer
          .get(id)
          .filter((invoice) => invoice.lifecycle === 'open' && invoice.outstanding.minor > 0);
        const openTickets = runtime.indexes.ticketsByCustomer
          .get(id)
          .filter((ticket) => ticket.status !== 'closed' && ticket.status !== 'resolved');
        if (openOrders.length > 0 || openInvoices.length > 0 || openTickets.length > 0) {
          throw domainError(
            'CUSTOMER_HAS_OPEN_ACTIVITY',
            `${customer.displayName} cannot be archived with ${openOrders.length} open orders, ${openInvoices.length} open invoices and ${openTickets.length} unresolved tickets`,
            409,
            {
              openOrders: openOrders.length,
              openInvoices: openInvoices.length,
              openTickets: openTickets.length,
            },
          );
        }
        open(tx, 'customers', id, 'Customer', options);
        tx.emit('customer.status_changed', { customerId: id, previousStatus: customer.status });
        customer.status = 'closed';
        customer.metadata.archivedAt = tx.occurredAt;
        finalize(tx, 'customers', customer, 'customer.archived', 'customer', [
          'status',
          'archivedAt',
        ]);
        tx.activityEvent({
          type: 'customer.archived',
          subjectType: 'customer',
          subjectId: id,
          subjectLabel: customer.displayName,
          customerId: id,
          summary: `${customer.displayName} archived`,
        });
        return customerListItem(runtime, customer);
      }),

    hold: (id: string, reason: string, options?: MutationOptions): Promise<CustomerListItem> =>
      runtime.command('POST /customers/:id/hold', options, { id, reason }, (tx) =>
        holdCustomer(tx, id, reason, options),
      ),

    releaseHold: (id: string, options?: MutationOptions): Promise<CustomerListItem> =>
      runtime.command('POST /customers/:id/release-hold', options, { id }, (tx) => {
        runtime.require('customers.credit_edit');
        const customer = open(tx, 'customers', id, 'Customer', options);
        if (customer.status !== 'on_hold')
          throw transition('Customer', customer.status, 'be released from hold');
        tx.emit('customer.status_changed', { customerId: id, previousStatus: customer.status });
        customer.status = 'active';
        delete customer.holdReason;
        customer.health = runtime.projections.computeHealth(customer);
        finalize(tx, 'customers', customer, 'customer.hold_released', 'customer', [
          'status',
          'holdReason',
          'health',
        ]);
        tx.activityEvent({
          type: 'customer.status_changed',
          subjectType: 'customer',
          subjectId: id,
          subjectLabel: customer.displayName,
          customerId: id,
          summary: `${customer.displayName} released from hold`,
        });
        return customerListItem(runtime, customer);
      }),

    contacts: {
      create: (
        customerId: string,
        input: {
          firstName: string;
          lastName: string;
          email?: string;
          phone?: string;
          mobile?: string;
          title?: string;
          department?: string;
          isPrimary?: boolean;
        },
        options?: MutationOptions,
      ): Promise<Contact> =>
        runtime.command('POST /customers/:id/contacts', options, { customerId, input }, (tx) => {
          const customer = load(runtime, 'customers', customerId, 'Customer');
          runtime.require('contacts.manage', {
            ownerId: customer.accountOwnerId,
            teamId: customer.salesTeamId,
          });
          const validator = new Validator()
            .required('firstName', input.firstName)
            .required('lastName', input.lastName);
          if (input.email)
            validator.check(
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email),
              'email',
              'INVALID_EMAIL',
              'email must be a valid address',
            );
          validator.throwIfAny();
          const id = runtime.store.nextId('contact');
          const contact: Contact = {
            id,
            organizationId: customer.organizationId,
            customerId,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            displayName: `${input.firstName.trim()} ${input.lastName.trim()}`,
            isPrimary: Boolean(input.isPrimary),
            status: 'active',
            metadata: metadata(tx, id),
            ...(trimmed(input.email) ? { email: trimmed(input.email) as string } : {}),
            ...(trimmed(input.phone) ? { phone: trimmed(input.phone) as string } : {}),
            ...(trimmed(input.mobile) ? { mobile: trimmed(input.mobile) as string } : {}),
            ...(trimmed(input.title) ? { title: trimmed(input.title) as string } : {}),
            ...(trimmed(input.department)
              ? { department: trimmed(input.department) as string }
              : {}),
          };
          if (contact.isPrimary) {
            for (const other of runtime.indexes.contactsByCustomer.get(customerId))
              if (other.isPrimary) tx.touch('contacts', other).isPrimary = false;
            tx.touch('customers', customer).primaryContactId = id;
            tx.dirty('customers');
          }
          tx.create('contacts', contact);
          tx.audit('contact.created', 'contact', id, { nextVersion: 1 });
          return contact;
        }),
      update: (
        contactId: string,
        input: Partial<
          Pick<
            Contact,
            | 'firstName'
            | 'lastName'
            | 'email'
            | 'phone'
            | 'mobile'
            | 'title'
            | 'department'
            | 'status'
            | 'preferredContactMethod'
          >
        >,
        options?: MutationOptions,
      ): Promise<Contact> =>
        runtime.command('PATCH /contacts/:id', options, { contactId, input }, (tx) => {
          const contact = load(runtime, 'contacts', contactId, 'Contact');
          const customer = load(runtime, 'customers', contact.customerId, 'Customer');
          runtime.require('contacts.manage', {
            ownerId: customer.accountOwnerId,
            teamId: customer.salesTeamId,
          });
          open(tx, 'contacts', contactId, 'Contact', options);
          const changed: string[] = [];
          for (const key of [
            'firstName',
            'lastName',
            'email',
            'phone',
            'mobile',
            'title',
            'department',
            'status',
            'preferredContactMethod',
          ] as const) {
            const value = input[key];
            if (value === undefined || value === contact[key]) continue;
            (contact as unknown as Record<string, unknown>)[key] =
              typeof value === 'string' ? value.trim() : value;
            changed.push(key);
          }
          if (changed.includes('firstName') || changed.includes('lastName'))
            contact.displayName = `${contact.firstName} ${contact.lastName}`;
          if (contact.status === 'inactive' && contact.isPrimary) {
            contact.isPrimary = false;
            tx.touch('customers', customer);
            delete customer.primaryContactId;
            tx.dirty('customers');
          }
          finalize(tx, 'contacts', contact, 'contact.updated', 'contact', changed);
          return contact;
        }),
      setPrimary: (contactId: string, options?: MutationOptions): Promise<Contact> =>
        runtime.command('POST /contacts/:id/set-primary', options, { contactId }, (tx) => {
          const contact = load(runtime, 'contacts', contactId, 'Contact');
          const customer = load(runtime, 'customers', contact.customerId, 'Customer');
          runtime.require('contacts.manage', {
            ownerId: customer.accountOwnerId,
            teamId: customer.salesTeamId,
          });
          if (contact.status !== 'active')
            throw transition('Contact', contact.status, 'become primary');
          open(tx, 'contacts', contactId, 'Contact', options);
          for (const other of runtime.indexes.contactsByCustomer.get(contact.customerId))
            if (other.isPrimary && other.id !== contactId)
              tx.touch('contacts', other).isPrimary = false;
          contact.isPrimary = true;
          tx.touch('customers', customer).primaryContactId = contactId;
          tx.dirty('customers');
          finalize(tx, 'contacts', contact, 'contact.set_primary', 'contact', ['isPrimary']);
          return contact;
        }),
    },

    addresses: {
      create: (
        customerId: string,
        input: {
          type: Address['type'];
          label?: string;
          line1: string;
          line2?: string;
          city: string;
          region: string;
          postalCode: string;
          countryCode?: string;
          deliveryInstructions?: string;
          isDefault?: boolean;
        },
        options?: MutationOptions,
      ): Promise<Address> =>
        runtime.command('POST /customers/:id/addresses', options, { customerId, input }, (tx) => {
          const customer = load(runtime, 'customers', customerId, 'Customer');
          runtime.require('customers.edit', {
            ownerId: customer.accountOwnerId,
            teamId: customer.salesTeamId,
          });
          new Validator()
            .required('line1', input.line1)
            .required('city', input.city)
            .required('region', input.region)
            .required('postalCode', input.postalCode)
            .oneOf('type', input.type, [
              'billing',
              'shipping',
              'headquarters',
              'service_location',
            ] as const)
            .throwIfAny();
          const id = runtime.store.nextId('address');
          const address: Address = {
            id,
            organizationId: customer.organizationId,
            ownerType: 'customer',
            ownerId: customerId,
            type: input.type,
            line1: input.line1.trim(),
            city: input.city.trim(),
            region: input.region.trim().toUpperCase(),
            postalCode: input.postalCode.trim(),
            countryCode: input.countryCode ?? 'US',
            isDefault: Boolean(input.isDefault),
            metadata: metadata(tx, id),
            ...(trimmed(input.label) ? { label: trimmed(input.label) as string } : {}),
            ...(trimmed(input.line2) ? { line2: trimmed(input.line2) as string } : {}),
            ...(trimmed(input.deliveryInstructions)
              ? { deliveryInstructions: trimmed(input.deliveryInstructions) as string }
              : {}),
          };
          if (address.isDefault) {
            for (const other of runtime.indexes.addressesByOwner.get(customerId))
              if (other.isDefault && other.type === address.type)
                tx.touch('addresses', other).isDefault = false;
            tx.touch('customers', customer);
            if (address.type === 'billing') customer.billingAddressId = id;
            if (address.type === 'shipping') customer.defaultShippingAddressId = id;
            tx.dirty('customers');
          }
          tx.create('addresses', address);
          tx.audit('address.created', 'address', id, { nextVersion: 1 });
          return address;
        }),
    },

    notes: {
      add: (
        customerId: string,
        input: {
          body: string;
          visibility?: CustomerNote['visibility'];
          teamId?: string;
          isPinned?: boolean;
          mentionedUserIds?: string[];
        },
        options?: MutationOptions,
      ): Promise<CustomerNote> =>
        runtime.command('POST /customers/:id/notes', options, { customerId, input }, (tx) => {
          const customer = load(runtime, 'customers', customerId, 'Customer');
          const actor = runtime.require('notes.create', {
            ownerId: customer.accountOwnerId,
            teamId: customer.salesTeamId,
          });
          new Validator()
            .required('body', input.body)
            .oneOf('visibility', input.visibility, ['organization', 'team', 'private'] as const)
            .throwIfAny();
          const id = runtime.store.nextId('customerNote');
          const visibility = input.visibility ?? 'organization';
          const teamId =
            visibility === 'team'
              ? (input.teamId ??
                runtime.store.dataset.teamMemberships.find(
                  (membership) => membership.userId === actor.id,
                )?.teamId)
              : undefined;
          const note: CustomerNote = {
            id,
            organizationId: customer.organizationId,
            customerId,
            authorId: actor.id,
            body: input.body.trim(),
            visibility,
            isPinned: Boolean(input.isPinned),
            mentionedUserIds: input.mentionedUserIds ?? [],
            attachmentIds: [],
            metadata: metadata(tx, id),
            ...(teamId ? { teamId } : {}),
          };
          tx.create('customerNotes', note);
          tx.audit('customer_note.created', 'customer_note', id, { nextVersion: 1 });
          for (const userId of note.mentionedUserIds) {
            if (userId !== actor.id && runtime.store.dataset.users.has(userId))
              tx.notify(
                userId,
                'info',
                `${actor.displayName} mentioned you on ${customer.displayName}`,
                note.body.slice(0, 140),
                { type: 'customer', id: customerId },
              );
          }
          return note;
        }),
      delete: (noteId: string, options?: MutationOptions): Promise<void> =>
        runtime.command('DELETE /notes/:id', options, { noteId }, (tx) => {
          const note = load(runtime, 'customerNotes', noteId, 'Note');
          const actor = runtime.actor;
          if (note.authorId !== actor.id || !runtime.can('notes.delete_own'))
            runtime.require('roles.manage');
          tx.remove('customerNotes', noteId);
          tx.audit('customer_note.deleted', 'customer_note', noteId, {});
        }),
    },
  };
}

export type CrmCommands = ReturnType<typeof createCrmCommands>;
export { dollars };
