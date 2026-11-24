import { Component } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlTree } from '@slotted/angular/tree';
import { SlText } from '@slotted/angular/typography';

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
  selector: 'app-tree-states',
  imports: [SlGrid, SlStack, SlText, SlTree],
  template: `
    <div slGrid [columns]="2" [gap]="6" minItemWidth="xs">
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">One node disabled</span>
        <div
          slTree
          aria-label="Permissions, one node disabled"
          [isNodeDisabled]="locked"
          selectionMode="multiple"
          [expandedKeys]="['finance']"
          [value]="['finance.invoices']"
          [nodes]="scopes"
          [getKey]="key"
          [getLabel]="name"
          [getChildren]="children"
        ></div>
      </div>
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">Read only</span>
        <div
          slTree
          aria-label="Permissions, read only"
          readOnly
          selectionMode="multiple"
          [expandedKeys]="['finance']"
          [value]="['finance.invoices']"
          [nodes]="scopes"
          [getKey]="key"
          [getLabel]="name"
          [getChildren]="children"
        ></div>
      </div>
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">Disabled</span>
        <div
          slTree
          aria-label="Permissions, disabled"
          disabled
          selectionMode="multiple"
          [expandedKeys]="['finance']"
          [value]="['finance.invoices']"
          [nodes]="scopes"
          [getKey]="key"
          [getLabel]="name"
          [getChildren]="children"
        ></div>
      </div>
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">Invalid</span>
        <div
          slTree
          aria-label="Permissions, invalid"
          invalid
          variant="framed"
          selectionMode="multiple"
          [expandedKeys]="['finance']"
          [value]="['finance.invoices']"
          [nodes]="scopes"
          [getKey]="key"
          [getLabel]="name"
          [getChildren]="children"
        ></div>
      </div>
    </div>
  `,
})
export class TreeStates {
  protected readonly scopes = SCOPES;
  protected readonly key = (scope: Scope) => scope.id;
  protected readonly name = (scope: Scope) => scope.name;
  protected readonly children = (scope: Scope) => scope.children;
  protected readonly locked = (scope: Scope) => scope.locked === true;
}
