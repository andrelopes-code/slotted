import { Component, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-badge-live',
  imports: [SlBadge, SlButton, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slInline align="center" [gap]="3">
        <button
          slButton
          size="sm"
          type="button"
          variant="outline"
          (click)="queued.set(queued() + 1)"
        >
          Queue order
        </button>
        <span slText>Queued</span>
        <span slBadge live="polite" tone="info" [count]="queued()"></span>
      </div>
      <div slInline align="center" [gap]="3">
        <button
          slButton
          size="sm"
          type="button"
          variant="outline"
          (click)="failed.set(failed() + 1)"
        >
          Fail payment
        </button>
        <span slText>Failed</span>
        <span slBadge live="assertive" tone="danger" [count]="failed()"></span>
      </div>
    </div>
  `,
})
export class BadgeLive {
  protected readonly queued = signal(3);
  protected readonly failed = signal(1);
}
