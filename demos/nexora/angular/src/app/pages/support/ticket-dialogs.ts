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
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';

import { RESOLUTION_LABEL, type SupportAgent } from '../../core/support/support.model';

/**
 * Resolve (§68.5): a resolution code is required, and a public reply written
 * in the composer is sent with it. The dialog says which of the two happens
 * before the confirm, so a reply is never sent unseen.
 */
@Component({
  selector: 'app-resolve-dialog',
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
    SlFieldError,
    SlFieldLabel,
    SlSelect,
    SlSelectItem,
  ],
  /* Only an overlay lives here: the host takes no box, as sl-dialog's own does not, so it adds
     no row or gap to its parent's layout. */
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sl-dialog size="sm" [(open)]="open" [loading]="busy()" (closed)="reset()">
      <header slDialogHeader>
        <h2 slDialogTitle>Resolve the ticket</h2>
        <p slDialogDescription>{{ description() }}</p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slField required [invalid]="submitted() && code() === null">
          <label slFieldLabel>Resolution</label>
          <sl-select
            placeholder="Choose what resolved it"
            data-testid="resolution-code"
            [value]="code()"
            (valueChangeRequest)="code.set($any($event.value))"
          >
            @for (entry of codes; track entry.value) {
              <sl-select-item [value]="entry.value">{{ entry.label }}</sl-select-item>
            }
          </sl-select>
          <span slFieldDescription
            >The resolution clock stops. A resolved ticket closes 72 hours later, and a message
            from the customer within seven days opens it again.</span
          >
          <span slFieldError>Choose a resolution.</span>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" type="button" (click)="open.set(false)">
          Keep it open
        </button>
        <button
          slButton
          type="button"
          tone="accent"
          data-testid="confirm-resolve"
          [loading]="busy()"
          [messages]="{ loading: 'Resolving' }"
          (click)="submit()"
        >
          {{ reply() ? 'Send and resolve' : 'Resolve' }}
        </button>
      </footer>
    </sl-dialog>
  `,
})
export class ResolveDialog {
  readonly open = model(false);
  readonly busy = input(false);
  /** The public reply the composer holds, sent with the resolution when there is one. */
  readonly reply = input('');
  readonly confirm = output<string>();

  readonly code = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly codes = Object.entries(RESOLUTION_LABEL).map(([value, label]) => ({ value, label }));

  description(): string {
    return this.reply().trim()
      ? 'The reply in the composer is sent to the customer with the resolution.'
      : 'No reply is sent: the composer is empty. Write one first to tell the customer.';
  }

  submit(): void {
    this.submitted.set(true);
    const code = this.code();
    if (code !== null) this.confirm.emit(code);
  }

  reset(): void {
    this.code.set(null);
    this.submitted.set(false);
  }
}

/** What an escalation sends: the reason, and the manager it goes to, if the reader names one. */
export interface EscalationRequest {
  readonly reason: string;
  readonly assigneeId?: string;
}

/**
 * Escalate (§68.5): a reason, and a manager or the team's default. The
 * ticket moves to the manager named, who is told; the reason is kept on the
 * ticket and written into its conversation as an internal line.
 */
@Component({
  selector: 'app-escalate-dialog',
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
    SlFieldError,
    SlFieldLabel,
    SlSelect,
    SlSelectItem,
    SlStack,
    SlTextarea,
  ],
  /* Only an overlay lives here: the host takes no box, as sl-dialog's own does not, so it adds
     no row or gap to its parent's layout. */
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sl-dialog size="sm" [(open)]="open" [loading]="busy()" (closed)="reset()">
      <header slDialogHeader>
        <h2 slDialogTitle>Escalate the ticket</h2>
        <p slDialogDescription>
          It moves to a support manager, who is notified. The customer is not told: the reason is
          an internal line of the conversation.
        </p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slStack [gap]="4">
          <div slField required [invalid]="submitted() && reason().trim().length === 0">
            <label slFieldLabel>Why it is escalated</label>
            <textarea
              slTextarea
              data-testid="escalation-reason"
              [rows]="3"
              [value]="reason()"
              (valueChange)="reason.set($event.value)"
              placeholder="Carrier lost the pallet; the customer's line is down."
            ></textarea>
            <span slFieldError>Say why it is escalated.</span>
          </div>
          <div slField>
            <label slFieldLabel>Escalate to</label>
            <sl-select
              placeholder="The support team's lead"
              [value]="target()"
              (valueChangeRequest)="target.set($any($event.value))"
            >
              @for (manager of managers(); track manager.id) {
                <sl-select-item [value]="manager.id"
                  >{{ manager.displayName }} · {{ manager.openTicketCount }} open</sl-select-item
                >
              }
            </sl-select>
            <span slFieldDescription
              >Left empty, it goes to the support team's lead, who is offered in the persona
              switcher.</span
            >
          </div>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" type="button" (click)="open.set(false)">
          Keep it as it is
        </button>
        <button
          slButton
          type="button"
          tone="warning"
          data-testid="confirm-escalate"
          [loading]="busy()"
          [messages]="{ loading: 'Escalating' }"
          (click)="submit()"
        >
          Escalate
        </button>
      </footer>
    </sl-dialog>
  `,
})
export class EscalateDialog {
  readonly open = model(false);
  readonly busy = input(false);
  readonly agents = input<readonly SupportAgent[] | null>(null);
  readonly confirm = output<EscalationRequest>();

  readonly reason = signal('');
  readonly target = signal<string | null>(null);
  readonly submitted = signal(false);

  managers(): readonly SupportAgent[] {
    return (this.agents() ?? []).filter((agent) => agent.role === 'support_manager');
  }

  submit(): void {
    this.submitted.set(true);
    const reason = this.reason().trim();
    if (reason.length === 0) return;
    const target = this.target();
    this.confirm.emit({ reason, ...(target ? { assigneeId: target } : {}) });
  }

  reset(): void {
    this.reason.set('');
    this.target.set(null);
    this.submitted.set(false);
  }
}
