import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-update',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region />
    <div slInline [gap]="2">
      <button slButton type="button" (click)="uploadThePriceList()">Upload the price list</button>
      <button slButton variant="outline" type="button" (click)="finish()">Finish</button>
    </div>
  `,
})
export class ToastUpdate {
  private readonly toasts = inject(SlToastService);

  protected uploadThePriceList(): void {
    this.toasts.show({ id: 'price-list', title: 'Uploading price list', duration: 0 });
  }

  protected finish(): void {
    this.toasts.show({
      id: 'price-list',
      title: 'Price list uploaded',
      tone: 'success',
      duration: 5000,
    });
  }
}
