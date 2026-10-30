import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
} from '@slotted/angular/dialog';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-dialog-menu-action',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlField,
    SlFieldLabel,
    SlMenu,
    SlMenuItem,
    SlMenuSeparator,
    SlMenuTrigger,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <button #actions slButton tone="secondary" variant="outline" [slMenuTriggerFor]="menu">
      Customer actions
    </button>
    <sl-menu #menu>
      <button slMenuItem (select)="open.set(true)">Change credit limit…</button>
      <button slMenuItem>Export statement</button>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger">Suspend account…</button>
    </sl-menu>
    <sl-dialog size="sm" [finalFocus]="trigger()?.nativeElement" [(open)]="open">
      <header slDialogHeader>
        <h2 slDialogTitle>Credit limit</h2>
        <p slDialogDescription>Contoso Foods has $18,420.00 outstanding on open invoices.</p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slField>
          <label slFieldLabel>Limit in US dollars</label>
          <div slTextField>
            <input slTextFieldInput inputmode="decimal" value="25000" />
          </div>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">Cancel</button>
        <button slButton (click)="open.set(false)">Save limit</button>
      </footer>
    </sl-dialog>
  `,
})
export class DialogMenuAction {
  readonly open = signal(false);
  readonly trigger = viewChild('actions', { read: ElementRef });
}
