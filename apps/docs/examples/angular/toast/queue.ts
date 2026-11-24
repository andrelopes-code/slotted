import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

const LABELS = ['SO-10482', 'SO-10483', 'SO-10484', 'SO-10485', 'SO-10486'];

@Component({
  selector: 'app-toast-queue',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region [limit]="2" />
    <div slInline [gap]="2">
      <button slButton type="button" (click)="printFiveLabels()">Print five labels</button>
      <button slButton variant="outline" type="button" (click)="clear()">Clear</button>
    </div>
  `,
})
export class ToastQueue {
  private readonly toasts = inject(SlToastService);

  protected printFiveLabels(): void {
    LABELS.forEach((label) => this.toasts.show({ title: `${label} printed` }));
  }

  protected clear(): void {
    this.toasts.clear();
  }
}
