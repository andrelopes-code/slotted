import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

const OUTCOMES: Record<string, string> = {
  partial: 'Ships the 4 items in stock today.',
  wait: 'Holds the order until every item is in stock.',
};

@Component({
  selector: 'app-dialog-result',
  imports: [
    SlButton,
    SlDialog,
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
        Ship order SO-1182
      </button>
      <sl-dialog #dialog="slDialog" (closed)="record($event)">
        <header slDialogHeader>
          <h2 slDialogTitle>Two items are out of stock</h2>
          <p slDialogDescription>Aniseed syrup and dried pears are back in stock on 14 October.</p>
          <button slDialogClose></button>
        </header>
        <footer slDialogFooter>
          <button slButton variant="outline" tone="secondary" (click)="dialog.close('wait')">
            Wait for all items
          </button>
          <button slButton (click)="dialog.close('partial')">Ship 4 items now</button>
        </footer>
      </sl-dialog>
      @if (outcome(); as message) {
        <span slText size="sm" tone="muted">{{ message }}</span>
      }
    </div>
  `,
})
export class DialogResult {
  readonly outcome = signal<string | null>(null);

  record(result: string | undefined): void {
    this.outcome.set((result && OUTCOMES[result]) ?? 'Closed without a choice.');
  }
}
