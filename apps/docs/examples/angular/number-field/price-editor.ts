import { Component, computed, signal } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';

@Component({
  selector: 'app-number-field-price-editor',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlGrid, SlNumberField, SlNumberFieldInput],
  template: `
    <div slGrid [gap]="4" minItemWidth="xs">
      <div slField required>
        <label slFieldLabel>Unit cost</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            min="0"
            step="0.5"
            [format]="currency"
            [value]="cost()"
            (valueChange)="cost.set($event.value)"
          />
        </div>
      </div>
      <div slField required>
        <label slFieldLabel>Markup</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            min="0"
            max="3"
            step="0.01"
            largeStep="0.1"
            [format]="{ style: 'percent' }"
            [value]="markup()"
            (valueChange)="markup.set($event.value)"
          />
        </div>
      </div>
      <div slField readOnly>
        <label slFieldLabel>List price</label>
        <div slNumberField stepper="none">
          <input slNumberFieldInput [format]="currency" [value]="price()" />
        </div>
        <span slFieldDescription>Unit cost plus markup.</span>
      </div>
    </div>
  `,
})
export class NumberFieldPriceEditor {
  readonly currency: Intl.NumberFormatOptions = { currency: 'USD', style: 'currency' };
  readonly cost = signal<number | null>(175);
  readonly markup = signal<number | null>(0.5);
  readonly price = computed(() => {
    const cost = this.cost();
    const markup = this.markup();
    return cost === null || markup === null ? null : Math.round(cost * (1 + markup) * 100) / 100;
  });
}
