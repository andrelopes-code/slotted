import { Component, signal } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';
import { SlTree, SlTreeEmpty } from '@slotted/angular/tree';

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
  selector: 'app-tree-filtering',
  imports: [
    SlGlyph,
    SlIcon,
    SlStack,
    SlTextField,
    SlTextFieldInput,
    SlTextFieldStart,
    SlTree,
    SlTreeEmpty,
  ],
  template: `
    <div slStack [gap]="3">
      <div slTextField clearable>
        <span slTextFieldStart
          ><span slIcon><svg slGlyph name="search"></svg></span
        ></span>
        <input
          slTextFieldInput
          type="search"
          aria-label="Find a category"
          [value]="query()"
          (valueChange)="query.set($event.value)"
        />
      </div>
      <div
        slTree
        aria-label="Product categories"
        [query]="query()"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      >
        <div slTreeEmpty>No category matches</div>
      </div>
    </div>
  `,
})
export class TreeFiltering {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
  protected readonly query = signal('spice');
}
