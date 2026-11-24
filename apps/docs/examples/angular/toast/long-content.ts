import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-long-content',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region />
    <div slInline [gap]="2">
      <button slButton type="button" (click)="showALongMessage()">Show a long message</button>
      <button slButton variant="outline" type="button" (click)="withoutAMark()">
        Without a mark
      </button>
    </div>
  `,
})
export class ToastLongContent {
  private readonly toasts = inject(SlToastService);

  protected showALongMessage(): void {
    this.toasts.show({
      title: 'Deployment of the storefront rejected by the registry',
      description: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      tone: 'danger',
      duration: 0,
    });
  }

  protected withoutAMark(): void {
    this.toasts.show({ title: 'Columns restored to their defaults', hideIcon: true });
  }
}
