import { Component, computed, signal } from '@angular/core';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlStack } from '@slotted/angular/stack';

const TOTALS: Record<string, string> = {
  usd: '$1,240.00',
  eur: '€1,147.00',
  gbp: '£982.00',
};

@Component({
  selector: 'app-radio-group-controlled',
  imports: [SlFieldGroup, SlFieldGroupLegend, SlRadio, SlRadioGroup, SlStack],
  template: `
    <div slStack [gap]="4">
      <fieldset slFieldGroup>
        <legend slFieldGroupLegend>Invoice currency</legend>
        <div
          slRadioGroup
          orientation="horizontal"
          [value]="currency()"
          (valueChange)="currency.set($event.value ?? 'usd')"
        >
          <div slRadio value="usd">USD</div>
          <div slRadio value="eur">EUR</div>
          <div slRadio value="gbp">GBP</div>
        </div>
      </fieldset>
      <span>Invoice total: {{ total() }}</span>
    </div>
  `,
})
export class RadioGroupControlled {
  readonly currency = signal('usd');
  readonly total = computed(() => TOTALS[this.currency()]);
}
