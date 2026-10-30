import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  provideDialogDefaults,
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-dialog-defaults',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlInline,
    SlText,
  ],
  providers: [provideDialogDefaults({ placement: 'top', size: 'lg' })],
  template: `
    <div slInline [gap]="2">
      <button slButton tone="secondary" variant="outline" [slDialogTrigger]="order">
        Purchase order PO-7730
      </button>
      <sl-dialog #order="slDialog">
        <header slDialogHeader>
          <h2 slDialogTitle>Purchase order PO-7730</h2>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <span slText size="sm">Large and at the top, from the provider.</span>
        </div>
      </sl-dialog>
      <button slButton tone="secondary" variant="outline" [slDialogTrigger]="rename">
        Rename supplier
      </button>
      <sl-dialog #rename="slDialog" size="sm">
        <header slDialogHeader>
          <h2 slDialogTitle>Rename supplier</h2>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <span slText size="sm">At the top from the provider, and small because it says so.</span>
        </div>
      </sl-dialog>
    </div>
  `,
})
export class DialogDefaults {}
