import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlAlertDialog,
  SlAlertDialogAction,
  SlAlertDialogCancel,
  SlAlertDialogIcon,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-dialog-destructive',
  imports: [
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlAlertDialogIcon,
    SlButton,
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
      <button slButton tone="danger" variant="outline" [slDialogTrigger]="dialog">
        Delete price list
      </button>
      <sl-alert-dialog #dialog="slAlertDialog">
        <header slDialogHeader>
          <span slAlertDialogIcon></span>
          <h2 slDialogTitle>Delete the 2026 wholesale price list?</h2>
          <p slDialogDescription>
            The 412 prices in it are removed, and 9 customers on this list move to retail prices.
            This cannot be undone.
          </p>
        </header>
        <footer slDialogFooter>
          <button slButton slAlertDialogCancel tone="secondary" variant="outline">
            Keep price list
          </button>
          <button slButton slAlertDialogAction tone="danger" (click)="deleted.set(true)">
            Delete price list
          </button>
        </footer>
      </sl-alert-dialog>
      @if (deleted()) {
        <span slText role="status" size="sm" tone="muted">
          The 2026 wholesale price list was deleted.
        </span>
      }
    </div>
  `,
})
export class DialogDestructive {
  readonly deleted = signal(false);
}
