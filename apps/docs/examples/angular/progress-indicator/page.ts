import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

/** Stands in for the navigation to a report. */
const NAVIGATION_MS = 1800;

@Component({
  selector: 'app-progress-indicator-page',
  imports: [SlButton, SlProgressBar, SlStack, SlText],
  template: `
    <div slStack align="start" [gap]="3">
      <div
        slProgressBar
        label="Loading page"
        placement="page"
        [delay]="200"
        [loading]="navigating()"
        [minDuration]="400"
      ></div>
      <button slButton type="button" (click)="navigate()">Open the Q3 report</button>
      <span slText size="sm" tone="muted">
        The bar crosses the top of the viewport while the report loads.
      </span>
    </div>
  `,
})
export class ProgressIndicatorPage {
  protected readonly navigating = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected navigate() {
    clearTimeout(this.timer);
    this.navigating.set(true);
    this.timer = setTimeout(() => this.navigating.set(false), NAVIGATION_MS);
  }
}
