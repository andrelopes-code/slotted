import { Component, signal } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';
import { SlText } from '@slotted/angular/typography';

const LIMIT = 3;

@Component({
  selector: 'app-toggle-group-controlled',
  imports: [SlStack, SlText, SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slStack [gap]="3">
      <div
        slToggleGroup
        aria-label="Visible columns"
        multiple
        [value]="columns()"
        (valueChange)="change($event)"
      >
        <button slToggleGroupItem value="sku">SKU</button>
        <button slToggleGroupItem value="quantity">Quantity</button>
        <button slToggleGroupItem value="location">Location</button>
        <button slToggleGroupItem value="supplier">Supplier</button>
      </div>
      <p slText size="sm" tone="muted">
        {{ columns().length }} of {{ limit }} columns: {{ columns().join(', ') || 'none' }}
      </p>
    </div>
  `,
})
export class ToggleGroupControlled {
  protected readonly limit = LIMIT;
  protected readonly columns = signal<readonly string[]>(['sku', 'quantity']);

  protected change(request: { value: readonly string[]; cancel(): void }) {
    if (request.value.length > LIMIT) request.cancel();
    else this.columns.set(request.value);
  }
}
