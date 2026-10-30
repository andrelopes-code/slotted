import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-basic',
  imports: [SlButton, SlToastRegion],
  template: `
    <!-- Once, near the root of the application. -->
    <sl-toast-region />
    <button slButton type="button" (click)="save()">Save draft</button>
  `,
})
export class ToastBasic {
  private readonly toasts = inject(SlToastService);

  save(): void {
    this.toasts.show({ title: 'Draft saved', description: 'Everything since 2:02 PM is saved.' });
  }
}
