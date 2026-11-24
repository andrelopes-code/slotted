import { Component } from '@angular/core';
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
  selector: 'app-tree-indicator',
  imports: [SlTree],
  template: `
    <div
      slTree
      aria-label="Default category"
      selectionIndicator="checkbox"
      [expandedKeys]="['beverages']"
      [value]="'tea'"
      [nodes]="categories"
      [getKey]="key"
      [getLabel]="name"
      [getChildren]="children"
    ></div>
  `,
})
export class TreeIndicator {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
}
