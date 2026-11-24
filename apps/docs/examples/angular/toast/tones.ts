import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-tones',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region />
    <div slInline [gap]="2">
      <button slButton variant="outline" type="button" (click)="info()">Info</button>
      <button slButton variant="outline" type="button" (click)="success()">Success</button>
      <button slButton variant="outline" type="button" (click)="warning()">Warning</button>
      <button slButton variant="outline" type="button" (click)="danger()">Danger</button>
      <button slButton variant="outline" type="button" (click)="note()">Note</button>
    </div>
  `,
})
export class ToastTones {
  private readonly toasts = inject(SlToastService);

  protected info(): void {
    this.toasts.show({ title: 'Nightly sync starts at 02:00', tone: 'info' });
  }

  protected success(): void {
    this.toasts.show({ title: 'Invoice INV-2041 sent', tone: 'success' });
  }

  protected warning(): void {
    this.toasts.show({ title: 'Stock of BEV-104 is below 20 units', tone: 'warning' });
  }

  protected danger(): void {
    this.toasts.show({ title: 'Payment for SO-10482 was declined', tone: 'danger' });
  }

  protected note(): void {
    this.toasts.show({ title: 'Columns restored to their defaults', tone: 'secondary' });
  }
}
