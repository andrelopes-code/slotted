import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
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
  selector: 'app-tree-form',
  imports: [ReactiveFormsModule, SlButton, SlInline, SlStack, SlText, SlTree],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div slStack [gap]="4">
        <div
          slTree
          aria-label="Categories in this feed"
          formControlName="categories"
          selectionMode="multiple"
          [expandedKeys]="['beverages']"
          [nodes]="categories"
          [getKey]="key"
          [getLabel]="name"
          [getChildren]="children"
        ></div>
        <div slInline align="center" [gap]="3">
          <button slButton type="submit">Save feed</button>
          @if (saved(); as message) {
            <span slText size="sm" tone="muted">{{ message }}</span>
          }
        </div>
      </div>
    </form>
  `,
})
export class TreeForm {
  protected readonly categories = CATEGORIES;
  protected readonly key = (category: Category) => category.id;
  protected readonly name = (category: Category) => category.name;
  protected readonly children = (category: Category) => category.children;
  protected readonly form = new FormGroup({
    categories: new FormControl<readonly string[]>(['coffee', 'tea'], { nonNullable: true }),
  });
  protected readonly saved = signal<string | null>(null);

  protected submit() {
    this.saved.set(`Submitted ${this.form.getRawValue().categories.length} categories.`);
  }
}
