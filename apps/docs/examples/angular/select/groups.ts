import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlSelect,
  SlSelectGroup,
  SlSelectItem,
  SlSelectSeparator,
  type SelectOptionGroup,
} from '@slotted/angular/select';

const METHODS: SelectOptionGroup[] = [
  {
    label: 'Ground',
    options: [
      { value: 'ups-ground', label: 'UPS Ground' },
      { value: 'fedex-ground', label: 'FedEx Ground' },
    ],
  },
  {
    label: 'Express',
    options: [
      { value: 'ups-2day', label: 'UPS 2nd Day Air' },
      { value: 'fedex-overnight', label: 'FedEx Priority Overnight' },
    ],
  },
  {
    label: 'Freight',
    options: [{ value: 'ltl', label: 'LTL freight, palletised' }],
  },
];

@Component({
  selector: 'app-select-groups',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectGroup, SlSelectItem, SlSelectSeparator],
  template: `
    <div slField>
      <label slFieldLabel>Shipping method</label>
      <sl-select placeholder="Choose a method">
        @for (group of methods; track group.label; let first = $first) {
          @if (!first) {
            <sl-select-separator />
          }
          <sl-select-group [label]="group.label">
            @for (method of group.options; track method.value) {
              <sl-select-item [value]="method.value">{{ method.label }}</sl-select-item>
            }
          </sl-select-group>
        }
      </sl-select>
    </div>
  `,
})
export class SelectGroups {
  protected readonly methods = METHODS;
}
