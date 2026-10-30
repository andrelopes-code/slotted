import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import type { ComboboxVariant } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';

const VARIANTS: { variant: ComboboxVariant; label: string }[] = [
  { variant: 'outline', label: 'Outline' },
  { variant: 'subtle', label: 'Subtle' },
  { variant: 'plain', label: 'Plain' },
];

const WAREHOUSES = ['Reno, NV', 'Columbus, OH', 'Savannah, GA'];

@Component({
  selector: 'app-combobox-variants',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      @for (step of variants; track step.variant) {
        <div slField>
          <label slFieldLabel>{{ step.label }}</label>
          <sl-combobox placeholder="Search warehouses" [variant]="step.variant">
            @for (warehouse of warehouses; track warehouse) {
              <sl-combobox-item [value]="warehouse" [label]="warehouse" />
            }
          </sl-combobox>
        </div>
      }
    </div>
  `,
})
export class ComboboxVariants {
  protected readonly variants = VARIANTS;
  protected readonly warehouses = WAREHOUSES;
}
