import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-priority',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region />
    <div slInline [gap]="2">
      <button slButton variant="outline" type="button" (click)="polite()">Polite</button>
      <button slButton variant="outline" type="button" (click)="assertive()">Assertive</button>
    </div>
  `,
})
export class ToastPriority {
  private readonly toasts = inject(SlToastService);

  protected polite(): void {
    this.toasts.show({ title: 'Draft saved' });
  }

  protected assertive(): void {
    this.toasts.show({
      title: 'Connection lost',
      description: 'Changes are kept on this device.',
      tone: 'danger',
      priority: 'assertive',
    });
  }
}
