import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlLoadingOverlay } from '@slotted/angular/loading-overlay';

@Component({
  selector: 'app-loading-overlay-page',
  imports: [SlButton, SlInline, SlLoadingOverlay],
  template: `
    <div slInline>
      <button slButton (click)="close()">Close March period</button>
    </div>
    <div
      slLoadingOverlay
      cancellable
      description="Keep this tab open."
      scope="page"
      [loading]="closing()"
      [messages]="{ label: 'Closing the accounting period' }"
      (cancel)="stop()"
    ></div>
  `,
})
export class LoadingOverlayPage {
  protected readonly closing = signal(false);
  private timer?: number;

  protected close() {
    this.closing.set(true);
    this.timer = window.setTimeout(() => this.closing.set(false), 4000);
  }

  protected stop() {
    window.clearTimeout(this.timer);
    this.closing.set(false);
  }
}
