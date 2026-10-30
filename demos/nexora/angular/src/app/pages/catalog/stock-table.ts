import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import { SlResultState, SlResultStateContent, SlResultStateDescription, SlResultStateTitle } from '@slotted/angular/result-state';
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
import { SlText } from '@slotted/angular/typography';

import { formatQuantity } from '../../core/catalog/catalog.model';
import type { StockRow } from '../../core/catalog/sku.store';

/**
 * One quantity taken apart by place.
 *
 * This is not a table of related records: every row is a piece of the same
 * four numbers the figures above state, so the table ends in the summary row
 * that adds them back up (RP-07). A reader who cannot add five rows in their
 * head and compare the total to the card has been given two numbers and no
 * way to reconcile them.
 */
@Component({
  selector: 'app-stock-table',
  imports: [
    RouterLink,
    SlBadge,
    SlInline,
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
    .short {
      color: var(--slotted-tone-danger-text);
    }
    /*
     * A value the page draws inside a cell states its own maximum. The
     * families that draw a name — link, text — size their box to their
     * content, and a value that never wraps makes that content one unbreakable
     * run, so the box never narrows with its column and the value is drawn
     * over the next one. The grid bounds the cell's direct child and reaches
     * no further (LP-04).
     */
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* On a finger a record's link in a table row is a touch target's height (--slotted-target-comfortable); the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    <div
      slTable
      variant="framed"
      [columns]="phone() ? 3 : 6"
      [layout]="phone() ? 'fixed' : 'auto'"
    >
      <div slTableContent>
        <caption slTableCaption>
          {{ caption() }}
        </caption>
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Warehouse</th>
            <th slTableColumnHeader align="end" numeric>Available</th>
            @if (!phone()) {
              <th slTableColumnHeader align="end" numeric>On hand</th>
              <th slTableColumnHeader align="end" numeric>Reserved</th>
            }
            <th slTableColumnHeader align="end" numeric>Inbound</th>
            @if (!phone()) {
              <th slTableColumnHeader align="end" numeric>Reorder point</th>
            }
          </tr>
        </thead>
        @if (pending()) {
          <tbody slTableBody>
            @for (row of placeholderRows; track row) {
              <tr slTableRow>
                <th slTableRowHeader>
                  <span slStack [gap]="1">
                    <span slSkeleton shape="text" inlineSize="70%"></span>
                    <span slSkeleton shape="text" inlineSize="40%"></span>
                  </span>
                </th>
                <td slTableCell align="end">
                  <span slSkeleton shape="text" inlineSize="2.5rem"></span>
                </td>
                @if (!phone()) {
                  <td slTableCell align="end">
                    <span slSkeleton shape="text" inlineSize="2.5rem"></span>
                  </td>
                  <td slTableCell align="end">
                    <span slSkeleton shape="text" inlineSize="2rem"></span>
                  </td>
                }
                <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="2rem"></span></td>
                @if (!phone()) {
                  <td slTableCell align="end">
                    <span slSkeleton shape="text" inlineSize="2rem"></span>
                  </td>
                }
              </tr>
            }
          </tbody>
        } @else if (rows().length === 0) {
          <tbody slTableBody>
            <tr slTableRow>
              <td slTableEmpty>
                <div slResultState status="empty" reach="section">
                  <div slResultStateContent>
                    <h3 slResultStateTitle>This SKU is in no warehouse</h3>
                    <p slResultStateDescription>
                      No warehouse holds a position for it, so nothing can be reserved or shipped.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        } @else {
          <tbody slTableBody>
            @for (row of rows(); track row.warehouseId) {
              <tr slTableRow>
                <th slTableRowHeader>
                  <span slStack [gap]="1">
                    @if (link(); as to) {
                      <a
                        slLink
                        class="cell-text"
                        variant="neutral"
                        underline="hover"
                        [routerLink]="to(row).path"
                        [queryParams]="to(row).queryParams"
                        [attr.aria-current]="row.warehouseId === chosen() ? 'true' : null"
                        [title]="title(row)"
                      >
                        {{ row.warehouseCode }}
                      </a>
                    } @else {
                      <span class="cell-text" [title]="title(row)">{{ row.warehouseCode }}</span>
                    }
                    <span slStack [gap]="1">
                      @if (row.warehouseName) {
                        <span class="cell-text" slText size="sm" tone="muted">
                          {{ row.warehouseName }}
                        </span>
                      }
                      @if (row.warehouseId === chosen()) {
                        <span slInline [gap]="2">
                          <span slBadge variant="soft" tone="accent" size="sm">Shown below</span>
                        </span>
                      } @else if (row.isOwn) {
                        <span slInline [gap]="2">
                          <span slBadge variant="soft" tone="accent" size="sm">Yours</span>
                        </span>
                      }
                    </span>
                  </span>
                </th>
                <td slTableCell align="end" numeric>
                  <span [class.short]="negativeOrZero(row.available)">
                    {{ quantity(row.available) }}
                  </span>
                </td>
                @if (!phone()) {
                  <td slTableCell align="end" numeric>{{ quantity(row.onHand) }}</td>
                  <td slTableCell align="end" numeric>{{ quantity(row.reserved) }}</td>
                }
                <td slTableCell align="end" numeric>{{ quantity(row.inbound) }}</td>
                @if (!phone()) {
                  <td slTableCell align="end" numeric>
                    @if (row.belowReorderPoint) {
                      <span slBadge variant="soft" tone="warning" size="sm">
                        {{ quantity(row.reorderPoint) }}
                      </span>
                    } @else {
                      {{ quantity(row.reorderPoint) }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
          <tfoot slTableSummary>
            <tr slTableRow>
              <th slTableRowHeader>{{ totalLabel() }}</th>
              <td slTableCell align="end" numeric>{{ number(sum().available) }}</td>
              @if (!phone()) {
                <td slTableCell align="end" numeric>{{ number(sum().onHand) }}</td>
                <td slTableCell align="end" numeric>{{ number(sum().reserved) }}</td>
              }
              <td slTableCell align="end" numeric>{{ number(sum().inbound) }}</td>
              @if (!phone()) {
                <td slTableCell align="end" numeric></td>
              }
            </tr>
          </tfoot>
        }
      </div>
    </div>
  `,
})
export class StockTable {
  readonly rows = input.required<readonly StockRow[]>();
  readonly unit = input<string>('');
  readonly pending = input(false);
  readonly phone = input(false);
  readonly caption = input('Stock by warehouse');
  /**
   * Where a warehouse's row leads, when the table stands on a page that opens
   * one position at a time (the inventory's stock of one SKU); none on the
   * catalogue's record, which only reads the decomposition.
   */
  readonly link = input<
    ((row: StockRow) => { path: string; queryParams: Record<string, string> }) | null
  >(null);
  /** The warehouse the page stands on, marked in its row. */
  readonly chosen = input<string | null>(null);

  /**
   * One row, because the number of warehouses is unknown before the answer:
   * a table that reserves three and lands with one shrinks under the reader,
   * and the smaller reservation only ever grows downward.
   */
  readonly placeholderRows = [1];

  readonly sum = computed(() =>
    this.rows().reduce(
      (total, row) => ({
        onHand: total.onHand + Number(row.onHand),
        available: total.available + Number(row.available),
        reserved: total.reserved + Number(row.reserved),
        inbound: total.inbound + Number(row.inbound),
      }),
      { onHand: 0, available: 0, reserved: 0, inbound: 0 },
    ),
  );

  readonly totalLabel = computed(() => {
    const places = this.rows().length;
    const unit = this.unit();
    return `${places} ${places === 1 ? 'warehouse' : 'warehouses'}${unit ? `, in ${unit}` : ''}`;
  });

  quantity(value: string): string {
    return formatQuantity(value);
  }

  number(value: number): string {
    return value.toLocaleString('en-US');
  }

  negativeOrZero(value: string): boolean {
    return Number(value) <= 0;
  }

  title(row: StockRow): string {
    return row.warehouseName ? `${row.warehouseCode} — ${row.warehouseName}` : row.warehouseCode;
  }
}
