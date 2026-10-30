import { Component, signal } from '@angular/core';
import { SlButton, SlButtonStart } from '@slotted/angular/button';
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
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-button-confirm-delete',
  imports: [
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlAlertDialogIcon,
    SlButton,
    SlButtonStart,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlGlyph,
    SlInline,
    SlText,
  ],
  template: `
    <div slInline align="center" [gap]="2">
      <button
        slButton
        tone="danger"
        variant="outline"
        focusableWhenDisabled
        [disabled]="deleted()"
        [slDialogTrigger]="dialog"
      >
        <span slButtonStart><svg slGlyph name="trash"></svg></span>
        Delete supplier
      </button>
      <sl-alert-dialog #dialog="slAlertDialog" [(open)]="open">
        <header slDialogHeader>
          <span slAlertDialogIcon></span>
          <h2 slDialogTitle>Delete Northwind Traders?</h2>
          <p slDialogDescription>
            The supplier and its 18 open purchase orders are removed for everyone. This cannot be
            undone.
          </p>
        </header>
        <footer slDialogFooter>
          <button slButton slAlertDialogCancel tone="secondary" variant="outline">
            Keep supplier
          </button>
          <button slButton slAlertDialogAction tone="danger" (click)="deleted.set(true)">
            Delete supplier
          </button>
        </footer>
      </sl-alert-dialog>
      @if (deleted()) {
        <span slText size="sm" tone="muted">Northwind Traders was deleted.</span>
        <button slButton size="sm" tone="secondary" variant="ghost" (click)="deleted.set(false)">
          Undo
        </button>
      }
    </div>
  `,
})
export class ButtonConfirmDelete {
  readonly open = signal(false);
  readonly deleted = signal(false);
}
