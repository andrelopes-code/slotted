import { Component } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
import { SlStack } from '@slotted/angular/stack';
import { SlTree } from '@slotted/angular/tree';
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
  selector: 'app-tree-expansion',
  imports: [SlGrid, SlStack, SlText, SlTree],
  template: `
    <div slGrid [columns]="2" [gap]="6" minItemWidth="xs">
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">The whole row</span>
        <div
          slTree
          aria-label="Categories, opened by the row"
          [expandedKeys]="['beverages']"
          [nodes]="categories"
          [getKey]="key"
          [getLabel]="name"
          [getChildren]="children"
        ></div>
      </div>
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">The chevron alone</span>
        <div
          slTree
          aria-label="Categories, opened by the chevron"
          expandOn="expander"
          [expandedKeys]="['beverages']"
          [nodes]="categories"
          [getKey]="key"
          [getLabel]="name"
          [getChildren]="children"
        ></div>
      </div>
    </div>
  `,
})
export class TreeExpansion {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
}
