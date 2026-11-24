import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

const SHIPMENTS = ['SH-2201', 'SH-2202', 'SH-2203', 'SH-2204'];

@Component({
  selector: 'app-toast-stacking',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region [limit]="4" stacking="stack" />
    <div slInline [gap]="2">
      <button slButton type="button" (click)="receiveFourShipments()">
        Receive four shipments
      </button>
      <button slButton variant="outline" type="button" (click)="clear()">Clear</button>
    </div>
  `,
})
export class ToastStacking {
  private readonly toasts = inject(SlToastService);

  protected receiveFourShipments(): void {
    SHIPMENTS.forEach((shipment) =>
      this.toasts.show({ title: `${shipment} received`, tone: 'success', duration: 0 }),
    );
  }

  protected clear(): void {
    this.toasts.clear();
  }
}
