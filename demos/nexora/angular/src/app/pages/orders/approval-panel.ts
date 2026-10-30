import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import {
  SlTimeline,
  SlTimelineActions,
  SlTimelineItem,
  SlTimelineList,
} from '@slotted/angular/timeline';
import type { ApprovalRequest } from '@slotted/demo-nexora-backend';

import { SessionStore } from '../../core/session/session.store';
import { formatDate, formatMoney } from './order-labels';

/**
 * Why a record is waiting, who decides it and what they decided (§67).
 *
 * The chain of steps is a `timeline`: the family owns the rail, the marker and
 * the connector that ties one step to the next, and its rail is the part that
 * is stretched to the height of the event — a thread drawn by hand beside it
 * breaks the moment a step carries a comment (CP-01). What the family does not
 * carry is what a step is waiting on and the three decisions, which stand in
 * its `actions` part. The request is taken as the backend stores it, so the
 * order page and the approvals queue show the same thing from two answers.
 *
 * The marker is left to the family: `current` already draws the step the
 * reader is on as a target, and `variant="solid"` asks for a halo two rules
 * wide that crowds the title beside it. A timeline is a quiet column.
 */
@Component({
  selector: 'app-approval-panel',
  imports: [
    SlBadge,
    SlButton,
    SlInline,
    SlStack,
    SlText,
    SlTimeline,
    SlTimelineActions,
    SlTimelineItem,
    SlTimelineList,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .reasons {
      display: grid;
      gap: var(--slotted-space-1);
      margin: 0;
      padding-inline-start: var(--slotted-space-5);
    }
  `,
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <span slInline [gap]="3">
          <span slText weight="medium">{{ heading() }}</span>
          <span slBadge variant="soft" size="sm" [tone]="statusTone()">{{ statusWord() }}</span>
          @if (amountShown() && approval().amount; as amount) {
            <span slText size="sm" tone="muted">{{ money(amount) }}</span>
          }
        </span>
        @if (reasons().length > 0) {
          <ul class="reasons">
            @for (reason of reasons(); track reason) {
              <li>
                <span slText size="sm">{{ sentence(reason) }}</span>
              </li>
            }
          </ul>
        }
      </div>

      <div slTimeline size="sm" [label]="'Approval steps for ' + (subject() ?? 'this record')">
        <ol slTimelineList>
          @for (step of steps(); track step.id) {
            <li
              slTimelineItem
              [title]="step.role"
              [description]="step.said"
              [tone]="step.tone"
              [complete]="step.complete"
              [current]="step.current"
            >
              @if (step.comment) {
                <span slText size="sm">“{{ step.comment }}”</span>
              }
              <div slTimelineActions>
                <span slInline [gap]="3">
                  @if (step.current && canDecide()) {
                    <button
                      slButton
                      size="sm"
                      type="button"
                      [loading]="busy()"
                      [messages]="{ loading: 'Approving' }"
                      (click)="decide.emit('approve')"
                    >
                      Approve
                    </button>
                    <button
                      slButton
                      size="sm"
                      variant="outline"
                      tone="secondary"
                      type="button"
                      [disabled]="busy()"
                      (click)="decide.emit('changes')"
                    >
                      Ask for changes
                    </button>
                    <button
                      slButton
                      size="sm"
                      variant="outline"
                      tone="danger"
                      type="button"
                      [disabled]="busy()"
                      (click)="decide.emit('reject')"
                    >
                      Reject
                    </button>
                  }
                </span>
              </div>
            </li>
          }
        </ol>
      </div>

      @if (!canDecide() && approval().status === 'pending') {
        <span slText size="sm" tone="muted">{{ waitingOn() }}</span>
      }
    </div>
  `,
})
export class ApprovalPanel {
  readonly approval = input.required<ApprovalRequest>();
  readonly busy = input(false);
  /** What the request is about, when the screen is not already the record. */
  readonly subject = input<string | null>(null);
  readonly decide = output<'approve' | 'reject' | 'changes'>();
  /**
   * Whether the request's amount is drawn. A cycle count's amount is its
   * variance at standard cost, which a reader without `cost.view` is not
   * shown (PM-01); the request carries it to anyone who can read it.
   */
  readonly amountShown = input(true);
  /** The reasons in the screen's words, where the policy's own sentence carries a withheld value. */
  readonly reasonsOverride = input<readonly string[] | null>(null);

  readonly reasons = computed(() => this.reasonsOverride() ?? this.approval().reasons);

  private readonly session = inject(SessionStore);

  readonly heading = computed(() => {
    const subject = this.subject();
    return subject === null ? 'Why this needs an approval' : `${subject} needs an approval`;
  });

  readonly current = computed(() => {
    const pending = this.approval()
      .steps.filter((step) => step.status === 'pending')
      .sort((a, b) => a.sequence - b.sequence);
    return pending[0] ?? null;
  });

  /**
   * The backend decides for itself; the screen predicts the same answer so it
   * does not offer a control that would be refused: the step is assigned to
   * this user, or it names a role this user holds.
   */
  readonly canDecide = computed(() => {
    const step = this.current();
    const session = this.session.session();
    if (step === null || session === null || this.approval().status !== 'pending') return false;
    // §67: whoever asked for the approval never decides it.
    if (this.approval().requestedBy === session.user.id) return false;
    if (step.assignedUserId !== undefined) return step.assignedUserId === session.user.id;
    return session.roles.some((role) => key(role.name) === key(step.requiredRole));
  });

  readonly mine = computed(() => this.approval().requestedBy === this.session.user()?.id);

  readonly steps = computed(() => {
    const currentId = this.current()?.id;
    return [...this.approval().steps]
      .sort((a, b) => a.sequence - b.sequence)
      .map((step) => {
        const mine =
          step.assignedUserId !== undefined && step.assignedUserId === this.session.user()?.id;
        const word =
          step.status === 'approved'
            ? 'Approved'
            : step.status === 'rejected'
              ? 'Rejected'
              : step.status === 'skipped'
                ? 'Skipped'
                : 'Waiting';
        const tone =
          step.status === 'approved'
            ? ('success' as const)
            : step.status === 'rejected'
              ? ('danger' as const)
              : step.status === 'skipped'
                ? ('secondary' as const)
                : ('accent' as const);
        return {
          id: step.id,
          role: words(step.requiredRole),
          word,
          tone,
          complete: step.status === 'approved',
          current: step.id === currentId,
          said:
            step.status === 'pending'
              ? mine || (step.assignedUserId === undefined && this.canDecide())
                ? 'Yours to decide'
                : 'Waiting on this role'
              : step.decidedAt
                ? `${word} on ${formatDate(step.decidedAt)}`
                : word,
          ...(step.comment ? { comment: step.comment } : {}),
        };
      });
  });

  readonly statusWord = computed(() => {
    const status = this.approval().status;
    return status === 'pending'
      ? 'Waiting'
      : status === 'approved'
        ? 'Approved'
        : status === 'rejected'
          ? 'Rejected'
          : status === 'changes_requested'
            ? 'Changes asked'
            : 'Cancelled';
  });

  readonly statusTone = computed<'accent' | 'success' | 'danger' | 'warning' | 'secondary'>(() => {
    const status = this.approval().status;
    return status === 'approved'
      ? 'success'
      : status === 'rejected'
        ? 'danger'
        : status === 'changes_requested'
          ? 'warning'
          : status === 'cancelled'
            ? 'secondary'
            : 'accent';
  });

  readonly waitingOn = computed(() => {
    const step = this.current();
    if (step === null) return 'Waiting on an approver.';
    if (this.mine())
      return `You asked for this approval, so ${words(step.requiredRole)} decides it.`;
    return `Waiting on ${words(step.requiredRole)}; this one is not yours to decide.`;
  });

  money(amount: { currency: 'USD' | 'EUR' | 'GBP' | 'BRL'; minor: number }): string {
    return formatMoney(amount);
  }

  /** A policy reason as a sentence, which is how the backend writes them but for the first letter. */
  sentence(reason: string): string {
    return reason.charAt(0).toUpperCase() + reason.slice(1);
  }
}

/** A role key as the words an operator uses for it. */
function words(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const key = (value: string): string => value.toLowerCase().replace(/[^a-z]/g, '');
