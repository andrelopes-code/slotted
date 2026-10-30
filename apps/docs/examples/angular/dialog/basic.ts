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
} from '@slotted/angular/dialog';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-dialog-basic',
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
    SlField,
    SlFieldLabel,
    SlInline,
    SlText,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slInline align="center" [gap]="3">
      <span slText size="sm">{{ email() }}</span>
      <button slButton size="sm" tone="secondary" variant="outline" [slDialogTrigger]="dialog">
        Edit billing email
      </button>
      <sl-dialog #dialog="slDialog" [open]="open()" (openChange)="toggle($event)">
        <header slDialogHeader>
          <h2 slDialogTitle>Billing email</h2>
          <p slDialogDescription>
            Invoices and payment receipts for Northwind Traders go to this address.
          </p>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <div slField>
            <label slFieldLabel>Email</label>
            <div slTextField>
              <input
                slTextFieldInput
                type="email"
                [value]="draft()"
                (valueChange)="draft.set($event.value)"
              />
            </div>
          </div>
        </div>
        <footer slDialogFooter>
          <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">
            Cancel
          </button>
          <button slButton (click)="save()">Save</button>
        </footer>
      </sl-dialog>
    </div>
  `,
})
export class DialogBasic {
  readonly open = signal(false);
  readonly email = signal('ap@northwindtraders.com');
  readonly draft = signal(this.email());

  toggle(next: boolean): void {
    if (next) this.draft.set(this.email());
    this.open.set(next);
  }

  save(): void {
    this.email.set(this.draft());
    this.open.set(false);
  }
}
