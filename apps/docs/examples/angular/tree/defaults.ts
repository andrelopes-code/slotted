import { Component } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
import { provideTreeDefaults, SlTree } from '@slotted/angular/tree';

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
  selector: 'app-tree-defaults',
  imports: [SlGrid, SlTree],
  providers: [provideTreeDefaults({ expandOn: 'expander', guides: false, size: 'sm' })],
  template: `
    <div slGrid [columns]="2" [gap]="6" minItemWidth="xs">
      <div
        slTree
        aria-label="Categories"
        [expandedKeys]="['beverages']"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
      <div
        slTree
        aria-label="Categories with guides"
        guides
        [expandedKeys]="['beverages']"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
    </div>
  `,
})
export class TreeDefaults {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
}
