import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';

const CATEGORIES: MultiSelectOption[] = [
  { value: 'beverages', label: 'Beverages' },
  { value: 'condiments', label: 'Condiments' },
  { value: 'confections', label: 'Confections' },
  { value: 'dairy', label: 'Dairy products' },
  { value: 'grains', label: 'Grains and cereals' },
  { value: 'meat', label: 'Meat and poultry' },
  { value: 'produce', label: 'Produce' },
  { value: 'seafood', label: 'Seafood' },
];

@Component({
  selector: 'app-multi-select-limit',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Featured categories</label>
      <sl-multi-select
        placeholder="Add a category"
        [max]="3"
        [items]="categories"
        [value]="featured"
      >
        @for (category of categories; track category.value) {
          <sl-multi-select-item [value]="category.value" [label]="category.label" />
        }
      </sl-multi-select>
      <span slFieldDescription>The storefront home page shows up to three categories.</span>
    </div>
  `,
})
export class MultiSelectLimit {
  protected readonly categories = CATEGORIES;
  protected readonly featured = ['beverages', 'confections'];
}
