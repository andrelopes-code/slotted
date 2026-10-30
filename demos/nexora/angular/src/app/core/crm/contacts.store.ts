import { computed, inject, Injectable, signal } from '@angular/core';
import type { FilterCondition, FilterGroup, FilterRule } from '@slotted/core/filter';
import type { Contact, CustomerListItem } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';

export interface ContactRow extends Contact {
  customerName: string;
  accountNumber: string;
  customerStatus: CustomerListItem['status'];
}

export const CONTACT_ACCOUNT_PAGE_SIZES = [25, 50, 100] as const;

/**
 * The tenant's contacts, read account by account.
 *
 * The backend exposes no contacts resource: `GET /customers/:id` is the only
 * answer that carries them (§73.12). One page of accounts is read, then each
 * account's record, and the contacts of that page are what this screen holds.
 * Everything the reader filters or sorts here happens over that page, and the
 * screen says so.
 */
@Injectable({ providedIn: 'root' })
export class ContactsStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);

  readonly page = signal<{ index: number; size: number }>({ index: 0, size: 25 });
  readonly search = signal('');
  readonly filter = signal<FilterGroup | null>(null);

  /** The contacts of the accounts on this page, before the reader's own filters. */
  readonly loaded = signal<readonly ContactRow[]>([]);
  readonly accountsRead = signal(0);
  /** Accounts on this page whose record did not answer: the page is partial, and says so. */
  readonly accountsFailed = signal(0);
  readonly accountTotal = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private sequence = 0;

  readonly rows = computed(() => {
    const search = this.search().trim().toLowerCase();
    const rules = flatten(this.filter());
    return this.loaded().filter((row) => {
      if (search.length > 0 && !haystack(row).includes(search)) return false;
      return rules.every((rule) => matches(row, rule));
    });
  });

  readonly partial = computed(() => this.accountsFailed() > 0);

  async open(): Promise<void> {
    if (this.loaded().length === 0 && !this.loading()) await this.load();
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setFilter(value: FilterGroup | null): void {
    this.filter.set(value);
  }

  async goTo(index: number): Promise<void> {
    this.page.update((page) => ({ ...page, index }));
    await this.load();
  }

  async resize(size: number): Promise<void> {
    this.page.set({ index: 0, size });
    await this.load();
  }

  /** A page of accounts, then their records: the rows are emptied first, as a change of page is (LP-06). */
  async load(): Promise<void> {
    const ticket = ++this.sequence;
    const { index, size } = this.page();
    this.loading.set(true);
    this.loaded.set([]);
    this.error.set(null);
    this.accountsFailed.set(0);
    try {
      const api = await this.backend.ready();
      const answer = await api.customers.list({
        page: index + 1,
        pageSize: size,
        sort: 'displayName',
      });
      if (ticket !== this.sequence) return;
      this.accountTotal.set(answer.page.totalItems);
      this.accountsRead.set(answer.data.length);
      const details = await Promise.all(
        answer.data.map(async (account) => {
          try {
            const detail = await api.customers.get(account.id);
            return detail.contacts.map<ContactRow>((contact) => ({
              ...contact,
              customerName: account.displayName,
              accountNumber: account.accountNumber,
              customerStatus: account.status,
            }));
          } catch (error) {
            if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
            this.accountsFailed.update((count) => count + 1);
            return [];
          }
        }),
      );
      if (ticket !== this.sequence) return;
      this.loaded.set(
        details
          .flat()
          .sort(
            (a, b) =>
              a.customerName.localeCompare(b.customerName) ||
              Number(b.isPrimary) - Number(a.isPrimary) ||
              a.displayName.localeCompare(b.displayName),
          ),
      );
    } catch (error) {
      if (ticket !== this.sequence) return;
      if (isApiError(error, 'SERVICE_UNAVAILABLE')) this.health.reportFailure();
      this.error.set(isApiError(error) ? error.message : 'The accounts could not be read');
    } finally {
      if (ticket === this.sequence) this.loading.set(false);
    }
  }

  reload(): Promise<void> {
    return this.load();
  }
}

function haystack(row: ContactRow): string {
  return [row.displayName, row.email, row.title, row.customerName, row.accountNumber]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

function flatten(group: FilterGroup | null): FilterRule[] {
  if (group === null) return [];
  const rules: FilterRule[] = [];
  const walk = (node: FilterGroup): void => {
    for (const child of node.rules) {
      if ('rules' in child) walk(child);
      else rules.push(child);
    }
  };
  walk(group);
  return rules;
}

/** The three fields this screen offers are sets and one text: `anyOf` and `contains`. */
function matches(row: ContactRow, rule: FilterRule): boolean {
  const value = field(row, rule.field);
  return rule.filter.conditions.some((condition) => holds(value, condition));
}

function holds(value: string, condition: FilterCondition<string, unknown>): boolean {
  switch (condition.operator) {
    case 'anyOf':
      return (condition.value as unknown[]).map(String).includes(value);
    case 'noneOf':
      return !(condition.value as unknown[]).map(String).includes(value);
    case 'contains':
      return value.toLowerCase().includes(String(condition.value).toLowerCase());
    case 'equals':
    case 'is':
      return value === String(condition.value);
    default:
      return true;
  }
}

function field(row: ContactRow, name: string): string {
  switch (name) {
    case 'status':
      return row.status;
    case 'preferredContactMethod':
      return row.preferredContactMethod ?? '';
    case 'customerName':
      return row.customerName;
    case 'isPrimary':
      return row.isPrimary ? 'yes' : 'no';
    default:
      return '';
  }
}
