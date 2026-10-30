import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SlIconButton } from '@slotted/angular/button';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlNumberField, SlNumberFieldEnd, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableSummary,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';
import type { FormErrors } from '@slotted/core/form';
import type { ChangeRequest } from '@slotted/core/state';
import type { CurrencyCode } from '@slotted/demo-nexora-backend';

import { formatMoney, formatQuantity } from '../../core/catalog/catalog.model';
import {
  lineKey,
  lineTotalMinor,
  subtotalMinor,
  varianceBps,
  type PoDraftLine,
  type SupplierMapping,
} from '../../core/procurement/po-draft';
import { formatDays, percentFromBps } from '../../core/procurement/procurement.model';

/**
 * The lines of a purchase order being written, shared by the create form and
 * the edit in place. Each line is typed in its SKU's own unit and priced in
 * the order's currency; the supplier's terms and the last accepted cost stand
 * under the line they are about, so a variance that will ask for an approval
 * is read at the line that causes it (FM-11).
 *
 * At the desk the lines are a `table` with the subtotal as its summary row
 * (RP-07). On a phone a row of four controls does not fit, so each line is a
 * `field-group` named by its SKU, each control with its label: `table` defers a
 * row of controls to `field-group` (`controlRowLayout`, CP-04).
 */
@Component({
  selector: 'app-po-lines',
  imports: [
    NgIcon,
    NgTemplateOutlet,
    SlCombobox,
    SlComboboxItem,
    SlCurrencyField,
    SlCurrencyFieldInput,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlFieldLabel,
    SlGrid,
    SlIconButton,
    SlInline,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlStack,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableSummary,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .line {
      position: relative;
      padding-block: var(--slotted-space-3);
      border-block-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    /*
     * The line's rule and its remove button sit on a wrapper: a fieldset draws its own border
     * through the legend, and its padding box starts under the legend.
     */
    .line-name {
      max-inline-size: 100%;
      padding-inline-end: calc(var(--slotted-target-comfortable) + var(--slotted-space-3));
    }
    .line-remove {
      position: absolute;
      inset-block-start: var(--slotted-space-3);
      inset-inline-end: 0;
    }
    .subtotal {
      padding-block: var(--slotted-space-3);
      border-block-start: var(--slotted-border-width-thin) solid var(--slotted-border-subtle);
    }
    /*
     * The row aligns its cells to the start (LA-05): a field with a line of help under it and
     * one without keep their controls on the same line. A value read beside them is centerd on
     * the controls' height, the line the eye follows across the row.
     */
    .control-line {
      display: inline-flex;
      align-items: center;
      min-block-size: var(--slotted-control-height-sm);
    }
  `,
  template: `
    <div slStack [gap]="5">
      <div slField [invalid]="!!error('lines')">
        <label slFieldLabel>Add a SKU</label>
        <sl-combobox
          data-testid="line-search"
          [placeholder]="
            disabled() ? 'Choose the supplier first' : 'Search the supplier’s SKUs by code or name'
          "
          [disabled]="disabled()"
          [filter]="null"
          [loading]="reading()"
          [inputValue]="query()"
          (inputValueChangeRequest)="typed($event)"
          [value]="null"
          (valueChangeRequest)="choose($event.value)"
        >
          @for (option of options(); track option.skuId) {
            <sl-combobox-item [value]="option.skuId" [label]="optionLabel(option)" />
          }
        </sl-combobox>
        @if (error('lines'); as message) {
          <p slFieldError>{{ message }}</p>
        } @else {
          <span slFieldDescription>{{ searchWords() }}</span>
        }
      </div>

      @if (lines().length > 0) {
        @if (phone()) {
          <div slStack [gap]="0" data-testid="po-lines">
            @for (line of lines(); track line.skuId) {
              <div class="line">
              <fieldset slFieldGroup size="sm">
                <legend slFieldGroupLegend class="line-name">
                  <span
                    class="cell-text"
                    slText
                    size="sm"
                    weight="medium"
                    [title]="line.skuName"
                    >{{ line.skuCode }}</span
                  >
                  <span class="cell-text" slText size="sm" tone="muted" [title]="line.skuName">{{
                    line.skuName
                  }}</span>
                </legend>
                <button
                  slIconButton
                  class="line-remove"
                  variant="ghost"
                  tone="secondary"
                  type="button"
                  [attr.aria-label]="'Remove ' + line.skuCode"
                  (click)="remove.emit(line.skuId)"
                >
                  <ng-icon name="lucideX" />
                </button>
                <div slGrid [columns]="showCost() ? 2 : 1" [gap]="3">
                  <ng-container *ngTemplateOutlet="quantityField; context: { $implicit: line }" />
                  @if (showCost()) {
                    <ng-container *ngTemplateOutlet="costField; context: { $implicit: line }" />
                  }
                </div>
                @if (showCost()) {
                  <span slInline [gap]="2" justify="between">
                    <span slText size="sm" tone="muted">Line total</span>
                    <span slText size="sm" weight="medium">{{ total(line) }}</span>
                  </span>
                }
              </fieldset>
              </div>
            }
            @if (showCost()) {
              <div class="subtotal">
                <span slInline [gap]="2" justify="between">
                  <span slText size="sm" weight="medium"
                    >Subtotal, {{ lines().length }}
                    {{ lines().length === 1 ? 'line' : 'lines' }}</span
                  >
                  <span slText size="sm" weight="medium" data-testid="subtotal">{{
                    subtotal()
                  }}</span>
                </span>
              </div>
            }
          </div>
        } @else {
          <div
            slTable
            variant="framed"
            cellAlign="start"
            [columns]="showCost() ? 5 : 3"
            data-testid="po-lines"
          >
            <div slTableContent>
              <caption slTableCaption>
                {{
                  caption()
                }}
              </caption>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>SKU</th>
                  <th slTableColumnHeader>Quantity</th>
                  @if (showCost()) {
                    <th slTableColumnHeader>Unit cost ({{ currency() }})</th>
                    <th slTableColumnHeader align="end" numeric>Line total</th>
                  }
                  <th slTableColumnHeader>Remove</th>
                </tr>
              </thead>
              <tbody slTableBody>
                @for (line of lines(); track line.skuId) {
                  <tr slTableRow>
                    <th slTableRowHeader>
                      <span slStack [gap]="1">
                        <span
                          class="cell-text"
                          slText
                          size="sm"
                          weight="medium"
                          [title]="line.skuName"
                          >{{ line.skuCode }}</span
                        >
                        <span
                          class="cell-text"
                          slText
                          size="sm"
                          tone="muted"
                          [title]="line.skuName"
                          >{{ line.skuName }}</span
                        >
                      </span>
                    </th>
                    <td slTableCell>
                      <ng-container
                        *ngTemplateOutlet="quantityField; context: { $implicit: line }"
                      />
                    </td>
                    @if (showCost()) {
                      <td slTableCell>
                        <ng-container *ngTemplateOutlet="costField; context: { $implicit: line }" />
                      </td>
                      <td slTableCell align="end" numeric>
                        <span class="control-line">{{ total(line) }}</span>
                      </td>
                    }
                    <td slTableCell>
                      <button
                        slIconButton
                        variant="ghost"
                        tone="secondary"
                        size="sm"
                        type="button"
                        [attr.aria-label]="'Remove ' + line.skuCode"
                        (click)="remove.emit(line.skuId)"
                      >
                        <ng-icon name="lucideX" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
              @if (showCost()) {
                <tfoot slTableSummary>
                  <tr slTableRow>
                    <th slTableRowHeader>
                      Subtotal, {{ lines().length }} {{ lines().length === 1 ? 'line' : 'lines' }}
                    </th>
                    <td slTableCell></td>
                    <td slTableCell></td>
                    <td slTableCell align="end" numeric data-testid="subtotal">{{ subtotal() }}</td>
                    <td slTableCell></td>
                  </tr>
                </tfoot>
              }
            </div>
          </div>
        }
      }
    </div>

    <ng-template #quantityField let-line>
      <div slField [invalid]="!!error(key(line, 'quantity'))">
        @if (phone()) {
          <label slFieldLabel>Quantity</label>
        }
        <div slNumberField size="sm">
          <input
            slNumberFieldInput
            [min]="0"
            [format]="{ maximumFractionDigits: line.precision }"
            [attr.aria-label]="'Quantity of ' + line.skuCode"
            [value]="line.quantity"
            (valueChange)="quantityChange.emit({ skuId: line.skuId, value: $event.value ?? null })"
          />
          <span slNumberFieldEnd>{{ line.unit }}</span>
        </div>
        @if (error(key(line, 'quantity')); as message) {
          <p slFieldError>{{ message }}</p>
        } @else if (termsWords(line); as words) {
          <span slFieldDescription>{{ words }}</span>
        }
      </div>
    </ng-template>

    <ng-template #costField let-line>
      <div slField [invalid]="!!error(key(line, 'unitCost'))">
        @if (phone()) {
          <label slFieldLabel>Unit cost ({{ currency() }})</label>
        }
        <div slCurrencyField size="sm">
          <input
            slCurrencyFieldInput
            [currency]="currency()"
            [min]="0"
            [attr.aria-label]="'Unit cost of ' + line.skuCode"
            [value]="line.unitCost"
            (valueChange)="unitCostChange.emit({ skuId: line.skuId, value: $event.value ?? null })"
          />
        </div>
        @if (error(key(line, 'unitCost')); as message) {
          <p slFieldError>{{ message }}</p>
        } @else if (costWords(line); as words) {
          <span slFieldDescription [attr.data-testid]="'variance-' + line.skuCode">{{
            words
          }}</span>
        }
      </div>
    </ng-template>
  `,
})
export class PoLines {
  readonly lines = input.required<readonly PoDraftLine[]>();
  readonly currency = input.required<CurrencyCode>();
  readonly errors = input<FormErrors>({});
  readonly phone = input(false);
  /** False for a reader without `cost.view`: the prices are not drawn (PM-01). */
  readonly showCost = input(true);
  readonly options = input<readonly SupplierMapping[]>([]);
  readonly query = input('');
  readonly reading = input(false);
  readonly disabled = input(false);
  readonly caption = input('Lines on this order');

  readonly queryChange = output<string>();
  readonly add = output<string>();
  readonly quantityChange = output<{ skuId: string; value: number | null }>();
  readonly unitCostChange = output<{ skuId: string; value: number | null }>();
  readonly remove = output<string>();

  error(name: string): string | null {
    return this.errors()[name]?.[0] ?? null;
  }

  key(line: PoDraftLine, field: 'quantity' | 'unitCost'): string {
    return lineKey(line.skuId, field);
  }

  /**
   * The picker adds a line and stays empty for the next: the label the family
   * writes into the field on a choice (reason `select`) is refused, and every
   * other text is the reader's search.
   */
  typed(request: ChangeRequest<string>): void {
    if (request.reason === 'select') {
      request.cancel();
      this.queryChange.emit('');
      return;
    }
    this.queryChange.emit(request.value);
  }

  choose(value: unknown): void {
    if (typeof value === 'string') this.add.emit(value);
  }

  optionLabel(option: SupplierMapping): string {
    const cost = this.showCost() ? ` · ${formatMoney(option.unitCost)}` : '';
    return `${option.skuCode} — ${option.skuName}${cost} · ${formatDays(option.leadTimeDays)}`;
  }

  searchWords(): string {
    if (this.disabled()) return 'A line is a SKU the supplier maps: choose the supplier first.';
    if (this.reading()) return 'Reading the supplier’s SKUs and the costs last accepted from it.';
    return 'The supplier’s own SKUs, with its price and lead time. Two letters narrow the list.';
  }

  termsWords(line: PoDraftLine): string | null {
    const parts: string[] = [];
    if (line.minimumOrderQuantity !== null && Number(line.minimumOrderQuantity) > 1)
      parts.push(`minimum ${formatQuantity(line.minimumOrderQuantity)} ${line.unit}`);
    if (line.packMultiple !== null && Number(line.packMultiple) > 1)
      parts.push(`in packs of ${formatQuantity(line.packMultiple)}`);
    if (line.leadTimeDays !== null) parts.push(`${formatDays(line.leadTimeDays)} lead time`);
    if (parts.length === 0) return null;
    const words = parts.join(', ');
    return `${words.charAt(0).toUpperCase()}${words.slice(1)}.`;
  }

  /** The variance the approval policy measures, at the line that carries it. */
  costWords(line: PoDraftLine): string | null {
    if (line.lastAcceptedMinor === null)
      return line.unitCost === null
        ? 'The supplier’s price is set when the order is written.'
        : null;
    const last = formatMoney({ currency: this.currency(), minor: line.lastAcceptedMinor });
    const variance = varianceBps(line);
    if (variance === null) return `Last accepted at ${last}.`;
    if (variance > 3_000)
      return `${percentFromBps(variance)} above the ${last} last accepted: a Procurement Manager and a Finance Manager approve it.`;
    if (variance > 1_500)
      return `${percentFromBps(variance)} above the ${last} last accepted: a Procurement Manager approves it.`;
    return `Last accepted at ${last}.`;
  }

  total(line: PoDraftLine): string {
    return formatMoney({ currency: this.currency(), minor: lineTotalMinor(line) });
  }

  subtotal(): string {
    return formatMoney({ currency: this.currency(), minor: subtotalMinor(this.lines()) });
  }
}
