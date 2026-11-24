import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-placement',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region placement="top" />
    <div slInline [gap]="2">
      <button slButton type="button" (click)="showAtTheTop()">Show at the top</button>
    </div>
  `,
})
export class ToastPlacement {
  private readonly toasts = inject(SlToastService);

  protected showAtTheTop(): void {
    this.toasts.show({ title: 'Draft saved' });
  }
}
