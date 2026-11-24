import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardActions, SlCardHeader } from '@slotted/angular/card';
import { SlContainer } from '@slotted/angular/container';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-container-basic',
  imports: [SlBadge, SlCard, SlCardActions, SlCardHeader, SlContainer, SlHeading, SlStack, SlText],
  template: `
    <div slContainer size="measure">
      <div slStack [gap]="5">
        <h2 slHeading size="md">Usage this month</h2>
        <p slText>
          Seats are billed per active user and settled with the invoice on the first business day of
          the next month. Archived warehouses stop counting from the day they are archived.
        </p>
        <div slCard>
          <div slCardHeader>
            <span slText weight="semibold">42 active seats</span>
            <span slText size="sm" tone="muted">$1,260.00 on December 1</span>
            <div slCardActions>
              <span slBadge tone="info">Open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ContainerBasic {}
