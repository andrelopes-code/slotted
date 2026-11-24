import { Component } from '@angular/core';
import { SlTree } from '@slotted/angular/tree';

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

@Component({
  selector: 'app-tree-cascade',
  imports: [SlTree],
  template: `
    <div
      slTree
      aria-label="Role permissions"
      selectionCascade="descendants"
      selectionMode="multiple"
      expandOn="expander"
      [expandedKeys]="['orders', 'finance']"
      [value]="['orders.view']"
      [isNodeDisabled]="locked"
      [nodes]="scopes"
      [getKey]="key"
      [getLabel]="name"
      [getChildren]="children"
    ></div>
  `,
})
export class TreeCascade {
  protected readonly scopes = SCOPES;
  protected readonly key = (scope: Scope) => scope.id;
  protected readonly name = (scope: Scope) => scope.name;
  protected readonly children = (scope: Scope) => scope.children;
  protected readonly locked = (scope: Scope) => scope.locked === true;
}
