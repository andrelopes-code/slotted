import { Component, inject } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';

@Component({
  selector: 'app-toast-keyboard',
  imports: [SlButton, SlInline, SlToastRegion],
  /* A queue for this example. The root service serves the whole application. */
  providers: [SlToastService],
  template: `
    <sl-toast-region hotkey="Alt+N" />
    <div slInline [gap]="2">
      <button slButton type="button" (click)="showAMessage()">Show a message</button>
    </div>
  `,
})
export class ToastKeyboard {
  private readonly toasts = inject(SlToastService);

  protected showAMessage(): void {
    this.toasts.show({
      title: 'Draft saved',
      description: 'Press Alt+N to reach this message.',
      duration: 0,
    });
  }
}
