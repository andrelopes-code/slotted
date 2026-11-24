import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';

type Check = 'checking' | 'done' | 'idle';

const SENTENCES: Record<Check, string> = {
  checking: 'Checking stock in Rotterdam…',
  done: '142 units in stock in Rotterdam.',
  idle: '',
};

@Component({
  selector: 'app-inline-message-pending',
  imports: [SlButton, SlInline, SlInlineMessage, SlStack],
  template: `
    <div slStack [gap]="3">
      <div slInline [gap]="2">
        <button
          slButton
          type="button"
          variant="outline"
          [disabled]="check() === 'checking'"
          (click)="start()"
        >
          Check stock in Rotterdam
        </button>
      </div>
      <p
        slInlineMessage
        live="polite"
        reserve
        [loading]="check() === 'checking'"
        [tone]="check() === 'done' ? 'success' : 'secondary'"
      >
        {{ sentences[check()] }}
      </p>
    </div>
  `,
})
export class InlineMessagePending {
  readonly check = signal<Check>('idle');
  protected readonly sentences = SENTENCES;

  start(): void {
    this.check.set('checking');
    setTimeout(() => this.check.set('done'), 1800);
  }
}
