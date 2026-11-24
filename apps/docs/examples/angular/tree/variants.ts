import { Component } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
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
  selector: 'app-tree-variants',
  imports: [SlGrid, SlTree],
  template: `
    <div slGrid [columns]="2" [gap]="6" minItemWidth="xs">
      <div
        slTree
        aria-label="Categories, plain"
        variant="plain"
        [expandedKeys]="['beverages']"
        [value]="'coffee'"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
      <div
        slTree
        aria-label="Categories, framed"
        variant="framed"
        [expandedKeys]="['beverages']"
        [value]="'coffee'"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
    </div>
  `,
})
export class TreeVariants {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
}
