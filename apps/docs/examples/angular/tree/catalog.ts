import { Component, computed, signal } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
import { SlList, SlListEmpty } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlTree, type TreeValue } from '@slotted/angular/tree';

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

const PRODUCTS = [
  { sku: 'BEV-104', name: 'House blend, 1 kg', category: 'coffee' },
  { sku: 'BEV-131', name: 'Decaf espresso, 500 g', category: 'coffee' },
  { sku: 'BEV-220', name: 'Earl grey, 50 bags', category: 'tea' },
  { sku: 'BEV-305', name: 'Ginger ale, 24 cans', category: 'soft-drinks' },
  { sku: 'PAN-012', name: 'Olive oil, 5 L', category: 'oils' },
  { sku: 'PAN-118', name: 'Smoked paprika, 250 g', category: 'ground-spices' },
];

function keysUnder(categories: Category[], key: string, inside = false): string[] {
  return categories.flatMap((category) => {
    const here = inside || category.id === key;
    return [...(here ? [category.id] : []), ...keysUnder(category.children ?? [], key, here)];
  });
}

@Component({
  selector: 'app-tree-catalog',
  imports: [
    SlGrid,
    SlList,
    SlListEmpty,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemEnd,
    SlListItemLabel,
    SlTree,
  ],
  template: `
    <div slGrid [columns]="2" [gap]="6" minItemWidth="xs">
      <div
        slTree
        aria-label="Product categories"
        disallowEmptySelection
        expandOn="expander"
        [expandedKeys]="['beverages', 'pantry']"
        [(value)]="category"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      ></div>
      <ul slList aria-label="Products" variant="framed">
        @for (product of products(); track product.sku) {
          <li slListItem>
            <div slListItemContent>
              <span slListItemBody
                ><span slListItemLabel>{{ product.name }}</span></span
              >
              <span slListItemEnd>{{ product.sku }}</span>
            </div>
          </li>
        } @empty {
          <li slListEmpty>No products in this category</li>
        }
      </ul>
    </div>
  `,
})
export class TreeCatalog {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
  protected readonly category = signal<TreeValue>('beverages');
  protected readonly products = computed(() => {
    const keys = keysUnder(CATEGORIES, String(this.category()));
    return PRODUCTS.filter((product) => keys.includes(product.category));
  });
}
