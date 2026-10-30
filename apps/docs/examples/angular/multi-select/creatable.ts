import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';

const SUGGESTED: MultiSelectOption[] = [
  { value: 'chai', label: 'chai' },
  { value: 'black tea', label: 'black tea' },
  { value: 'spiced', label: 'spiced' },
  { value: 'loose leaf', label: 'loose leaf' },
  { value: 'caffeinated', label: 'caffeinated' },
  { value: 'gift', label: 'gift' },
];

@Component({
  selector: 'app-multi-select-creatable',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Search keywords</label>
      <sl-multi-select creatable placeholder="Add a keyword" [items]="suggested" [value]="keywords">
        @for (keyword of suggested; track keyword.value) {
          <sl-multi-select-item [value]="keyword.value" [label]="keyword.label" />
        }
      </sl-multi-select>
      <span slFieldDescription>
        Type a keyword and press Enter or a comma. Shoppers find Chai tea, 24 bags by these words.
      </span>
    </div>
  `,
})
export class MultiSelectCreatable {
  protected readonly suggested = SUGGESTED;
  protected readonly keywords = ['chai', 'black tea'];
}
