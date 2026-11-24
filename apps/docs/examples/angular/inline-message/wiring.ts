import { Component } from '@angular/core';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-inline-message-wiring',
  imports: [SlInlineMessage, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slStack [gap]="2">
      <div slTextField>
        <input
          slTextFieldInput
          aria-label="EIN"
          invalid
          value="12-345678"
          [attr.aria-errormessage]="message.messageId"
        />
      </div>
      <p slInlineMessage #message="slInlineMessage" tone="danger">
        The EIN has 8 digits and needs 9.
      </p>
    </div>
  `,
})
export class InlineMessageWiring {}
