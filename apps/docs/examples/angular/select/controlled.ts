import { Component, computed, signal } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectSelection } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';

const SPEEDS = [
  { value: 'ground', label: 'Ground', transit: '3–5 business days', price: '$8.40' },
  { value: 'two-day', label: 'Two-day', transit: '2 business days', price: '$18.90' },
  { value: 'overnight', label: 'Overnight', transit: 'Next business day', price: '$42.75' },
];

@Component({
  selector: 'app-select-controlled',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Delivery speed</label>
        <sl-select [items]="speeds" [(value)]="speed">
          @for (option of speeds; track option.value) {
            <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
          }
        </sl-select>
      </div>
      <span>Arrives in {{ chosen()?.transit }}. Shipping: {{ chosen()?.price }}</span>
    </div>
  `,
})
export class SelectControlled {
  protected readonly speeds = SPEEDS;
  protected readonly speed = signal<SelectSelection>('ground');
  protected readonly chosen = computed(() =>
    SPEEDS.find((option) => option.value === this.speed()),
  );
}
