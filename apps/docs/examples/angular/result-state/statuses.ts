import { Component } from '@angular/core';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const REGIONS = [
  {
    status: 'empty',
    title: 'No shipments yet',
    description: 'Shipments appear here once a carrier collects an order.',
  },
  {
    status: 'no-results',
    title: 'No orders match this search',
    description: 'Check the spelling or search by order number.',
  },
  {
    status: 'not-found',
    title: 'Order SO-10492 does not exist',
    description: 'It may have been merged into another order.',
  },
  {
    status: 'error',
    title: 'Orders did not load',
    description: 'The orders service did not respond. Try again in a moment.',
  },
  {
    status: 'forbidden',
    title: 'Payroll reports are restricted',
    description: 'Only members of Finance can open them. Ask an administrator for access.',
  },
  {
    status: 'offline',
    title: 'You are offline',
    description: 'Changes are kept on this device and sync when the connection returns.',
  },
  {
    status: 'success',
    title: 'Refund issued',
    description: 'The customer receives 84.20 USD within 5 business days.',
  },
] as const;

@Component({
  selector: 'app-result-state-statuses',
  imports: [
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="6">
      @for (region of regions; track region.status) {
        <div slStack [gap]="1">
          <p slText size="sm" tone="muted">{{ region.status }}</p>
          <section slResultState align="start" reach="inline" [status]="region.status">
            <div slResultStateContent>
              <div slResultStateTitle>{{ region.title }}</div>
              <p slResultStateDescription>{{ region.description }}</p>
            </div>
          </section>
        </div>
      }
    </div>
  `,
})
export class ResultStateStatuses {
  protected readonly regions = REGIONS;
}
