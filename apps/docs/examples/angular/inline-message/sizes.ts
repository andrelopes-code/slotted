import { Component } from '@angular/core';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-inline-message-sizes',
  imports: [SlInlineMessage, SlStack],
  template: `
    <div slStack [gap]="3">
      <p slInlineMessage size="sm" tone="danger">The reorder point must be a whole number.</p>
      <p slInlineMessage size="md" tone="danger">
        The reorder point must be lower than the stock ceiling.
      </p>
    </div>
  `,
})
export class InlineMessageSizes {}
