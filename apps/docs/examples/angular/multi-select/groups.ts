import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectGroup,
  SlMultiSelectItem,
  SlMultiSelectSeparator,
  type MultiSelectOptionGroup,
} from '@slotted/angular/multi-select';

const REGIONS: MultiSelectOptionGroup[] = [
  {
    label: 'West',
    options: [
      { value: 'RNO', label: 'Reno, NV' },
      { value: 'ONT', label: 'Ontario, CA' },
      { value: 'SEA', label: 'Kent, WA' },
    ],
  },
  {
    label: 'Central',
    options: [
      { value: 'DFW', label: 'Dallas, TX' },
      { value: 'JOT', label: 'Joliet, IL' },
      { value: 'CMH', label: 'Columbus, OH' },
    ],
  },
  {
    label: 'East',
    options: [
      { value: 'SAV', label: 'Savannah, GA' },
      { value: 'ABE', label: 'Allentown, PA' },
      { value: 'EWR', label: 'Edison, NJ' },
    ],
  },
];

@Component({
  selector: 'app-multi-select-groups',
  imports: [
    SlField,
    SlFieldLabel,
    SlMultiSelect,
    SlMultiSelectGroup,
    SlMultiSelectItem,
    SlMultiSelectSeparator,
  ],
  template: `
    <div slField>
      <label slFieldLabel>Stocking warehouses</label>
      <sl-multi-select placeholder="Add a warehouse" [items]="regions" [value]="stocked">
        @for (region of regions; track region.label; let first = $first) {
          @if (!first) {
            <sl-multi-select-separator />
          }
          <sl-multi-select-group [label]="region.label">
            @for (warehouse of region.options; track warehouse.value) {
              <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
            }
          </sl-multi-select-group>
        }
      </sl-multi-select>
    </div>
  `,
})
export class MultiSelectGroups {
  protected readonly regions = REGIONS;
  protected readonly stocked = ['RNO', 'SAV'];
}
