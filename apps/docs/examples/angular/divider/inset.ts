import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlDivider } from '@slotted/angular/divider';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-divider-inset',
  imports: [SlButton, SlCard, SlCardBody, SlCardHeader, SlDivider, SlHeading, SlStack],
  template: `
    <div slStack [gap]="4">
      @for (inset of insets; track inset) {
        <div slCard>
          <div slCardHeader>
            <h2 slHeading size="sm">{{ inset ? 'inset' : 'Full length' }}</h2>
          </div>
          <div slCardBody>
            <div slStack [gap]="2">
              @for (carrier of carriers; track carrier; let first = $first) {
                @if (!first) {
                  <hr slDivider [inset]="inset" />
                }
                <button slButton fullWidth justify="between" tone="secondary" variant="ghost">
                  {{ carrier }}
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DividerInset {
  protected readonly insets = [false, true];
  protected readonly carriers = ['Northwind Freight', 'Harbor Line', 'Alpine Express'];
}
