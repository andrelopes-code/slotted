import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

/** Stand in for a response from a warm cache and for one from a distant region. */
const FAST_MS = 150;
const SLOW_MS = 1500;

@Component({
  selector: 'app-progress-indicator-timing',
  imports: [SlButton, SlInline, SlProgressBar, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="3">
        <button slButton type="button" variant="outline" (click)="request(fast)">
          Fast response
        </button>
        <button slButton type="button" variant="outline" (click)="request(slow)">
          Slow response
        </button>
      </div>
      <span slText size="sm" tone="muted">No timing</span>
      <div slProgressBar label="Loading shipments" [loading]="pending()"></div>
      <span slText size="sm" tone="muted">delay 200 ms, minDuration 400 ms</span>
      <div
        slProgressBar
        label="Loading shipments, timed"
        [delay]="200"
        [loading]="pending()"
        [minDuration]="400"
        (withdraw)="withdrawals.set(withdrawals() + 1)"
      ></div>
      <span slText size="sm">Times the timed bar left the page: {{ withdrawals() }}</span>
    </div>
  `,
})
export class ProgressIndicatorTiming {
  protected readonly fast = FAST_MS;
  protected readonly slow = SLOW_MS;
  protected readonly pending = signal(false);
  protected readonly withdrawals = signal(0);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected request(duration: number) {
    clearTimeout(this.timer);
    this.pending.set(true);
    this.timer = setTimeout(() => this.pending.set(false), duration);
  }
}
