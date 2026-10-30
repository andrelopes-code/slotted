import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
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

/** The reason a hold carries (section 56.2); one reason for every customer selected. */
@Component({
  selector: 'app-hold-dialog',
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sl-dialog size="sm" [(open)]="open" [loading]="busy()" (closed)="reason.set('')">
      <header slDialogHeader>
        <h2 slDialogTitle>{{ title() }}</h2>
        <p slDialogDescription>
          New orders cannot be confirmed while an account is on hold. Only active and prospect
          accounts can be held.
        </p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slField required [invalid]="submitted() && reason().trim().length === 0">
          <label slFieldLabel>Reason</label>
          <textarea
            slTextarea
            [rows]="3"
            [value]="reason()"
            (valueChange)="reason.set($event.value)"
            placeholder="Overdue invoices past 60 days"
          ></textarea>
          <span slFieldDescription>Written on the account and sent to its owner.</span>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" type="button" (click)="open.set(false)">
          Cancel
        </button>
        <button
          slButton
          type="button"
          [loading]="busy()"
          [messages]="{ loading: 'Placing on hold' }"
          (click)="submit()"
        >
          Place on hold
        </button>
      </footer>
    </sl-dialog>
  `,
})
export class HoldDialog {
  readonly open = model(false);
  readonly count = input(0);
  readonly busy = input(false);
  readonly confirm = output<string>();

  readonly reason = signal('');
  readonly submitted = signal(false);
  readonly title = computed(() =>
    this.count() === 1 ? 'Place 1 customer on hold' : `Place ${this.count()} customers on hold`,
  );

  submit(): void {
    this.submitted.set(true);
    const reason = this.reason().trim();
    if (reason.length === 0) return;
    this.confirm.emit(reason);
  }
}
