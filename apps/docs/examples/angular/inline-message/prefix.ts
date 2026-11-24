import { Component } from '@angular/core';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-inline-message-prefix',
  imports: [SlInlineMessage, SlStack],
  template: `
    <div slStack [gap]="2">
      <p slInlineMessage tone="danger">Enter a valid tax ID.</p>
      <p slInlineMessage prefix="Overdue:" tone="danger">Invoice 4822 was due on March 3.</p>
      <p slInlineMessage prefix="" tone="danger">Error: the tax ID needs 9 digits.</p>
    </div>
  `,
})
export class InlineMessagePrefix {}
