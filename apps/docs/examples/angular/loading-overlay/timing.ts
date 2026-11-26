import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlLoadingOverlay } from '@slotted/angular/loading-overlay';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-timing',
  imports: [SlButton, SlCard, SlCardBody, SlHeading, SlInline, SlLoadingOverlay, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="2">
        <button slButton variant="outline" (click)="look(100)">Fast lookup (100 ms)</button>
        <button slButton (click)="look(500)">Slower lookup (500 ms)</button>
      </div>
      <div
        slLoadingOverlay
        [delay]="300"
        [loading]="loading()"
        [messages]="{ label: 'Looking up rates' }"
        [minDuration]="600"
        (reveal)="shown.update((count) => count + 1)"
      >
        <div slCard>
          <div slCardBody>
            <h3 slHeading size="md">Exchange rates</h3>
            <p slText>1 EUR = 1.08 USD, 1 GBP = 1.27 USD.</p>
          </div>
        </div>
      </div>
      <p slText size="sm" tone="muted">Layers drawn: {{ shown() }}</p>
    </div>
  `,
})
export class LoadingOverlayTiming {
  protected readonly loading = signal(false);
  protected readonly shown = signal(0);

  protected look(ms: number) {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), ms);
  }
}
