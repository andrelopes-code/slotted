import { Component, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlStack } from '@slotted/angular/stack';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toast-dismissal',
  imports: [SlButton, SlStack, SlText, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <div slStack align="start" [gap]="3">
      <sl-toast-region (toastsChange)="note($event.reason)" />
      <button slButton type="button" (click)="save()">Save draft</button>
      <span slText role="status" size="sm" tone="muted">Last departure: {{ reason() }}</span>
    </div>
  `,
})
export class ToastDismissal {
  private readonly toasts = inject(SlToastService);
  protected readonly reason = signal('none yet');

  protected note(reason: string): void {
    if (reason !== 'programmatic') this.reason.set(reason);
  }

  protected save(): void {
    this.toasts.show({ title: 'Draft saved', progress: true });
  }
}
