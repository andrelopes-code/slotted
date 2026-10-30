import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

@Component({
  selector: 'app-number-field-controlled',
  imports: [SlButton, SlField, SlFieldLabel, SlInline, SlNumberField, SlNumberFieldInput, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Credit limit for Ernst Handel</label>
        <div slNumberField>
          <input
            slNumberFieldInput
            min="0"
            step="500"
            stepFrom="5000"
            [format]="{ currency: 'USD', style: 'currency' }"
            [value]="limit()"
            (valueChange)="limit.set($event.value)"
          />
        </div>
      </div>
      <div slInline [gap]="3" justify="between">
        <span>{{ summary() }}</span>
        <button slButton variant="outline" [disabled]="limit() === null" (click)="limit.set(null)">
          Remove limit
        </button>
      </div>
    </div>
  `,
})
export class NumberFieldControlled {
  readonly limit = signal<number | null>(5000);
  readonly summary = computed(() => {
    const limit = this.limit();
    return limit === null ? 'No credit limit' : `Orders up to ${USD.format(limit)}`;
  });
}
