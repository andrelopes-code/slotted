import { Component, signal } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlTree } from '@slotted/angular/tree';
import { SlText } from '@slotted/angular/typography';

interface Page {
  id: string;
  name: string;
  children?: Page[];
}

const PAGES: Page[] = [
  {
    id: 'inventory',
    name: 'Inventory',
    children: [
      { id: 'stock', name: 'Stock levels' },
      { id: 'transfers', name: 'Transfers' },
      { id: 'counts', name: 'Cycle counts' },
    ],
  },
  {
    id: 'purchasing',
    name: 'Purchasing',
    children: [
      { id: 'orders', name: 'Purchase orders' },
      { id: 'suppliers', name: 'Suppliers' },
    ],
  },
];

const NAMES = new Map(
  PAGES.flatMap((page) => [page, ...(page.children ?? [])]).map((page) => [page.id, page.name]),
);

@Component({
  selector: 'app-tree-navigation',
  imports: [SlStack, SlText, SlTree],
  template: `
    <div slStack [gap]="3">
      <div
        slTree
        aria-label="Help center"
        expandOn="expander"
        selectionMode="none"
        activeKey="stock"
        [expandedKeys]="['inventory']"
        (nodeActivate)="page.set($event.key)"
        [nodes]="pages"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
      <span slText role="status" size="sm" tone="muted">Open page: {{ names.get(page()) }}</span>
    </div>
  `,
})
export class TreeNavigation {
  protected readonly pages = PAGES;
  protected readonly key = (entry: Page) => entry.id;
  protected readonly name = (entry: Page) => entry.name;
  protected readonly children = (entry: Page) => entry.children;
  protected readonly names = NAMES;
  protected readonly page = signal('stock');
}
