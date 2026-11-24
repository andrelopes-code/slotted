import { Component } from '@angular/core';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-inline-message-states',
  imports: [SlInlineMessage, SlStack],
  template: `
    <div slStack [gap]="2">
      <p slInlineMessage loading>Checking the carrier rates…</p>
      <p slInlineMessage disabled tone="danger">
        The address cannot be edited while the order ships.
      </p>
      <p slInlineMessage disabled loading>Syncing stock counts…</p>
    </div>
  `,
})
export class InlineMessageStates {}
