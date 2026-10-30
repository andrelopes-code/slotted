import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
} from '@slotted/angular/dialog';

/**
 * A destructive command confirmed before it is sent, and waiting on its answer
 * in the confirming control (AF-03). `alert-dialog` closes on its action
 * before the handler runs, so a confirmation that has to stay open while the
 * command answers is a `dialog` whose footer carries the two outcomes.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [
    SlButton,
    SlDialog,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
  ],
  /* Only an overlay lives here: the host takes no box, as sl-dialog's own does not, so it adds
     no row or gap to its parent's layout. */
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sl-dialog size="sm" [(open)]="open">
      <header slDialogHeader>
        <h2 slDialogTitle>{{ title() }}</h2>
        <p slDialogDescription>{{ description() }}</p>
        <button slDialogClose></button>
      </header>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" type="button" (click)="open.set(false)">
          {{ keepLabel() }}
        </button>
        <button
          slButton
          type="button"
          data-testid="confirm"
          [tone]="tone()"
          [loading]="busy()"
          [messages]="{ loading: confirmLabel() }"
          (click)="confirm.emit()"
        >
          {{ confirmLabel() }}
        </button>
      </footer>
    </sl-dialog>
  `,
})
export class ConfirmDialog {
  readonly open = model(false);
  readonly title = input('');
  readonly description = input('');
  readonly confirmLabel = input('Confirm');
  readonly keepLabel = input('Keep it');
  readonly tone = input<'danger' | 'warning' | 'accent'>('danger');
  readonly busy = input(false);
  readonly confirm = output<void>();
}
