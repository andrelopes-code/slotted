import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInlineMessage, SlInlineMessageActions } from '@slotted/angular/inline-message';

@Component({
  selector: 'app-inline-message-actions',
  imports: [SlButton, SlInlineMessage, SlInlineMessageActions],
  template: `
    @if (quantity() === null) {
      <div slInlineMessage live="polite" size="md" tone="warning">
        Order 4821 lists 240 units. Did you mean 24?
        <div slInlineMessageActions>
          <button slButton type="button" variant="outline" (click)="quantity.set(24)">
            Use 24
          </button>
          <button slButton type="button" variant="ghost" (click)="quantity.set(240)">
            Keep 240
          </button>
        </div>
      </div>
    } @else {
      <p slInlineMessage live="polite" size="md" tone="success">
        Quantity set to {{ quantity() }}.
      </p>
    }
  `,
})
export class InlineMessageActionsExample {
  readonly quantity = signal<number | null>(null);
}
