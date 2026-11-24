import { Tree } from '@slotted/react/tree';

interface Scope {
  id: string;
  name: string;
  locked?: boolean;
  children?: Scope[];
}

const SCOPES: Scope[] = [
  {
    id: 'orders',
    name: 'Orders',
    children: [
      { id: 'orders.view', name: 'View orders' },
      { id: 'orders.edit', name: 'Edit orders' },
      { id: 'orders.refund', name: 'Issue refunds' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    children: [
      { id: 'finance.invoices', name: 'View invoices' },
      { id: 'finance.payouts', name: 'Approve payouts', locked: true },
    ],
  },
  { id: 'reports', name: 'Reports' },
];

export default function TreeCascade() {
  return (
    <Tree
      aria-label="Role permissions"
      selectionCascade="descendants"
      selectionMode="multiple"
      expandOn="expander"
      defaultExpandedKeys={['orders', 'finance']}
      defaultValue={['orders.view']}
      isNodeDisabled={(scope) => scope.locked === true}
      nodes={SCOPES}
      getKey={(scope) => scope.id}
      getLabel={(scope) => scope.name}
      getChildren={(scope) => scope.children}
    />
  );
}
