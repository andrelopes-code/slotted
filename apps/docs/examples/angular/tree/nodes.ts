import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTree } from '@slotted/angular/tree';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

const CATEGORIES: Category[] = [
  {
    id: 'beverages',
    name: 'Beverages',
    children: [
      { id: 'coffee', name: 'Coffee' },
      { id: 'tea', name: 'Tea' },
      { id: 'soft-drinks', name: 'Soft drinks' },
    ],
  },
  {
    id: 'pantry',
    name: 'Pantry',
    children: [
      { id: 'oils', name: 'Oils and vinegars' },
      {
        id: 'spices',
        name: 'Spices',
        children: [
          { id: 'ground-spices', name: 'Ground spices' },
          { id: 'whole-spices', name: 'Whole spices' },
        ],
      },
    ],
  },
  { id: 'household', name: 'Household' },
];

@Component({
  selector: 'app-tree-nodes',
  imports: [SlButton, SlInline, SlStack, SlTree],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="2">
        <button slButton size="sm" variant="outline" (click)="tree.expandAll()">Expand all</button>
        <button slButton size="sm" variant="outline" (click)="tree.collapseAll()">
          Collapse all
        </button>
      </div>
      <div
        slTree
        #tree="slTree"
        aria-label="Product categories"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
    </div>
  `,
})
export class TreeNodes {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
}
