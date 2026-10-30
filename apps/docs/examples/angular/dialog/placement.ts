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
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-dialog-placement',
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
    SlTextarea,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
      Add a note
    </button>
    <sl-dialog #dialog="slDialog" placement="top" [(open)]="open">
      <header slDialogHeader>
        <h2 slDialogTitle>Note on order SO-1182</h2>
        <p slDialogDescription>The warehouse team sees the note on the pick list.</p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slField>
          <label slFieldLabel>Note</label>
          <textarea
            slTextarea
            [rows]="3"
            [maxRows]="12"
            placeholder="Leave at the loading dock after 2 pm."
          ></textarea>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">Cancel</button>
        <button slButton (click)="open.set(false)">Add note</button>
      </footer>
    </sl-dialog>
  `,
})
export class DialogPlacement {
  readonly open = signal(false);
}
