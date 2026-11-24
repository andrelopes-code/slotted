import { Component, computed, signal } from '@angular/core';
import { SlTree } from '@slotted/angular/tree';

interface Account {
  id: string;
  name: string;
  orders?: number;
  children?: Account[];
}

const ACCOUNTS: Account[] = [
  { id: 'contoso', name: 'Contoso Foods', orders: 3 },
  { id: 'fabrikam', name: 'Fabrikam Supply', orders: 2 },
  { id: 'atlas', name: 'Atlas Freight' },
];

const ORDERS: Record<string, Account[]> = {
  contoso: [
    { id: 'SO-10482', name: 'SO-10482' },
    { id: 'SO-10496', name: 'SO-10496' },
    { id: 'SO-10511', name: 'SO-10511' },
  ],
  fabrikam: [
    { id: 'SO-10484', name: 'SO-10484' },
    { id: 'SO-10502', name: 'SO-10502' },
  ],
};

@Component({
  selector: 'app-tree-lazy',
  imports: [SlTree],
  template: `
    <div
      slTree
      aria-label="Orders by account"
      [expandedKeys]="open()"
      (expandedKeysChange)="handleOpen($event)"
      [getChildrenCount]="count"
      [hasChildren]="isBranch"
      [isNodeLoading]="isLoading()"
      [nodes]="accounts()"
      [getKey]="key"
      [getLabel]="name"
      [getChildren]="children"
    ></div>
  `,
})
export class TreeLazy {
  protected readonly accounts = signal(ACCOUNTS);
  protected readonly open = signal<readonly string[]>([]);
  protected readonly pending = signal<readonly string[]>([]);
  protected readonly isLoading = computed(() => {
    const pending = this.pending();
    return (account: Account) => pending.includes(account.id);
  });
  protected readonly key = (account: Account) => account.id;
  protected readonly name = (account: Account) => account.name;
  protected readonly children = (account: Account) => account.children;
  protected readonly count = (account: Account) => account.orders;
  protected readonly isBranch = (account: Account) => account.orders !== undefined;

  protected handleOpen(keys: readonly string[]) {
    const opened = keys.filter((candidate) => !this.open().includes(candidate));
    this.open.set(keys);
    for (const key of opened) this.fetchOrders(key);
  }

  private fetchOrders(key: string) {
    const account = this.accounts().find((candidate) => candidate.id === key);
    if (account === undefined || account.children !== undefined || this.pending().includes(key)) {
      return;
    }

    this.pending.update((current) => [...current, key]);
    setTimeout(() => {
      this.accounts.update((current) =>
        current.map((entry) =>
          entry.id === key ? { ...entry, children: ORDERS[key] ?? [] } : entry,
        ),
      );
      this.pending.update((current) => current.filter((candidate) => candidate !== key));
    }, 1200);
  }
}
