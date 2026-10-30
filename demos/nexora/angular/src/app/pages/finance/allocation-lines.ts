import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlButton } from '@slotted/angular/button';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableEmpty,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSummary,
} from '@slotted/angular/table';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlText } from '@slotted/angular/typography';
import type { FormErrors } from '@slotted/core/form';
import type { CurrencyCode } from '@slotted/demo-nexora-backend';

import { formatDate, formatMoney } from '../../core/catalog/catalog.model';
import { INVOICES_ROUTE } from '../../core/finance/finance.model';
import { ALLOCATIONS_KEY, allocationKey, type AllocationLine } from '../../core/finance/payment-allocation';

/**
 * The customer's open invoices in the payment's currency, each with the amount
 * the payment gives it (§66.8). A `table` at the desk, whose summary row adds
 * the amounts back up against what the payment brings (RP-07); on a phone a
 * `field-group` per invoice, named by its legend, each control with its label —
 * `table` defers a row of controls to `field-group` (`controlRowLayout`), as
 * the purchase order's lines do (CP-04).
 *
 * The amount's limits are said under its control as the reader types (FM-11);
 * the controls carry no `name` because `currency-field` reads it once, as a
 * static attribute, and a row in a loop has none to give (the ledger row
 * "number-field, form").
 */
@Component({
  selector: 'app-allocation-lines',
  imports: [
    RouterLink,
    SlButton,
    SlCurrencyField,
    SlCurrencyFieldInput,
    SlField,
    SlFieldError,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlFieldLabel,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeleton,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableEmpty,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSummary,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .line {
      padding-block: var(--slotted-space-4);
      border-block-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    /* On a finger the invoice's link is a touch target's height (--slotted-target-comfortable). */
    @media (pointer: coarse) {
      .line a {
        line-height: var(--slotted-target-comfortable);
      }
    }
    .amount {
      /* literal: the amount column holds a currency field; 11rem fits seven figures, cents and the symbol */
      inline-size: 11rem;
      margin-inline-start: auto;
    }
  `,
  template: `
    <div slStack [gap]="3">
      @if (error(allKey); as message) {
        <div slInlineMessage tone="danger" data-testid="allocation-total-error">
          <span slInlineMessageIcon></span>
          {{ message }}
        </div>
      }
      @if (phone()) {
        <div slStack [gap]="0" data-testid="allocation-lines">
          @if (pending()) {
            <div class="line" slStack [gap]="3">
              <span slSkeleton shape="text" inlineSize="60%"></span>
              <span slSkeleton shape="text" inlineSize="40%"></span>
            </div>
          } @else {
            @for (line of lines(); track line.invoiceId) {
              <div class="line">
              <fieldset slFieldGroup>
                <legend slFieldGroupLegend>
                  <span slStack [gap]="1">
                    <a slLink [routerLink]="[invoicesRoute, line.invoiceId]">{{ line.invoiceNumber }}</a>
                    <span slText size="sm" tone="muted">Owes {{ money(line.outstandingMinor) }} · due {{ date(line.dueDate) }}</span>
                  </span>
                </legend>
                <div slField [invalid]="!!error(key(line.invoiceId))">
                  <label slFieldLabel>Give {{ line.invoiceNumber }}</label>
                  <div slCurrencyField>
                    <input
                      slCurrencyFieldInput
                      [currency]="currency()"
                      [min]="0"
                      [value]="line.amount"
                      (valueChange)="lineChange.emit({ invoiceId: line.invoiceId, amount: $event.value ?? null })"
                    />
                  </div>
                  @if (error(key(line.invoiceId)); as message) {
                    <p slFieldError>{{ message }}</p>
                  }
                </div>
              </fieldset>
              </div>
            } @empty {
              <span slText size="sm" tone="muted">{{ emptyWords() }}</span>
            }
          }
        </div>
      } @else {
        <div slTable variant="framed" [columns]="4" data-testid="allocation-lines">
          <div slTableContent>
            <caption slTableCaption>{{ caption() }}</caption>
            <thead slTableHead>
              <tr slTableRow>
                <th slTableColumnHeader>Invoice</th>
                <th slTableColumnHeader>Due</th>
                <th slTableColumnHeader align="end" numeric>Owes</th>
                <th slTableColumnHeader align="end" numeric>Give it</th>
              </tr>
            </thead>
            <tbody slTableBody>
              @if (pending()) {
                <tr slTableRow>
                  <th slTableRowHeader><span slSkeleton shape="text" inlineSize="70%"></span></th>
                  <td slTableCell><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                  <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="4rem"></span></td>
                  <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="6rem"></span></td>
                </tr>
              } @else {
                @for (line of lines(); track line.invoiceId) {
                  <tr slTableRow>
                    <th slTableRowHeader>
                      <a slLink variant="neutral" underline="hover" [routerLink]="[invoicesRoute, line.invoiceId]">{{ line.invoiceNumber }}</a>
                    </th>
                    <td slTableCell>{{ date(line.dueDate) }}</td>
                    <td slTableCell align="end" numeric>{{ money(line.outstandingMinor) }}</td>
                    <td slTableCell align="end">
                      <div slField [invalid]="!!error(key(line.invoiceId))" class="amount">
                        <div slCurrencyField size="sm">
                          <input
                            slCurrencyFieldInput
                            [currency]="currency()"
                            [min]="0"
                            [attr.aria-label]="'Give ' + line.invoiceNumber"
                            [value]="line.amount"
                            (valueChange)="lineChange.emit({ invoiceId: line.invoiceId, amount: $event.value ?? null })"
                          />
                        </div>
                        @if (error(key(line.invoiceId)); as message) {
                          <p slFieldError>{{ message }}</p>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr slTableRow>
                    <td slTableEmpty>
                      <div slResultState status="empty" reach="section">
                        <div slResultStateContent>
                          <h3 slResultStateTitle>Nothing to allocate to</h3>
                          <p slResultStateDescription>{{ emptyWords() }}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
            @if (!pending() && lines().length > 0) {
              <tfoot slTableSummary>
                <tr slTableRow>
                  <th slTableRowHeader>Given, {{ lines().length }} {{ lines().length === 1 ? 'invoice' : 'invoices' }}</th>
                  <td slTableCell></td>
                  <td slTableCell align="end" numeric>{{ money(owed()) }}</td>
                  <td slTableCell align="end" numeric data-testid="allocated-total">{{ money(given()) }}</td>
                </tr>
              </tfoot>
            }
          </div>
        </div>
      }
      @if (!pending() && lines().length > 0) {
        <span slStack [gap]="2">
          <span slText size="sm" data-testid="allocation-outcome">{{ outcome() }}</span>
          <span>
            <button slButton size="sm" variant="outline" tone="secondary" type="button" data-testid="fill-oldest" (click)="fill.emit()">
              Give the oldest first
            </button>
          </span>
        </span>
      }
      @if (otherCurrency() > 0) {
        <span slText size="sm" tone="muted">{{ otherWords() }}</span>
      }
    </div>
  `,
})
export class AllocationLines {
  readonly lines = input.required<readonly AllocationLine[]>();
  readonly errors = input.required<FormErrors>();
  readonly currency = input.required<CurrencyCode>();
  /** What the payment has to give: its amount, or on a posted payment what it left unapplied. */
  readonly available = input.required<number>();
  readonly otherCurrency = input(0);
  readonly pending = input(false);
  readonly phone = input(false);
  readonly caption = input('The customer’s open invoices in this currency, oldest due first');
  readonly lineChange = output<{ invoiceId: string; amount: number | null }>();
  readonly fill = output<void>();

  readonly invoicesRoute = INVOICES_ROUTE;
  readonly allKey = ALLOCATIONS_KEY;

  readonly given = computed(() => this.lines().reduce((sum, line) => sum + Math.round((line.amount ?? 0) * 100), 0));
  readonly owed = computed(() => this.lines().reduce((sum, line) => sum + line.outstandingMinor, 0));

  /** What the payment becomes: what goes to invoices, and what stays with the customer as credit. */
  readonly outcome = computed(() => {
    const given = this.given();
    const left = this.available() - given;
    const count = this.lines().filter((line) => (line.amount ?? 0) > 0).length;
    const to = `${this.money(given)} goes to ${count} ${count === 1 ? 'invoice' : 'invoices'}`;
    if (left > 0) return `${to}; ${this.money(left)} stays unapplied as the customer’s credit, to allocate or refund later.`;
    if (left === 0) return `${to}; nothing stays unapplied.`;
    return `${to}, ${this.money(-left)} more than the payment has to give.`;
  });

  readonly emptyWords = computed(
    () => `The customer owes nothing in ${this.currency()}: the whole payment stays unapplied as their credit.`,
  );

  readonly otherWords = computed(() => {
    const n = this.otherCurrency();
    return `${n} open ${n === 1 ? 'invoice is' : 'invoices are'} written in another currency: a payment is allocated only to invoices in its own.`;
  });

  key(invoiceId: string): string {
    return allocationKey(invoiceId);
  }

  error(key: string): string | null {
    return this.errors()[key]?.[0] ?? null;
  }

  money(minor: number): string {
    return formatMoney({ currency: this.currency(), minor });
  }

  date(iso: string): string {
    return formatDate(iso);
  }
}
