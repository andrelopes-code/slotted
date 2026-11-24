import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

function publish(succeeds: boolean) {
  return new Promise<number>((resolve, reject) => {
    setTimeout(() => (succeeds ? resolve(148) : reject(new Error('Offline'))), 2000);
  });
}

const MESSAGES = {
  loading: { title: 'Publishing prices' },
  success: (count: number) => ({ title: `${count} prices published`, tone: 'success' as const }),
  error: { title: 'Prices were not published', tone: 'danger' as const },
};

@Component({
  selector: 'app-toast-promise',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region />
    <div slInline [gap]="2">
      <button slButton type="button" (click)="publishPrices()">Publish prices</button>
      <button slButton variant="outline" type="button" (click)="publishWithAnError()">
        Publish with an error
      </button>
    </div>
  `,
})
export class ToastPromise {
  private readonly toasts = inject(SlToastService);

  protected publishPrices(): void {
    void this.toasts.promise(publish(true), MESSAGES);
  }

  protected publishWithAnError(): void {
    this.toasts.promise(publish(false), MESSAGES).catch(() => undefined);
  }
}
