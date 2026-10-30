import { Component, computed, signal } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlStack } from '@slotted/angular/stack';

const ORDERS: Record<string, number> = { card: 812, transfer: 145, paypal: 96 };

@Component({
  selector: 'app-checkbox-group-controlled',
  imports: [SlCheckbox, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend, SlStack],
  template: `
    <div slStack [gap]="4">
      <fieldset slFieldGroup>
        <legend slFieldGroupLegend>Payment method</legend>
        <div
          slCheckboxGroup
          orientation="horizontal"
          [value]="methods()"
          (valueChange)="methods.set($event.value)"
        >
          <div slCheckbox value="card">Card</div>
          <div slCheckbox value="transfer">Bank transfer</div>
          <div slCheckbox value="paypal">PayPal</div>
        </div>
      </fieldset>
      <span>Showing {{ shown() }} orders</span>
    </div>
  `,
})
export class CheckboxGroupControlled {
  readonly methods = signal<readonly string[]>(['card', 'transfer']);
  readonly shown = computed(() =>
    this.methods().reduce((sum, method) => sum + (ORDERS[method] ?? 0), 0),
  );
}
