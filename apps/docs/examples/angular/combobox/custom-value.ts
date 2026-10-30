import { Component, signal } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

const BOXES = [
  { id: 'small', label: 'Small · 20 × 15 × 10 cm' },
  { id: 'medium', label: 'Medium · 35 × 25 × 15 cm' },
  { id: 'large', label: 'Large · 50 × 40 × 30 cm' },
];

@Component({
  selector: 'app-combobox-custom-value',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Box size</label>
      <sl-combobox allowsCustomValue placeholder="Pick a box or type dimensions" [(value)]="value">
        @for (box of boxes; track box.id) {
          <sl-combobox-item [value]="box.id" [label]="box.label" />
        }
      </sl-combobox>
      <span slFieldDescription>Value: {{ value() ?? 'none' }}</span>
    </div>
  `,
})
export class ComboboxCustomValue {
  protected readonly boxes = BOXES;
  protected readonly value = signal<string | null>(null);
}
