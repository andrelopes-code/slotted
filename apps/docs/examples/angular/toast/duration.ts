import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-duration',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region />
    <div slInline [gap]="2">
      <button slButton variant="outline" type="button" (click)="eightSeconds()">
        Eight seconds
      </button>
      <button slButton variant="outline" type="button" (click)="untilDismissed()">
        Until dismissed
      </button>
    </div>
  `,
})
export class ToastDuration {
  private readonly toasts = inject(SlToastService);

  protected eightSeconds(): void {
    this.toasts.show({
      title: 'Export ready',
      description: 'orders-november.csv',
      duration: 8000,
      progress: true,
    });
  }

  protected untilDismissed(): void {
    this.toasts.show({
      title: 'Your session has expired',
      description: 'Sign in again to go on.',
      tone: 'danger',
      duration: 0,
    });
  }
}
