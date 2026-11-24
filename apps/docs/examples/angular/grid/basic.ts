import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-grid-basic',
  imports: [SlBadge, SlCard, SlCardBody, SlGrid, SlHeading, SlInline, SlStack, SlText],
  template: `
    <div slGrid>
      @for (warehouse of warehouses; track warehouse.name) {
        <div slCard>
          <div slCardBody>
            <div slStack [gap]="3">
              <h2 slHeading size="md">{{ warehouse.name }}</h2>
              <p slText size="sm" tone="muted">{{ warehouse.units }}</p>
              <div slInline>
                <span slBadge [tone]="warehouse.tone">{{ warehouse.status }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class GridBasic {
  protected readonly warehouses = [
    { name: 'Rotterdam', units: '12,480 units on hand', status: 'Healthy', tone: 'success' },
    { name: 'Chicago', units: '8,215 units on hand', status: 'Low stock', tone: 'warning' },
    { name: 'Singapore', units: '3,902 units on hand', status: 'Delayed', tone: 'danger' },
    { name: 'Lisbon', units: '6,730 units on hand', status: 'Healthy', tone: 'success' },
    { name: 'Osaka', units: '5,118 units on hand', status: 'Audit due', tone: 'info' },
    { name: 'Denver', units: '2,044 units on hand', status: 'Opening soon', tone: 'secondary' },
  ] as const;
}
