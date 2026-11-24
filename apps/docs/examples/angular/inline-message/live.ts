import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';

type Status = 'failed' | 'idle' | 'saved';

@Component({
  selector: 'app-inline-message-live',
  imports: [SlButton, SlInline, SlInlineMessage, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="2">
        <button slButton type="button" variant="outline" (click)="status.set('saved')">
          Save prices
        </button>
        <button slButton type="button" variant="outline" (click)="status.set('failed')">
          Lose connection
        </button>
      </div>
      <p slInlineMessage live="polite" reserve tone="success">{{ saved() }}</p>
      <p slInlineMessage live="assertive" reserve tone="danger">{{ failed() }}</p>
    </div>
  `,
})
export class InlineMessageLive {
  readonly status = signal<Status>('idle');
  readonly saved = computed(() =>
    this.status() === 'saved' ? 'Changes to 214 products are live.' : '',
  );
  readonly failed = computed(() =>
    this.status() === 'failed' ? 'Price changes are not being saved.' : '',
  );
}
