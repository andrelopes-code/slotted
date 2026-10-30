import { ChangeDetectionStrategy, Component, input, model, output, signal } from '@angular/core';
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
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlTextarea } from '@slotted/angular/textarea';

/**
 * One reason, written before a decision that changes a record for everyone —
 * a hold, a cancellation, a rejection. The backend requires the words (§59,
 * §67) and the record keeps them, so the field says who will read them.
 */
@Component({
  selector: 'app-reason-dialog',
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
    SlFieldDescription,
    SlFieldLabel,
    SlTextarea,
  ],
  /* Only an overlay lives here: the host takes no box, as sl-dialog's own does not, so it adds
     no row or gap to its parent's layout. */
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sl-dialog size="sm" [(open)]="open" [loading]="busy()" (closed)="reason.set('')">
      <header slDialogHeader>
        <h2 slDialogTitle>{{ title() }}</h2>
        <p slDialogDescription>{{ description() }}</p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slField required [invalid]="submitted() && reason().trim().length === 0">
          <label slFieldLabel>{{ label() }}</label>
          <textarea
            slTextarea
            [rows]="3"
            [value]="reason()"
            (valueChange)="reason.set($event.value)"
            [placeholder]="placeholder()"
          ></textarea>
          <span slFieldDescription>{{ note() }}</span>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" type="button" (click)="open.set(false)">
          Keep it as it is
        </button>
        <button
          slButton
          type="button"
          [tone]="tone()"
          [loading]="busy()"
          [messages]="{ loading: confirmLabel() }"
          (click)="submit()"
        >
          {{ confirmLabel() }}
        </button>
      </footer>
    </sl-dialog>
  `,
})
export class ReasonDialog {
  readonly open = model(false);
  readonly title = input('');
  readonly description = input('');
  readonly label = input('Reason');
  readonly placeholder = input('');
  readonly note = input('Kept on the record and sent to the owner.');
  readonly confirmLabel = input('Confirm');
  readonly tone = input<'accent' | 'danger' | 'warning' | 'secondary'>('danger');
  readonly busy = input(false);
  readonly confirm = output<string>();

  readonly reason = signal('');
  readonly submitted = signal(false);

  submit(): void {
    this.submitted.set(true);
    const reason = this.reason().trim();
    if (reason.length === 0) return;
    this.confirm.emit(reason);
  }
}
