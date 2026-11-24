import { Component, inject, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlStack } from '@slotted/angular/stack';
import { SlToastRegion, SlToastService, type ToastInput } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toast-actions',
  imports: [SlButton, SlStack, SlText, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <div slStack align="start" [gap]="3">
      <sl-toast-region />
      <button slButton type="button" [disabled]="archived()" (click)="archive(undo)">
        Archive order
      </button>
      <span slText size="sm" tone="muted">
        {{ archived() ? 'SO-10482 is archived.' : 'SO-10482 is open.' }}
      </span>
    </div>
    <ng-template #undo let-message>
      <button slButton size="sm" type="button" variant="outline" (click)="restore(message.id)">
        Undo
      </button>
    </ng-template>
  `,
})
export class ToastActions {
  private readonly toasts = inject(SlToastService);
  protected readonly archived = signal(false);

  protected archive(undo: NonNullable<ToastInput['actions']>): void {
    this.archived.set(true);
    this.toasts.show({ title: 'Order SO-10482 archived', actions: undo });
  }

  protected restore(id: string): void {
    this.archived.set(false);
    this.toasts.dismiss(id);
  }
}
