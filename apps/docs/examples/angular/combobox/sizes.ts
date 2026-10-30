import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import type { ComboboxSize } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';

const SIZES: { size: ComboboxSize; label: string }[] = [
  { size: 'sm', label: 'Small' },
  { size: 'md', label: 'Medium' },
  { size: 'lg', label: 'Large' },
];

const WAREHOUSES = ['Reno, NV', 'Columbus, OH', 'Savannah, GA'];

@Component({
  selector: 'app-combobox-sizes',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      @for (step of sizes; track step.size) {
        <div slField>
          <label slFieldLabel>{{ step.label }}</label>
          <sl-combobox [size]="step.size" inputValue="Reno, NV" defaultValue="Reno, NV">
            @for (warehouse of warehouses; track warehouse) {
              <sl-combobox-item [value]="warehouse" [label]="warehouse" />
            }
          </sl-combobox>
        </div>
      }
    </div>
  `,
})
export class ComboboxSizes {
  protected readonly sizes = SIZES;
  protected readonly warehouses = WAREHOUSES;
}
