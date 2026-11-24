import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { provideToastDefaults, SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-defaults',
  imports: [SlButton, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [
    provideToastDefaults({ duration: 0, placement: 'top-end', variant: 'soft' }),
    SlToastService,
  ],
  template: `
    <sl-toast-region />
    <button slButton type="button" (click)="pack()">Pack order</button>
  `,
})
export class ToastDefaults {
  private readonly toasts = inject(SlToastService);

  protected pack(): void {
    this.toasts.show({ title: 'Order SO-10482 packed', tone: 'success' });
  }
}
