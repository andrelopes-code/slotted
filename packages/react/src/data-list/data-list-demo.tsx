import type { GridColumn } from '@slotted/core/grid';
import type { ReactNode } from 'react';

import { Avatar } from '../avatar';
import { Badge } from '../badge';

/** One account of a sales desk: the domain every demonstration on the page stays in. */
export interface Account {
  id: string;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'On hold' | 'Churned';
  owner: string | null;
  region: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  lastOrder: string;
  created: string;
}

export const ACCOUNTS: Account[] = [
  {
    id: 'acme',
    name: 'Acme Logistics',
    email: 'ops@acme.example',
    balance: 12480.0,
    status: 'Active',
    owner: 'Marta Silva',
    region: 'Lisbon',
    plan: 'Pro',
    lastOrder: '2026-09-12',
    created: '2024-01-04',
  },
  {
    id: 'borealis',
    name: 'Borealis Foods',
    email: 'buying@borealis.example',
    balance: 3902.15,
    status: 'On hold',
    owner: null,
    region: 'Porto',
    plan: 'Free',
    lastOrder: '2026-08-30',
    created: '2023-06-10',
  },
  {
    id: 'cobalt',
    name: 'Cobalt Studio',
    email: 'hello@cobalt.example',
    balance: 48120.4,
    status: 'Active',
    owner: 'John Reed',
    region: 'Madrid',
    plan: 'Enterprise',
    lastOrder: '2026-09-20',
    created: '2022-02-01',
  },
  {
    id: 'dunmore',
    name: 'Dunmore Freight',
    email: 'accounts@dunmore.example',
    balance: 0,
    status: 'Churned',
    owner: 'Rui Neves',
    region: 'Seville',
    plan: 'Pro',
    lastOrder: '2025-11-02',
    created: '2021-09-15',
  },
  {
    id: 'star',
    name: 'Star Pharma',
    email: 'purchasing@star.example',
    balance: 27650.9,
    status: 'Active',
    owner: 'Ana Costa',
    region: 'Lisbon',
    plan: 'Enterprise',
    lastOrder: '2026-09-18',
    created: '2023-03-22',
  },
  {
    id: 'fjord',
    name: 'Fjord Outdoor',
    email: 'orders@fjord.example',
    balance: 815.0,
    status: 'On hold',
    owner: 'Marta Silva',
    region: 'Bilbao',
    plan: 'Free',
    lastOrder: '2026-07-04',
    created: '2025-05-09',
  },
];

export const COLUMNS: GridColumn<Account>[] = [
  { id: 'name', label: 'Account', rowHeader: true },
  { id: 'email', label: 'Email' },
  { id: 'balance', label: 'Balance', kind: 'number', format: (value) => money(value as number) },
  {
    id: 'status',
    label: 'Status',
    kind: 'set',
    priority: 1,
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'On hold', label: 'On hold' },
      { value: 'Churned', label: 'Churned' },
    ],
  },
  { id: 'owner', label: 'Owner', priority: 2 },
  { id: 'region', label: 'Region', priority: 3 },
  { id: 'lastOrder', label: 'Last order', kind: 'date', priority: 4 },
  { id: 'plan', label: 'Plan' },
  { id: 'created', label: 'Created', kind: 'date', sortable: false },
  { id: 'actions', label: 'Actions', kind: 'actions' },
];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function money(value: number): string {
  return currency.format(value);
}

const TONES = { Active: 'success', 'On hold': 'warning', Churned: 'secondary' } as const;

/** The status as a badge: a value a reader scans the list for. */
export function StatusBadge({ status }: { status: Account['status'] }) {
  return (
    <Badge size="sm" tone={TONES[status]} variant="soft">
      {status}
    </Badge>
  );
}

export function AccountAvatar({ account }: { account: Account }) {
  return <Avatar name={account.name} size="sm" />;
}

/** A phone's width, stated: the family's picture depends on the room it is given. */
export function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-room" data-room="phone">
      {children}
    </div>
  );
}

/** A tablet's width, for the pairs that take two and three columns. */
export function Tablet({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-room" data-room="tablet">
      {children}
    </div>
  );
}
