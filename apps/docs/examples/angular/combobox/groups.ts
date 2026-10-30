import { Component } from '@angular/core';
import { SlCombobox, SlComboboxGroup, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

const CATALOG = [
  {
    category: 'Kitchen',
    products: [
      { sku: 'KIT-1042', name: 'Cast-iron skillet' },
      { sku: 'KIT-1043', name: 'Stoneware mug' },
      { sku: 'KIT-1051', name: 'Pour-over kettle' },
    ],
  },
  {
    category: 'Bags',
    products: [
      { sku: 'BAG-2010', name: 'Canvas tote' },
      { sku: 'BAG-2014', name: 'Trail daypack' },
      { sku: 'BAG-2019', name: 'Weekender bag' },
    ],
  },
  {
    category: 'Stationery',
    products: [
      { sku: 'STA-3002', name: 'Field notebook' },
      { sku: 'STA-3007', name: 'Fountain pen' },
      { sku: 'STA-3011', name: 'Brass stapler' },
    ],
  },
];

@Component({
  selector: 'app-combobox-groups',
  imports: [SlCombobox, SlComboboxGroup, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Product</label>
      <sl-combobox placeholder="Search the catalog">
        @for (group of catalog; track group.category) {
          <sl-combobox-group [label]="group.category">
            @for (product of group.products; track product.sku) {
              <sl-combobox-item [value]="product.sku" [label]="product.name" />
            }
          </sl-combobox-group>
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxGroups {
  protected readonly catalog = CATALOG;
}
