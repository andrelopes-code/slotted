import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-visually-hidden-skip-link',
  imports: [SlHeading, SlStack, SlText, SlVisuallyHidden],
  template: `
    <div slStack [gap]="3">
      <a slVisuallyHidden focusable href="#orders-today">Skip to the orders</a>
      <p slText size="sm" tone="muted">The skip link appears above this text while it has focus.</p>
      <h2 slHeading id="orders-today" size="sm" tabindex="-1">Orders placed today</h2>
    </div>
  `,
})
export class VisuallyHiddenSkipLink {}
