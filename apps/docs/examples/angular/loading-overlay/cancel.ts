import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlLoadingOverlay } from '@slotted/angular/loading-overlay';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-loading-overlay-cancel',
  imports: [SlButton, SlCard, SlCardBody, SlHeading, SlInline, SlLoadingOverlay, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slInline>
        <button slButton (click)="start()">Import price list</button>
      </div>
      <div
        slLoadingOverlay
        cancellable
        [loading]="importing()"
        [messages]="{ label: 'Importing 4 812 rows' }"
        (cancel)="stop($event.reason)"
      >
        <div slCard>
          <div slCardBody>
            <h3 slHeading size="md">Price list</h3>
            <p slText>4 812 rows, last updated 12 Nov.</p>
          </div>
        </div>
      </div>
      <p slText size="sm" tone="muted">{{ outcome() }}</p>
    </div>
  `,
})
export class LoadingOverlayCancel {
  protected readonly importing = signal(false);
  protected readonly outcome = signal('No import has run yet.');
  private timer?: number;

  protected start() {
    this.importing.set(true);
    this.outcome.set('Importing.');
    this.timer = window.setTimeout(() => {
      this.importing.set(false);
      this.outcome.set('Imported 4 812 rows.');
    }, 6000);
  }

  protected stop(reason: string) {
    window.clearTimeout(this.timer);
    this.importing.set(false);
    this.outcome.set(`Import stopped (reason: ${reason}).`);
  }
}
