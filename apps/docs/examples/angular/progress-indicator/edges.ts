import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardFooter, SlCardHeader } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlHeading, SlText } from '@slotted/angular/typography';

/** Stands in for a refresh and for a save that reports how much of it is done. */
const REFRESH_MS = 2500;
const SAVE_STEP = 10;

@Component({
  selector: 'app-progress-indicator-edges',
  imports: [
    SlButton,
    SlCard,
    SlCardBody,
    SlCardFooter,
    SlCardHeader,
    SlHeading,
    SlInline,
    SlProgressBar,
    SlText,
  ],
  template: `
    <div slCard>
      <div
        slProgressBar
        label="Refreshing orders"
        placement="edge-start"
        [loading]="refreshing()"
      ></div>
      <div slCardHeader>
        <h2 slHeading size="md">Open orders</h2>
        <p slText size="sm" tone="muted">
          The bars stand on the top and bottom edges of this card.
        </p>
      </div>
      <div slCardBody>
        <p slText size="sm">38 orders are waiting for a carrier pickup.</p>
      </div>
      <div slCardFooter>
        <div slInline [gap]="3">
          <button slButton type="button" variant="outline" (click)="refresh()">
            Refresh orders
          </button>
          <button slButton type="button" variant="outline" (click)="save()">Save view</button>
        </div>
      </div>
      <div
        slProgressBar
        label="Saving the view"
        placement="edge-end"
        [loading]="saving()"
        [value]="saved()"
      ></div>
    </div>
  `,
})
export class ProgressIndicatorEdges {
  protected readonly refreshing = signal(false);
  protected readonly saved = signal<number | null>(null);
  protected readonly saving = signal(false);
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private saveTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.refreshTimer);
      clearInterval(this.saveTimer);
    });
  }

  protected refresh() {
    clearTimeout(this.refreshTimer);
    this.refreshing.set(true);
    this.refreshTimer = setTimeout(() => this.refreshing.set(false), REFRESH_MS);
  }

  protected save() {
    clearInterval(this.saveTimer);
    this.saved.set(0);
    this.saving.set(true);
    this.saveTimer = setInterval(() => {
      const next = Math.min(100, (this.saved() ?? 0) + SAVE_STEP);
      this.saved.set(next);
      if (next < 100) return;
      clearInterval(this.saveTimer);
      this.saving.set(false);
    }, 250);
  }
}
