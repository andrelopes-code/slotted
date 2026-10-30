import { Component, computed, signal } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const WAREHOUSES: MultiSelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
];

const labelOf = (value: string) => WAREHOUSES.find((option) => option.value === value)?.label;

@Component({
  selector: 'app-multi-select-controlled',
  imports: [SlField, SlFieldLabel, SlMultiSelect, SlMultiSelectItem, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slField>
        <label slFieldLabel>Stocking warehouses</label>
        <sl-multi-select
          placeholder="Add a warehouse"
          [items]="options"
          [(value)]="warehouses"
          (valueChangeRequest)="reason.set($event.reason)"
        >
          @for (warehouse of options; track warehouse.value) {
            <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
          }
        </sl-multi-select>
      </div>
      <span slText size="sm" tone="muted">{{ summary() }}</span>
    </div>
  `,
})
export class MultiSelectControlled {
  protected readonly options = WAREHOUSES;
  protected readonly warehouses = signal<readonly string[]>(['RNO', 'CMH']);
  protected readonly reason = signal<string | null>(null);
  protected readonly summary = computed(() => {
    const held = this.warehouses();
    const stocked =
      held.length === 0 ? 'Not stocked anywhere' : `Stocked at ${held.map(labelOf).join('; ')}`;
    const reason = this.reason();
    return reason === null ? stocked : `${stocked} · last change: ${reason}`;
  });
}
