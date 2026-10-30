import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import type { DrawerChangeRequest } from '@slotted/angular/drawer';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-drawer-unsaved-changes',
  imports: [
    SlButton,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerFooter,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlField,
    SlFieldLabel,
    SlInlineMessage,
    SlTextarea,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
      Delivery instructions
    </button>
    <sl-drawer #drawer="slDrawer" [(open)]="open" (openChangeRequest)="guard($event)">
      <header slDrawerHeader>
        <h2 slDrawerTitle>Delivery instructions</h2>
        <p slDrawerDescription>Order SO-1182, printed on the packing slip.</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div slField>
          <label slFieldLabel>Instructions for the carrier</label>
          <textarea slTextarea [value]="draft()" (valueChange)="edit($event.value)"></textarea>
        </div>
      </div>
      <footer slDrawerFooter>
        @if (confirming()) {
          <p slInlineMessage live="polite" tone="warning">
            Discard your changes to the instructions?
          </p>
          <button slButton variant="ghost" tone="secondary" (click)="confirming.set(false)">
            Keep editing
          </button>
          <button slButton tone="danger" (click)="close()">Discard</button>
        } @else {
          <button slButton variant="ghost" tone="secondary" (click)="cancel()">Cancel</button>
          <button slButton (click)="save()">Save</button>
        }
      </footer>
    </sl-drawer>
  `,
})
export class DrawerUnsavedChanges {
  readonly open = signal(false);
  readonly saved = signal('Leave at the loading dock, door 3.');
  readonly draft = signal(this.saved());
  readonly confirming = signal(false);

  guard(request: DrawerChangeRequest): void {
    if (request.value) {
      this.draft.set(this.saved());
      this.confirming.set(false);
    } else if (this.draft() !== this.saved()) {
      request.cancel();
      this.confirming.set(true);
    }
  }

  edit(value: string): void {
    this.draft.set(value);
    this.confirming.set(false);
  }

  cancel(): void {
    if (this.draft() === this.saved()) this.close();
    else this.confirming.set(true);
  }

  save(): void {
    this.saved.set(this.draft());
    this.close();
  }

  close(): void {
    this.confirming.set(false);
    this.open.set(false);
  }
}
