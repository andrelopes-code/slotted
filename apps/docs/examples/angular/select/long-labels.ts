import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';

const LISTINGS: SelectOption[] = [
  {
    value: 'mug-sage',
    label: 'Stoneware mug, 12 oz, sage glaze, case of 24, for the autumn wholesale catalogue',
  },
  { value: 'mug-sku', label: 'SKU-NW-STONEWARE-MUG-12OZ-SAGE-GLAZE-CASE24-WHOLESALE' },
  { value: 'tumbler', label: 'Glass tumbler, 8 oz' },
];

@Component({
  selector: 'app-select-long-labels',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Catalogue listing</label>
      <sl-select value="mug-sage" [items]="listings">
        @for (listing of listings; track listing.value) {
          <sl-select-item [value]="listing.value">{{ listing.label }}</sl-select-item>
        }
      </sl-select>
    </div>
  `,
})
export class SelectLongLabels {
  protected readonly listings = LISTINGS;
}
