import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-badge-basic',
  imports: [SlBadge, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      @for (order of orders; track order.id) {
        <div slInline align="center" [gap]="3">
          <span slText numeric="tabular">{{ order.id }}</span>
          <span slBadge [tone]="order.tone">{{ order.status }}</span>
        </div>
      }
    </div>
  `,
})
export class BadgeBasic {
  protected readonly orders = [
    { id: 'SO-10482', status: 'Shipped', tone: 'success' },
    { id: 'SO-10483', status: 'Awaiting pickup', tone: 'warning' },
    { id: 'SO-10484', status: 'Payment failed', tone: 'danger' },
    { id: 'SO-10485', status: 'Draft', tone: 'secondary' },
  ] as const;
}
