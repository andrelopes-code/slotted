import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

const ORDERS = [
  { id: 'SO-10482', customer: 'Harbor & Pine' },
  { id: 'SO-10483', customer: 'Brightline Studio' },
  { id: 'SO-10484', customer: 'Northgate Labs' },
  { id: 'SO-10485', customer: 'Verde Kitchen' },
];

@Component({
  selector: 'app-result-state-search',
  imports: [
    SlButton,
    SlField,
    SlFieldLabel,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Search orders</label>
        <div slTextField>
          <input slTextFieldInput [value]="query()" (valueChange)="query.set($event.value)" />
        </div>
      </div>
      @if (rows().length === 0) {
        <section slResultState status="no-results">
          <div slResultStateContent>
            <div slResultStateTitle>No orders match this search</div>
            <p slResultStateDescription>Clear the search to see all {{ orders.length }} orders.</p>
          </div>
          <div slResultStateActions>
            <button slButton variant="outline" (click)="query.set('')">Clear search</button>
          </div>
        </section>
      } @else {
        <div slStack [gap]="2">
          @for (order of rows(); track order.id) {
            <p slText>{{ order.id }} · {{ order.customer }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class ResultStateSearch {
  protected readonly orders = ORDERS;
  protected readonly query = signal('Contoso');
  protected readonly rows = computed(() => {
    const needle = this.query().trim().toLowerCase();
    return ORDERS.filter((order) => `${order.id} ${order.customer}`.toLowerCase().includes(needle));
  });
}
