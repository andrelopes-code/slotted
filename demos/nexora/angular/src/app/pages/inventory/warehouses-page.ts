import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlLink } from '@slotted/angular/link';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
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
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';

import { WarehousesStore } from '../../core/catalog/warehouses.store';
import {
  WAREHOUSE_STATUS_LABEL,
  WAREHOUSE_STATUS_TONE,
  WAREHOUSES_ROUTE,
  type WarehouseListItem,
} from '../../core/inventory/inventory.model';
import { phoneSignal } from '../../core/layout/phone';

/**
 * The warehouses the reader's role covers. `GET /warehouses` answers all six
 * whatever the scope; the page draws the ones in scope and nothing of the
 * rest (the ledger row "the warehouse directory is not scoped").
 *
 * Six places are a `table`, not a grid of the list pages: there is nothing
 * to filter, page or arrange. The capacity is the declared volume; Nexora
 * holds no occupancy, so no utilization is drawn (the ledger row "a
 * warehouse's capacity has no occupancy beside it").
 */
@Component({
  selector: 'app-warehouses-page',
  imports: [
    RouterLink,
    SlLink,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
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
    SlTag,
    SlTagBody,
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
    /* On a finger a record's link in a table row is a touch target's height (--slotted-target-comfortable); the ellipsis stays. */
    @media (pointer: coarse) {
      a.cell-text {
        line-height: var(--slotted-target-comfortable);
      }
    }
  `,
  template: `
    <div slPage>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>Warehouses</h1></div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>{{ description() }}</p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div slStack [gap]="3">
          <div slTable variant="framed" [columns]="phone() ? 3 : 6" [layout]="phone() ? 'fixed' : 'auto'">
            <div slTableContent>
              <caption slTableCaption>Warehouses in your scope</caption>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>Warehouse</th>
                  <th slTableColumnHeader>Status</th>
                  @if (!phone()) {
                    <th slTableColumnHeader>Manager</th>
                    <th slTableColumnHeader>Where</th>
                  }
                  <th slTableColumnHeader align="end" numeric>Locations</th>
                  @if (!phone()) {
                    <th slTableColumnHeader align="end" numeric>Capacity</th>
                  }
                </tr>
              </thead>
              @if (!store.loaded()) {
                <tbody slTableBody>
                  @for (row of placeholderRows; track row) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        <span slStack [gap]="1">
                          <span slSkeleton shape="text" inlineSize="40%"></span>
                          <span slSkeleton shape="text" inlineSize="70%"></span>
                        </span>
                      </th>
                      <td slTableCell><span slSkeleton shape="text" inlineSize="5rem"></span></td>
                      @if (!phone()) {
                        <td slTableCell><span slSkeleton shape="text" inlineSize="7rem"></span></td>
                        <td slTableCell><span slSkeleton shape="text" inlineSize="6rem"></span></td>
                      }
                      <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="2rem"></span></td>
                      @if (!phone()) {
                        <td slTableCell align="end"><span slSkeleton shape="text" inlineSize="4rem"></span></td>
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
                          <h3 slResultStateTitle>No warehouse is in your scope</h3>
                          <p slResultStateDescription>Your role reads no warehouse's stock.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              } @else {
                <tbody slTableBody>
                  @for (row of rows(); track row.id) {
                    <tr slTableRow>
                      <th slTableRowHeader>
                        <span slStack [gap]="1">
                          <a slLink class="cell-text" variant="neutral" underline="hover" [routerLink]="[warehousesRoute, row.id]">
                            {{ row.code }}
                          </a>
                          <span class="cell-text" slText size="sm" tone="muted" [title]="row.name">{{ row.name }}</span>
                        </span>
                      </th>
                      <td slTableCell>
                        <span slTag size="sm" [tone]="tone(row)"><span slTagBody>{{ status(row) }}</span></span>
                      </td>
                      @if (!phone()) {
                        <td slTableCell>{{ row.managerName }}</td>
                        <td slTableCell>{{ row.address.city }}, {{ row.address.region }}</td>
                      }
                      <td slTableCell align="end" numeric>{{ row.locationCount }}</td>
                      @if (!phone()) {
                        <td slTableCell align="end" numeric>{{ cubic(row.capacityCubicMeters) }}</td>
                      }
                    </tr>
                  }
                </tbody>
                @if (rows().length > 1) {
                  <tfoot slTableSummary>
                    <tr slTableRow>
                      <th slTableRowHeader>{{ rows().length }} warehouses</th>
                      <td slTableCell></td>
                      @if (!phone()) {
                        <td slTableCell></td>
                        <td slTableCell></td>
                      }
                      <td slTableCell align="end" numeric>{{ totalLocations() }}</td>
                      @if (!phone()) {
                        <td slTableCell align="end" numeric>{{ cubic(totalCapacity()) }}</td>
                      }
                    </tr>
                  </tfoot>
                }
              }
            </div>
          </div>
          <span slText size="sm" tone="muted">
            Capacity is the volume each warehouse declares. Nexora keeps no occupancy beside it, so
            how full a warehouse is cannot be read here.
          </span>
        </div>
      </div>
    </div>
  `,
})
export class WarehousesPage {
  readonly store = inject(WarehousesStore);
  readonly warehousesRoute = WAREHOUSES_ROUTE;
  readonly phone = phoneSignal();
  readonly placeholderRows = [1, 2, 3];

  readonly rows = this.store.inScope;
  readonly totalLocations = computed(() => this.rows().reduce((sum, row) => sum + row.locationCount, 0));
  readonly totalCapacity = computed(() =>
    this.rows().reduce((sum, row) => sum + row.capacityCubicMeters, 0),
  );

  readonly description = computed(() => {
    const rows = this.rows();
    return rows.length === 1
      ? `${rows[0]!.code} ${rows[0]!.name}, the warehouse your role is scoped to: its locations, its stock, its movements, its counts and its transfers.`
      : 'The places the stock is held in. Each one opens on its locations, its stock below reorder point, its movements, its counts and its transfers.';
  });

  constructor() {
    void this.store.open();
  }

  status(row: WarehouseListItem): string {
    return WAREHOUSE_STATUS_LABEL[row.status];
  }

  tone(row: WarehouseListItem) {
    return WAREHOUSE_STATUS_TONE[row.status];
  }

  cubic(value: number): string {
    return `${value.toLocaleString('en-US')} m³`;
  }
}
