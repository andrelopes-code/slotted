import { Component } from '@angular/core';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-inline-message-tones',
  imports: [SlInlineMessage, SlStack],
  template: `
    <div slStack [gap]="2">
      <p slInlineMessage tone="secondary">Use the SKU printed on the shelf label.</p>
      <p slInlineMessage tone="accent">Prices are shown in euros.</p>
      <p slInlineMessage tone="info">Carrier rates were updated on Monday.</p>
      <p slInlineMessage tone="success">Pickup scheduled for 09:30.</p>
      <p slInlineMessage tone="warning">Only 4 units are left at this location.</p>
      <p slInlineMessage tone="danger">This SKU is already registered.</p>
    </div>
  `,
})
export class InlineMessageTones {}
