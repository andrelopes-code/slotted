import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlAlertDialog,
  SlAlertDialogAction,
  SlAlertDialogCancel,
  SlAlertDialogIcon,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
  type DialogTone,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';

const CONFIRMATIONS: {
  tone: DialogTone;
  trigger: string;
  title: string;
  description: string;
  action: string;
}[] = [
  {
    tone: 'accent',
    trigger: 'Send invoices',
    title: 'Send 214 invoices?',
    description: 'Each customer receives the September invoice by email within the hour.',
    action: 'Send invoices',
  },
  {
    tone: 'warning',
    trigger: 'Publish prices',
    title: 'Publish the new prices?',
    description: 'Open quotes keep their prices; new orders use the new ones from now on.',
    action: 'Publish prices',
  },
  {
    tone: 'success',
    trigger: 'Close September',
    title: 'Close the books for September?',
    description: 'All 1,180 entries reconcile. Entries dated September can no longer be edited.',
    action: 'Close September',
  },
];

@Component({
  selector: 'app-dialog-alert-tones',
  imports: [
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlAlertDialogIcon,
    SlButton,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlInline,
  ],
  template: `
    <div slInline [gap]="2">
      @for (confirmation of confirmations; track confirmation.tone) {
        <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
          {{ confirmation.trigger }}
        </button>
        <sl-alert-dialog #dialog="slAlertDialog" [tone]="confirmation.tone">
          <header slDialogHeader>
            <span slAlertDialogIcon></span>
            <h2 slDialogTitle>{{ confirmation.title }}</h2>
            <p slDialogDescription>{{ confirmation.description }}</p>
          </header>
          <footer slDialogFooter>
            <button slButton slAlertDialogCancel tone="secondary" variant="outline">Not now</button>
            <button slButton slAlertDialogAction [tone]="confirmation.tone">
              {{ confirmation.action }}
            </button>
          </footer>
        </sl-alert-dialog>
      }
    </div>
  `,
})
export class DialogAlertTones {
  readonly confirmations = CONFIRMATIONS;
}
