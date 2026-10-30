import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectVariant } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';

const VARIANTS: { variant: SelectVariant; label: string }[] = [
  { variant: 'outline', label: 'Outline' },
  { variant: 'subtle', label: 'Subtle' },
  { variant: 'plain', label: 'Plain' },
];

const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

@Component({
  selector: 'app-select-variants',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem, SlStack],
  template: `
    <div slStack [gap]="5">
      @for (step of variants; track step.variant) {
        <div slField>
          <label slFieldLabel>{{ step.label }}</label>
          <sl-select placeholder="Choose a warehouse" [variant]="step.variant">
            @for (warehouse of warehouses; track warehouse.value) {
              <sl-select-item [value]="warehouse.value">{{ warehouse.label }}</sl-select-item>
            }
          </sl-select>
        </div>
      }
    </div>
  `,
})
export class SelectVariants {
  protected readonly variants = VARIANTS;
  protected readonly warehouses = WAREHOUSES;
}
