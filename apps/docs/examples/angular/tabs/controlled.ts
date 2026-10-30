import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const VIEWS = [
  { value: 'orders', label: 'Orders', panel: '12 open orders, $14,380.00 in total.' },
  {
    value: 'invoices',
    label: 'Invoices',
    panel: 'INV-20877 and INV-20902 are past due: $2,146.50.',
  },
  { value: 'payments', label: 'Payments', panel: 'Last payment: $3,200.00 on September 30.' },
];

@Component({
  selector: 'app-tabs-controlled',
  imports: [SlButton, SlInline, SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    <div slStack [gap]="5">
      <div slInline [gap]="3" align="center" justify="between">
        <span slText size="sm" tone="muted">2 invoices are past due.</span>
        <button slButton size="sm" variant="outline" (click)="view.set('invoices')">
          Review invoices
        </button>
      </div>
      <div slTabs [value]="view()" (valueChange)="view.set($event.value ?? view())">
        <div slTabList aria-label="Account Harbor & Pine">
          @for (item of views; track item.value) {
            <div slTab [value]="item.value">{{ item.label }}</div>
          }
        </div>
        @for (item of views; track item.value) {
          <div slTabPanel [value]="item.value">
            <span slText size="sm">{{ item.panel }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class TabsControlled {
  protected readonly views = VIEWS;
  protected readonly view = signal('orders');
}
