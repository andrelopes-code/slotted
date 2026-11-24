import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

/** Stands in for an import that reports how much of it is done. */
const STEP = 8;

@Component({
  selector: 'app-progress-indicator-live',
  imports: [SlButton, SlInline, SlProgressBar, SlStack, SlText],
  template: `
    <div
      slStack
      aria-describedby="import-progress"
      [attr.aria-busy]="running() ? 'true' : null"
      [gap]="4"
    >
      <div slInline><button slButton type="button" (click)="start()">Start import</button></div>
      <div
        slProgressBar
        id="import-progress"
        label="Importing orders"
        showValue
        [value]="value()"
      ></div>
      <span slText size="sm" tone="muted">
        {{ value() === 100 ? '1,240 orders imported.' : 'Northwind Retail, 1,240 orders.' }}
      </span>
    </div>
  `,
})
export class ProgressIndicatorLive {
  protected readonly value = signal(0);
  protected readonly running = signal(false);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  protected start() {
    clearInterval(this.timer);
    this.value.set(0);
    this.running.set(true);
    this.timer = setInterval(() => {
      const next = Math.min(100, this.value() + STEP);
      this.value.set(next);
      if (next < 100) return;
      clearInterval(this.timer);
      this.running.set(false);
    }, 250);
  }
}
