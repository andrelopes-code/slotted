import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlButton } from '@slotted/angular/button';
import { SlDataGrid, SlDataGridCellTemplate, SlDataGridFooter } from '@slotted/angular/data-grid';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerHeader,
  SlDrawerTitle,
} from '@slotted/angular/drawer';
import { SlFilterBar, SlFilterBarEnd } from '@slotted/angular/filter-bar';
import { SlInlineMessage, SlInlineMessageIcon } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderArea,
  SlPageHeaderBack,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderHeading,
  SlPageHeaderNav,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlPagination,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import type { FilterGroup } from '@slotted/core/filter';
import { emptyQuery, withPageIndex, withPageSize, type GridQuery } from '@slotted/core/grid';
import type { MovementListItem } from '@slotted/demo-nexora-backend';

import { isApiError } from '../../core/backend/api-error';
import { doorFilter, fieldsWithDoor, type Door } from '../../core/backend/door';
import { LIST_PAGE_SIZE, LIST_PAGE_SIZES } from '../../core/backend/list-query';
import {
  formatDateTime,
  formatQuantity,
  MOVEMENT_LABEL,
  movementSourceLabel,
} from '../../core/catalog/catalog.model';
import { WarehousesStore } from '../../core/catalog/warehouses.store';
import {
  MOVEMENTS_ROUTE,
  movementSourceLink,
  positionLink,
  signed,
} from '../../core/inventory/inventory.model';
import { MovementsStore } from '../../core/inventory/movements.store';
import { phoneSignal } from '../../core/layout/phone';
import { SessionStore } from '../../core/session/session.store';
import { listView } from '../list-view/list-view';
import { ListViewTools } from '../list-view/list-view-tools';
import {
  MOVEMENT_HIDDEN_BY_DEFAULT,
  movementColumns,
  MOVEMENT_DOOR_FIELDS,
  movementFilterFields,
} from './movement-columns';

/**
 * The stock ledger (§60.1): every movement, immutable, newest first. A row
 * says what moved, where, by how much and because of what; its source leads to
 * the record that caused it, or to the ledger narrowed to what that record
 * moved where the record has no screen yet (LG-01).
 *
 * One movement is small and never changes, so its `:id` is a drawer over the
 * ledger it belongs to rather than a page: the list stays under it, the URL
 * names the movement, and the platform's back gesture closes it because the
 * route is what opened it.
 */
@Component({
  selector: 'app-movements-page',
  imports: [
    ListViewTools,
    RouterLink,
    SlButton,
    SlDataGrid,
    SlDataGridCellTemplate,
    SlDataGridFooter,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerTitle,
    SlFilterBar,
    SlFilterBarEnd,
    SlInlineMessage,
    SlInlineMessageIcon,
    SlLink,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderArea,
    SlPageHeaderBack,
    SlPageHeaderContent,
    SlPageHeaderDescription,
    SlPageHeaderHeading,
    SlPageHeaderNav,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlPagination,
    SlPaginationNext,
    SlPaginationPageSize,
    SlPaginationPrevious,
    SlPaginationStatus,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeletonText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .listing {
      display: flex;
      flex-direction: column;
      gap: var(--slotted-space-4);
      min-block-size: 0;
      block-size: 100%;
    }
    sl-data-grid {
      flex: 1 1 0;
      min-block-size: 0;
    }
    .cell-text {
      display: block;
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cell-quantity {
      display: block;
      text-align: end;
      font-variant-numeric: tabular-nums;
    }
    .down {
      color: var(--slotted-tone-danger-text);
    }
    .up {
      color: var(--slotted-tone-success-text);
    }
  `,
  template: `
    <div slPage width="bleed" fill>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          @if (store.placed()) {
            <div slPageHeaderNav>
              <a slPageHeaderBack [routerLink]="movementsRoute">All movements</a>
            </div>
          }
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle>
              <h1 slPageHeaderHeading>{{ heading() }}</h1>
            </div>
          </div>
        </div>
        <div slPageHeaderArea>
          <div slPageHeaderContent>
            <p slPageHeaderDescription>{{ description() }}</p>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div class="listing">
          <div
            slFilterBar
            aria-label="Movement filters"
            shortcut="/"
            [fields]="fields()"
            [value]="store.filter()"
            (valueChangeRequest)="store.setFilter($event.value)"
            [query]="store.search()"
            (queryChangeRequest)="store.setSearch($event.value)"
            [messages]="countMessages"
            [count]="store.total() ?? undefined"
            [total]="store.total() === store.grandTotal() ? undefined : (store.grandTotal() ?? undefined)"
            [loading]="store.loading()"
          >
            <app-list-view-tools
              slFilterBarEnd
              #tools
              label="Movement"
              [view]="view"
              [columns]="columns"
              [outOfSpace]="grid.outOfSpace()"
            />
          </div>
          @if (store.flattened()) {
            <div slInlineMessage tone="warning">
              <span slInlineMessageIcon></span>
              Nexora matches every filter at once: "any of the following" and groups are applied as
              "all of the following".
            </div>
          }
          <sl-data-grid
            #grid="slDataGrid"
            aria-label="Stock movements"
            rowKey="id"
            variant="framed"
            activatable
            [rows]="store.rows()"
            [columns]="columns"
            [totalCount]="store.total() ?? 0"
            [loading]="store.loading()"
            [error]="store.error()"
            [query]="store.query()"
            (queryChangeRequest)="store.load($event.value)"
            [columnState]="view.columnState()"
            (columnStateChangeRequest)="tools.arrange($event)"
            [density]="view.density()"
            manageable
            (manageColumns)="tools.manage()"
            [showRange]="false"
            (retry)="store.reload()"
            (activate)="openMovement($event.key)"
          >
            <ng-template slDataGridCell="occurredAt" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="[movementsRoute, row.id]"
                [queryParams]="currentParams()"
                [title]="dateTime(row.occurredAt)"
              >
                {{ dateTime(row.occurredAt) }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="skuCode" let-row="row">
              <a
                slLink
                class="cell-text"
                variant="neutral"
                underline="hover"
                [routerLink]="position(row).path"
                [queryParams]="position(row).queryParams"
                [title]="row.skuCode + ' · ' + row.skuName"
              >
                {{ row.skuCode }}
              </a>
            </ng-template>
            <ng-template slDataGridCell="onHandDelta" let-row="row">
              <span
                class="cell-quantity"
                [class.down]="row.onHandDelta.startsWith('-')"
                [class.up]="up(row.onHandDelta)"
              >
                {{ delta(row.onHandDelta) }}
              </span>
            </ng-template>
            <ng-template slDataGridCell="sourceEntityType" let-row="row">
              @if (source(row); as to) {
                <a
                  slLink
                  class="cell-text"
                  [routerLink]="to.path"
                  [queryParams]="to.queryParams ?? {}"
                  [title]="sourceWord(row)"
                >
                  {{ sourceWord(row) }}
                </a>
              } @else {
                <span class="cell-text" [title]="sourceWord(row)">{{ sourceWord(row) }}</span>
              }
            </ng-template>
            <nav
              slDataGridFooter
              slPagination
              aria-label="Movement pages"
              [messages]="pagerMessages"
              [count]="store.total() ?? 0"
              [page]="store.page().index + 1"
              [pageSize]="store.page().size"
              [pageSizeOptions]="pageSizes"
              [loading]="store.loading()"
              (pageChange)="goTo($event.value)"
              (pageSizeChange)="resize($event.value)"
            >
              @if (!phone()) {
                <sl-pagination-page-size></sl-pagination-page-size>
              }
              <p slPaginationStatus></p>
              <button slPaginationPrevious type="button"></button>
              <button slPaginationNext type="button"></button>
            </nav>
          </sl-data-grid>
        </div>
      </div>
    </div>

    <sl-drawer
      side="end"
      size="md"
      back="none"
      aria-label="Movement"
      [open]="movementId() !== null"
      (openChange)="$event ? null : close()"
    >
      <header slDrawerHeader>
        <h2 slDrawerTitle>{{ movement() ? kindWord(movement()!) : 'Movement' }}</h2>
        <p slDrawerDescription>
          @if (movement(); as m) {
            {{ dateTime(m.occurredAt) }} · {{ m.warehouseCode }}
          } @else if (movementFailed() === null) {
            <span slSkeletonText [lines]="1" lastLineSize="60%"></span>
          }
        </p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody data-testid="movement-drawer">
        @if (movement(); as m) {
          <div slDescriptionList layout="row">
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>SKU</dt>
              <dd slDescriptionListDescription>
                <a slLink [routerLink]="position(m).path" [queryParams]="position(m).queryParams">{{
                  m.skuCode
                }}</a>
                · {{ m.skuName }}
              </dd>
            </div>
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>On hand</dt>
              <dd slDescriptionListDescription>{{ delta(m.onHandDelta) }}</dd>
            </div>
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>Damaged</dt>
              <dd slDescriptionListDescription>{{ delta(m.damagedDelta) }}</dd>
            </div>
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>Quarantine</dt>
              <dd slDescriptionListDescription>{{ delta(m.quarantineDelta) }}</dd>
            </div>
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>From</dt>
              <dd slDescriptionListDescription>
                @if (source(m); as to) {
                  <a slLink [routerLink]="to.path" [queryParams]="to.queryParams ?? {}">{{
                    sourceWord(m)
                  }}</a>
                } @else {
                  {{ sourceWord(m) }}
                }
              </dd>
            </div>
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>By</dt>
              <dd slDescriptionListDescription>{{ m.actorName }}</dd>
            </div>
            @if (m.reason) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>Reason</dt>
                <dd slDescriptionListDescription>{{ m.reason }}</dd>
              </div>
            }
          </div>
        } @else if (movementFailed(); as failure) {
          <div
            slResultState
            [status]="failure === 'NOT_FOUND' ? 'not-found' : 'error'"
            reach="section"
          >
            <div slResultStateContent>
              <h3 slResultStateTitle>
                {{
                  failure === 'NOT_FOUND'
                    ? 'No movement in your warehouses has this id'
                    : 'The movement could not be read'
                }}
              </h3>
              <p slResultStateDescription>
                {{
                  failure === 'NOT_FOUND'
                    ? 'The ledger holds movements of the warehouses your role covers.'
                    : 'Nothing was changed. Try again in a moment.'
                }}
              </p>
            </div>
            <div slResultStateActions>
              @if (failure !== 'NOT_FOUND') {
                <button slButton type="button" (click)="readMovement()">Try again</button>
              }
              <button slButton variant="ghost" tone="secondary" type="button" (click)="close()">
                Back to the ledger
              </button>
            </div>
          </div>
        } @else {
          <span slSkeletonText [lines]="5"></span>
        }
      </div>
    </sl-drawer>
  `,
})
export class MovementsPage {
  readonly store = inject(MovementsStore);
  private readonly warehouses = inject(WarehousesStore);
  private readonly session = inject(SessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly movementsRoute = MOVEMENTS_ROUTE;
  readonly pageSizes = LIST_PAGE_SIZES;
  readonly phone = phoneSignal();
  readonly columns = movementColumns();
  /** A report's door, whose ids the bar shows by the words the door carries. */
  private readonly door = signal<Door | null>(null);
  readonly fields = computed(() =>
    fieldsWithDoor(movementFilterFields(this.warehouses.inScope()), MOVEMENT_DOOR_FIELDS, this.door()),
  );

  readonly movementId = signal<string | null>(null);
  readonly movement = signal<MovementListItem | null>(null);
  readonly movementFailed = signal<string | null>(null);
  readonly currentParams = signal<Record<string, string>>({});

  readonly heading = computed(() => {
    const place = this.store.place();
    const first = this.store.rows()[0];
    if (place.skuId !== null)
      return first ? `Movements of ${first.skuCode}` : 'Movements of one SKU';
    if (place.sourceId !== null)
      return first
        ? `What one ${movementSourceLabel(first.sourceEntityType).toLowerCase()} moved`
        : 'What one record moved';
    return 'Movements';
  });

  readonly description = computed(() => {
    const place = this.store.place();
    if (place.skuId !== null)
      return 'Every movement of this SKU in the warehouses your role covers, newest first. Quantities are in the SKU’s own unit.';
    if (place.sourceId !== null)
      return 'The movements one record wrote into the ledger. That record has no screen of its own yet; this is what it did to the stock.';
    return 'The stock ledger: every receipt, shipment, transfer, adjustment and count, newest first. A movement is never edited; a correction is a movement of its own.';
  });

  /** The count in this listing's own noun: all of them, or how many of them a filter keeps. */
  readonly countMessages = { count: '{count} of {total} movements', countOnly: '{count} movements' };

  readonly pagerMessages = {
    range: 'Movements {start}–{end} of {count}',
    pageSize: 'Movements per page',
  };

  readonly view = listView({
    page: 'movements',
    columns: movementColumns(),
    defaultColumnState: { hidden: [...MOVEMENT_HIDDEN_BY_DEFAULT] },
    query: this.store.query,
    defaultQuery: emptyQuery({ index: 0, size: LIST_PAGE_SIZE }),
    applyQuery: (query) => void this.store.load(query),
  });

  constructor() {
    void this.warehouses.open();
    let first = true;
    this.route.queryParamMap.subscribe((params) => {
      this.currentParams.set(
        Object.fromEntries(params.keys.map((key) => [key, params.get(key) ?? ''])),
      );
      const warehouse = params.get('warehouse');
      // A report's door names its condition and its days field by field (OV-01).
      const report = warehouse
        ? null
        : doorFilter(params, [...movementFilterFields(this.warehouses.inScope()), ...MOVEMENT_DOOR_FIELDS]);
      this.door.set(report);
      const initial: GridQuery | null = warehouse
        ? { ...emptyQuery({ index: 0, size: LIST_PAGE_SIZE }), filter: warehouseFilter(warehouse) }
        : report
          ? { ...emptyQuery({ index: 0, size: LIST_PAGE_SIZE }), filter: report.filter }
          : first
          ? this.view.openingQuery
          : null;
      first = false;
      if (report) void this.store.openDoor({ ...emptyQuery({ index: 0, size: LIST_PAGE_SIZE }), filter: report.filter });
      else void this.store.openAt({ skuId: params.get('sku'), sourceId: params.get('source') }, initial);
    });
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.movementId.set(id);
      if (id !== null) void this.readMovement();
    });
  }

  async readMovement(): Promise<void> {
    const id = this.movementId();
    if (id === null) return;
    this.movementFailed.set(null);
    const held = this.store.rows().find((row) => row.id === id);
    this.movement.set(held ?? null);
    if (held) return;
    try {
      const found = await this.store.one(id);
      if (this.movementId() !== id) return;
      this.movement.set(found);
      if (found === null) this.movementFailed.set('NOT_FOUND');
    } catch (error) {
      this.movementFailed.set(isApiError(error) ? error.code : 'UNKNOWN');
    }
  }

  openMovement(id: string): void {
    void this.router.navigate([MOVEMENTS_ROUTE, id], { queryParams: this.currentParams() });
  }

  /**
   * The drawer leaves the history the way it came: back to the ledger that
   * opened it, or — on a link pasted from elsewhere — to the ledger in place of
   * the movement, so the back gesture does not reopen it.
   */
  close(): void {
    if (this.movementId() === null) return;
    const previous = this.router.lastSuccessfulNavigation()?.previousNavigation?.finalUrl;
    const fromLedger =
      previous !== undefined &&
      previous.toString().startsWith(MOVEMENTS_ROUTE) &&
      !previous.toString().startsWith(`${MOVEMENTS_ROUTE}/`);
    if (fromLedger) this.location.back();
    else
      void this.router.navigate([MOVEMENTS_ROUTE], {
        queryParams: this.currentParams(),
        replaceUrl: true,
      });
  }

  position(row: MovementListItem) {
    return positionLink(row.skuId, row.warehouseId);
  }

  source(row: MovementListItem) {
    void this.session.session();
    return movementSourceLink(row.sourceEntityType, row.sourceEntityId, (permission) =>
      this.session.can(permission),
    );
  }

  sourceWord(row: MovementListItem): string {
    return movementSourceLabel(row.sourceEntityType);
  }

  kindWord(row: MovementListItem): string {
    return MOVEMENT_LABEL[row.type] ?? 'Movement';
  }

  dateTime(iso: string): string {
    return formatDateTime(iso);
  }

  delta(value: string): string {
    return signed(value, formatQuantity);
  }

  up(value: string): boolean {
    return !value.startsWith('-') && Number(value) !== 0;
  }

  goTo(page: number): void {
    void this.store.load(withPageIndex(this.store.query(), page - 1).query);
  }

  resize(size: number): void {
    void this.store.load(withPageSize(this.store.query(), size).query);
  }
}

function warehouseFilter(warehouseId: string): FilterGroup {
  return {
    join: 'and',
    rules: [
      {
        field: 'warehouseId',
        filter: {
          kind: 'set',
          join: 'and',
          conditions: [{ operator: 'anyOf', value: [warehouseId] }],
        },
      },
    ],
  };
}
