import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
  type DialogSize,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

const SIZES: { size: DialogSize; title: string; body: string }[] = [
  {
    size: 'sm',
    title: 'Rename warehouse',
    body: 'Small, 24rem: one field or one question.',
  },
  {
    size: 'md',
    title: 'Edit customer',
    body: 'Medium, 32rem, the default: a short form of one column.',
  },
  {
    size: 'lg',
    title: 'Invoice INV-2041',
    body: 'Large, 42rem: a record with a table of line items.',
  },
  {
    size: 'xl',
    title: 'Compare price lists',
    body: 'Extra large, 56rem: two columns side by side.',
  },
  {
    size: 'full',
    title: 'Shipment manifest',
    body: 'Full: the whole layer less its padding, for a document.',
  },
];

@Component({
  selector: 'app-dialog-sizes',
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
  template: `
    <div slInline [gap]="2">
      @for (option of sizes; track option.size) {
        <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
          {{ option.size }}
        </button>
        <sl-dialog #dialog="slDialog" [size]="option.size">
          <header slDialogHeader>
            <h2 slDialogTitle>{{ option.title }}</h2>
            <button slDialogClose></button>
          </header>
          <div slDialogBody>
            <span slText size="sm">{{ option.body }}</span>
          </div>
        </sl-dialog>
      }
    </div>
  `,
})
export class DialogSizes {
  readonly sizes = SIZES;
}
