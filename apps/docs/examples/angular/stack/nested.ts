import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-stack-nested',
  imports: [SlCard, SlCardBody, SlCardHeader, SlHeading, SlStack, SlText],
  template: `
    <div slCard>
      <div slCardHeader>
        <h2 slHeading size="md">Order SO-10482</h2>
      </div>
      <div slCardBody>
        <div slStack [gap]="8">
          @for (section of sections; track section.title) {
            <div slStack [gap]="2">
              <span slText weight="semibold">{{ section.title }}</span>
              <span slText tone="muted">{{ section.value }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class StackNested {
  protected readonly sections = [
    { title: 'Payment method', value: 'Visa ending 4242' },
    { title: 'Billing address', value: '200 Harbor Street, Portland' },
    { title: 'Shipping method', value: 'Priority shipping, 2 days' },
  ] as const;
}
