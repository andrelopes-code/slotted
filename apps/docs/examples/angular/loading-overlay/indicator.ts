import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlLoadingOverlay, SlLoadingOverlayIndicator } from '@slotted/angular/loading-overlay';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-indicator',
  imports: [
    SlButton,
    SlCard,
    SlCardBody,
    SlHeading,
    SlInline,
    SlLoadingOverlay,
    SlLoadingOverlayIndicator,
    SlProgressBar,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      <div slInline>
        <button slButton (click)="upload()">Upload manifest</button>
      </div>
      <div
        slLoadingOverlay
        [loading]="progress() !== null"
        [messages]="{ label: 'Uploading carrier-manifest.csv' }"
      >
        <div
          slLoadingOverlayIndicator
          slProgressBar
          hideLabel
          label="Uploaded"
          [value]="progress() ?? 100"
        ></div>
        <div slCard>
          <div slCardBody>
            <h3 slHeading size="md">Carrier manifest</h3>
            <p slText>Pickup list for 14 Nov, 38 shipments.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoadingOverlayIndicator {
  protected readonly progress = signal<number | null>(null);

  protected upload() {
    this.progress.set(0);
    const timer = window.setInterval(() => {
      const next = (this.progress() ?? 0) + 10;
      if (next < 100) {
        this.progress.set(next);
        return;
      }
      window.clearInterval(timer);
      this.progress.set(null);
    }, 400);
  }
}
