import { Component, signal } from '@angular/core';
import { SlIconButton } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlStack } from '@slotted/angular/stack';
import { SlTree, SlTreeActions, SlTreeCell } from '@slotted/angular/tree';
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
  selector: 'app-tree-actions',
  imports: [
    SlGlyph,
    SlIconButton,
    SlMenu,
    SlMenuItem,
    SlMenuTrigger,
    SlStack,
    SlText,
    SlTree,
    SlTreeActions,
    SlTreeCell,
  ],
  template: `
    <div slStack [gap]="3">
      <div
        slTree
        aria-label="Product categories"
        [expandedKeys]="['beverages']"
        [nodes]="categories"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
      >
        <ng-template slTreeCell="actions" let-category [slTreeCellOf]="categories">
          <div slTreeActions>
            <button
              slIconButton
              size="sm"
              variant="ghost"
              [attr.aria-label]="'Actions for ' + category.name"
              [slMenuTriggerFor]="actions"
            >
              <svg slGlyph name="ellipsis"></svg>
            </button>
            <sl-menu #actions align="end">
              <button slMenuItem (select)="last.set('Rename ' + category.name + '.')">
                Rename…
              </button>
              <button slMenuItem (select)="last.set('Add a category under ' + category.name + '.')">
                Add a category
              </button>
            </sl-menu>
          </div>
        </ng-template>
      </div>
      <span slText role="status" size="sm" tone="muted">{{ last() }}</span>
    </div>
  `,
})
export class TreeActions {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
  protected readonly last = signal('No action yet.');
}
