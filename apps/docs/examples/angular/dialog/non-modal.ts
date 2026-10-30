import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const STEPS = [
  'Pick the 6 lines on the pick list from aisles 4 and 9.',
  'Pack the olive oil upright, with dividers.',
  'Print the UPS label and attach it to the top face.',
];

@Component({
  selector: 'app-dialog-non-modal',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlStack,
    SlText,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
      Show packing steps
    </button>
    <sl-dialog #dialog="slDialog" outsidePress="none" placement="top" size="sm" [modal]="false">
      <header slDialogHeader>
        <h2 slDialogTitle>Packing steps</h2>
        <p slDialogDescription>Order SO-1182. The page stays usable behind this panel.</p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slStack [gap]="2">
          @for (step of steps; track step; let index = $index) {
            <span slText size="sm">{{ index + 1 }}. {{ step }}</span>
          }
        </div>
      </div>
    </sl-dialog>
  `,
})
export class DialogNonModal {
  readonly steps = STEPS;
}
