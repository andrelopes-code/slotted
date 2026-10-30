import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-dialog-dismiss',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlText,
  ],
  template: `
    <button slButton [slDialogTrigger]="dialog">Import products</button>
    <sl-dialog #dialog="slDialog" escape="none" outsidePress="none" [(open)]="open">
      <header slDialogHeader>
        <h2 slDialogTitle>Import 1,240 products</h2>
        <p slDialogDescription>From spring-catalogue.csv into the Northwind price list.</p>
      </header>
      <div slDialogBody>
        <span slText size="sm">
          38 rows update existing products and 1,202 add new ones. Escape and a press outside the
          panel leave this dialog open; choose one of the actions.
        </span>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">
          Cancel import
        </button>
        <button slButton (click)="open.set(false)">Start import</button>
      </footer>
    </sl-dialog>
  `,
})
export class DialogDismiss {
  readonly open = signal(false);
}
