import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlTextarea } from '@slotted/angular/textarea';

const PAYLOAD = `{
  "event": "order.shipped",
  "orderId": 10248,
  "carrier": "Federal Shipping",
  "tracking": "FS-2026-0042-7731"
}`;

@Component({
  selector: 'app-textarea-mono',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlTextarea],
  template: `
    <div slField>
      <label slFieldLabel>Test payload</label>
      <textarea
        slTextarea
        mono
        variant="subtle"
        [rows]="7"
        spellcheck="false"
        [defaultValue]="payload"
      ></textarea>
      <span slFieldDescription>Sent to your endpoint when you press Send test event.</span>
    </div>
  `,
})
export class TextareaMono {
  readonly payload = PAYLOAD;
}
