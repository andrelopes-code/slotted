import { Component, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import {
  SlAlertDialog,
  SlAlertDialogAction,
  SlAlertDialogCancel,
  SlAlertDialogIcon,
  SlDialogBody,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlSelect, SlSelectItem, type SelectSelection } from '@slotted/angular/select';
import { SlText } from '@slotted/angular/typography';

const REASONS = [
  { value: 'customer', label: 'The customer asked to cancel' },
  { value: 'stock', label: 'Items are out of stock' },
  { value: 'payment', label: 'The payment was flagged' },
  { value: 'duplicate', label: 'Duplicate order' },
];

@Component({
  selector: 'app-dialog-cancel-order',
  imports: [
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlAlertDialogIcon,
    SlBadge,
    SlButton,
    SlDialogBody,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlField,
    SlFieldLabel,
    SlInline,
    SlSelect,
    SlSelectItem,
    SlText,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <span slText weight="medium">Order SO-1182</span>
      <span slBadge [tone]="cancelled() ? 'danger' : 'accent'">
        {{ cancelled() ? 'Cancelled' : 'Processing' }}
      </span>
      <button
        slButton
        focusableWhenDisabled
        size="sm"
        tone="danger"
        variant="outline"
        [disabled]="cancelled()"
        [slDialogTrigger]="dialog"
      >
        Cancel order
      </button>
      <sl-alert-dialog #dialog="slAlertDialog" (openChange)="$event && reason.set(null)">
        <header slDialogHeader>
          <span slAlertDialogIcon></span>
          <h2 slDialogTitle>Cancel order SO-1182?</h2>
          <p slDialogDescription>
            Contoso Foods is refunded $1,240.00 and the 6 items go back to stock. The order cannot
            be reopened.
          </p>
        </header>
        <div slDialogBody>
          <div slField required>
            <label slFieldLabel>Reason</label>
            <sl-select placeholder="Choose a reason" [items]="reasons" [(value)]="reason">
              @for (option of reasons; track option.value) {
                <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
              }
            </sl-select>
          </div>
        </div>
        <footer slDialogFooter>
          <button slButton slAlertDialogCancel tone="secondary" variant="outline">
            Keep order
          </button>
          <button
            slButton
            slAlertDialogAction
            tone="danger"
            [disabled]="reason() === null"
            (click)="cancelled.set(true)"
          >
            Cancel order
          </button>
        </footer>
      </sl-alert-dialog>
    </div>
  `,
})
export class DialogCancelOrder {
  readonly reasons = REASONS;
  readonly cancelled = signal(false);
  readonly reason = signal<SelectSelection>(null);
}
