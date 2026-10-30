import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

const PRODUCTS = [
  { sku: 'KIT-1042', name: 'Cast-iron skillet' },
  { sku: 'KIT-1043', name: 'Stoneware mug' },
  { sku: 'BAG-2010', name: 'Canvas tote' },
  { sku: 'BAG-2014', name: 'Trail daypack' },
  { sku: 'HOM-4010', name: 'Wool throw' },
  { sku: 'HOM-4014', name: 'Brass desk lamp' },
  { sku: 'STA-3010', name: 'Field notebook' },
];

@Component({
  selector: 'app-combobox-custom-filter',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>SKU</label>
      <sl-combobox placeholder="KIT-, BAG-, HOM-…" [filter]="startsWith">
        @for (product of products; track product.sku) {
          <sl-combobox-item
            [value]="product.sku"
            [label]="product.sku"
            [description]="product.name"
          />
        }
      </sl-combobox>
      <span slFieldDescription>Codes match from the first character, so “10” finds nothing.</span>
    </div>
  `,
})
export class ComboboxCustomFilter {
  protected readonly products = PRODUCTS;
  protected readonly startsWith = (label: string, query: string) =>
    label.toLowerCase().startsWith(query.toLowerCase());
}
