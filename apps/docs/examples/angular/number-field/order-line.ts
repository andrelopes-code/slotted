import { Component, computed, signal } from '@angular/core';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const LINES = [
  { id: 'cabrales', product: 'Queso Cabrales', price: 14, stock: 22 },
  { id: 'hokkien', product: 'Singaporean Hokkien Fried Mee', price: 9.8, stock: 26 },
  { id: 'mozzarella', product: 'Mozzarella di Giovanni', price: 34.8, stock: 14 },
];

@Component({
  selector: 'app-number-field-order-line',
  imports: [SlGrid, SlInline, SlNumberField, SlNumberFieldInput, SlStack, SlText],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="4">
        @for (line of lines; track line.id) {
          <div slGrid [columns]="3" [gap]="4" minItemWidth="xs">
            <div slStack [gap]="1">
              <span slText weight="medium">{{ line.product }}</span>
              <span slText size="sm" tone="muted"
                >{{ usd(line.price) }} each · {{ line.stock }} in stock</span
              >
            </div>
            <div slStack justify="center">
              <div slNumberField size="sm" stepper="split">
                <input
                  slNumberFieldInput
                  min="0"
                  [attr.aria-label]="'Quantity of ' + line.product"
                  [max]="line.stock"
                  [value]="quantities()[line.id] ?? null"
                  (valueChange)="set(line.id, $event.value)"
                />
              </div>
            </div>
            <div slStack justify="center">
              <span slText align="end" numeric="tabular">{{
                usd(line.price * (quantities()[line.id] ?? 0))
              }}</span>
            </div>
          </div>
        }
      </div>
      <div slInline [gap]="4" justify="between">
        <span slText weight="semibold">Order total</span>
        <span slText numeric="tabular" weight="semibold">{{ usd(total()) }}</span>
      </div>
    </div>
  `,
})
export class NumberFieldOrderLine {
  readonly lines = LINES;
  readonly quantities = signal<Record<string, number | null>>({
    cabrales: 12,
    hokkien: 10,
    mozzarella: 5,
  });
  readonly total = computed(() =>
    LINES.reduce((sum, line) => sum + line.price * (this.quantities()[line.id] ?? 0), 0),
  );

  usd(amount: number): string {
    return USD.format(amount);
  }

  set(id: string, value: number | null): void {
    this.quantities.update((current) => ({ ...current, [id]: value }));
  }
}
