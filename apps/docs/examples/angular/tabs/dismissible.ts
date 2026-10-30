import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlStack } from '@slotted/angular/stack';
import { SlTab, SlTabList, SlTabPanel, SlTabs } from '@slotted/angular/tabs';
import { SlText } from '@slotted/angular/typography';

const OPEN = [
  { id: 'SO-1187', customer: 'Harbor & Pine', total: '$1,240.00' },
  { id: 'SO-1188', customer: 'Brightline Studio', total: '$318.50' },
  { id: 'SO-1190', customer: 'Northgate Labs', total: '$2,906.10' },
  { id: 'SO-1191', customer: 'Verde Kitchen', total: '$86.00' },
];

@Component({
  selector: 'app-tabs-dismissible',
  imports: [SlButton, SlStack, SlTab, SlTabList, SlTabPanel, SlTabs, SlText],
  template: `
    @if (orders().length === 0) {
      <div slStack [gap]="3" align="start">
        <span slText size="sm" tone="muted">No orders open.</span>
        <button slButton size="sm" variant="outline" (click)="reopen()">Reopen orders</button>
      </div>
    } @else {
      <div
        slTabs
        [value]="active()"
        (valueChange)="active.set($event.value ?? active())"
        (tabDismiss)="close($event.value)"
      >
        <div slTabList aria-label="Open orders">
          @for (order of orders(); track order.id) {
            <div slTab dismissible [dismissLabel]="'Close ' + order.id" [value]="order.id">
              {{ order.id }}
            </div>
          }
        </div>
        @for (order of orders(); track order.id) {
          <div slTabPanel [value]="order.id">
            <span slText size="sm">{{ order.customer }}, {{ order.total }}.</span>
          </div>
        }
      </div>
    }
  `,
})
export class TabsDismissible {
  protected readonly orders = signal(OPEN);
  protected readonly active = signal('SO-1188');

  protected close(id: string) {
    this.orders.update((open) => open.filter((order) => order.id !== id));
  }

  protected reopen() {
    this.orders.set(OPEN);
    this.active.set('SO-1187');
  }
}
