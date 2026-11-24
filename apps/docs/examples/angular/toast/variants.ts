import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-variants',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region />
    <div slInline [gap]="2">
      <button slButton variant="outline" type="button" (click)="raised()">Raised</button>
      <button slButton variant="outline" type="button" (click)="soft()">Soft</button>
      <button slButton variant="outline" type="button" (click)="solid()">Solid</button>
    </div>
  `,
})
export class ToastVariants {
  private readonly toasts = inject(SlToastService);

  protected raised(): void {
    this.toasts.show({ title: 'Invoice INV-2041 sent', tone: 'success', variant: 'raised' });
  }

  protected soft(): void {
    this.toasts.show({ title: 'Invoice INV-2041 sent', tone: 'success', variant: 'soft' });
  }

  protected solid(): void {
    this.toasts.show({ title: 'Invoice INV-2041 sent', tone: 'success', variant: 'solid' });
  }
}
