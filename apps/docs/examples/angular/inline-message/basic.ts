import { Component } from '@angular/core';
import { SlInlineMessage } from '@slotted/angular/inline-message';

@Component({
  selector: 'app-inline-message-basic',
  imports: [SlInlineMessage],
  template: `<p slInlineMessage tone="danger">Enter the tax ID printed on the invoice.</p>`,
})
export class InlineMessageBasic {}
