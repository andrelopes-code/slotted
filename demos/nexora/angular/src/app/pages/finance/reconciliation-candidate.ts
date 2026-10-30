import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSummary,
} from '@slotted/angular/table';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';
import type { Money } from '@slotted/demo-nexora-backend';

import { formatDate, formatMoney } from '../../core/catalog/catalog.model';
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  INVOICES_ROUTE,
  PAYMENTS_ROUTE,
} from '../../core/finance/finance.model';
import { BAND_WORDS, type CandidateView } from '../../core/finance/reconciliation.store';

/**
 * One candidate a deposit could be matched to (§66.13), and why it scored
 * what it did. The score is taken apart criterion by criterion, the ones that
 * did not score drawn too, and the total names the band it falls in — a
 * confidence the reader can check rather than trust.
 *
 * The criteria are a `table` that takes the score apart and ends in the
 * summary row that adds it back up (RP-07); the block around it — the
 * document, its amount, the difference and the command — is the screen's own
 * (CP-04): `list-item`, the closest family, carries one label, one
 * description and an end, and no place for a breakdown under them.
 */
@Component({
  selector: 'app-reconciliation-candidate',
  imports: [
    RouterLink,
    SlButton,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSummary,
    SlInline,
    SlLink,
    SlStack,
    SlTag,
    SlTagBody,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    .head {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: var(--slotted-space-4);
      min-inline-size: 0;
    }
    .who {
      min-inline-size: 0;
    }
    .who > * {
      max-inline-size: 100%;
    }
    .figure {
      flex: none;
    }
    /* On a finger a document's link is a touch target's height (--slotted-target-comfortable), as on the record pages' tables. */
    @media (pointer: coarse) {
      a[slLink] {
        display: inline-block;
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    <div
      slStack
      [gap]="3"
      data-testid="candidate"
      [attr.data-payment-id]="view().kind === 'payment' ? view().documentId : null"
      [attr.data-invoice-id]="view().kind === 'invoice' ? view().documentId : null"
      [attr.data-score]="view().explanation.score"
    >
      <div class="head">
        <span slStack [gap]="1" class="who">
          <span slText size="sm" weight="medium" [truncate]="true" [title]="view().number + ' · ' + view().customerName">
            @if (canOpen()) {
              <a slLink [routerLink]="[route(), view().documentId]">{{ view().number }}</a>
            } @else {
              {{ view().number }}
            }
            · {{ view().customerName }}
          </span>
          <span slText size="sm" tone="muted">{{ documentWords() }}</span>
        </span>
        <span slText size="sm" weight="medium" numeric="tabular" class="figure">{{ money(view().amount) }}</span>
      </div>
      <span slText size="sm" [tone]="view().difference === 0 ? 'default' : 'muted'" data-testid="difference">{{ differenceWords() }}</span>

      <div slTable variant="plain" [columns]="2" layout="fixed" data-testid="score">
        <div slTableContent>
          <caption slTableCaption>What the score is made of</caption>
          <thead slTableHead>
            <tr slTableRow>
              <th slTableColumnHeader>Criterion</th>
              <th slTableColumnHeader align="end" numeric>Points</th>
            </tr>
          </thead>
          <tbody slTableBody>
            @for (line of view().explanation.lines; track line.key) {
              <tr slTableRow>
                <th slTableRowHeader>{{ line.label }}</th>
                <td slTableCell align="end" numeric>
                  <span slText size="sm" [tone]="line.earned > 0 ? 'default' : 'muted'">
                    {{ line.earned > 0 ? '+' + line.earned : '0 of ' + line.points }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
          <tfoot slTableSummary>
            <tr slTableRow>
              <th slTableRowHeader>{{ view().explanation.capped ? 'Score, capped at 100' : 'Score' }}</th>
              <td slTableCell align="end" numeric data-testid="score-total">{{ view().explanation.score }}</td>
            </tr>
          </tfoot>
        </div>
      </div>
      <span slInline [gap]="2" wrap="wrap">
        <span slTag size="sm" [tone]="tone()"><span slTagBody>{{ word() }}</span></span>
        <span slText size="sm" tone="muted" data-testid="band">{{ bandWords() }}</span>
      </span>

      @if (open() && canManage()) {
        @if (view().confirmable) {
          <span slInline [gap]="3" wrap="wrap">
            @if (view().kind === 'payment') {
              <button
                slButton
                size="sm"
                type="button"
                data-testid="confirm-match"
                [loading]="busy()"
                [messages]="{ loading: 'Matching' }"
                [disabled]="locked()"
                (click)="confirm.emit(view())"
              >
                Confirm match
              </button>
            } @else {
              <button
                slButton
                size="sm"
                variant="outline"
                tone="secondary"
                type="button"
                data-testid="confirm-invoice"
                [disabled]="locked()"
                (click)="confirm.emit(view())"
              >
                Create payment and allocate
              </button>
            }
          </span>
        } @else {
          <span slText size="sm" tone="muted" data-testid="not-confirmable">{{ refusalWords() }}</span>
        }
      }
    </div>
  `,
})
export class ReconciliationCandidate {
  readonly view = input.required<CandidateView>();
  /** The deposit's currency and amount, which the difference is said in. */
  readonly deposit = input.required<Money>();
  readonly open = input(true);
  readonly canManage = input(false);
  readonly canOpen = input(false);
  /** This candidate's command is on its way. */
  readonly busy = input(false);
  /** Another command of the workspace is on its way. */
  readonly locked = input(false);
  readonly confirm = output<CandidateView>();

  readonly route = computed(() => (this.view().kind === 'payment' ? PAYMENTS_ROUTE : INVOICES_ROUTE));
  readonly word = computed(() => CONFIDENCE_LABEL[this.view().explanation.confidence]);
  readonly tone = computed(() => CONFIDENCE_TONE[this.view().explanation.confidence]);

  readonly documentWords = computed(() => {
    const view = this.view();
    const reference = view.reference ? ` · ref ${view.reference}` : '';
    return view.kind === 'payment'
      ? `Payment received ${formatDate(`${view.date}T12:00:00Z`)}${reference}`
      : `Invoice due ${formatDate(`${view.date}T12:00:00Z`)}, still owing`;
  });

  readonly differenceWords = computed(() => {
    const view = this.view();
    const against = view.kind === 'payment' ? 'the payment' : 'the invoice owes';
    if (view.difference === 0) return view.kind === 'payment' ? 'Same amount as the deposit.' : 'The deposit pays the invoice to the cent.';
    const gap = formatMoney({ currency: this.deposit().currency, minor: Math.abs(view.difference) });
    return `The deposit is ${gap} ${view.difference > 0 ? 'more' : 'less'} than ${against}.`;
  });

  readonly bandWords = computed(() => {
    const explanation = this.view().explanation;
    const capped = explanation.capped ? ` The criteria add up to ${explanation.sum}; the score stops at 100.` : '';
    return `${BAND_WORDS}.${capped}`;
  });

  readonly refusalWords = computed(() => {
    const view = this.view();
    if (view.kind === 'payment' && view.difference !== 0)
      return 'A payment is linked to a deposit only at the exact amount. Choose one of the invoices to record the deposit as a payment instead.';
    return 'This document can no longer take the deposit.';
  });

  money(value: Money): string {
    return formatMoney(value);
  }
}
