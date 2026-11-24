import { Component, signal } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlTree, type TreeValue } from '@slotted/angular/tree';
import { SlText } from '@slotted/angular/typography';

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
  selector: 'app-tree-controlled',
  imports: [SlStack, SlText, SlTree],
  template: `
    <div slStack [gap]="3">
      <div
        slTree
        aria-label="Product categories"
        [(expandedKeys)]="open"
        [(value)]="value"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
      <span slText size="sm" tone="muted"
        >Chosen: {{ value() ?? 'none' }}. Open: {{ open().join(', ') || 'none' }}.</span
      >
    </div>
  `,
})
export class TreeControlled {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
  protected readonly value = signal<TreeValue>('tea');
  protected readonly open = signal<readonly string[]>(['beverages']);
}
