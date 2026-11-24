import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlStack } from '@slotted/angular/stack';
import { SlToastRegion, type ToastContent, type ToastMessage } from '@slotted/angular/toast';
import { SlText } from '@slotted/angular/typography';

const FIRST: ToastMessage<ToastContent> = {
  id: 'import-118',
  duration: 0,
  priority: 'polite',
  announcement: 'Import 118 finished',
  loading: false,
  action: false,
  data: { title: 'Import 118 finished', tone: 'success' },
  status: 'visible',
  revision: 0,
};

@Component({
  selector: 'app-toast-controlled',
  imports: [SlButton, SlStack, SlText, SlToastRegion],
  template: `
    <div slStack align="start" [gap]="3">
      <div style="block-size: 9rem; inline-size: 100%; position: relative">
        <sl-toast-region
          attach="inline"
          [toasts]="toasts()"
          (toastsChange)="toasts.set($event.value)"
        />
      </div>
      <button
        slButton
        type="button"
        variant="outline"
        [disabled]="toasts().length > 0"
        (click)="reset()"
      >
        Show again
      </button>
      <span slText size="sm" tone="muted">Messages in the queue: {{ toasts().length }}</span>
    </div>
  `,
})
export class ToastControlled {
  protected readonly toasts = signal<readonly ToastMessage<ToastContent>[]>([FIRST]);

  protected reset(): void {
    this.toasts.set([FIRST]);
  }
}
