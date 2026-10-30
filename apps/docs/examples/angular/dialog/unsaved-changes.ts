import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlAlertDialog,
  SlAlertDialogAction,
  SlAlertDialogCancel,
  SlAlertDialogIcon,
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
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-dialog-unsaved-changes',
  imports: [
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlAlertDialogIcon,
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
      <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
        Change delivery address
      </button>
      <sl-dialog #dialog="slDialog" [(open)]="open" (openChangeRequest)="guard($event)">
        <header slDialogHeader>
          <h2 slDialogTitle>Delivery address</h2>
          <p slDialogDescription>Applies to order SO-1182 and to later orders.</p>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <div slField>
            <label slFieldLabel>Address</label>
            <div slTextField>
              <input slTextFieldInput [value]="draft()" (valueChange)="draft.set($event.value)" />
            </div>
          </div>
        </div>
        <footer slDialogFooter>
          <button slButton variant="ghost" tone="secondary" (click)="leave()">Cancel</button>
          <button slButton (click)="save()">Save address</button>
        </footer>
        <sl-alert-dialog tone="warning" [(open)]="confirming">
          <header slDialogHeader>
            <span slAlertDialogIcon></span>
            <h2 slDialogTitle>Discard the new address?</h2>
            <p slDialogDescription>
              The address you typed is not saved. The order keeps the previous one.
            </p>
          </header>
          <footer slDialogFooter>
            <button slButton slAlertDialogCancel tone="secondary" variant="outline">
              Keep editing
            </button>
            <button slButton slAlertDialogAction tone="warning" (click)="open.set(false)">
              Discard changes
            </button>
          </footer>
        </sl-alert-dialog>
      </sl-dialog>
      <span slText size="sm" tone="muted">{{ address() }}</span>
    </div>
  `,
})
export class DialogUnsavedChanges {
  readonly open = signal(false);
  readonly confirming = signal(false);
  readonly address = signal('Pier 70, Suite 300, Seattle, WA 98121');
  readonly draft = signal(this.address());
  readonly dirty = computed(() => this.draft() !== this.address());

  guard(request: DialogChangeRequest): void {
    if (request.value) {
      this.draft.set(this.address());
    } else if (this.dirty()) {
      request.cancel();
      this.confirming.set(true);
    }
  }

  leave(): void {
    if (this.dirty()) this.confirming.set(true);
    else this.open.set(false);
  }

  save(): void {
    this.address.set(this.draft());
    this.open.set(false);
  }
}
