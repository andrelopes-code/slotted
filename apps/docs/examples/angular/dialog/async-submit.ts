import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
  type DialogChangeRequest,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-dialog-async-submit',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlInline,
    SlText,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
        Refund order SO-1182
      </button>
      <sl-dialog #dialog="slDialog" [(open)]="open" (openChangeRequest)="guard($event)">
        <header slDialogHeader>
          <h2 slDialogTitle>Refund $1,240.00</h2>
          <p slDialogDescription>To the card ending 4242, for order SO-1182.</p>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <span slText size="sm">
            The payment provider takes a moment to confirm. The dialog stays open until it does.
          </span>
        </div>
        <footer slDialogFooter>
          <button
            slButton
            variant="ghost"
            tone="secondary"
            [disabled]="saving()"
            (click)="open.set(false)"
          >
            Cancel
          </button>
          <button
            slButton
            [loading]="saving()"
            [messages]="{ loading: 'Issuing refund' }"
            (click)="refund()"
          >
            Issue refund
          </button>
        </footer>
      </sl-dialog>
      @if (sent()) {
        <span slText role="status" size="sm" tone="muted">Refund issued.</span>
      }
    </div>
  `,
})
export class DialogAsyncSubmit {
  readonly open = signal(false);
  readonly saving = signal(false);
  readonly sent = signal(false);

  guard(request: DialogChangeRequest): void {
    if (!request.value && this.saving()) request.cancel();
    if (request.value) this.sent.set(false);
  }

  refund(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.sent.set(true);
      this.open.set(false);
    }, 1500);
  }
}
