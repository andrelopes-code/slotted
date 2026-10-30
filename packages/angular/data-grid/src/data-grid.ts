import { COMPACT_BELOW } from '@slotted/core/measure';
import { writeToClipboard } from '@slotted/core/clipboard';
import { createRowMetrics, nextSelection, virtualWindow } from '@slotted/core/collection';
import { createDragController, type DragController } from '@slotted/core/drag';
import { createFilterGroupPredicate, ruleFor, withoutRuleFor } from '@slotted/core/filter';
import type { FilterDescriptor, FilterKind } from '@slotted/core/filter';
import {
  applyQuery,
  groupInOrder,
  cellText,
  columnsOutOfSpace,
  cellValue,
  serializeQuery,
  toCsv,
  columnRange,
  columnTemplate,
  emptyQuery,
  FILTER_ROW,
  GROUP_ROW_PREFIX,
  clampWidth,
  HEADER_ROW,
  isGroupCursorRow,
  moveCursor,
  normalizeColumnState,
  POPIN_COLUMN_ID,
  rangeBounds,
  rangeCells,
  rangeEdges,
  rangeToText,
  RESIZE_STEP,
  resolveColumnOverflow,
  resolveColumns,
  rowRange,
  sameCell,
  settleCursor,
  SUMMARY_ROW,
  wholeRange,
  withColumnFilter,
  withColumnHidden,
  withColumnMoved,
  withColumnPinned,
  withColumnWidth,
  withoutFilters,
  withSort,
  withSortPress,
  zoneOf,
  type CursorGrid,
  type CursorIntent,
  type GridCell,
  type GridColumn,
  type GridColumnGroup,
  type GridColumnState,
  type GridDensity,
  type GridNode,
  type GridOutOfSpace,
  type GridQuery,
  type GridRange,
  type ResolvedGridColumn,
  type SortDirection,
  type GridTree,
} from '@slotted/core/grid';
import {
  dataGridMessages,
  dragMessages,
  type DataGridMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createScrollAffordance } from '@slotted/core/overflow';
import type { PositionerAnchor } from '@slotted/core/positioner';
import { createControllable, type ChangeReason, type ChangeRequest } from '@slotted/core/state';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  type Signal,
  untracked,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
import {
  SlPopover,
  SlPopoverAnchor,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeleton } from '@slotted/angular/skeleton';
import {
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';
import {
  filterKindOf,
  SlDataGridEditor,
  SlDataGridFilterPanel,
  SlDataGridFilterRowOperand,
} from './data-grid-controls';
import {
  injectDataGridDefaults,
  SlDataGridIdFactory,
  type DataGridActivateEvent,
  type DataGridCellContext,
  type DataGridColumnOverflow,
  type DataGridColumnStateRequest,
  type DataGridEditCommit,
  type DataGridEditMode,
  type DataGridEditorContext,
  type DataGridDataSource,
  type DataGridDataSourceResult,
  type DataGridExportOptions,
  type DataGridPinnedRows,
  type DataGridRowsReorderEvent,
  type DataGridExpandedGroups,
  type DataGridGroupContext,
  type DataGridHeaderContext,
  type DataGridLoading,
  type DataGridMode,
  type DataGridQueryRequest,
  type DataGridReason,
  type DataGridRowHeight,
  type DataGridSelection,
  type DataGridSelectionMode,
  type DataGridStickyTo,
  type DataGridVariant,
  type DataGridLoadMoreTrigger,
  type DataGridVirtualize,
} from './data-grid-defaults';
import {
  SlDataGridCellTemplate,
  SlDataGridColumnHelp,
  SlDataGridDetailTemplate,
  SlDataGridEditorTemplate,
  SlDataGridEmptyTemplate,
  SlDataGridFilterTemplate,
  SlDataGridFooter,
  SlDataGridGroupTemplate,
  SlDataGridHeaderTemplate,
} from './data-grid-templates';

export const SELECTION_COLUMN = '__selection';
export const EXPANDER_COLUMN = '__expander';
/** The reserved column that carries a row's drag handle. */
export const DRAG_COLUMN = '__drag';
const SELECTION_WIDTH = 48;
const EXPANDER_WIDTH = 40;
const DRAG_WIDTH = 40;
const DEFAULT_ROW_HEIGHT = 34;
/** Milliseconds a changed cell stays marked when `highlightChanges` is `true`. */
const DEFAULT_CHANGED_DURATION = 1200;
/** Answers a data source keeps, by query. */
const DEFAULT_CACHE_SIZE = 20;
const EMPTY_ROWS: readonly never[] = [];
/** The out-of-space set of a frame not measured yet, or of a grid that scrolls instead. */
const NONE_OUT: GridOutOfSpace = { popin: [], hidden: [] };
const VIRTUALIZE_ROWS_FROM = 100;
const VIRTUALIZE_COLUMNS_FROM = 20;
/** The viewport assumed until the scroller is measured. */
const PROVISIONAL_VIEWPORT = 600;
const COLUMN_OVERSCAN_PX = 400;
const SIMPLE_WIDGET =
  'a[href], button, input[type="checkbox"], input[type="radio"], [role="switch"], [role="button"], [role="checkbox"]';
/** What an editor's focus lands on: its field, before any control beside it. */
const EDITOR_FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([disabled]), textarea:not([disabled]), [role="combobox"]:not([disabled]), [role="spinbutton"]:not([disabled]), [role="checkbox"], [role="switch"]';
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
/** Where a secondary press is the field's own: the browser's menu cuts, copies and pastes. */
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
/**
 * The window after a keyboard opening of a column menu in which a
 * `contextmenu` is the one Windows fires for the key, not a second press:
 * `context-menu-trigger.ts`'s technique.
 */
const KEYBOARD_ECHO = 300;
/** Milliseconds after a touch activation in which the `dblclick` the browser adds is ignored. */
const TOUCH_ECHO = 500;

/** A rectangle with no size at the point the reader pressed. */
function pointAnchor(x: number, y: number): PositionerAnchor {
  const rect = new DOMRect(x, y, 0, 0);
  return { getBoundingClientRect: () => rect };
}

/**
 * Whether a pointer event landed on a widget inside the cell — a link, a
 * button, a field — rather than on the cell itself. Asked of the cell and not
 * of the document: the scroller is focusable while the grid overflows, and
 * `closest` walked up to it from every value, so a press on a header's name
 * sorted nothing and only the cell's own padding answered. A press outside
 * the cell — on the menu it opened — is not its own either.
 */
function insideWidget(event: Event) {
  const cell = event.currentTarget as HTMLElement;
  const target = event.target as HTMLElement | null;
  /* An event from a layer the cell owns — React bubbles a portal's events
     through the tree — is not the cell's own press either. */
  if (!target || !cell.contains(target)) return true;
  const widget = target.closest(FOCUSABLE);
  return widget !== null && widget !== cell && cell.contains(widget);
}

interface EditSession {
  readonly cell: GridCell;
  readonly columns: readonly string[];
  readonly drafts: Readonly<Record<string, unknown>>;
  readonly originals: Readonly<Record<string, unknown>>;
  readonly status: 'editing' | 'pending' | 'invalid';
  readonly messages: Readonly<Record<string, string>>;
}

type GroupNode = Extract<GridNode<unknown>, { kind: 'group' }>;
type RowNode = Extract<GridNode<unknown>, { kind: 'row' }>;

function sameKeys(a: readonly string[] | 'all', b: readonly string[] | 'all') {
  if (a === 'all' || b === 'all') return a === b;
  return a.length === b.length && a.every((key, index) => key === b[index]);
}
function sameSelection(a: DataGridSelection, b: DataGridSelection) {
  if (Array.isArray(a) && Array.isArray(b)) return sameKeys(a, b);
  return a === b;
}
function sameRange(a: GridRange | null, b: GridRange | null) {
  if (!a || !b) return a === b;
  return sameCell(a.anchor, b.anchor) && sameCell(a.focus, b.focus);
}
/**
 * Where a drop at a boundary of the whole row lands inside the source's zone:
 * the index among the zone's members, or `null` when the column would not
 * move. A boundary past the zone's edge lands on that edge.
 */
function zoneIndex<Row>(
  list: readonly ResolvedGridColumn<Row>[],
  zone: readonly string[],
  columnId: string,
  boundary: number,
): number | null {
  const first = list.findIndex((column) => column.id === zone[0]);
  const clamped = Math.max(first, Math.min(first + zone.length, boundary));
  const from = zone.indexOf(columnId);
  const to = clamped - first;
  const settled = to > from ? to - 1 : to;
  return settled === from ? null : settled;
}

function isBodyRow(row: string) {
  return row !== HEADER_ROW && row !== FILTER_ROW && row !== SUMMARY_ROW && !isGroupCursorRow(row);
}

/**
 * A grid of data: the composite widget `table` declined to be. It owns the
 * rows, applies the query, walks the cells with one cursor, edits in place,
 * and lets the reader arrange the columns. Its selection is a form value.
 */
/** The room a cell's content asks for: the value's laid-out width, the boxes beside it, the gaps, the padding and the border. */
function contentWidth(cell: HTMLElement): number {
  const style = getComputedStyle(cell);
  const frame =
    cell.offsetWidth -
    cell.clientWidth +
    parseFloat(style.paddingInlineStart) +
    parseFloat(style.paddingInlineEnd);
  const gap = parseFloat(style.columnGap) || 0;
  let width = 0;
  let count = 0;
  for (const child of cell.children) {
    if (!(child instanceof HTMLElement) || getComputedStyle(child).display === 'none') continue;
    /* The description is read, not drawn: it asks for no room. */
    if (child.dataset['part'] === 'column-description') continue;
    count += 1;
    if (count === 1 && child.dataset['ui'] === undefined) {
      const range = cell.ownerDocument.createRange();
      range.selectNodeContents(child);
      width += range.getBoundingClientRect().width;
    } else {
      width += child.getBoundingClientRect().width;
    }
  }
  return width + Math.max(0, count - 1) * gap + frame;
}

@Component({
  selector: 'sl-data-grid',
  standalone: true,
  exportAs: 'slDataGrid',
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlCheckbox,
    SlDataGridEditor,
    SlDataGridFilterPanel,
    SlDataGridFilterRowOperand,
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuItem,
    SlMenuSeparator,
    SlMenuTrigger,
    SlPopover,
    SlPopoverAnchor,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeleton,
    SlTooltip,
    SlTooltipContent,
    SlTooltipLayer,
    SlTooltipTrigger,
  ],
  styleUrls: [
    '../../../styles/src/data-grid/data-grid.css',
    '../../../styles/src/checkbox/checkbox.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  template: `
    <div #scroll data-part="scroll" data-part-scroll="">
      <div data-part="head" data-part-head="" role="rowgroup">
        @if (hasGroups()) {
          <div data-part="header-row" data-part-header-row="" role="row" aria-rowindex="1">
            @for (cell of groupCells(); track cell.key) {
              <div
                data-part="column-group"
                data-part-column-group=""
                role="columnheader"
                tabindex="-1"
                [attr.aria-colindex]="cell.first"
                [attr.aria-colspan]="cell.span"
                [attr.data-pinned]="cell.pinned"
                [style.--slotted-data-grid-column]="cell.first + ' / ' + (cell.first + cell.span)"
                [style.--slotted-data-grid-pin-offset]="cell.pinned ? cell.pinOffset + 'px' : null"
              >
                <span>{{ cell.label }}</span>
              </div>
            }
          </div>
        }
        <div
          data-part="header-row"
          data-part-header-row=""
          role="row"
          [attr.data-row]="HEADER"
          [attr.aria-rowindex]="hasGroups() ? 2 : 1"
        >
          @if (hasSelectionColumn()) {
            <div
              data-part="selection"
              data-part-selection=""
              role="gridcell"
              aria-colindex="1"
              [attr.data-column]="SELECTION"
              [attr.tabindex]="isTabStop(HEADER, SELECTION) ? 0 : -1"
              [attr.data-current]="isCurrent(HEADER, SELECTION) ? '' : null"
              [style.--slotted-data-grid-column]="1"
              (focus)="onCellFocus({ row: HEADER, column: SELECTION }, $event)"
              (keydown)="onCellKeyDown($event, { row: HEADER, column: SELECTION })"
              (pointerdown)="onCellPointerDown($event, { row: HEADER, column: SELECTION })"
            >
              @if (resolvedSelectionMode() === 'multiple') {
                <span
                  slCheckbox
                  [checked]="allState() === 'all'"
                  [indeterminate]="allState() === 'some'"
                  [tabIndex]="isCurrent(HEADER, SELECTION) ? 0 : -1"
                  (checkedChange)="toggleAll($event.source)"
                >
                  <span
                    data-ui="visually-hidden"
                    data-ui-visually-hidden=""
                    data-part="root"
                    data-part-root=""
                    >{{ selectAllName() }}</span
                  >
                </span>
              }
            </div>
          }
          @if (hasDragColumn()) {
            <div
              data-part="column-header"
              data-part-column-header=""
              role="columnheader"
              tabindex="-1"
              [attr.aria-colindex]="dragIndex()"
              [attr.data-column]="DRAG"
              [style.--slotted-data-grid-column]="dragIndex()"
            >
              <span></span>
            </div>
          }
          @if (hasExpanderColumn()) {
            <div
              data-part="column-header"
              data-part-column-header=""
              role="columnheader"
              tabindex="-1"
              [attr.aria-colindex]="expanderIndex()"
              [attr.data-column]="EXPANDER"
              [style.--slotted-data-grid-column]="expanderIndex()"
            >
              <span></span>
            </div>
          }
          @for (column of mountedColumns(); track column.id) {
            <ng-container
              slPopover
              side="bottom"
              align="start"
              size="sm"
              [open]="filterOpen() === column.id && filterKind(column) !== null"
              (openChange)="onFilterOpenChange(column.id, $event)"
            >
              <div
                slPopoverAnchor
                data-part="column-header"
                data-part-column-header=""
                role="columnheader"
                [attr.aria-colindex]="indexOf(column.id)"
                [attr.aria-sort]="ariaSort(column.id)"
                [attr.aria-describedby]="
                  column.column.description ? descriptionId(column.id) : null
                "
                [attr.data-column]="column.id"
                [attr.data-align]="column.align ?? null"
                [attr.data-numeric]="column.numeric ? '' : null"
                [attr.data-pinned]="column.pinned"
                [attr.data-pin-edge]="column.pinEdge ? '' : null"
                [attr.data-sortable]="column.sortable ? '' : null"
                [attr.data-sorted]="sortOf(column.id)?.direction ?? null"
                [attr.data-filtered]="filterOf(column.id) ? '' : null"
                [attr.data-current]="isCurrent(HEADER, column.id) ? '' : null"
                [attr.data-dragging]="dragState().dragging === column.id ? '' : null"
                [attr.data-drop-target]="dragState().target === column.id ? '' : null"
                [attr.data-resizing]="resizing() === column.id ? '' : null"
                [attr.tabindex]="isTabStop(HEADER, column.id) ? 0 : -1"
                [style.--slotted-data-grid-column]="indexOf(column.id)"
                [style.--slotted-data-grid-pin-offset]="
                  column.pinned ? column.pinOffset + 'px' : null
                "
                (click)="onHeaderClick($event, column)"
                (contextmenu)="onHeaderContextMenu($event, column.id)"
                (focus)="onCellFocus({ row: HEADER, column: column.id }, $event)"
                (keydown)="onCellKeyDown($event, { row: HEADER, column: column.id })"
                (pointerdown)="onCellPointerDown($event, { row: HEADER, column: column.id })"
              >
                <ng-container slTooltip whenClipped describes="none" openOn="hover" side="bottom">
                  <span slTooltipTrigger>
                    @if (headerTemplate(column.id); as template) {
                      <ng-container
                        [ngTemplateOutlet]="template"
                        [ngTemplateOutletContext]="headerContext(column)"
                      />
                    } @else {
                      {{ column.column.label }}
                    }
                  </span>
                  <ng-template slTooltipLayer>
                    <div slTooltipContent>{{ column.column.label }}</div>
                  </ng-template>
                </ng-container>
                @if (sortOf(column.id); as sort) {
                  <span
                    data-part="sort"
                    data-part-sort=""
                    aria-hidden="true"
                    [attr.data-index]="query().sort.length > 1 ? sort.index : null"
                  >
                    <!-- The stylesheet turns the chevron over for ascending; the
                         index of a key past the first is its own text before it. -->
                    <span slIcon><svg slGlyph name="chevron-down"></svg></span>
                  </span>
                }
                @if (column.column.description; as description) {
                  <span
                    data-part="column-description"
                    data-part-column-description=""
                    aria-hidden="true"
                    [id]="descriptionId(column.id)"
                    >{{ description }}</span
                  >
                }
                <span data-part="column-actions" data-part-column-actions="">
                  @if (hasHelp(column)) {
                    <ng-container slPopover side="bottom" align="start" size="sm">
                      <button
                        slPopoverTrigger
                        data-part="column-help"
                        data-part-column-help=""
                        type="button"
                        tabindex="-1"
                        [attr.aria-label]="helpLabel(column)"
                        (pointerdown)="$event.stopPropagation()"
                        (click)="$event.stopPropagation()"
                      >
                        <span slIcon><svg slGlyph name="circle-question"></svg></span>
                      </button>
                      <ng-template slPopoverLayer>
                        <div slPopoverContent [attr.aria-label]="helpLabel(column)">
                          <div slPopoverBody>
                            @if (column.column.description; as description) {
                              <div>{{ description }}</div>
                            }
                            @if (helpTemplate(column.id); as template) {
                              <ng-container
                                [ngTemplateOutlet]="template"
                                [ngTemplateOutletContext]="headerContext(column)"
                              />
                            }
                          </div>
                        </div>
                      </ng-template>
                    </ng-container>
                  }
                  @if (column.filterable && (filterOf(column.id) || filterOpen() === column.id)) {
                    <button
                      data-part="filter"
                      data-part-filter=""
                      type="button"
                      tabindex="-1"
                      aria-haspopup="dialog"
                      [attr.aria-expanded]="filterOpen() === column.id"
                      [attr.aria-label]="t('filterColumn', { column: column.column.label })"
                      [attr.data-filtered]="filterOf(column.id) ? '' : null"
                      [attr.data-open]="filterOpen() === column.id ? '' : null"
                      (pointerdown)="$event.stopPropagation()"
                      (click)="$event.stopPropagation(); toggleFilterPanel(column.id)"
                    >
                      <span slIcon><svg slGlyph name="funnel"></svg></span>
                    </button>
                  }
                  <button
                    data-part="column-menu"
                    data-part-column-menu=""
                    type="button"
                    tabindex="-1"
                    [slMenuTriggerFor]="columnMenu"
                    [attr.data-menu-for]="column.id"
                    [attr.aria-label]="t('columnMenu', { column: column.column.label })"
                    (pointerdown)="$event.stopPropagation()"
                    (click)="$event.stopPropagation(); anchorToButton(columnMenu)"
                  >
                    <span slIcon><svg slGlyph name="ellipsis"></svg></span>
                  </button>
                  <sl-menu
                    #columnMenu
                    size="sm"
                    [sideOffset]="MENU_OFFSET"
                    [attr.aria-label]="t('columnMenu', { column: column.column.label })"
                    [aria-describedby]="
                      column.column.description ? descriptionId(column.id) : undefined
                    "
                  >
                    @if (column.column.description; as description) {
                      <div
                        data-part="column-menu-description"
                        data-part-column-menu-description=""
                        aria-hidden="true"
                      >
                        {{ description }}
                      </div>
                    }
                    @if (column.sortable) {
                      <button
                        slMenuItem
                        [disabled]="isSortedAlone(column.id, 'ascending')"
                        (select)="setSort(column.id, 'ascending', $event)"
                      >
                        {{ t('sortAscendingAction') }}
                      </button>
                      <button
                        slMenuItem
                        [disabled]="isSortedAlone(column.id, 'descending')"
                        (select)="setSort(column.id, 'descending', $event)"
                      >
                        {{ t('sortDescendingAction') }}
                      </button>
                      <button
                        slMenuItem
                        [disabled]="sortOf(column.id) === null"
                        (select)="setSort(column.id, null, $event)"
                      >
                        {{ t('sortClearAction') }}
                      </button>
                      <hr slMenuSeparator />
                    }
                    @if (column.filterable && filterKind(column) !== null) {
                      <button slMenuItem (select)="filterOpen.set(column.id)">
                        {{ t('filterMenu') }}
                      </button>
                    }
                    <button
                      slMenuItem
                      [disabled]="column.pinned === 'start'"
                      (select)="pin(column.id, 'start', $event)"
                    >
                      {{ t('pinStart') }}
                    </button>
                    <button
                      slMenuItem
                      [disabled]="column.pinned === 'end'"
                      (select)="pin(column.id, 'end', $event)"
                    >
                      {{ t('pinEnd') }}
                    </button>
                    @if (column.pinned) {
                      <button slMenuItem (select)="pin(column.id, null, $event)">
                        {{ t('unpin') }}
                      </button>
                    }
                    <hr slMenuSeparator />
                    @if (column.resizable) {
                      <button slMenuItem (select)="fit(column.id, $event.reason, $event)">
                        {{ t('autofit') }}
                      </button>
                      <button slMenuItem (select)="fit(null, $event.reason, $event)">
                        {{ t('autofitAll') }}
                      </button>
                    }
                    @if (column.hideable) {
                      <button slMenuItem (select)="hide(column.id, $event, $event.reason)">
                        {{ t('hide') }}
                      </button>
                    }
                    @if (manageable()) {
                      <button slMenuItem (select)="manageColumns.emit()">
                        {{ t('manageColumns') }}
                      </button>
                    }
                  </sl-menu>
                </span>
                @if (column.resizable) {
                  <div
                    data-part="resizer"
                    data-part-resizer=""
                    aria-hidden="true"
                    [attr.title]="t('resize')"
                    [attr.data-resizing]="resizing() === column.id ? '' : null"
                    (pointerdown)="beginResize($event, column)"
                    (pointermove)="moveResize($event, column)"
                    (pointerup)="endResize($event)"
                    (pointercancel)="endResize($event)"
                    (click)="$event.stopPropagation()"
                    (dblclick)="
                      $event.stopPropagation();
                      fit($event.shiftKey ? null : column.id, 'pointer', $event)
                    "
                  >
                    @if (resizeGuide()?.column === column.id) {
                      <div
                        data-part="resize-guide"
                        data-part-resize-guide=""
                        aria-hidden="true"
                        [style.block-size.px]="resizeGuide()!.span"
                      ></div>
                    }
                  </div>
                }
              </div>
              <ng-template slPopoverLayer>
                <div
                  slPopoverContent
                  [attr.aria-label]="t('filterColumn', { column: column.column.label })"
                >
                  <sl-data-grid-filter-panel
                    [column]="$any(column)"
                    [kind]="filterKind(column)!"
                    [committed]="filterOf(column.id)"
                    [t]="t"
                    [locale]="resolvedLocale()"
                    [counts]="filterKind(column) === 'set' ? countsFor(column.id) : undefined"
                    [customTemplate]="filterTemplate(column.id)"
                    (applyRequest)="applyPanel(column.id, $event)"
                  />
                </div>
              </ng-template>
            </ng-container>
          }
          @if (hasPopin()) {
            <!-- The pop-in's column, named for a reader and given no track. -->
            <div
              data-part="popin-header"
              data-part-popin-header=""
              role="columnheader"
              [attr.aria-colindex]="popinIndex()"
              [attr.data-column]="POPIN"
            >
              {{ t('popinHeader') }}
            </div>
          }
        </div>
        @if (resolvedFilterRow()) {
          <div
            data-part="filter-row"
            data-part-filter-row=""
            role="row"
            [attr.data-row]="FILTER"
            [attr.aria-rowindex]="headerRowCount()"
          >
            @if (hasSelectionColumn()) {
              <div
                data-part="filter-cell"
                data-part-filter-cell=""
                role="gridcell"
                aria-colindex="1"
                tabindex="-1"
                [attr.data-column]="SELECTION"
                [style.--slotted-data-grid-column]="1"
              ></div>
            }
            @if (hasDragColumn()) {
              <div
                data-part="filter-cell"
                data-part-filter-cell=""
                role="gridcell"
                tabindex="-1"
                [attr.aria-colindex]="dragIndex()"
                [attr.data-column]="DRAG"
                [style.--slotted-data-grid-column]="dragIndex()"
              ></div>
            }
            @if (hasExpanderColumn()) {
              <div
                data-part="filter-cell"
                data-part-filter-cell=""
                role="gridcell"
                tabindex="-1"
                [attr.aria-colindex]="expanderIndex()"
                [attr.data-column]="EXPANDER"
                [style.--slotted-data-grid-column]="expanderIndex()"
              ></div>
            }
            @for (column of mountedColumns(); track column.id) {
              <div
                data-part="filter-cell"
                data-part-filter-cell=""
                role="gridcell"
                [attr.aria-colindex]="indexOf(column.id)"
                [attr.data-column]="column.id"
                [attr.data-pinned]="column.pinned"
                [attr.data-pin-edge]="column.pinEdge ? '' : null"
                [attr.data-filtered]="filterOf(column.id) ? '' : null"
                [attr.data-current]="isCurrent(FILTER, column.id) ? '' : null"
                [attr.tabindex]="isCurrent(FILTER, column.id) ? 0 : -1"
                [style.--slotted-data-grid-column]="indexOf(column.id)"
                [style.--slotted-data-grid-pin-offset]="
                  column.pinned ? column.pinOffset + 'px' : null
                "
                (focus)="onCellFocus({ row: FILTER, column: column.id }, $event)"
                (keydown)="onCellKeyDown($event, { row: FILTER, column: column.id })"
                (pointerdown)="onCellPointerDown($event, { row: FILTER, column: column.id })"
              >
                @if (column.filterable && filterKind(column); as kind) {
                  <sl-data-grid-filter-row-operand
                    [column]="$any(column)"
                    [kind]="kind"
                    [committed]="filterOf(column.id)"
                    [t]="t"
                    [locale]="resolvedLocale()"
                    [counts]="kind === 'set' ? countsFor(column.id) : undefined"
                    [debounce]="resolvedDebounce()"
                    [customTemplate]="filterTemplate(column.id)"
                    (filterChange)="setFilter(column.id, $event.filter, $event.reason)"
                  />
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- One row of the body, drawn here and in the held groups at the edges. -->
      <ng-template #bodyRow let-entry>
        <div
          data-part="row"
          data-part-row=""
          role="row"
          [attr.data-row]="entry.node.key"
          [attr.aria-rowindex]="entry.rowIndex"
          [attr.aria-selected]="rowSelectable() ? isSelected(entry.node.key) : null"
          [attr.data-selected]="isSelected(entry.node.key) ? '' : null"
          [attr.data-current]="current()?.row === entry.node.key ? '' : null"
          [attr.data-expanded]="detailOpen(entry.node) ? '' : null"
          [attr.aria-level]="tree() ? entry.node.level : null"
          [attr.aria-expanded]="
            tree() &&
            (entry.node.childCount > 0 || entry.node.open || isLoadingChildren(entry.node.key))
              ? entry.node.open
              : null
          "
          [attr.data-loading]="isLoadingChildren(entry.node.key) ? '' : null"
          [attr.data-dragging]="rowDragState().dragging === entry.node.key ? '' : null"
          [attr.data-disabled]="isDisabled(entry.node.key) ? '' : null"
          [attr.data-editing]="edit()?.cell?.row === entry.node.key ? '' : null"
          [attr.data-index]="entry.index"
        >
          @if (hasSelectionColumn()) {
            <div
              data-part="selection"
              data-part-selection=""
              role="gridcell"
              aria-colindex="1"
              [attr.data-column]="SELECTION"
              [attr.tabindex]="isCurrent(entry.node.key, SELECTION) ? 0 : -1"
              [attr.data-current]="isCurrent(entry.node.key, SELECTION) ? '' : null"
              [style.--slotted-data-grid-column]="1"
              (focus)="onCellFocus({ row: entry.node.key, column: SELECTION }, $event)"
              (keydown)="onCellKeyDown($event, { row: entry.node.key, column: SELECTION })"
              (pointerdown)="onCellPointerDown($event, { row: entry.node.key, column: SELECTION })"
            >
              <span
                slCheckbox
                [checked]="isSelected(entry.node.key)"
                [disabled]="isDisabled(entry.node.key) || undefined"
                [tabIndex]="isCurrent(entry.node.key, SELECTION) ? 0 : -1"
                (checkedChange)="
                  toggleSelected(entry.node.key, {
                    range: shiftHeld($event.source),
                    source: $event.source,
                  })
                "
              >
                <span
                  data-ui="visually-hidden"
                  data-ui-visually-hidden=""
                  data-part="root"
                  data-part-root=""
                  >{{ selectRowLabel(entry.node.key) }}</span
                >
              </span>
            </div>
          }
          @if (hasDragColumn()) {
            <div
              data-part="cell"
              data-part-cell=""
              role="gridcell"
              data-kind="drag"
              [attr.aria-colindex]="dragIndex()"
              [attr.data-column]="DRAG"
              [attr.tabindex]="isCurrent(entry.node.key, DRAG) ? 0 : -1"
              [attr.data-current]="isCurrent(entry.node.key, DRAG) ? '' : null"
              [style.--slotted-data-grid-column]="dragIndex()"
              (focus)="onCellFocus({ row: entry.node.key, column: DRAG }, $event)"
              (keydown)="onCellKeyDown($event, { row: entry.node.key, column: DRAG })"
              (pointerdown)="onCellPointerDown($event, { row: entry.node.key, column: DRAG })"
            >
              <button
                data-part="row-handle"
                data-part-row-handle=""
                type="button"
                [attr.tabindex]="isCurrent(entry.node.key, DRAG) ? 0 : -1"
                [attr.aria-disabled]="rowsReorderableNow() ? null : 'true'"
                [attr.data-disabled]="rowsReorderableNow() ? null : ''"
                [attr.aria-label]="rowHandleLabel(entry.node.key)"
              >
                <span slIcon><svg slGlyph name="grip-vertical"></svg></span>
              </button>
            </div>
          }
          @if (hasExpanderColumn()) {
            <div
              data-part="cell"
              data-part-cell=""
              data-kind="expander"
              role="gridcell"
              [attr.aria-colindex]="expanderIndex()"
              [attr.data-column]="EXPANDER"
              [attr.tabindex]="isCurrent(entry.node.key, EXPANDER) ? 0 : -1"
              [attr.data-current]="isCurrent(entry.node.key, EXPANDER) ? '' : null"
              [style.--slotted-data-grid-column]="expanderIndex()"
              (focus)="onCellFocus({ row: entry.node.key, column: EXPANDER }, $event)"
              (keydown)="onCellKeyDown($event, { row: entry.node.key, column: EXPANDER })"
              (pointerdown)="onCellPointerDown($event, { row: entry.node.key, column: EXPANDER })"
            >
              @if (isExpandable(entry.node.row)) {
                <button
                  data-part="expander"
                  data-part-expander=""
                  type="button"
                  tabindex="-1"
                  [attr.aria-expanded]="isExpanded(entry.node.key)"
                  [attr.aria-controls]="
                    isExpanded(entry.node.key) ? detailId(entry.node.key) : null
                  "
                  [attr.aria-label]="isExpanded(entry.node.key) ? t('collapse') : t('expand')"
                  (click)="toggleExpanded(entry.node.key, $event)"
                >
                  <span slIcon><svg slGlyph name="chevron-right"></svg></span>
                </button>
              }
            </div>
          }
          @for (column of mountedColumns(); track column.id) {
            @let cell = cellState(entry.node, column);
            <div
              [attr.data-part]="column.column.rowHeader ? 'row-header' : 'cell'"
              [attr.data-part-row-header]="column.column.rowHeader ? '' : null"
              [attr.data-part-cell]="column.column.rowHeader ? null : ''"
              [attr.role]="column.column.rowHeader ? 'rowheader' : 'gridcell'"
              [attr.aria-colindex]="indexOf(column.id)"
              [attr.aria-readonly]="cell.readonly ? 'true' : null"
              [attr.aria-selected]="
                resolvedSelectionMode() === 'range' && cell.inRange ? 'true' : null
              "
              [attr.aria-invalid]="cell.invalid ? 'true' : null"
              [attr.data-column]="column.id"
              [attr.data-align]="column.align ?? null"
              [attr.data-numeric]="column.numeric ? '' : null"
              [attr.data-text]="column.text"
              [attr.data-pinned]="column.pinned"
              [attr.data-pin-edge]="column.pinEdge ? '' : null"
              [attr.data-current]="cell.current ? '' : null"
              [attr.data-in-range]="cell.inRange ? '' : null"
              [attr.data-range-edge]="cell.edges.length > 0 ? cell.edges.join(' ') : null"
              [attr.data-editing]="cell.editing ? '' : null"
              [attr.data-invalid]="cell.invalid ? '' : null"
              [attr.data-loading]="cell.pending ? '' : null"
              [attr.data-readonly]="cell.readonly ? '' : null"
              [attr.data-changed]="cell.changed"
              [attr.tabindex]="cell.current ? 0 : -1"
              [attr.title]="cell.invalid ? cell.message : null"
              [style.--slotted-data-grid-column]="indexOf(column.id)"
              [style.--slotted-data-grid-pin-offset]="
                column.pinned ? column.pinOffset + 'px' : null
              "
              (click)="onBodyCellClick($event, { row: entry.node.key, column: column.id })"
              (dblclick)="onCellDoubleClick($event, { row: entry.node.key, column: column.id })"
              (focus)="onCellFocus({ row: entry.node.key, column: column.id }, $event)"
              (keydown)="onCellKeyDown($event, { row: entry.node.key, column: column.id })"
              (pointerdown)="onCellPointerDown($event, { row: entry.node.key, column: column.id })"
              (pointerenter)="
                onCellPointerEnter($event, { row: entry.node.key, column: column.id })
              "
              [attr.data-tree]="cell.tree"
              [style.--slotted-data-grid-level]="cell.tree ? entry.node.level : null"
            >
              @if (cell.tree === 'branch') {
                <button
                  data-part="tree-toggle"
                  data-part-tree-toggle=""
                  type="button"
                  tabindex="-1"
                  [attr.aria-expanded]="entry.node.open"
                  [attr.aria-label]="entry.node.open ? t('collapse') : t('expand')"
                  [attr.data-loading]="isLoadingChildren(entry.node.key) ? '' : null"
                  (click)="$event.stopPropagation(); toggleBranch(entry.node.key, $event)"
                  (pointerdown)="$event.stopPropagation()"
                >
                  <!-- A row waiting for its children turns the chevron into the
                       loader's ring, which the stylesheet spins. -->
                  <span slIcon
                    ><svg
                      slGlyph
                      [name]="isLoadingChildren(entry.node.key) ? 'loader-circle' : 'chevron-right'"
                    ></svg
                  ></span>
                </button>
              } @else if (cell.tree === 'leaf') {
                <span
                  data-part="tree-toggle"
                  data-part-tree-toggle=""
                  data-empty
                  aria-hidden="true"
                ></span>
              }
              @if (cell.editing) {
                <div data-part="editor" data-part-editor="">
                  @if (editorTemplate(column.id); as template) {
                    <ng-container
                      [ngTemplateOutlet]="template"
                      [ngTemplateOutletContext]="editorContext(entry.node, column, cell)"
                    />
                  } @else {
                    <sl-data-grid-editor
                      [column]="$any(column.column)"
                      [draft]="edit()?.drafts?.[column.id]"
                      [value]="cell.value"
                      [invalid]="cell.invalid"
                      [message]="cell.message"
                      [t]="t"
                      [locale]="resolvedLocale()"
                      (draftChange)="setDraft(column.id, $event)"
                    />
                  }
                </div>
              } @else if (cellTemplate(column.id); as template) {
                <ng-container
                  [ngTemplateOutlet]="template"
                  [ngTemplateOutletContext]="cellContext(entry.node, column, cell)"
                />
              } @else {
                <span [attr.title]="cell.text">{{ cell.text }}</span>
              }
            </div>
          }
          @if (hasPopin()) {
            <div
              data-part="popin"
              data-part-popin=""
              role="gridcell"
              [attr.aria-colindex]="popinIndex()"
              [attr.data-column]="POPIN"
              [attr.data-current]="isCurrent(entry.node.key, POPIN) ? '' : null"
              [attr.tabindex]="isCurrent(entry.node.key, POPIN) ? 0 : -1"
              [style.--slotted-data-grid-column]="'1 / -1'"
              (click)="onBodyCellClick($event, { row: entry.node.key, column: POPIN })"
              (dblclick)="onCellDoubleClick($event, { row: entry.node.key, column: POPIN })"
              (focus)="onCellFocus({ row: entry.node.key, column: POPIN }, $event)"
              (keydown)="onCellKeyDown($event, { row: entry.node.key, column: POPIN })"
              (pointerdown)="onCellPointerDown($event, { row: entry.node.key, column: POPIN })"
            >
              @for (column of popinColumns(); track column.id) {
                @let cell = cellState(entry.node, column);
                <div data-part="popin-field" data-part-popin-field="" [attr.data-field]="column.id">
                  @if (column.column.label) {
                    <span data-part="popin-label" data-part-popin-label="">{{
                      column.column.label
                    }}</span>
                  }
                  <!-- Read only: an edit happens in a visible cell, the detail or the record. -->
                  <div
                    data-part="popin-value"
                    data-part-popin-value=""
                    [attr.data-text]="column.text"
                  >
                    @if (cellTemplate(column.id); as template) {
                      <ng-container
                        [ngTemplateOutlet]="template"
                        [ngTemplateOutletContext]="cellContext(entry.node, column, cell)"
                      />
                    } @else {
                      <span [attr.title]="cell.text">{{ cell.text }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
        @if (detailOpen(entry.node) && detailTemplate(); as template) {
          <div
            data-part="detail"
            data-part-detail=""
            role="row"
            [attr.data-row]="entry.node.key + ':detail'"
            [attr.id]="detailId(entry.node.key)"
            [attr.aria-rowindex]="entry.rowIndex + 1"
          >
            <div
              role="gridcell"
              aria-colindex="1"
              tabindex="-1"
              [attr.aria-colspan]="ariaColCount()"
              [style.--slotted-data-grid-column]="'1 / -1'"
            >
              <ng-container
                [ngTemplateOutlet]="template.template"
                [ngTemplateOutletContext]="{
                  $implicit: entry.node.row,
                  row: entry.node.row,
                  key: entry.node.key,
                }"
              />
            </div>
          </div>
        }
      </ng-template>
      @if (pinned().top.length > 0) {
        <div data-part="pinned-rows" data-part-pinned-rows="" data-edge="top" role="rowgroup">
          @for (entry of pinnedTopEntries(); track entry.node.key) {
            <ng-container
              [ngTemplateOutlet]="bodyRow"
              [ngTemplateOutletContext]="{ $implicit: entry }"
            />
          }
        </div>
      }
      @if (status() === 'loading') {
        <div
          data-part="loader"
          data-part-loader=""
          role="rowgroup"
          aria-hidden="true"
          [style.--slotted-data-grid-loader-row-size]="rowSize() + 'px'"
        >
          @for (row of skeletonRowsList(); track row) {
            <div data-part="row" data-part-row="" role="row">
              @for (columnId of columnIds(); track columnId; let index = $index) {
                <div role="gridcell" [style.--slotted-data-grid-column]="index + 1">
                  <!-- The gutters reserve their width and draw nothing: what
                       stands in them is a chooser, a handle and a toggle, and
                       an outline of a control nobody can press yet is a
                       control that lies. The lengths follow the value
                       columns, so a gutter does not shift the sequence. -->
                  @if (index >= gutterCount()) {
                    <span slSkeleton [inlineSize]="skeletonWidth(index - gutterCount())"></span>
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div
          data-part="body"
          data-part-body=""
          role="rowgroup"
          [style.--slotted-data-grid-window-total]="
            windowsRows() ? rowWindow().totalSize + 'px' : null
          "
          [style.--slotted-data-grid-window-start]="
            windowsRows() ? rowWindow().startOffset + 'px' : null
          "
        >
          @for (entry of mountedEntries(); track entry.node.key) {
            @if (entry.node.kind === 'group') {
              <div
                data-part="group-row"
                data-part-group-row=""
                role="row"
                [attr.data-row]="GROUP_PREFIX + entry.node.key"
                [attr.aria-rowindex]="entry.rowIndex"
                [attr.aria-level]="entry.node.level"
                [attr.aria-expanded]="entry.node.expanded"
                [attr.data-current]="current()?.row === GROUP_PREFIX + entry.node.key ? '' : null"
                [style.--slotted-data-grid-level]="entry.node.level"
              >
                <div
                  role="gridcell"
                  aria-colindex="1"
                  [attr.aria-colspan]="firstAggregateIndex() - 1"
                  [attr.data-column]="columnIds()[0]"
                  [attr.tabindex]="
                    isCurrent(GROUP_PREFIX + entry.node.key, columnIds()[0]!) ? 0 : -1
                  "
                  [attr.data-current]="
                    isCurrent(GROUP_PREFIX + entry.node.key, columnIds()[0]!) ? '' : null
                  "
                  [style.--slotted-data-grid-column]="'1 / ' + firstAggregateIndex()"
                  (click)="toggleGroup(entry.node.key, $event)"
                  (focus)="
                    onCellFocus(
                      { row: GROUP_PREFIX + entry.node.key, column: columnIds()[0]! },
                      $event
                    )
                  "
                  (keydown)="
                    onCellKeyDown($event, {
                      row: GROUP_PREFIX + entry.node.key,
                      column: columnIds()[0]!,
                    })
                  "
                  (pointerdown)="
                    onCellPointerDown($event, {
                      row: GROUP_PREFIX + entry.node.key,
                      column: columnIds()[0]!,
                    })
                  "
                >
                  <button
                    data-part="group-toggle"
                    data-part-group-toggle=""
                    type="button"
                    tabindex="-1"
                    [attr.aria-expanded]="entry.node.expanded"
                    [attr.aria-label]="
                      t(entry.node.expanded ? 'collapseGroup' : 'expandGroup', {
                        group: entry.node.text,
                      })
                    "
                    (click)="$event.stopPropagation(); toggleGroup(entry.node.key, $event)"
                  >
                    <span slIcon><svg slGlyph name="chevron-right"></svg></span>
                  </button>
                  @if (groupTemplate(); as template) {
                    <ng-container
                      [ngTemplateOutlet]="template.template"
                      [ngTemplateOutletContext]="groupContext(entry.node)"
                    />
                  } @else {
                    <span>{{ entry.node.text }}</span>
                    <span data-count="">{{ groupCount(entry.node) }}</span>
                  }
                </div>
                @for (column of aggregated(); track column.id) {
                  <div
                    role="gridcell"
                    [attr.aria-colindex]="indexOf(column.id)"
                    [attr.data-column]="column.id"
                    [attr.data-numeric]="column.numeric ? '' : null"
                    [attr.data-align]="column.align ?? null"
                    [attr.data-pinned]="column.pinned"
                    [attr.tabindex]="isCurrent(GROUP_PREFIX + entry.node.key, column.id) ? 0 : -1"
                    [attr.data-current]="
                      isCurrent(GROUP_PREFIX + entry.node.key, column.id) ? '' : null
                    "
                    [style.--slotted-data-grid-column]="indexOf(column.id)"
                    [style.--slotted-data-grid-pin-offset]="
                      column.pinned ? column.pinOffset + 'px' : null
                    "
                    (focus)="
                      onCellFocus({ row: GROUP_PREFIX + entry.node.key, column: column.id }, $event)
                    "
                    (keydown)="
                      onCellKeyDown($event, {
                        row: GROUP_PREFIX + entry.node.key,
                        column: column.id,
                      })
                    "
                    (pointerdown)="
                      onCellPointerDown($event, {
                        row: GROUP_PREFIX + entry.node.key,
                        column: column.id,
                      })
                    "
                  >
                    <span data-aggregate="">{{
                      aggregateText(column, entry.node.aggregates[column.id])
                    }}</span>
                  </div>
                }
              </div>
            } @else {
              <ng-container
                [ngTemplateOutlet]="bodyRow"
                [ngTemplateOutletContext]="{ $implicit: entry }"
              />
            }
          }
          @if (asksForMore()) {
            <div
              #loadMoreMark
              aria-hidden="true"
              [style.bottom.px]="0"
              [style.inline-size.px]="1"
              [style.position]="'absolute'"
              [style.top.px]="loadMoreTop()"
            ></div>
          }
        </div>
      }

      @if (status() !== 'rows' && status() !== 'loading') {
        <div data-part="empty" data-part-empty="">
          @if (emptyTemplate(); as template) {
            <ng-container
              [ngTemplateOutlet]="template.template"
              [ngTemplateOutletContext]="{ $implicit: status(), status: status() }"
            />
          } @else {
            <section slResultState reach="section" tabindex="-1" [status]="resultStatus()">
              <div slResultStateContent>
                <div slResultStateTitle>{{ emptyTitle() }}</div>
                @if (status() === 'error' && error()) {
                  <p slResultStateDescription>{{ error() }}</p>
                }
              </div>
              @if (status() === 'no-results') {
                <div slResultStateActions>
                  <button
                    slButton
                    type="button"
                    size="sm"
                    tone="secondary"
                    variant="outline"
                    (click)="clearFilters($event)"
                  >
                    {{ t('clearFilters') }}
                  </button>
                </div>
              } @else if (status() === 'error') {
                <div slResultStateActions>
                  <button
                    slButton
                    type="button"
                    size="sm"
                    tone="secondary"
                    variant="outline"
                    (click)="onRetry()"
                  >
                    {{ t('retry') }}
                  </button>
                </div>
              }
            </section>
          }
        </div>
      }
      @if (pinned().bottom.length > 0) {
        <div data-part="pinned-rows" data-part-pinned-rows="" data-edge="bottom" role="rowgroup">
          @for (entry of pinnedBottomEntries(); track entry.node.key) {
            <ng-container
              [ngTemplateOutlet]="bodyRow"
              [ngTemplateOutletContext]="{ $implicit: entry }"
            />
          }
        </div>
      }
      @if (hasSummary() && status() === 'rows') {
        <div data-part="summary" data-part-summary="" role="rowgroup">
          <div role="row" [attr.data-row]="SUMMARY" [attr.aria-rowindex]="summaryRowIndex()">
            @for (columnId of gutterIds(); track columnId; let index = $index) {
              <div
                data-part="summary-cell"
                data-part-summary-cell=""
                role="gridcell"
                tabindex="-1"
                [attr.aria-colindex]="index + 1"
                [attr.data-column]="columnId"
                [style.--slotted-data-grid-column]="index + 1"
              ></div>
            }
            @for (column of mountedColumns(); track column.id) {
              <div
                data-part="summary-cell"
                data-part-summary-cell=""
                role="gridcell"
                [attr.aria-colindex]="indexOf(column.id)"
                [attr.data-column]="column.id"
                [attr.data-numeric]="column.numeric ? '' : null"
                [attr.data-align]="column.align ?? null"
                [attr.data-pinned]="column.pinned"
                [attr.data-pin-edge]="column.pinEdge ? '' : null"
                [attr.tabindex]="isCurrent(SUMMARY, column.id) ? 0 : -1"
                [attr.data-current]="isCurrent(SUMMARY, column.id) ? '' : null"
                [style.--slotted-data-grid-column]="indexOf(column.id)"
                [style.--slotted-data-grid-pin-offset]="
                  column.pinned ? column.pinOffset + 'px' : null
                "
                (focus)="onCellFocus({ row: SUMMARY, column: column.id }, $event)"
                (keydown)="onCellKeyDown($event, { row: SUMMARY, column: column.id })"
                (pointerdown)="onCellPointerDown($event, { row: SUMMARY, column: column.id })"
              >
                <span>{{ aggregateText(column, applied().aggregates[column.id]) }}</span>
              </div>
            }
            @if (hasPopinCell(SUMMARY)) {
              <div
                data-part="popin"
                data-part-popin=""
                role="gridcell"
                [attr.aria-colindex]="popinIndex()"
                [attr.data-column]="POPIN"
                [attr.data-current]="isCurrent(SUMMARY, POPIN) ? '' : null"
                [attr.tabindex]="isCurrent(SUMMARY, POPIN) ? 0 : -1"
                [style.--slotted-data-grid-column]="'1 / -1'"
                (focus)="onCellFocus({ row: SUMMARY, column: POPIN }, $event)"
                (keydown)="onCellKeyDown($event, { row: SUMMARY, column: POPIN })"
                (pointerdown)="onCellPointerDown($event, { row: SUMMARY, column: POPIN })"
              >
                @for (column of popinAggregated(); track column.id) {
                  <div
                    data-part="popin-field"
                    data-part-popin-field=""
                    [attr.data-field]="column.id"
                  >
                    @if (column.column.label) {
                      <span data-part="popin-label" data-part-popin-label="">{{
                        column.column.label
                      }}</span>
                    }
                    <div data-part="popin-value" data-part-popin-value="">
                      <span>{{ aggregateText(column, applied().aggregates[column.id]) }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
      @if (dragState().offset !== null) {
        <div
          data-part="drop-indicator"
          data-part-drop-indicator=""
          aria-hidden="true"
          [style.--slotted-data-grid-drop-offset]="dragState().offset + 'px'"
          [style.--slotted-data-grid-drop-scroll]="dragState().scrollTop + 'px'"
        ></div>
      }
      @if (rowDragState().offset !== null) {
        <div
          data-part="drop-indicator"
          data-part-drop-indicator=""
          data-axis="row"
          aria-hidden="true"
          [style.--slotted-data-grid-drop-offset]="rowDragState().offset + 'px'"
          [style.--slotted-data-grid-drop-scroll]="rowDragState().scrollLeft + 'px'"
        ></div>
      }
    </div>
    @if (showsFooter()) {
      <div data-part="footer" data-part-footer="">
        @if (rangeText(); as text) {
          <span data-range="">{{ text }}</span>
        }
        <ng-content select="[slDataGridFooter]" />
        @if (hasMore() && !hasFooterContent()) {
          @if (offersMoreControl()) {
            <div>
              <button
                slButton
                type="button"
                size="sm"
                tone="secondary"
                variant="outline"
                [disabled]="loading()"
                (click)="loadMore.emit()"
              >
                {{ loadMoreFailed() ? t('retry') : t('loadMore') }}
              </button>
            </div>
          } @else if (loading()) {
            <span data-loading-more="" role="status">{{ t('loadingMore') }}</span>
          }
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlDataGrid), multi: true },
  ],
  host: {
    'data-ui': 'data-grid',
    'data-ui-data-grid': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': "tree() ? 'treegrid' : 'grid'",
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'labelledBy() ?? null',
    '[attr.aria-rowcount]': 'ariaRowCount()',
    '[attr.aria-colcount]': 'ariaColCount()',
    '[attr.aria-multiselectable]':
      "resolvedSelectionMode() === 'multiple' || resolvedSelectionMode() === 'range' ? 'true' : null",
    '[attr.aria-busy]': "loading() && status() !== 'loading' ? 'true' : null",
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-striped]': "resolvedStriped() ? '' : null",
    '[attr.data-sticky-header]': "resolvedStickyHeader() ? '' : null",
    '[attr.data-sticky-to]': "resolvedStickyTo() === 'page' ? 'page' : null",
    '[attr.data-selection]': "resolvedSelectionMode() === 'none' ? null : resolvedSelectionMode()",
    '[attr.data-filter-row]': "resolvedFilterRow() ? '' : null",
    '[attr.data-rows]': "autoRows() ? 'auto' : 'fixed'",
    '[attr.data-slotted-density]': 'density() ?? null',
    '[attr.data-popin]': 'hasPopin() ? outOfSpace().popin.length : null',
    '[attr.data-narrow]': "viewport().width > 0 && viewport().width < narrowBelow ? '' : null",
    '[style.--slotted-data-grid-viewport]': "viewport().width > 0 ? viewport().width + 'px' : null",
    '[style.--slotted-data-grid-template]': 'template()',
    '[style.--slotted-data-grid-block-size]': 'blockSize()',
    '[style.--slotted-data-grid-row-block-size]': 'rowBlockSize()',
    '[style.--slotted-data-grid-leading]': "hasPopin() ? leading() + 'px' : null",
    '[style.--slotted-data-grid-changed-duration]': 'changedDuration()',
    '(keydown)': 'onRootKeyDown($event)',
    '(focusout)': 'onRootFocusOut($event)',
  },
})
export class SlDataGrid<Row = unknown> implements ControlValueAccessor {
  protected readonly HEADER = HEADER_ROW;
  protected readonly FILTER = FILTER_ROW;
  protected readonly SUMMARY = SUMMARY_ROW;
  protected readonly GROUP_PREFIX = GROUP_ROW_PREFIX;
  protected readonly SELECTION = SELECTION_COLUMN;
  protected readonly EXPANDER = EXPANDER_COLUMN;
  protected readonly DRAG = DRAG_COLUMN;
  protected readonly POPIN = POPIN_COLUMN_ID;
  /** The room between the header and the menu it opens: one space step. */
  protected readonly MENU_OFFSET = 4;

  /* ── Data ───────────────────────────────────────────────────────────── */
  /** The rows, or nothing when a `dataSource` answers for them. */
  readonly rowsInput = input<readonly Row[] | undefined>(undefined, { alias: 'rows' });
  /**
   * The grid asks for its own rows: `getRows` is called with the query on
   * every change, the request before it aborted, and the answer is kept by
   * the query's text. The grid is in `server` mode, with the loading and the
   * error states of its own; `reload()` drops the cache.
   */
  readonly dataSource = input<DataGridDataSource<Row> | undefined>(undefined);
  readonly rowKey = input.required<keyof Row | ((row: Row) => string)>();
  readonly columns = input.required<readonly GridColumn<Row>[]>();
  readonly columnGroups = input<readonly GridColumnGroup[] | undefined>(undefined);
  readonly mode = input<DataGridMode | undefined>(undefined);
  readonly totalCountInput = input<number | undefined, number | string | undefined>(undefined, {
    alias: 'totalCount',
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  readonly hasMoreInput = input<boolean | undefined, boolean | string | undefined>(undefined, {
    alias: 'hasMore',
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * A load in flight. Zero rows is an answer too: after the grid has drawn
   * one, `true` keeps it — the empty state stays and no skeleton is drawn —
   * so a refetch of an empty list does not flicker. `'initial'` asks for the
   * skeleton anyway, for a grid that stays mounted across two different sets.
   */
  readonly loadingInput = input<DataGridLoading, DataGridLoading | string | null | undefined>(
    false,
    {
      alias: 'loading',
      transform: (value) =>
        value === 'initial' || value === 'refresh' ? value : booleanAttribute(value),
    },
  );
  readonly errorInput = input<string | null | undefined>(undefined, { alias: 'error' });
  /* With a source the grid asks for its rows itself; what the consumer gave
     for rows, total, loading and error is what the source answered. */
  private readonly sourced = signal<{
    result: DataGridDataSourceResult<Row> | null;
    loading: boolean;
    error: string | null;
  }>({ result: null, loading: false, error: null });
  protected readonly rows = computed<readonly Row[]>(() =>
    this.dataSource()
      ? (this.sourced().result?.rows ?? EMPTY_ROWS)
      : (this.rowsInput() ?? EMPTY_ROWS),
  );
  protected readonly totalCount = computed(() =>
    this.dataSource() ? this.sourced().result?.total : this.totalCountInput(),
  );
  protected readonly hasMore = computed(() =>
    this.dataSource() ? this.sourced().result?.hasMore : this.hasMoreInput(),
  );
  private readonly loadingGiven = computed<DataGridLoading>(() =>
    this.dataSource() ? this.sourced().loading : this.loadingInput(),
  );
  protected readonly loading = computed(() => this.loadingGiven() !== false);
  protected readonly error = computed(() =>
    this.dataSource() ? this.sourced().error : this.errorInput(),
  );
  readonly disabledKeys = input<readonly string[]>([]);
  /**
   * Marks a mounted cell whose value changed between two `rows`, for the
   * stated milliseconds (`true` is 1200). A row that arrived is not a change.
   */
  readonly highlightChanges = input<boolean | number | undefined>(undefined);

  /* ── Models ─────────────────────────────────────────────────────────── */
  readonly query = model<GridQuery>(emptyQuery());
  readonly columnState = model<Partial<GridColumnState> | undefined>(undefined);
  readonly value = model<DataGridSelection>(null);
  readonly range = model<GridRange | null>(null);
  readonly current = model<GridCell | null>(null);
  readonly expanded = model<readonly string[]>([]);
  readonly expandedGroups = model<DataGridExpandedGroups>('all');

  readonly queryChangeRequest = output<DataGridQueryRequest>();
  readonly columnStateChangeRequest = output<DataGridColumnStateRequest>();
  readonly valueChangeRequest = output<ChangeRequest<DataGridSelection>>();
  readonly rangeChangeRequest = output<ChangeRequest<GridRange | null>>();
  readonly currentChangeRequest = output<ChangeRequest<GridCell | null>>();
  readonly expandedChangeRequest = output<ChangeRequest<readonly string[]>>();
  readonly expandedGroupsChangeRequest = output<ChangeRequest<DataGridExpandedGroups>>();

  readonly editStart = output<GridCell>();
  readonly editCommit = output<DataGridEditCommit<Row>>();
  readonly editCancel = output<GridCell>();
  readonly activate = output<DataGridActivateEvent>();
  readonly loadMore = output<void>();
  protected readonly asksForMore = computed(
    () =>
      this.hasMore() === true &&
      !this.loading() &&
      this.resolvedLoadMore() !== 'button' &&
      !this.loadMoreFailed(),
  );
  protected readonly loadMoreTop = computed(() => {
    const index = Math.max(0, this.nodes().length - this.resolvedThreshold());
    const metrics = this.metrics();
    return metrics ? metrics.offsetOf(index) : index * this.rowSize();
  });
  /** A branch `hasChildren` says has children opened and none are in `rows`. */
  readonly loadChildren = output<{ key: string; row: Row }>();
  readonly rowsReorder = output<DataGridRowsReorderEvent>();
  readonly retry = output<void>();
  readonly manageColumns = output<void>();
  /** The columns a narrow frame has taken out by their `priority`, each time either set changes. */
  readonly outOfSpaceChange = output<GridOutOfSpace>();

  /* ── Axes ───────────────────────────────────────────────────────────── */
  readonly variant = input<DataGridVariant | undefined>(undefined);
  /**
   * The density of this grid alone, written as `data-slotted-density` on the
   * root; absent or `null`, the grid takes the page's. The layers it opens
   * are portals and stay at the page's density.
   */
  readonly density = input<GridDensity | null | undefined>(undefined);
  readonly striped = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly stickyHeader = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly stickyTo = input<DataGridStickyTo | undefined>(undefined);
  readonly selectionMode = input<DataGridSelectionMode | undefined>(undefined);
  readonly editMode = input<DataGridEditMode | undefined>(undefined);
  readonly filterRow = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly virtualize = input<DataGridVirtualize | undefined>(undefined);
  readonly rowHeight = input<DataGridRowHeight | undefined>(undefined);
  /**
   * What a frame too narrow for the template does. `popin` moves the columns
   * of least `priority` into a pop-in at the foot of each row, as labelled
   * values; `scroll` keeps every column and scrolls sideways; `auto`, the
   * default, pops in on a frame under 600px, or under 1024px when the main
   * pointer is coarse, and scrolls elsewhere.
   */
  readonly columnOverflow = input<DataGridColumnOverflow | undefined>(undefined);
  readonly overscan = input<number | undefined>(undefined);
  readonly filterDebounce = input<number | undefined>(undefined);
  readonly loadMoreThreshold = input<number | undefined>(undefined);
  /**
   * What asks for the next page. `scroll` asks when the window nears the end,
   * `button` only from the Load more control, `both` does the two. Default
   * `scroll`.
   */
  readonly loadMoreTrigger = input<DataGridLoadMoreTrigger | undefined>(undefined);
  /** The last page asked for failed: the automatic request stops and the footer offers a retry. */
  readonly loadMoreFailed = input(false, { transform: booleanAttribute });
  readonly skeletonRows = input<number | undefined>(undefined);
  readonly activatable = input(false, { transform: booleanAttribute });
  /**
   * Whether the column menu offers Manage columns. The grid has no manager of
   * its own — `column-manager` edits `columnState` — so the item is drawn only
   * for an application that answers `manageColumns`, the way React draws it
   * only when `onManageColumns` is given.
   */
  readonly manageable = input(false, { transform: booleanAttribute });
  readonly expandable = input<boolean | ((row: Row) => boolean) | undefined>(undefined);
  /**
   * Rows as a tree: each row names its parent by key. The open branches are
   * `expanded`; `query.group` is ignored. The root is a `treegrid`.
   */
  readonly tree = input<GridTree<Row> | undefined>(undefined);
  /**
   * A handle per row, dragged with the pointer or moved with Alt and the
   * vertical arrows. The grid keeps no order of its own: `rowsReorder` says
   * where the row goes in `rows` and the consumer moves it. Only while the
   * query is at rest — no sort, filter, search or group — and without a
   * tree; elsewhere the handle is disabled.
   */
  readonly rowsReorderable = input(false, { transform: booleanAttribute });
  /**
   * Rows held at the top or the bottom of the body, by key, in the stated
   * order: out of the query — never sorted, filtered or paged — and always on
   * screen, under the head and over the summary.
   */
  readonly pinnedRows = input<DataGridPinnedRows | undefined>(undefined);
  readonly height = input<string | number | undefined>(undefined);
  /** The id of the element that names the grid; a static `aria-label` names it directly. */
  readonly labelledBy = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * grid's name (`grid`), every control, state and announcement.
   */
  readonly messages = input<PartialMessages<DataGridMessages> | undefined>(undefined);
  /** The locale cells, numbers and dates are written in. Default: the language in force. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly showRange = input<boolean | undefined>(undefined);

  /* ── Templates ──────────────────────────────────────────────────────── */
  private readonly cellTemplates = contentChildren(SlDataGridCellTemplate);
  private readonly editorTemplates = contentChildren(SlDataGridEditorTemplate);
  private readonly headerTemplates = contentChildren(SlDataGridHeaderTemplate);
  private readonly filterTemplates = contentChildren(SlDataGridFilterTemplate);
  private readonly helpTemplates = contentChildren(SlDataGridColumnHelp);
  protected readonly detailTemplate = contentChild(SlDataGridDetailTemplate);
  protected readonly groupTemplate = contentChild(SlDataGridGroupTemplate);
  protected readonly emptyTemplate = contentChild(SlDataGridEmptyTemplate);
  private readonly footerContent = contentChild(SlDataGridFooter);

  private readonly scrollRef = viewChild<ElementRef<HTMLDivElement>>('scroll');
  private readonly loadMoreMark = viewChild<ElementRef<HTMLDivElement>>('loadMoreMark');
  private readonly columnMenus = viewChildren(SlMenu);
  private readonly defaults = injectDataGridDefaults();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly id = inject(SlDataGridIdFactory).next();

  /* ── Resolution ─────────────────────────────────────────────────────── */
  /** The family's words in the language in force, with this grid's `messages` laid over them. */
  readonly t = injectMessages(dataGridMessages, this.messages);
  /** What a drag of a column or a row says, in the language in force. */
  private readonly dragT = injectMessages(dragMessages);
  private readonly providedLocale = injectLocale();
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedStriped = computed(() => this.striped() ?? this.defaults.striped);
  protected readonly resolvedStickyHeader = computed(
    () => this.stickyHeader() ?? this.defaults.stickyHeader,
  );
  protected readonly resolvedStickyTo = computed(() => this.stickyTo() ?? this.defaults.stickyTo);
  protected readonly resolvedSelectionMode = computed(
    () => this.selectionMode() ?? this.defaults.selectionMode,
  );
  protected readonly resolvedEditMode = computed(() => this.editMode() ?? this.defaults.editMode);
  protected readonly resolvedFilterRow = computed(
    () => this.filterRow() ?? this.defaults.filterRow,
  );
  protected readonly resolvedVirtualize = computed(
    () => this.virtualize() ?? this.defaults.virtualize,
  );
  protected readonly resolvedRowHeight = computed(
    () => this.rowHeight() ?? this.defaults.rowHeight,
  );
  protected readonly resolvedColumnOverflow = computed(
    () => this.columnOverflow() ?? this.defaults.columnOverflow,
  );
  protected readonly resolvedOverscan = computed(() => this.overscan() ?? this.defaults.overscan);
  protected readonly resolvedDebounce = computed(
    () => this.filterDebounce() ?? this.defaults.filterDebounce,
  );
  protected readonly resolvedThreshold = computed(
    () => this.loadMoreThreshold() ?? this.defaults.loadMoreThreshold,
  );
  protected readonly resolvedLoadMore = computed(
    () => this.loadMoreTrigger() ?? this.defaults.loadMoreTrigger,
  );
  /**
   * Under `scroll` the request is automatic: a quiet status while the page
   * loads, and a control only to retry one that failed. A Load more control
   * beside a list that loads itself read as a control with no purpose.
   */
  protected readonly offersMoreControl = computed(
    () => this.resolvedLoadMore() !== 'scroll' || this.loadMoreFailed(),
  );
  protected readonly resolvedSkeleton = computed(
    () => this.skeletonRows() ?? this.defaults.skeletonRows,
  );
  protected readonly resolvedLocale = computed(() => this.locale() ?? this.providedLocale());
  protected readonly resolvedMode = computed<DataGridMode>(
    () =>
      this.mode() ??
      (this.dataSource() || this.totalCount() !== undefined || this.hasMore() !== undefined
        ? 'server'
        : 'client'),
  );
  protected readonly ariaLabel = computed(
    () => this.ownLabel ?? (this.labelledBy() ? null : this.t('grid')),
  );
  protected readonly blockSize = computed(() => {
    const height = this.height();
    return height === undefined ? null : typeof height === 'number' ? `${height}px` : height;
  });
  /* A stated row height is the drawn row as well as the windowed one: the
     window's offsets are computed from it, and a row drawn at the density's
     height under a taller estimate drifted away from its own place. */
  protected readonly rowBlockSize = computed(() => {
    const height = this.resolvedRowHeight();
    return typeof height === 'number' ? `${height}px` : null;
  });
  /* A row with a pop-in is as tall as its fields, whatever the stated
     height: it is measured one by one, as an `auto` row is. */
  protected readonly autoRows = computed(
    () => this.resolvedRowHeight() === 'auto' || this.hasPopin(),
  );

  private readonly formatOptions = computed(() => ({
    locale: this.resolvedLocale(),
    timeZone: this.timeZone(),
    booleans: { true: this.t('filterYes'), false: this.t('filterNo') },
  }));

  rowKeyOf(row: Row): string {
    const key = this.rowKey();
    return typeof key === 'function' ? key(row) : String((row as Record<keyof Row, unknown>)[key]);
  }
  textOf(column: GridColumn<Row>, row: Row): string {
    return cellText(column, row, this.formatOptions());
  }
  private readonly disabledSet = computed(() => new Set(this.disabledKeys()));
  isDisabled(key: string) {
    return this.disabledSet().has(key);
  }
  isEditable(column: GridColumn<Row>, row: Row) {
    if (this.disabledSet().has(this.rowKeyOf(row))) return false;
    const editable = column.editable;
    return typeof editable === 'function' ? editable(row) : editable === true;
  }
  private readonly anyEditable = computed(() => this.columns().some((column) => column.editable));
  isExpandable(row: Row) {
    if (!this.detailTemplate()) return false;
    const expandable = this.expandable();
    if (expandable === undefined) return true;
    return typeof expandable === 'function' ? expandable(row) : expandable;
  }

  /* ── Columns ────────────────────────────────────────────────────────── */
  private readonly effectiveState = computed(() =>
    normalizeColumnState(this.columnState(), this.columns()),
  );
  /** The gutters' width, before the first data column; where a pop-in's fields start. */
  protected readonly leading = computed(() =>
    this.gutters().reduce((sum, width) => sum + width, 0),
  );
  /** Every column the reader has not hidden, before the frame's width is asked. */
  private readonly layout = computed(() =>
    resolveColumns(this.columns(), this.effectiveState(), { leading: this.leading() }),
  );
  /** The scroller's inner width; 0 until it is measured, and nothing is taken out before. */
  private readonly frameWidth = signal(0);
  /** Whether the main pointer is coarse — a finger. A render without `matchMedia` reads a fine one. */
  private readonly coarsePointer = signal(false);
  /** The policy the frame's width and the pointer settle `auto` to. */
  private readonly effectiveColumnOverflow = computed(() =>
    resolveColumnOverflow(this.resolvedColumnOverflow(), this.frameWidth(), this.coarsePointer()),
  );
  /**
   * The columns a frame too narrow for the template has taken out, by their
   * `priority`: those drawn in each row's pop-in, and those that declined it
   * with `popin: false`. Read from the frame's width, which neither set
   * changes, so the measure never loops. Never in `columnState`. Empty while
   * `columnOverflow` settles to `scroll`.
   *
   * The width is read first: an unmeasured frame takes nothing out and reads
   * no input, so a template that reads the set before the grid's inputs are
   * bound — a column manager written before the grid — gets an empty set.
   */
  readonly outOfSpace: Signal<GridOutOfSpace> = computed(
    () => {
      const available = this.frameWidth();
      if (available <= 0 || this.effectiveColumnOverflow() === 'scroll') return NONE_OUT;
      return columnsOutOfSpace(this.layout(), available, { leading: this.leading() });
    },
    { equal: (a, b) => sameKeys(a.popin, b.popin) && sameKeys(a.hidden, b.hidden) },
  );
  protected readonly resolved = computed(() => {
    const out = this.outOfSpace();
    if (out.popin.length === 0 && out.hidden.length === 0) return this.layout();
    const state = this.effectiveState();
    return resolveColumns(
      this.columns(),
      { ...state, hidden: [...state.hidden, ...out.popin, ...out.hidden] },
      { leading: this.leading() },
    );
  });
  /** The columns drawn in each row's pop-in, in the order of the resolved columns. */
  protected readonly popinColumns = computed(() => {
    const popin = this.outOfSpace().popin;
    return popin.length === 0 ? [] : this.layout().filter((column) => popin.includes(column.id));
  });
  protected readonly hasPopin = computed(() => this.outOfSpace().popin.length > 0);
  private readonly resolvedById = computed(
    () => new Map(this.resolved().map((column) => [column.id, column])),
  );
  protected readonly hasSelectionColumn = computed(
    () => this.resolvedSelectionMode() === 'single' || this.resolvedSelectionMode() === 'multiple',
  );
  protected readonly hasExpanderColumn = computed(() => this.detailTemplate() !== undefined);
  protected readonly rowSelectable = this.hasSelectionColumn;
  protected readonly hasDragColumn = computed(() => this.rowsReorderable());
  private readonly gutters = computed(() => [
    ...(this.hasSelectionColumn() ? [SELECTION_WIDTH] : []),
    ...(this.hasDragColumn() ? [DRAG_WIDTH] : []),
    ...(this.hasExpanderColumn() ? [EXPANDER_WIDTH] : []),
  ]);
  protected readonly gutterIds = computed(() => [
    ...(this.hasSelectionColumn() ? [SELECTION_COLUMN] : []),
    ...(this.hasDragColumn() ? [DRAG_COLUMN] : []),
    ...(this.hasExpanderColumn() ? [EXPANDER_COLUMN] : []),
  ]);
  protected readonly columnIds = computed(() => [
    ...this.gutterIds(),
    ...this.resolved().map((column) => column.id),
  ]);
  protected readonly gutterCount = computed(() => this.gutterIds().length);
  /** The pop-in is one more column for a reader, after every visible one, with no track. */
  protected readonly ariaColCount = computed(
    () => this.columnIds().length + (this.hasPopin() ? 1 : 0),
  );
  protected readonly popinIndex = computed(() => this.columnIds().length + 1);
  /** The columns the cursor walks: the visible ones, then the pop-in's. */
  private readonly cursorColumns = computed(() =>
    this.hasPopin() ? [...this.columnIds(), POPIN_COLUMN_ID] : this.columnIds(),
  );
  protected readonly expanderIndex = computed(() => this.columnIds().indexOf(EXPANDER_COLUMN) + 1);
  protected readonly dragIndex = computed(() => this.columnIds().indexOf(DRAG_COLUMN) + 1);
  protected readonly template = computed(() => columnTemplate(this.resolved(), this.gutters()));
  protected readonly hasGroups = computed(() => (this.columnGroups()?.length ?? 0) > 0);
  protected readonly headerRowCount = computed(
    () => 1 + (this.hasGroups() ? 1 : 0) + (this.resolvedFilterRow() ? 1 : 0),
  );
  protected indexOf(columnId: string) {
    return this.columnIds().indexOf(columnId) + 1;
  }
  protected filterKind(column: ResolvedGridColumn<Row>): FilterKind | null {
    return filterKindOf(column.kind);
  }

  /* ── The applied query ──────────────────────────────────────────────── */
  /* Held rows leave the query: what is sorted, filtered and paged is the
     rest. Each becomes a node of its own, outside the body's count. */
  protected readonly pinned = computed(() => {
    const held = this.pinnedRows();
    const top = held?.top ?? [];
    const bottom = held?.bottom ?? [];
    if (top.length === 0 && bottom.length === 0) {
      return {
        top: [] as RowNode[],
        bottom: [] as RowNode[],
        keys: null as ReadonlySet<string> | null,
      };
    }
    const byKey = new Map<string, Row>();
    for (const row of this.rows()) byKey.set(this.rowKeyOf(row), row);
    const nodesOf = (keys: readonly string[]) =>
      keys.flatMap((key): RowNode[] => {
        const row = byKey.get(key);
        return row === undefined
          ? []
          : [
              {
                kind: 'row',
                key,
                row,
                index: -1,
                groups: [],
                level: 1,
                parent: null,
                childCount: 0,
                open: false,
              },
            ];
      });
    return { top: nodesOf(top), bottom: nodesOf(bottom), keys: new Set([...top, ...bottom]) };
  });
  private readonly bodyRows = computed(() => {
    const keys = this.pinned().keys;
    return keys ? this.rows().filter((row) => !keys.has(this.rowKeyOf(row))) : this.rows();
  });
  protected readonly pinnedTopEntries = computed(() => {
    const first = this.headerRowCount() + 1;
    return this.pinned().top.map((node, offset) => ({ node, index: -1, rowIndex: first + offset }));
  });
  protected readonly pinnedBottomEntries = computed(() => {
    const first =
      this.headerRowCount() + this.pinned().top.length + (this.total() ?? this.nodes().length) + 1;
    return this.pinned().bottom.map((node, offset) => ({
      node,
      index: -1,
      rowIndex: first + offset,
    }));
  });
  protected readonly applied = computed(() => {
    const rows = this.bodyRows();
    const query = this.query();
    if (this.resolvedMode() === 'server') {
      /* Sorted, filtered and paged by the server; grouped here, in the order
         the rows came, so a page ordered by date shows its days. */
      const nodes = groupInOrder(rows, this.columns(), query.group, {
        rowKey: (row) => this.rowKeyOf(row),
        expandedGroups: this.expandedGroups(),
        offset: query.page && 'index' in query.page ? query.page.index * query.page.size : 0,
        ...this.formatOptions(),
      });
      return {
        nodes,
        rows,
        total: this.totalCount() ?? null,
        hasMore: this.hasMore() ?? false,
        aggregates: {} as Record<string, unknown>,
      };
    }
    const applied = applyQuery(rows, this.columns(), query, {
      rowKey: (row) => this.rowKeyOf(row),
      expandedGroups: this.expandedGroups(),
      tree: this.tree(),
      expanded: this.tree() ? this.expanded() : undefined,
      ...this.formatOptions(),
    });
    return { ...applied, total: applied.total as number | null };
  });
  protected readonly nodes = computed(() => this.applied().nodes);
  protected readonly total = computed(() => this.applied().total);
  protected readonly aggregated = computed(() =>
    this.resolved().filter((column) => column.column.aggregate !== undefined),
  );
  /** The aggregating columns in the pop-in: the summary row draws their totals in its own. */
  protected readonly popinAggregated = computed(() =>
    this.popinColumns().filter((column) => column.column.aggregate !== undefined),
  );
  protected readonly hasSummary = computed(
    () =>
      this.aggregated().length + this.popinAggregated().length > 0 &&
      this.resolvedMode() === 'client',
  );
  protected readonly firstAggregateIndex = computed(() => {
    const aggregated = this.aggregated();
    return aggregated.length === 0
      ? this.columnIds().length + 1
      : Math.min(...aggregated.map((column) => this.indexOf(column.id)));
  });
  /* The last answer the grid drew. Zero rows is an answer, and a refetch of
     it keeps the empty state rather than drawing a skeleton over it (AF-02).
     Rows emptied by the consumer while a load starts are a new set, and wait
     in the skeleton. */
  private readonly lastAnswer = linkedSignal<
    { loading: boolean; error: boolean; empty: boolean },
    'rows' | 'empty' | null
  >({
    source: () => ({
      loading: this.loading(),
      error: Boolean(this.error()),
      empty: this.rows().length === 0,
    }),
    computation: (now, previous) =>
      !now.loading && !now.error ? (now.empty ? 'empty' : 'rows') : (previous?.value ?? null),
  });
  /* `lastAnswer` is read on every evaluation: a linked signal computes when it
     is read, and one skipped while the grid showed its answer would miss it. */
  private readonly firstLoad = computed(() => {
    const lastAnswer = this.lastAnswer();
    const given = this.loadingGiven();
    return given === 'initial' || (given === true && lastAnswer !== 'empty');
  });
  protected readonly status = computed<'rows' | 'empty' | 'no-results' | 'error' | 'loading'>(
    () => {
      if (this.error()) return 'error';
      if (this.firstLoad() && this.rows().length === 0) return 'loading';
      if (this.nodes().length > 0) return 'rows';
      const query = this.query();
      return query.filter || query.search.trim() ? 'no-results' : 'empty';
    },
  );
  protected readonly resultStatus = computed<'empty' | 'no-results' | 'error'>(() => {
    const status = this.status();
    return status === 'error' || status === 'no-results' ? status : 'empty';
  });
  protected readonly emptyTitle = computed(() => {
    const status = this.status();
    return this.t(status === 'error' ? 'error' : status === 'no-results' ? 'noResults' : 'empty');
  });
  protected readonly ariaRowCount = computed(
    () =>
      (this.total() === null ? -1 : (this.total() as number)) +
      this.pinned().top.length +
      this.pinned().bottom.length +
      this.headerRowCount() +
      (this.hasSummary() ? 1 : 0),
  );
  protected readonly summaryRowIndex = computed(
    () =>
      this.headerRowCount() +
      this.pinned().top.length +
      (this.total() ?? this.nodes().length) +
      this.pinned().bottom.length +
      1,
  );
  /* A first load draws as many skeleton rows as the frame shows, capped at
     the page the query asks for: eight rows in a frame of twenty-five left
     the rest of the frame empty and the page that arrived was a different
     picture. An unmeasured frame draws the stated count. */
  protected readonly skeletonRowsList = computed(() => {
    const page = this.query().page?.size;
    const height = this.viewport().height;
    const count =
      height === 0
        ? this.resolvedSkeleton()
        : Math.max(1, Math.min(page ?? Infinity, Math.ceil(height / this.rowSize())));
    return Array.from({ length: count }, (_unused, index) => index);
  });
  protected skeletonWidth(index: number) {
    return `${[70, 55, 80, 40, 60][index % 5]}%`;
  }

  /* ── Cursor axis ────────────────────────────────────────────────────── */
  private readonly cursorRows = computed(() => {
    const list = [HEADER_ROW];
    if (this.resolvedFilterRow()) list.push(FILTER_ROW);
    for (const node of this.pinned().top) list.push(node.key);
    for (const node of this.nodes())
      list.push(node.kind === 'group' ? `${GROUP_ROW_PREFIX}${node.key}` : node.key);
    for (const node of this.pinned().bottom) list.push(node.key);
    if (this.hasSummary()) list.push(SUMMARY_ROW);
    return list;
  });
  private readonly bodyStart = computed(() => 1 + (this.resolvedFilterRow() ? 1 : 0));
  private readonly bodyEnd = computed(
    () =>
      this.bodyStart() +
      this.pinned().top.length +
      this.nodes().length +
      this.pinned().bottom.length,
  );

  /* ── Virtual rows ───────────────────────────────────────────────────── */
  private readonly scrollTop = signal(0);
  private readonly scrollLeft = signal(0);
  protected readonly viewport = signal({ width: 0, height: 0 });
  /** The scroller's width under which the pop-in's fields start at the row's own padding. */
  protected readonly narrowBelow = COMPACT_BELOW;
  private readonly measuredRow = signal<number | null>(null);
  private readonly rowSizes = signal<ReadonlyMap<number, number>>(new Map());
  /** The body row's height: stated, or measured from the rows drawn, or the default. */
  protected readonly rowSize = computed(() => {
    const stated = this.resolvedRowHeight();
    return typeof stated === 'number' ? stated : (this.measuredRow() ?? DEFAULT_ROW_HEIGHT);
  });
  protected readonly windowsRows = computed(() => {
    const mode = this.resolvedVirtualize();
    return mode === true || (mode === 'auto' && this.nodes().length > VIRTUALIZE_ROWS_FROM);
  });
  private readonly metrics = computed(() => {
    if (!this.autoRows()) return undefined;
    const sizes = this.rowSizes();
    const size = this.rowSize();
    return createRowMetrics(this.nodes().map((_node, index) => sizes.get(index) ?? size));
  });
  protected readonly rowWindow = computed(() => {
    const count = this.nodes().length;
    if (!this.windowsRows())
      return { startIndex: 0, endIndex: count, startOffset: 0, totalSize: 0 };
    /* Before the scroller is measured the window is provisional — a screen's
       worth of rows — rather than the whole set. */
    const win = virtualWindow({
      itemCount: count,
      itemSize: this.rowSize(),
      metrics: this.metrics(),
      overscan: this.resolvedOverscan(),
      scrollOffset: Math.max(0, this.scrollTop()),
      viewportSize: this.viewport().height || PROVISIONAL_VIEWPORT,
    });
    return {
      startIndex: win.startIndex,
      endIndex: win.endIndex,
      startOffset: win.startOffset,
      totalSize: win.totalSize,
    };
  });
  private readonly heldRows = signal<readonly string[]>([]);
  protected readonly mountedEntries = computed(() => {
    const nodes = this.nodes();
    const window_ = this.rowWindow();
    const mounted = this.windowsRows() ? nodes.slice(window_.startIndex, window_.endIndex) : nodes;
    const extra = this.heldRows()
      .map((key) => nodes.find((node) => node.key === key))
      .filter((node): node is GridNode<Row> => node !== undefined && !mounted.includes(node));
    const headerRows = this.headerRowCount() + this.pinned().top.length;
    const first = this.windowsRows() ? window_.startIndex : 0;
    return [...mounted, ...extra].map((node, offset) => {
      const index = first + offset;
      return { node, index, rowIndex: headerRows + 1 + (node.kind === 'row' ? node.index : index) };
    });
  });

  /* ── Virtual columns ────────────────────────────────────────────────── */
  private readonly middle = computed(() =>
    this.resolved().filter((column) => column.pinned === null),
  );
  private readonly windowsColumns = computed(() => {
    const mode = this.resolvedVirtualize();
    return mode === true || (mode === 'auto' && this.middle().length > VIRTUALIZE_COLUMNS_FROM);
  });
  protected readonly mountedColumns = computed(() => {
    const resolved = this.resolved();
    if (!this.windowsColumns() || this.viewport().width === 0) return resolved;
    const gutterWidth = this.gutters().reduce((sum, width) => sum + width, 0);
    const startZone = resolved
      .filter((column) => column.pinned === 'start')
      .reduce((sum, column) => sum + column.width, 0);
    const endZone = resolved
      .filter((column) => column.pinned === 'end')
      .reduce((sum, column) => sum + column.width, 0);
    const from = this.scrollLeft() - COLUMN_OVERSCAN_PX;
    const to = this.scrollLeft() + this.viewport().width - endZone + COLUMN_OVERSCAN_PX;
    let offset = gutterWidth + startZone;
    const kept = new Set<string>();
    for (const column of this.middle()) {
      const end = offset + column.width;
      if (end >= from && offset <= to) kept.add(column.id);
      offset = end;
    }
    const current = this.current();
    return resolved.filter(
      (column) => column.pinned !== null || kept.has(column.id) || current?.column === column.id,
    );
  });

  /* ── Selection ──────────────────────────────────────────────────────── */
  private readonly selectableKeys = computed(() => {
    const source = this.resolvedMode() === 'client' ? this.applied().rows : this.bodyRows();
    const pinned = this.pinned();
    return [
      ...pinned.top.map((node) => node.key),
      ...source.map((row) => this.rowKeyOf(row)),
      ...pinned.bottom.map((node) => node.key),
    ].filter((key) => !this.disabledSet().has(key));
  });
  private readonly selectedList = computed<readonly string[]>(() => {
    const value = this.value();
    return Array.isArray(value)
      ? value
      : value === null || value === undefined
        ? []
        : [value as string];
  });
  private readonly selectedSet = computed(() => new Set(this.selectedList()));
  private anchor: string | undefined;
  isSelected(key: string) {
    return this.selectedSet().has(key);
  }
  private readonly selectableSet = computed(() => new Set(this.selectableKeys()));
  /* A set on both sides: `includes` over ten thousand keys for each of ten
     thousand chosen ones was a hundred million steps on select-all. */
  protected readonly selectedCount = computed(
    () => this.selectedList().filter((key) => this.selectableSet().has(key)).length,
  );
  protected readonly allState = computed<'none' | 'some' | 'all'>(() => {
    const count = this.selectedCount();
    return count === 0 ? 'none' : count >= this.selectableKeys().length ? 'all' : 'some';
  });
  protected readonly selectAllName = computed(() => {
    const total = this.total();
    const count = this.selectableKeys().length;
    return this.t(total !== null && total > count ? 'selectAllPage' : 'selectAllFiltered', {
      count,
    });
  });

  private touched: (() => void) | undefined;
  private notify: ((value: DataGridSelection) => void) | undefined;
  private readonly formDisabled = signal(false);

  private requestValue(next: DataGridSelection, reason: DataGridReason, source?: unknown) {
    const state = createControllable<DataGridSelection>({
      initial: this.value(),
      equals: sameSelection,
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (!state.request(next, reason, source)) return;
    this.value.set(next);
    this.notify?.(next);
    this.touched?.();
  }
  private commitSelection(selected: readonly string[], reason: DataGridReason, source?: unknown) {
    const next = this.resolvedSelectionMode() === 'multiple' ? selected : (selected[0] ?? null);
    this.requestValue(next, reason, source);
  }
  toggleSelected(
    key: string,
    options: { range?: boolean; source?: unknown; reason?: DataGridReason },
  ) {
    const mode = this.resolvedSelectionMode();
    if (mode === 'none' || mode === 'range' || this.disabledSet().has(key) || this.formDisabled())
      return;
    const outcome = nextSelection({
      action: options.range ? 'range' : 'toggle',
      mode,
      selected: this.selectedList(),
      keys: this.selectableKeys(),
      key,
      anchor: this.anchor,
      disabled: (candidate) => this.disabledSet().has(candidate),
    });
    if (!options.range) this.anchor = key;
    if (outcome.changed)
      this.commitSelection(outcome.selected, options.reason ?? 'pointer', options.source);
  }
  protected shiftHeld(source: unknown) {
    return source instanceof MouseEvent && source.shiftKey;
  }
  toggleAll(source?: unknown) {
    if (this.resolvedSelectionMode() !== 'multiple') return;
    const outcome = nextSelection({
      action: 'all',
      mode: 'multiple',
      selected: this.selectedList(),
      keys: this.selectableKeys(),
    });
    if (outcome.changed) this.commitSelection(outcome.selected, 'select', source);
  }
  selectAll() {
    this.commitSelection(this.selectableKeys(), 'programmatic');
  }
  clearSelection() {
    this.commitSelection([], 'programmatic');
  }

  /* ── Cursor grid and range ──────────────────────────────────────────── */
  private readonly cursorGrid = computed<CursorGrid>(() => ({
    rows: this.cursorRows(),
    columns: this.cursorColumns(),
    pageSize: Math.max(1, Math.floor((this.viewport().height || 400) / this.rowSize()) - 1),
    bodyStart: this.bodyStart(),
    bodyEnd: this.bodyEnd(),
  }));
  private readonly bounds = computed(() =>
    this.resolvedSelectionMode() === 'range' ? rangeBounds(this.cursorGrid(), this.range()) : null,
  );
  private readonly rangeDragging = signal(false);
  private rangeAnchor: GridCell | null = null;

  private requestRange(next: GridRange | null, reason: ChangeReason, source?: unknown) {
    const state = createControllable<GridRange | null>({
      initial: this.range(),
      equals: sameRange,
      onRequest: (request) => this.rangeChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.range.set(next);
  }
  private beginRange(cell: GridCell, extend: boolean, source: unknown) {
    if (this.resolvedSelectionMode() !== 'range' || !isBodyRow(cell.row)) return;
    const from = extend && this.range() ? this.range()!.anchor : cell;
    this.rangeAnchor = from;
    this.requestRange({ anchor: from, focus: cell }, 'pointer', source);
  }
  private extendRange(cell: GridCell, source: unknown) {
    if (this.resolvedSelectionMode() !== 'range' || !isBodyRow(cell.row)) return;
    const from = this.rangeAnchor ?? this.range()?.anchor ?? cell;
    this.requestRange({ anchor: from, focus: cell }, 'pointer', source);
  }

  /* ── Cursor ─────────────────────────────────────────────────────────── */
  private readonly focused = signal(false);
  private pendingFocus: GridCell | null = null;
  private lastRowIndex = 0;

  isCurrent(row: string, column: string) {
    const current = this.current();
    return current !== null && current.row === row && current.column === column;
  }
  /* One tab stop always, as the pattern requires of a grid: the current cell
     while there is one, and the header's first cell until the reader has been
     anywhere — without it a grid nobody had entered had no way in from the
     keyboard and no focusable content for its scroller. */
  protected isTabStop(row: string, column: string) {
    if (this.current() !== null) return this.isCurrent(row, column);
    return row === HEADER_ROW && column === this.columnIds()[0];
  }
  /**
   * Whether a row draws a pop-in: a record's row, held or not, and the
   * summary while a column in the pop-in has a total to show there.
   */
  protected hasPopinCell(row: string) {
    if (!this.hasPopin()) return false;
    if (row === SUMMARY_ROW) return this.popinAggregated().length > 0;
    return isBodyRow(row);
  }
  /** The pop-in's column on a row that draws none is that row's last visible column. */
  private landOn(cell: GridCell): GridCell {
    if (cell.column !== POPIN_COLUMN_ID || this.hasPopinCell(cell.row)) return cell;
    const columns = this.columnIds();
    return { row: cell.row, column: columns[columns.length - 1]! };
  }
  private requestCurrent(next: GridCell | null, reason: ChangeReason, source?: unknown) {
    const state = createControllable<GridCell | null>({
      initial: this.current(),
      equals: sameCell,
      onRequest: (request) => this.currentChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.current.set(next);
  }
  private focusCellNow(cell: GridCell): boolean {
    const element = this.host.nativeElement.querySelector<HTMLElement>(
      `[data-row="${CSS.escape(cell.row)}"] [data-column="${CSS.escape(cell.column)}"]`,
    );
    if (!element) return false;
    const structural =
      element.matches('[data-part="column-header"], [data-part="filter-cell"]') ||
      element.querySelector('[data-part="group-toggle"]') !== null;
    /* A cell in edit hands the focus to its editor's field — the input, the
       select's trigger, the picker's first segment — never to a stepper or a
       calendar button beside it, and never to the cell: Enter on a numeric
       cell opened the editor and left the focus on the cell because the field
       and its two steppers were three widgets, not one. */
    const editor = element.querySelector<HTMLElement>('[data-part="editor"]');
    if (editor) {
      const field =
        editor.querySelector<HTMLElement>(EDITOR_FIELD) ??
        editor.querySelector<HTMLElement>(FOCUSABLE);
      (field ?? element).focus();
      return true;
    }
    const widgets = structural ? [] : [...element.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const single = widgets.length === 1 && widgets[0]!.matches(SIMPLE_WIDGET) ? widgets[0]! : null;
    (single ?? element).focus();
    return true;
  }
  setCurrent(cell: GridCell, reason: DataGridReason, source?: unknown) {
    if (!sameCell(cell, this.current())) this.requestCurrent(cell, reason, source);
    this.pendingFocus = cell;
    const index = this.cursorRows().indexOf(cell.row) - this.bodyStart();
    const window_ = this.rowWindow();
    if (
      this.windowsRows() &&
      index >= 0 &&
      (index < window_.startIndex || index >= window_.endIndex)
    ) {
      this.heldRows.set([cell.row]);
      const metrics = this.metrics();
      const offset = metrics ? metrics.offsetOf(index) : index * this.rowSize();
      this.scrollRef()?.nativeElement.scrollTo({
        top: offset - this.viewport().height / 2 + this.rowSize(),
      });
    }
    this.flushFocus();
  }
  private flushFocus() {
    afterNextRender(
      () => {
        const cell = this.pendingFocus;
        if (cell && this.focusCellNow(cell)) this.pendingFocus = null;
      },
      { injector: this.injector },
    );
  }
  focusCell(cell: GridCell) {
    this.setCurrent(cell, 'programmatic');
  }

  /* ── Sorting and filtering ──────────────────────────────────────────── */
  protected readonly filterOpen = signal<string | null>(null);
  protected readonly resizing = signal<string | null>(null);

  sortOf(columnId: string) {
    const index = this.query().sort.findIndex((key) => key.column === columnId);
    if (index === -1) return null;
    return { direction: this.query().sort[index]!.direction, index: index + 1 };
  }
  protected ariaSort(columnId: string) {
    const sort = this.sortOf(columnId);
    return sort && sort.index === 1 ? sort.direction : null;
  }
  protected isSortedAlone(columnId: string, direction: SortDirection) {
    const sort = this.sortOf(columnId);
    return sort?.direction === direction && sort.index === 1 && this.query().sort.length === 1;
  }
  filterOf(columnId: string): FilterDescriptor | null {
    return ruleFor(this.query().filter, columnId) ?? null;
  }
  private requestQuery(next: GridQuery, change: string, reason: ChangeReason, source?: unknown) {
    const state = createControllable<GridQuery>({
      initial: this.query(),
      equals: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      onRequest: (request) =>
        this.queryChangeRequest.emit(Object.assign(request, { change }) as DataGridQueryRequest),
    });
    if (state.request(next, reason, source)) this.query.set(next);
  }
  private labelOf(columnId: string) {
    return this.resolvedById().get(columnId)?.column.label ?? columnId;
  }
  private announceSort(next: GridQuery) {
    if (next.sort.length === 0) {
      this.announce(this.t('sortCleared'));
      return;
    }
    const order = next.sort
      .map((key) =>
        this.t(key.direction === 'ascending' ? 'sortAscending' : 'sortDescending', {
          column: this.labelOf(key.column),
        }),
      )
      .join(', ');
    this.announce(this.t('sortedBy', { order }));
  }
  pressSort(
    columnId: string,
    append: boolean,
    source?: unknown,
    reason: DataGridReason = 'pointer',
  ) {
    const column = this.resolvedById().get(columnId);
    if (!column || !column.sortable) return;
    const move = withSortPress(this.query(), columnId, append);
    this.requestQuery(move.query, move.change, reason, source);
    this.announceSort(move.query);
  }
  setSort(columnId: string, direction: SortDirection | null, source?: unknown) {
    const move = withSort(this.query(), columnId, direction);
    this.requestQuery(move.query, move.change, 'pointer', source);
    this.announceSort(move.query);
  }
  setFilter(
    columnId: string,
    filter: FilterDescriptor | null,
    reason: DataGridReason,
    source?: unknown,
  ) {
    const move = withColumnFilter(this.query(), columnId, filter);
    this.requestQuery(move.query, move.change, reason, source);
  }
  protected applyPanel(
    columnId: string,
    event: {
      filter: FilterDescriptor | null;
      reason: 'pointer' | 'keyboard' | 'clear';
      said: string;
    },
  ) {
    this.setFilter(columnId, event.filter, event.reason);
    this.announce(event.said);
    this.filterOpen.set(null);
  }
  protected onFilterOpenChange(columnId: string, open: boolean) {
    if (!open && this.filterOpen() === columnId) {
      this.filterOpen.set(null);
      this.pendingFocus = { row: HEADER_ROW, column: columnId };
      this.flushFocus();
    }
  }
  protected toggleFilterPanel(columnId: string) {
    this.filterOpen.set(this.filterOpen() === columnId ? null : columnId);
  }
  protected clearFilters(source?: unknown) {
    const move = withoutFilters(this.query());
    this.requestQuery(move.query, move.change, 'clear', source);
  }
  private countsCache = new Map<string, ReadonlyMap<string, number>>();
  countsFor(columnId: string): ReadonlyMap<string, number> {
    const query = this.query();
    const rows = this.rows();
    const key = `${columnId}|${JSON.stringify(query.filter)}|${rows.length}`;
    const cached = this.countsCache.get(key);
    if (cached) return cached;
    const columns = this.columns();
    const column = columns.find((entry) => entry.id === columnId);
    const counts = new Map<string, number>();
    if (column) {
      const rest = withoutRuleFor(query.filter, columnId);
      const read = (row: Row, field: string) => {
        const target = columns.find((entry) => entry.id === field);
        return target ? cellValue(target, row) : undefined;
      };
      const match = createFilterGroupPredicate<Row>(rest.rules.length ? rest : null, read, {
        locale: this.resolvedLocale(),
      });
      for (const row of rows) {
        if (!match(row)) continue;
        const raw = cellValue(column, row);
        for (const entry of Array.isArray(raw) ? raw : [raw]) {
          if (entry === null || entry === undefined || entry === '') continue;
          const text = String(entry);
          counts.set(text, (counts.get(text) ?? 0) + 1);
        }
      }
    }
    this.countsCache = new Map([[key, counts]]);
    return counts;
  }

  /* ── Column moves ───────────────────────────────────────────────────── */
  private requestState(
    next: GridColumnState,
    change: string,
    reason: DataGridReason,
    source?: unknown,
  ) {
    const state = createControllable<GridColumnState>({
      initial: this.effectiveState(),
      equals: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      onRequest: (request) =>
        this.columnStateChangeRequest.emit(
          Object.assign(request, { change }) as DataGridColumnStateRequest,
        ),
    });
    if (state.request(next, reason, source)) this.columnState.set(next);
  }
  pin(columnId: string, zone: 'start' | 'end' | null, source?: unknown) {
    this.requestState(
      withColumnPinned(this.effectiveState(), columnId, zone),
      'pinned',
      'pointer',
      source,
    );
  }
  /** Hides a column and announces it; the undo is the application's, from the request's `previous`. */
  hide(columnId: string, source?: unknown, reason: DataGridReason = 'programmatic') {
    const state = this.effectiveState();
    const column = this.columns().find((entry) => entry.id === columnId);
    if (!column || state.hidden.includes(columnId)) return;
    this.requestState(withColumnHidden(state, columnId, true), 'hidden', reason, source);
    this.announce(this.t('columnHidden', { column: column.label }));
  }
  resizeTo(columnId: string, width: number, reason: DataGridReason, source?: unknown) {
    const column = this.columns().find((entry) => entry.id === columnId);
    if (!column) return;
    const next = withColumnWidth(this.effectiveState(), column, width);
    this.requestState(next, 'width', reason, source);
    if (reason === 'keyboard') {
      this.announce(
        this.t('resized', {
          column: column.label,
          width: String(next.widths[columnId] ?? width),
        }),
      );
    }
  }
  resizeBy(columnId: string, delta: number, source?: unknown) {
    const column = this.resolvedById().get(columnId);
    if (!column || !column.resizable) return;
    this.resizeTo(columnId, column.width + delta, 'keyboard', source);
  }
  /* The widest content the column has on screen, plus the cell's own padding
     and border. The content is measured by a Range over the value, never by
     `scrollWidth`: a value that truncates lays its text out at full width
     under the clip, and one that does not fills its cell — `scrollWidth` gave
     the cell's box either way, so a column only ever grew. A header is its
     name plus what sits beside it (the sort mark, the actions slot) and the
     gaps between. `null` for a column with nothing mounted. */
  private measureFit(columnId: string): number | null {
    let widest = 0;
    for (const cell of this.host.nativeElement.querySelectorAll<HTMLElement>(
      `[data-column="${CSS.escape(columnId)}"]`,
    )) {
      widest = Math.max(widest, contentWidth(cell));
    }
    return widest > 0 ? Math.ceil(widest) : null;
  }
  /** One column to its content; without an id, every resizable column at once, as one request. */
  autofit(columnId?: string, source?: unknown) {
    this.fit(columnId ?? null, 'programmatic', source);
  }
  /** The fit behind the resizer, the menu, the keyboard and `autofit()`, each with its own reason. */
  protected fit(columnId: string | null, reason: DataGridReason, source?: unknown) {
    if (columnId !== null) {
      if (!this.resolvedById().has(columnId)) return;
      const width = this.measureFit(columnId);
      if (width !== null) this.resizeTo(columnId, width, reason, source);
      return;
    }
    const state = this.effectiveState();
    let next = state;
    for (const column of this.resolved()) {
      if (!column.resizable) continue;
      const width = this.measureFit(column.id);
      if (width !== null) next = withColumnWidth(next, column.column, width);
    }
    if (next !== state) this.requestState(next, 'width', reason, source);
  }
  moveColumn(columnId: string, direction: -1 | 1, source?: unknown) {
    const column = this.resolvedById().get(columnId);
    if (!column || !column.reorderable) return;
    const zone = zoneOf(this.resolved(), columnId);
    const target = zone.indexOf(columnId) + direction;
    if (target < 0 || target >= zone.length) return;
    this.requestState(
      withColumnMoved(this.effectiveState(), columnId, target, zone),
      'order',
      'keyboard',
      source,
    );
  }

  private resizeSession: {
    column: string;
    startX: number;
    startWidth: number;
    rtl: boolean;
    /** The width the drag stands at, applied on release. */
    pending: number | null;
    /** Escape during the drag, which requests nothing. */
    escape: (event: KeyboardEvent) => void;
  } | null = null;
  /**
   * The column whose guide is drawn and the scroller height it spans. A drag
   * moves only the guide and requests the width once on release: applied on
   * every move, it reflowed every rendered cell under the hand.
   */
  protected readonly resizeGuide = signal<{ column: string; span: number } | null>(null);
  protected beginResize(event: PointerEvent, column: ResolvedGridColumn<Row>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    /* The header's own box and not the column's stated width: a flex column
       is as wide as the room left over, and a drag that started from the
       stated width jumped to it on the first move. */
    const header = handle.closest('[data-part="column-header"]');
    const startWidth = header ? Math.round(header.getBoundingClientRect().width) : column.width;
    const escape = (key: KeyboardEvent) => {
      if (key.key !== 'Escape') return;
      key.preventDefault();
      key.stopPropagation();
      this.stopResize();
    };
    document.addEventListener('keydown', escape, true);
    this.resizeSession = {
      column: column.id,
      startX: event.clientX,
      startWidth,
      rtl: getComputedStyle(this.host.nativeElement).direction === 'rtl',
      pending: null,
      escape,
    };
    this.resizing.set(column.id);
    this.resizeGuide.set({
      column: column.id,
      span: this.scrollRef()?.nativeElement.clientHeight ?? 0,
    });
  }
  protected moveResize(event: PointerEvent, column: ResolvedGridColumn<Row>) {
    const session = this.resizeSession;
    if (!session || session.column !== column.id) return;
    const delta = (event.clientX - session.startX) * (session.rtl ? -1 : 1);
    /* The guide slides by `translate`, which lays nothing out. */
    const width = clampWidth(column.column, session.startWidth + delta);
    session.pending = width;
    (event.currentTarget as HTMLElement)
      .querySelector<HTMLElement>('[data-part="resize-guide"]')
      ?.style.setProperty(
        'translate',
        `${String((width - session.startWidth) * (session.rtl ? -1 : 1))}px 0`,
      );
  }
  protected endResize(event: PointerEvent) {
    const session = this.resizeSession;
    if (!session) return;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    this.stopResize();
    if (session.pending !== null && event.type === 'pointerup') {
      this.resizeTo(session.column, session.pending, 'pointer', event);
    }
  }
  private stopResize() {
    if (this.resizeSession) {
      document.removeEventListener('keydown', this.resizeSession.escape, true);
    }
    this.resizeSession = null;
    this.resizing.set(null);
    this.resizeGuide.set(null);
  }

  /* ── Reordering by drag ─────────────────────────────────────────────── */
  protected readonly dragState = signal<{
    dragging: string | null;
    target: string | null;
    offset: number | null;
    /** Where the scroller stood at the last move: the line follows the viewport, not the content. */
    scrollTop: number;
  }>({
    dragging: null,
    target: null,
    offset: null,
    scrollTop: 0,
  });
  private drag: DragController | null = null;
  private readonly draggables = new Map<string, () => void>();
  private readonly draggableNodes = new Map<string, HTMLElement>();

  /* ── Expansion ──────────────────────────────────────────────────────── */
  private readonly expandedSet = computed(() => new Set(this.expanded()));
  /* ── Tree ───────────────────────────────────────────────────────────── */
  protected readonly treeColumn = computed(() => {
    const tree = this.tree();
    if (!tree) return null;
    if (tree.column && this.resolvedById().has(tree.column)) return tree.column;
    return this.resolved()[0]?.id ?? null;
  });
  private readonly nodeByKey = computed(() => {
    const map = new Map<string, RowNode>();
    for (const node of this.pinned().top) map.set(node.key, node);
    for (const node of this.nodes()) if (node.kind === 'row') map.set(node.key, node);
    for (const node of this.pinned().bottom) map.set(node.key, node);
    return map;
  });
  /* A row opened with children still to come: asked for once, marked until
     a child of hers is in `rows` or she is closed. */
  private readonly loadingChildren = signal<ReadonlySet<string>>(new Set());
  protected isLoadingChildren(key: string) {
    return this.loadingChildren().has(key);
  }
  /** In a tree, `expanded` is the branch; the detail is a leaf's alone. */
  protected detailOpen(node: RowNode) {
    return this.isExpanded(node.key) && (this.tree() === undefined || node.childCount === 0);
  }
  protected treeKind(node: RowNode, column: string): 'branch' | 'leaf' | null {
    if (this.treeColumn() !== column) return null;
    const branch =
      node.childCount > 0 ||
      node.open ||
      this.isLoadingChildren(node.key) ||
      this.tree()?.hasChildren?.(node.row as Row) === true;
    return branch ? 'branch' : 'leaf';
  }
  toggleBranch(key: string, source?: unknown, reason: DataGridReason = 'pointer') {
    const node = this.nodeByKey().get(key);
    if (!node) return;
    const opening = !this.expandedSet().has(key);
    this.toggleExpanded(key, source, reason);
    if (opening && node.childCount === 0 && this.tree()?.hasChildren?.(node.row as Row)) {
      this.loadingChildren.update((current) => new Set(current).add(key));
      this.loadChildren.emit({ key, row: node.row as Row });
    }
  }

  isExpanded(key: string) {
    return this.expandedSet().has(key);
  }
  toggleExpanded(key: string, source?: unknown, reason: DataGridReason = 'pointer') {
    const held = this.expanded();
    const next = this.expandedSet().has(key)
      ? held.filter((entry) => entry !== key)
      : [...held, key];
    const state = createControllable<readonly string[]>({
      initial: held,
      equals: sameKeys,
      onRequest: (request) => this.expandedChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.expanded.set(next);
  }
  toggleGroup(key: string, source?: unknown, reason: DataGridReason = 'pointer') {
    const held = this.expandedGroups();
    const open = held === 'all' || held.includes(key);
    let next: DataGridExpandedGroups;
    if (held === 'all') {
      next = this.nodes()
        .filter((node) => node.kind === 'group')
        .map((node) => node.key)
        .filter((entry) => entry !== key && !entry.startsWith(`${key}/`));
    } else {
      next = open ? held.filter((entry) => entry !== key) : [...held, key];
    }
    const state = createControllable<DataGridExpandedGroups>({
      initial: held,
      equals: sameKeys,
      onRequest: (request) => this.expandedGroupsChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.expandedGroups.set(next);
  }
  protected detailId(key: string) {
    return `${this.id}-detail-${key}`;
  }
  protected groupCount(node: GroupNode) {
    return this.t('groupCount', { count: node.count });
  }
  protected groupContext(node: GroupNode): DataGridGroupContext<Row> {
    const column = this.columns().find((entry) => entry.id === node.column)!;
    return {
      $implicit: node as never,
      node: node as never,
      column,
      toggle: () => this.toggleGroup(node.key),
    };
  }
  protected aggregateText(column: ResolvedGridColumn<Row>, value: unknown) {
    if (value === null || value === undefined) return '';
    return cellText({ ...column.column, accessor: () => value }, {} as Row, this.formatOptions());
  }

  /* ── Editing ────────────────────────────────────────────────────────── */
  readonly edit = signal<EditSession | null>(null);
  private rowOf(key: string): Row | undefined {
    return this.nodeByKey().get(key)?.row as Row | undefined;
  }
  startEdit(cell: GridCell, seed: string | null = null) {
    const row = this.rowOf(cell.row);
    const column = this.columns().find((entry) => entry.id === cell.column);
    if (!row || !column || !this.isEditable(column, row)) return;
    const editing =
      this.resolvedEditMode() === 'row'
        ? this.columns()
            .filter((entry) => this.isEditable(entry, row))
            .map((entry) => entry.id)
        : [cell.column];
    const originals: Record<string, unknown> = {};
    for (const columnId of editing) {
      const target = this.columns().find((entry) => entry.id === columnId)!;
      originals[columnId] = cellValue(target, row);
    }
    const drafts = { ...originals };
    if (seed !== null) drafts[cell.column] = column.kind === 'number' ? Number(seed) : seed;
    this.edit.set({ cell, columns: editing, drafts, originals, status: 'editing', messages: {} });
    this.editStart.emit(cell);
    this.pendingFocus = cell;
    this.flushFocus();
  }
  setDraft(columnId: string, draft: unknown) {
    const session = this.edit();
    if (session)
      this.edit.set({
        ...session,
        drafts: { ...session.drafts, [columnId]: draft },
        status: 'editing',
      });
  }
  cancelEdit() {
    const session = this.edit();
    if (!session) return;
    this.edit.set(null);
    this.editCancel.emit(session.cell);
    this.pendingFocus = session.cell;
    this.flushFocus();
  }
  private nextEditableCell(cell: GridCell, move: 'down' | 'next' | 'previous'): GridCell | null {
    if (move === 'down') {
      const next = moveCursor(this.cursorGrid(), cell, 'down');
      return sameCell(next, cell) || !isBodyRow(next.row) ? null : next;
    }
    const row = this.rowOf(cell.row);
    if (!row) return null;
    const editable = this.columnIds().filter((columnId) => {
      const column = this.columns().find((entry) => entry.id === columnId);
      return column !== undefined && this.isEditable(column, row);
    });
    const index = editable.indexOf(cell.column);
    const target = editable[index + (move === 'next' ? 1 : -1)];
    return target ? { row: cell.row, column: target } : null;
  }
  commitEdit(
    reason: 'keyboard' | 'pointer' | 'blur' | 'programmatic',
    options: { move?: 'down' | 'next' | 'previous' | 'stay' } = {},
  ) {
    const session = this.edit();
    if (!session || session.status === 'pending') return;
    const row = this.rowOf(session.cell.row);
    if (!row) {
      this.edit.set(null);
      return;
    }
    const changes: Record<string, unknown> = {};
    for (const columnId of session.columns) {
      if (!Object.is(session.drafts[columnId], session.originals[columnId]))
        changes[columnId] = session.drafts[columnId];
    }
    const after = () => {
      const move = options.move ?? 'stay';
      const target = move === 'stay' ? null : this.nextEditableCell(session.cell, move);
      this.edit.set(null);
      if (target) {
        this.setCurrent(target, 'keyboard');
        if (this.resolvedEditMode() === 'cell' && move !== 'down') this.startEdit(target);
      } else {
        this.pendingFocus = session.cell;
        this.flushFocus();
      }
    };
    if (Object.keys(changes).length === 0) {
      after();
      return;
    }
    const run = async () => {
      this.edit.update((state) => (state ? { ...state, status: 'pending' } : state));
      const messages: Record<string, string> = {};
      for (const columnId of Object.keys(changes)) {
        const column = this.columns().find((entry) => entry.id === columnId)!;
        const parsed = column.parse ? column.parse(changes[columnId], row) : changes[columnId];
        changes[columnId] = parsed;
        const message = column.validate ? await column.validate(parsed, row) : null;
        if (message) messages[columnId] = message;
      }
      if (Object.keys(messages).length > 0) {
        this.edit.update((state) => (state ? { ...state, status: 'invalid', messages } : state));
        this.pendingFocus = session.cell;
        this.flushFocus();
        return;
      }
      const primary =
        session.cell.column in changes ? session.cell.column : Object.keys(changes)[0]!;
      let waited: Promise<void> | null = null;
      this.editCommit.emit({
        key: session.cell.row,
        column: primary,
        value: changes[primary],
        previous: session.originals[primary],
        row,
        reason,
        changes,
        wait: (promise) => {
          waited = promise;
        },
      });
      try {
        if (waited) await waited;
        after();
      } catch (failure) {
        const message =
          failure instanceof Error && failure.message ? failure.message : this.t('editFailed');
        this.edit.update((state) =>
          state ? { ...state, status: 'invalid', messages: { [primary]: message } } : state,
        );
        this.pendingFocus = session.cell;
        this.flushFocus();
      }
    };
    void run();
  }
  stopEdit(options?: { commit?: boolean }) {
    if (options?.commit === false) this.cancelEdit();
    else this.commitEdit('programmatic');
  }
  protected cellState(node: RowNode, column: ResolvedGridColumn<Row>) {
    const key = node.key;
    const session = this.edit();
    const editing =
      session !== null && session.cell.row === key && session.columns.includes(column.id);
    const message = editing ? (session.messages[column.id] ?? null) : null;
    const invalid = editing && session.status === 'invalid' && message !== null;
    const row = node.row as Row;
    const range = rangeEdges(this.cursorGrid(), this.bounds(), { row: key, column: column.id });
    const editable = this.isEditable(column.column, row);
    return {
      value: cellValue(column.column, row),
      text: this.textOf(column.column, row),
      current: this.isCurrent(key, column.id),
      selected: this.isSelected(key),
      editing,
      invalid,
      message,
      pending: editing && session.status === 'pending',
      inRange: range.inside,
      edges: range.edges,
      readonly: this.anyEditable() && !editable && column.kind !== 'actions',
      changed: this.changedOf(key, column.id),
      tree: this.treeKind(node, column.id),
    };
  }
  protected cellContext(
    node: RowNode,
    column: ResolvedGridColumn<Row>,
    cell: ReturnType<SlDataGrid<Row>['cellState']>,
  ): DataGridCellContext<Row> {
    return {
      $implicit: node.row as Row,
      row: node.row as Row,
      key: node.key,
      column: column.column,
      value: cell.value,
      text: cell.text,
      current: cell.current,
      selected: cell.selected,
    };
  }
  protected editorContext(
    node: RowNode,
    column: ResolvedGridColumn<Row>,
    cell: ReturnType<SlDataGrid<Row>['cellState']>,
  ): DataGridEditorContext<Row> {
    return {
      ...this.cellContext(node, column, cell),
      draft: this.edit()?.drafts[column.id],
      setDraft: (draft) => this.setDraft(column.id, draft),
      commit: () => this.commitEdit('programmatic'),
      cancel: () => this.cancelEdit(),
      invalid: cell.invalid,
      message: cell.message,
    };
  }
  protected headerContext(column: ResolvedGridColumn<Row>): DataGridHeaderContext<Row> {
    const sort = this.sortOf(column.id);
    return {
      $implicit: column.column,
      column: column.column,
      resolved: column,
      sorted: sort?.direction ?? null,
      sortIndex: sort?.index ?? null,
      filtered: this.filterOf(column.id) !== null,
    };
  }
  private templateFor<T extends { template: unknown }>(
    list: readonly T[],
    read: (entry: T) => string,
    columnId: string,
  ) {
    return (
      (list.find((entry) => read(entry) === columnId) ?? list.find((entry) => read(entry) === ''))
        ?.template ?? null
    );
  }
  protected cellTemplate(columnId: string) {
    return this.templateFor(
      this.cellTemplates(),
      (entry) => entry.slDataGridCell(),
      columnId,
    ) as never;
  }
  protected editorTemplate(columnId: string) {
    return this.templateFor(
      this.editorTemplates(),
      (entry) => entry.slDataGridEditor(),
      columnId,
    ) as never;
  }
  protected headerTemplate(columnId: string) {
    return this.templateFor(
      this.headerTemplates(),
      (entry) => entry.slDataGridHeader(),
      columnId,
    ) as never;
  }
  protected helpTemplate(columnId: string) {
    return (this.helpTemplates().find((entry) => entry.slDataGridColumnHelp() === columnId)
      ?.template ?? null) as never;
  }
  protected hasHelp(column: ResolvedGridColumn<Row>) {
    return (
      Boolean(column.column.description) ||
      this.helpTemplates().some((entry) => entry.slDataGridColumnHelp() === column.id)
    );
  }
  protected helpLabel(column: ResolvedGridColumn<Row>) {
    return this.t('columnHelp', { column: column.column.label });
  }
  protected descriptionId(columnId: string) {
    return `${this.id}-description-${columnId}`;
  }
  protected filterTemplate(columnId: string) {
    return this.templateFor(
      this.filterTemplates(),
      (entry) => entry.slDataGridFilter(),
      columnId,
    ) as never;
  }
  protected readonly hasFooterContent = computed(() => this.footerContent() !== undefined);
  protected readonly showsFooter = computed(
    () => this.hasFooterContent() || this.rangeText() !== null || this.hasMore() === true,
  );
  protected readonly rangeText = computed(() => {
    const query = this.query();
    if (this.showRange() === false || !query.page || this.nodes().length === 0) return null;
    const start = ('index' in query.page ? query.page.index * query.page.size : 0) + 1;
    const shown =
      this.resolvedMode() === 'client'
        ? this.nodes().filter((node) => node.kind === 'row').length
        : this.rows().length;
    const last = start + shown - 1;
    const total = this.total();
    return total === null || total < 0
      ? this.t('rangeUnknown', { start, end: last })
      : this.t('range', { start, end: last, total });
  });

  /* ── Groups ─────────────────────────────────────────────────────────── */
  protected readonly groupCells = computed(() => {
    const groups = this.columnGroups() ?? [];
    const columns = this.mountedColumns();
    const offset = this.gutterIds().length;
    const cells: {
      key: string;
      first: number;
      span: number;
      label: string;
      pinned: 'start' | 'end' | null;
      pinOffset: number;
    }[] = [];
    let index = 0;
    while (index < columns.length) {
      const column = columns[index]!;
      const group = groups.find((entry) => entry.columns.includes(column.id));
      let span = 1;
      if (group)
        while (index + span < columns.length && group.columns.includes(columns[index + span]!.id))
          span += 1;
      cells.push({
        key: group ? `${group.id}:${column.id}` : column.id,
        first: column.index + offset,
        span,
        label: group?.label ?? '',
        pinned: column.pinned,
        pinOffset: column.pinOffset,
      });
      index += span;
    }
    return cells;
  });

  /* ── Changed cells ──────────────────────────────────────────────────── */
  private readonly changedFor = computed(() => {
    const stated = this.highlightChanges();
    return stated === true ? DEFAULT_CHANGED_DURATION : stated || 0;
  });
  protected readonly changedDuration = computed(() => {
    const ms = this.changedFor();
    return ms > 0 ? `${ms}ms` : null;
  });
  /* One mark per changed cell, with the generation it was marked in: the
     generation's parity is the attribute's value, so a cell changed twice in
     a row restarts its paint. The map is read through its version. */
  private readonly changedCells = new Map<string, { until: number; generation: number }>();
  private changedGeneration = 0;
  private readonly changedVersion = signal(0);
  private changedTimer: ReturnType<typeof setTimeout> | null = null;
  private previousRows: { rows: readonly Row[]; byKey: Map<string, Row> } | null = null;
  private changedOf(key: string, column: string): 'a' | 'b' | null {
    this.changedVersion();
    const mark = this.changedCells.get(`${key}\u0000${column}`);
    return mark ? (mark.generation % 2 === 0 ? 'a' : 'b') : null;
  }
  private markChanges(rows: readonly Row[]) {
    const changedFor = untracked(() => this.changedFor());
    if (changedFor <= 0) {
      this.previousRows = null;
      return;
    }
    const previous = this.previousRows;
    const byKey = new Map<string, Row>();
    for (const row of rows) byKey.set(this.rowKeyOf(row), row);
    this.previousRows = { rows, byKey };
    if (!previous || previous.rows === rows) return;
    const now = Date.now();
    let marked = false;
    const columns = untracked(() => this.resolved());
    const pinned = untracked(() => this.pinned());
    const mounted = untracked(() => this.mountedEntries()).map((entry) => entry.node);
    for (const node of [...pinned.top, ...mounted, ...pinned.bottom]) {
      if (node.kind !== 'row') continue;
      const before = previous.byKey.get(node.key);
      if (before === undefined || before === node.row) continue;
      for (const column of columns) {
        if (Object.is(cellValue(column.column, before), cellValue(column.column, node.row as Row)))
          continue;
        this.changedCells.set(`${node.key}\u0000${column.id}`, {
          until: now + changedFor,
          generation: this.changedGeneration + 1,
        });
        marked = true;
      }
    }
    if (!marked) return;
    this.changedGeneration += 1;
    this.changedVersion.update((version) => version + 1);
    if (this.changedTimer === null)
      this.changedTimer = setTimeout(() => this.sweepChanges(), changedFor);
  }
  private sweepChanges() {
    this.changedTimer = null;
    const at = Date.now();
    let next = Number.POSITIVE_INFINITY;
    for (const [key, mark] of this.changedCells) {
      if (mark.until <= at) this.changedCells.delete(key);
      else next = Math.min(next, mark.until);
    }
    this.changedVersion.update((version) => version + 1);
    if (next !== Number.POSITIVE_INFINITY)
      this.changedTimer = setTimeout(() => this.sweepChanges(), Math.max(16, next - at));
  }

  /* ── Lifecycle ──────────────────────────────────────────────────────── */
  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(() => {
      if (this.changedTimer !== null) clearTimeout(this.changedTimer);
      this.sourceController?.abort();
    });
    /* One request per query, and per retry or reload. */
    effect(() => {
      const source = this.dataSource();
      const query = this.query();
      this.sourceAttempt();
      if (!source) return;
      untracked(() => this.fetchFromSource(source, query));
    });
    /* A wait ends when a child arrived, or the row closed. */
    effect(() => {
      const waiting = this.loadingChildren();
      if (waiting.size === 0) return;
      const byKey = this.nodeByKey();
      const open = this.expandedSet();
      const next = new Set(waiting);
      for (const key of waiting) {
        const node = byKey.get(key);
        if (!node || !open.has(key) || node.childCount > 0) next.delete(key);
      }
      if (next.size !== waiting.size) this.loadingChildren.set(next);
    });
    /* The main pointer, read again when it changes: a tablet docked to a
       mouse leaves the pop-in for the sideways scroll. */
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const query = window.matchMedia('(pointer: coarse)');
      const read = () => this.coarsePointer.set(query.matches);
      read();
      query.addEventListener('change', read);
      destroy.onDestroy(() => query.removeEventListener('change', read));
    }
    /* The sets a narrow frame took out, reported when either changes. */
    let spaced: GridOutOfSpace = NONE_OUT;
    effect(() => {
      const next = this.outOfSpace();
      if (sameKeys(next.popin, spaced.popin) && sameKeys(next.hidden, spaced.hidden)) return;
      spaced = next;
      untracked(() => this.outOfSpaceChange.emit(next));
    });
    /* Two consecutive `rows` are compared once the new nodes are known. */
    effect(() => {
      const rows = this.rows();
      this.nodes();
      untracked(() => this.markChanges(rows));
    });

    /* The scroller: the window, the viewport and the overflow affordance. */
    afterNextRender(
      () => {
        const scroller = this.scrollRef()?.nativeElement;
        if (!scroller) return;
        let frame = 0;
        const read = () => {
          frame = 0;
          this.scrollTop.set(scroller.scrollTop);
          this.scrollLeft.set(Math.abs(scroller.scrollLeft));
        };
        const onScroll = () => {
          if (frame === 0) frame = requestAnimationFrame(read);
        };
        scroller.addEventListener('scroll', onScroll, { passive: true });
        const observer =
          typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(() => {
                this.viewport.set({ width: scroller.clientWidth, height: scroller.clientHeight });
                this.frameWidth.set(scroller.clientWidth);
                this.measureEdges?.();
              });
        /* The head's and the summary's heights, for the rows held under one
           and over the other: written on the scroller as the offsets the held
           rows stick at. */
        const edges = () => {
          const head = scroller.querySelector<HTMLElement>(':scope > [data-part="head"]');
          const summary = scroller.querySelector<HTMLElement>(':scope > [data-part="summary"]');
          scroller.style.setProperty(
            '--slotted-data-grid-pinned-top-offset',
            `${head?.offsetHeight ?? 0}px`,
          );
          scroller.style.setProperty(
            '--slotted-data-grid-pinned-bottom-offset',
            `${summary?.offsetHeight ?? 0}px`,
          );
        };
        observer?.observe(scroller);
        for (const part of scroller.querySelectorAll(
          ':scope > [data-part="head"], :scope > [data-part="summary"]',
        ))
          observer?.observe(part);
        edges();
        this.measureEdges = edges;
        this.viewport.set({ width: scroller.clientWidth, height: scroller.clientHeight });
        if (observer) this.frameWidth.set(scroller.clientWidth);
        const affordance = createScrollAffordance(scroller, {
          orientation: () => 'horizontal',
          onChange: (state) => {
            scroller.toggleAttribute('data-overflowing', state.overflowing);
            scroller.toggleAttribute('data-at-start', state.overflowing && state.atStart);
            scroller.toggleAttribute('data-at-end', state.overflowing && state.atEnd);
          },
        });
        destroy.onDestroy(() => {
          scroller.removeEventListener('scroll', onScroll);
          if (frame) cancelAnimationFrame(frame);
          observer?.disconnect();
          affordance.destroy();
        });
        this.wireDrag();
      },
      { injector: this.injector },
    );

    /* The row height, read once from the first mounted row; every row when
       auto. A row with a pop-in changes height with the columns in it and
       with the frame's width, which reflows its fields, so both are read. */
    effect(() => {
      this.mountedEntries();
      this.outOfSpace();
      if (this.hasPopin()) this.frameWidth();
      afterNextRender(
        () => {
          const rows = this.host.nativeElement.querySelectorAll<HTMLElement>(
            '[data-part="body"] > [data-part="row"]',
          );
          const first = rows[0];
          if (!first) return;
          if (
            typeof untracked(() => this.resolvedRowHeight()) !== 'number' &&
            untracked(() => this.measuredRow()) === null
          ) {
            const height = first.getBoundingClientRect().height;
            if (height > 0) this.measuredRow.set(Math.round(height));
          }
          if (untracked(() => this.autoRows())) {
            const sizes = new Map(untracked(() => this.rowSizes()));
            let changed = false;
            for (const row of rows) {
              const index = Number(row.getAttribute('data-index'));
              const height = row.getBoundingClientRect().height;
              if (!Number.isNaN(index) && height > 0 && sizes.get(index) !== height) {
                sizes.set(index, height);
                changed = true;
              }
            }
            if (changed) this.rowSizes.set(sizes);
          }
        },
        { injector: this.injector },
      );
    });

    /* The cursor survives its row leaving: same index, same column. A column
       that moved into the pop-in takes the cursor with it. */
    effect(() => {
      const current = this.current();
      const rows = this.cursorRows();
      const columns = this.cursorColumns();
      if (current && rows.includes(current.row)) {
        this.lastRowIndex = rows.indexOf(current.row);
        if (columns.includes(current.column)) return;
      }
      if (!current) return;
      const popped =
        rows.includes(current.row) &&
        this.outOfSpace().popin.includes(current.column) &&
        this.hasPopinCell(current.row);
      const settled = popped
        ? { row: current.row, column: POPIN_COLUMN_ID }
        : settleCursor(
            untracked(() => this.cursorGrid()),
            current,
            this.lastRowIndex,
          );
      untracked(() => {
        if (settled && !sameCell(settled, current)) {
          this.requestCurrent(settled, 'programmatic');
          if (this.focused()) {
            this.pendingFocus = settled;
            this.flushFocus();
          }
        } else if (!settled && this.focused()) {
          this.host.nativeElement
            .querySelector<HTMLElement>('[data-part="empty"] [tabindex]')
            ?.focus();
        }
      });
    });

    /* A row that changes under an open editor is a conflict, not a refresh. */
    effect(() => {
      this.rows();
      const session = untracked(() => this.edit());
      if (!session || session.status === 'pending') return;
      const row = untracked(() => this.rowOf(session.cell.row));
      if (!row) return;
      const conflicts: Record<string, string> = {};
      for (const columnId of session.columns) {
        const column = this.columns().find((entry) => entry.id === columnId);
        if (column && !Object.is(cellValue(column, row), session.originals[columnId])) {
          conflicts[columnId] = this.t('editConflict');
        }
      }
      if (Object.keys(conflicts).length > 0) {
        untracked(() =>
          this.edit.set({
            ...session,
            status: 'invalid',
            messages: { ...session.messages, ...conflicts },
          }),
        );
      }
    });

    /* Load more when the row `loadMoreThreshold` rows before the end comes into
       view, unless only the control asks, or the last page failed and a retry
       is the reader's to press. In view of the page, not of the grid's own box:
       a grid with no height grows to its rows and an ancestor scrolls, and its
       own scroller always reached the end, so every page was asked for at
       mount. An observer with no root counts the clip of every ancestor that
       scrolls. Without the observer (a test document) nothing asks by itself. */
    effect((onCleanup) => {
      const mark = this.loadMoreMark()?.nativeElement;
      /* Observed again when rows arrive: a mark still in view asks again. */
      const rows = this.nodes().length + this.loadMoreTop();
      if (!this.asksForMore() || mark === undefined || rows < 0) return;
      if (typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.loadMore.emit();
      });
      observer.observe(mark);
      onCleanup(() => observer.disconnect());
    });

    /* The drag session's state, drawn on the headers. */
    destroy.onDestroy(() => {
      for (const detach of this.draggables.values()) detach();
      this.draggables.clear();
      this.drag?.destroy();
    });

    /* The headers as draggables, re-attached when the mounted set changes. */
    effect(() => {
      this.mountedColumns();
      afterNextRender(() => this.attachDraggables(), { injector: this.injector });
    });
    /* The mounted rows as draggables, the same way. */
    effect(() => {
      this.mountedEntries();
      this.hasDragColumn();
      afterNextRender(() => this.attachRowDraggables(), { injector: this.injector });
    });

    /* A range drag ends on the document. */
    effect((onCleanup) => {
      if (!this.rangeDragging()) return;
      const doc = this.host.nativeElement.ownerDocument;
      const end = () => this.rangeDragging.set(false);
      doc.addEventListener('pointerup', end);
      doc.addEventListener('pointercancel', end);
      onCleanup(() => {
        doc.removeEventListener('pointerup', end);
        doc.removeEventListener('pointercancel', end);
      });
    });
  }

  private wireDrag() {
    const element = this.host.nativeElement;
    /* One container for the whole header row: the three pin zones share the
       row's box, and three containers registered over the same element
       claimed the pointer in turn — the last one, an empty end zone, took
       every drop as its root. The zone is enforced at the drop instead: a
       column never leaves its zone, so a target past the zone's edge lands on
       the edge. */
    const controller = createDragController({
      document: element.ownerDocument,
      t: this.dragT,
      preview: false,
      /* The scroller moves sideways when a header is dragged to its edge, so a
         column can reach a place past the viewport; never up or down — the
         pointer is at the scroller's top edge for the whole drag. */
      autoScroll: { axis: 'x' },
      onDrop: ({ items, target, reason, event }) => {
        if (target.kind !== 'between') return;
        const columnId = items[0]!;
        const list = this.resolved();
        const zone = zoneOf(list, columnId);
        const to = zoneIndex(list, zone, columnId, target.index);
        if (to === null) return;
        this.requestState(
          withColumnMoved(this.effectiveState(), columnId, to, zone),
          'order',
          reason === 'keyboard' ? 'keyboard' : 'pointer',
          event,
        );
      },
    });
    const allItems = () => this.resolved().map((column) => column.id);
    const headerOf = (columnId: string) =>
      element.querySelector(`[data-part="column-header"][data-column="${CSS.escape(columnId)}"]`);
    controller.registerContainer({
      key: 'columns',
      items: allItems,
      orientation: 'horizontal',
      element: () =>
        element.querySelector('[data-part="head"] > [data-part="header-row"]:last-of-type'),
      itemElement: headerOf,
      label: () => this.t('dragColumns'),
      itemLabel: (columnId) => this.labelOf(columnId),
    });
    let wasDragging = false;
    controller.subscribe((state) => {
      if (state.status !== 'dragging') {
        /* The click the browser fires after a drop is the drag's, not a press
           on the header: read live, a reordered column came back sorted. */
        if (wasDragging) this.swallowClick = true;
        wasDragging = false;
        this.dragState.set({ dragging: null, target: null, offset: null, scrollTop: 0 });
        return;
      }
      wasDragging = true;
      const dragging = state.items[0] ?? null;
      const target = state.target && state.target.kind === 'between' ? state.target : null;
      let offset: number | null = null;
      let scrollTop = 0;
      let over: string | null = null;
      if (target && dragging) {
        const list = this.resolved();
        const zone = zoneOf(list, dragging);
        const first = list.find((column) => column.id === zone[0]);
        const last = list.find((column) => column.id === zone[zone.length - 1]);
        /* The indicator is drawn where the drop would land: inside the zone. */
        const boundary = Math.max(
          first ? first.index - 1 : 0,
          Math.min(last ? last.index : list.length, target.index),
        );
        const scroller = this.scrollRef()?.nativeElement;
        const ids = allItems();
        const atEnd = boundary >= ids.length;
        const anchor = ids[atEnd ? ids.length - 1 : boundary];
        const header = anchor ? headerOf(anchor) : null;
        if (header && scroller) {
          const box = header.getBoundingClientRect();
          const origin = scroller.getBoundingClientRect();
          const rtl = getComputedStyle(scroller).direction === 'rtl';
          const edge = atEnd !== rtl ? box.right : box.left;
          /* Content coordinates: the indicator is positioned in the
             scroller's box at scroll zero, so the scrolled distance is added
             back. `scrollLeft` is negative once an rtl scroller has moved. */
          offset = rtl
            ? origin.right - edge - scroller.scrollLeft
            : edge - origin.left + scroller.scrollLeft;
          scrollTop = scroller.scrollTop;
          over = ids[boundary] ?? null;
        }
      }
      this.dragState.set({ dragging, target: over, offset, scrollTop });
    });
    this.drag = controller;
    this.attachDraggables();
    this.wireRowDrag();
  }

  /* ── The data source ───────────────────────────────────────────────── */
  private readonly sourceCache = new Map<string, DataGridDataSourceResult<Row>>();
  private sourceController: AbortController | null = null;
  private readonly sourceAttempt = signal(0);
  /** The same query again, after a failure; with a source, else `retry` is emitted. */
  protected onRetry() {
    if (this.dataSource()) this.sourceAttempt.update((count) => count + 1);
    else this.retry.emit();
  }
  /** Drops the data source's cache and asks the query again. */
  reload() {
    this.sourceCache.clear();
    this.sourceAttempt.update((count) => count + 1);
  }
  private fetchFromSource(source: DataGridDataSource<Row>, query: GridQuery) {
    const key = serializeQuery(query);
    const cached = this.sourceCache.get(key);
    if (cached) {
      this.sourced.set({ result: cached, loading: false, error: null });
      return;
    }
    this.sourceController?.abort();
    const own = new AbortController();
    this.sourceController = own;
    this.sourced.update((current) => ({ ...current, loading: true, error: null }));
    source.getRows(query, { signal: own.signal }).then(
      (result) => {
        if (own.signal.aborted) return;
        const size = source.cacheSize ?? DEFAULT_CACHE_SIZE;
        if (size > 0) {
          this.sourceCache.set(key, result);
          while (this.sourceCache.size > size) {
            const oldest = this.sourceCache.keys().next().value;
            if (oldest === undefined) break;
            this.sourceCache.delete(oldest);
          }
        }
        this.sourced.set({ result, loading: false, error: null });
      },
      (reason: unknown) => {
        if (own.signal.aborted) return;
        const message = reason instanceof Error ? reason.message : String(reason);
        this.sourced.update((current) => ({ ...current, loading: false, error: message }));
      },
    );
  }

  /* ── Reordering rows ────────────────────────────────────────────────── */
  /* Rows move only while the query is at rest and there is no tree: sorted,
     filtered, searched or grouped, the position on screen is not the
     position in `rows`. A page is fine — a node's index is its place in
     `rows` across pages. */
  protected readonly rowsReorderableNow = computed(() => {
    const query = this.query();
    return (
      this.hasDragColumn() &&
      this.tree() === undefined &&
      this.resolvedMode() === 'client' &&
      query.sort.length === 0 &&
      query.filter === null &&
      query.search.trim() === '' &&
      query.group.length === 0
    );
  });
  protected readonly rowDragState = signal<{
    dragging: string | null;
    offset: number | null;
    scrollLeft: number;
  }>({ dragging: null, offset: null, scrollLeft: 0 });
  private rowDrag: DragController | null = null;
  private measureEdges: (() => void) | null = null;
  private readonly rowDraggables = new Map<string, () => void>();
  private readonly rowDraggableNodes = new Map<string, HTMLElement>();
  protected selectRowLabel(key: string) {
    return this.t('selectRow', { row: this.rowLabelOf(key), key });
  }
  protected rowHandleLabel(key: string) {
    return this.t('reorderRow', { row: this.rowLabelOf(key) });
  }
  /** What a row is called: its row header's text, else its key. */
  private rowLabelOf(key: string) {
    const node = this.nodeByKey().get(key);
    const header = this.columns().find((column) => column.rowHeader);
    return node && header ? cellText(header, node.row as Row, this.formatOptions()) : key;
  }
  private mountedRowKeys() {
    return this.mountedEntries().flatMap(({ node }) => (node.kind === 'row' ? [node.key] : []));
  }
  /** Where a row lands in `rows` when dropped before the visible item at `index`. */
  private rowMove(key: string, index: number): DataGridRowsReorderEvent | null {
    const node = this.nodeByKey().get(key);
    if (!node) return null;
    const items = this.mountedEntries().flatMap(({ node: entry }) =>
      entry.kind === 'row' ? [entry] : [],
    );
    const last = items[items.length - 1];
    const before = items[index];
    const target = before ? before.index : last ? last.index + 1 : 0;
    /* Removing the row first shifts everything after it up by one. */
    const to = node.index < target ? target - 1 : target;
    if (to === node.index) return null;
    return { key, from: node.index, to, reason: 'pointer' };
  }
  private moveRow(key: string, direction: -1 | 1, source?: unknown) {
    if (!this.rowsReorderableNow()) return;
    const keys = this.mountedRowKeys();
    const at = keys.indexOf(key);
    if (at < 0) return;
    const index = direction > 0 ? at + 2 : at - 1;
    if (index < 0) return;
    const move = this.rowMove(key, index);
    if (!move) return;
    this.rowsReorder.emit({ ...move, reason: 'keyboard', event: source as Event | undefined });
    this.announce(this.t('rowMoved', { row: this.rowLabelOf(key), position: move.to + 1 }));
  }
  private wireRowDrag() {
    const element = this.host.nativeElement;
    const controller = createDragController({
      document: element.ownerDocument,
      t: this.dragT,
      preview: false,
      autoScroll: { axis: 'y' },
      onDrop: ({ items, target, reason, event }) => {
        if (target.kind !== 'between') return;
        const move = this.rowMove(items[0]!, target.index);
        if (move)
          this.rowsReorder.emit({
            ...move,
            reason: reason === 'keyboard' ? 'keyboard' : 'pointer',
            event,
          });
      },
    });
    const rowOf = (key: string) =>
      element.querySelector(
        `[data-part="body"] > [data-part="row"][data-row="${CSS.escape(key)}"]`,
      );
    controller.registerContainer({
      key: 'rows',
      items: () => this.mountedRowKeys(),
      orientation: 'vertical',
      element: () => element.querySelector('[data-part="body"]'),
      itemElement: rowOf,
      label: () => this.t('dragRows'),
      itemLabel: (key) => this.rowLabelOf(key),
    });
    controller.subscribe((state) => {
      if (state.status !== 'dragging') {
        this.rowDragState.set({ dragging: null, offset: null, scrollLeft: 0 });
        return;
      }
      const dragging = state.items[0] ?? null;
      const target = state.target && state.target.kind === 'between' ? state.target : null;
      let offset: number | null = null;
      let scrollLeft = 0;
      const scroller = this.scrollRef()?.nativeElement;
      if (target && scroller) {
        const keys = this.mountedRowKeys();
        const atEnd = target.index >= keys.length;
        const anchor = keys[atEnd ? keys.length - 1 : target.index];
        const row = anchor ? rowOf(anchor) : null;
        if (row) {
          const box = row.getBoundingClientRect();
          const origin = scroller.getBoundingClientRect();
          offset = (atEnd ? box.bottom : box.top) - origin.top + scroller.scrollTop;
          scrollLeft = Math.abs(scroller.scrollLeft);
        }
      }
      this.rowDragState.set({ dragging, offset, scrollLeft });
    });
    this.rowDrag = controller;
    this.attachRowDraggables();
  }
  private attachRowDraggables() {
    const controller = this.rowDrag;
    if (!controller) return;
    const element = this.host.nativeElement;
    const seen = new Set<string>();
    if (this.hasDragColumn()) {
      for (const key of this.mountedRowKeys()) {
        const node = element.querySelector<HTMLElement>(
          `[data-part="body"] > [data-part="row"][data-row="${CSS.escape(key)}"]`,
        );
        if (!node) continue;
        seen.add(key);
        const previous = this.rowDraggables.get(key);
        if (previous && this.rowDraggableNodes.get(key) === node) continue;
        previous?.();
        const detach = controller.attachDraggable(node, {
          container: 'rows',
          key,
          handle: () => node.querySelector('[data-part="row-handle"]'),
          disabled: () => !this.rowsReorderableNow(),
          distance: 6,
        });
        this.rowDraggableNodes.set(key, node);
        this.rowDraggables.set(key, detach);
      }
    }
    for (const [key, detach] of this.rowDraggables) {
      if (!seen.has(key)) {
        detach();
        this.rowDraggables.delete(key);
        this.rowDraggableNodes.delete(key);
      }
    }
  }
  private attachDraggables() {
    const controller = this.drag;
    if (!controller) return;
    const element = this.host.nativeElement;
    const seen = new Set<string>();
    for (const column of this.resolved()) {
      const node = element.querySelector<HTMLElement>(
        `[data-part="column-header"][data-column="${CSS.escape(column.id)}"]`,
      );
      if (!node || !column.reorderable) continue;
      seen.add(column.id);
      /* A node already attached stays attached: detaching it between two
         renders would throw away a press in progress. */
      const previous = this.draggables.get(column.id);
      if (previous && this.draggableNodes.get(column.id) === node) continue;
      previous?.();
      const detach = controller.attachDraggable(node, {
        container: 'columns',
        key: column.id,
        handle: () => node,
        /* A press on the resize handle is a resize: the controller's own
           listener sits on the header and fires before the handle's, so
           the handle cannot stop it. */
        canDrag: (event) =>
          !(event.target instanceof Element && event.target.closest('[data-part="resizer"]')),
        distance: 6,
      });
      this.draggableNodes.set(column.id, node);
      this.draggables.set(column.id, detach);
    }
    for (const [columnId, detach] of this.draggables) {
      if (!seen.has(columnId)) {
        detach();
        this.draggables.delete(columnId);
        this.draggableNodes.delete(columnId);
      }
    }
  }

  /* ── Events ─────────────────────────────────────────────────────────── */
  announce(message: string) {
    getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(message);
  }
  private rtl() {
    return getComputedStyle(this.host.nativeElement).direction === 'rtl';
  }
  protected onCellFocus(cell: GridCell, event: FocusEvent) {
    if (event.target !== event.currentTarget) return;
    this.focused.set(true);
    if (!sameCell(cell, this.current())) this.requestCurrent(cell, 'programmatic');
  }
  protected onRootFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) {
      this.focused.set(false);
      const session = this.edit();
      if (session && session.status === 'editing') this.commitEdit('blur', { move: 'stay' });
    }
  }
  protected onRootKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (this.drag?.handleKeydown(event)) return;
    this.rowDrag?.handleKeydown(event);
  }
  private swallowClick = false;
  /** The pointer of the last press on a cell: `touch` and `pen` activate on one press. */
  private pressedWith = '';
  private touchActivatedAt = Number.NEGATIVE_INFINITY;
  private keyboardMenuAt = Number.NEGATIVE_INFINITY;
  private columnMenuFor(columnId: string) {
    return this.columnMenus().find(
      (menu) => menu.trigger()?.getAttribute('data-menu-for') === columnId,
    );
  }
  /**
   * Opens a column's menu against an anchor other than its button: the point
   * a context menu was opened at, or the header cell. Focus returns to the
   * header cell, which is where the reader was.
   */
  private openColumnMenu(
    columnId: string,
    anchor: PositionerAnchor,
    reason: 'pointer' | 'keyboard',
    event: Event,
    header: HTMLElement,
  ): boolean {
    const menu = this.columnMenuFor(columnId);
    if (!menu || menu.resolvedDisabled()) return false;
    menu.finalFocus.set(header);
    menu.anchor.set(anchor);
    menu.entry.current = 'first';
    menu.toggle(true, reason, event);
    return true;
  }
  /** The button opens the menu where it always did: under itself, focus returning to it. */
  protected anchorToButton(menu: SlMenu) {
    menu.anchor.set(null);
    menu.finalFocus.set(null);
  }
  /**
   * A secondary press on a data column's header opens its menu at the press.
   * The browser keeps its own menu under Shift, and over a field, where cut,
   * copy and paste are the reader's; a `contextmenu` just after Shift+F10 or
   * the Menu key opened the menu from the keyboard is that key's echo.
   */
  protected onHeaderContextMenu(event: MouseEvent, columnId: string) {
    if (event.shiftKey) return;
    if (event.target instanceof Element && event.target.closest(EDITABLE)) return;
    if (Date.now() - this.keyboardMenuAt < KEYBOARD_ECHO) {
      event.preventDefault();
      return;
    }
    const header = event.currentTarget as HTMLElement;
    const anchor = pointAnchor(event.clientX, event.clientY);
    if (this.openColumnMenu(columnId, anchor, 'pointer', event, header)) event.preventDefault();
  }
  protected onHeaderClick(event: MouseEvent, column: ResolvedGridColumn<Row>) {
    if (this.swallowClick) {
      this.swallowClick = false;
      return;
    }
    if (insideWidget(event)) return;
    if (column.sortable) this.pressSort(column.id, event.shiftKey, event, 'pointer');
  }
  protected onBodyCellClick(event: MouseEvent, cell: GridCell) {
    const pointer = this.pressedWith;
    this.pressedWith = '';
    if (insideWidget(event)) return;
    if (this.resolvedSelectionMode() === 'single' && !this.disabledSet().has(cell.row)) {
      this.toggleSelected(cell.row, { range: false, source: event });
    }
    /* On a touch screen one press opens the record: a double tap is a zoom,
       not the gesture of opening. A cell in edit keeps the press for its
       editor. */
    const session = this.edit();
    const editing =
      session !== null && session.cell.row === cell.row && session.columns.includes(cell.column);
    if (this.activatable() && (pointer === 'touch' || pointer === 'pen') && !editing) {
      this.touchActivatedAt = Date.now();
      this.activate.emit({ key: cell.row, reason: 'pointer', event });
    }
  }
  protected onCellDoubleClick(event: MouseEvent, cell: GridCell) {
    if (insideWidget(event)) return;
    /* The second tap of a touch that already activated the row. */
    if (Date.now() - this.touchActivatedAt < TOUCH_ECHO) return;
    const row = this.rowOf(cell.row);
    const column = this.columns().find((entry) => entry.id === cell.column);
    if (!row) return;
    if (column && this.isEditable(column, row) && !this.activatable()) {
      this.startEdit(cell);
      return;
    }
    if (this.activatable()) this.activate.emit({ key: cell.row, reason: 'pointer', event });
    else if (column && this.isEditable(column, row)) this.startEdit(cell);
  }
  protected onCellPointerDown(event: PointerEvent, cell: GridCell) {
    this.pressedWith = event.pointerType ?? '';
    if (event.button !== 0) return;
    this.swallowClick = false;
    const session = this.edit();
    if (
      session &&
      !sameCell(session.cell, cell) &&
      !(session.cell.row === cell.row && session.columns.includes(cell.column))
    ) {
      this.commitEdit('blur', { move: 'stay' });
    }
    if (!sameCell(cell, this.current())) this.requestCurrent(cell, 'pointer', event);
    if (this.resolvedSelectionMode() === 'range' && isBodyRow(cell.row)) {
      if (!insideWidget(event)) {
        this.beginRange(cell, event.shiftKey, event);
        this.rangeDragging.set(true);
      }
    }
  }
  protected onCellPointerEnter(event: PointerEvent, cell: GridCell) {
    if (this.rangeDragging() && event.buttons === 1) this.extendRange(cell, event);
  }

  private async copyRange(cell: GridCell) {
    const bounds = this.bounds();
    const cells = bounds ? rangeCells(this.cursorGrid(), bounds) : [[cell]];
    const text = rangeToText(cells, (target) => {
      const row = this.rowOf(target.row);
      const column = this.columns().find((entry) => entry.id === target.column);
      return row && column ? this.textOf(column, row) : '';
    });
    const outcome = await writeToClipboard(text, this.host.nativeElement.ownerDocument);
    if (outcome !== 'refused') {
      this.announce(this.t('copied', { count: cells.reduce((sum, line) => sum + line.length, 0) }));
    }
  }

  protected onCellKeyDown(event: KeyboardEvent, cell: GridCell) {
    if (event.defaultPrevented) return;
    const session = this.edit();
    const target = event.target as HTMLElement;
    const cellElement = event.currentTarget as HTMLElement;
    const insideWidget = target !== cellElement;
    const key = event.key;
    const mirror = this.rtl();
    const ctrl = event.ctrlKey || event.metaKey;

    if (session && sameCell(session.cell, cell)) {
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.cancelEdit();
      } else if (key === 'Enter') {
        event.preventDefault();
        this.commitEdit('keyboard', { move: this.resolvedEditMode() === 'cell' ? 'down' : 'stay' });
      } else if (key === 'Tab') {
        const next = this.nextEditableCell(cell, event.shiftKey ? 'previous' : 'next');
        if (next) {
          event.preventDefault();
          this.commitEdit('keyboard', { move: event.shiftKey ? 'previous' : 'next' });
        } else this.commitEdit('keyboard', { move: 'stay' });
      } else if (key === 'F2') {
        event.preventDefault();
        this.commitEdit('keyboard', { move: 'stay' });
      }
      return;
    }
    if (session && session.columns.includes(cell.column) && session.cell.row === cell.row) {
      if (key === 'Escape') {
        event.preventDefault();
        this.cancelEdit();
      } else if (key === 'Enter') {
        event.preventDefault();
        this.commitEdit('keyboard', { move: 'stay' });
      }
      return;
    }
    /* A widget of a header cell: Escape and F2 return to the cell, Tab cycles
       the cell's widgets without leaving it. */
    if (
      insideWidget &&
      cell.row === HEADER_ROW &&
      target.closest('[data-part="column-actions"]') !== null
    ) {
      if (key === 'Escape' || key === 'F2') {
        event.preventDefault();
        cellElement.focus();
        return;
      }
      if (key === 'Tab') {
        const widgets = [
          ...cellElement.querySelectorAll<HTMLElement>(
            '[data-part="column-actions"] button:not([disabled])',
          ),
        ];
        const index = widgets.indexOf(target);
        event.preventDefault();
        widgets[(index + (event.shiftKey ? -1 : 1) + widgets.length) % widgets.length]?.focus();
        return;
      }
    }
    if (insideWidget && !target.matches(SIMPLE_WIDGET)) {
      if (key === 'Escape') {
        event.preventDefault();
        cellElement.focus();
      } else if (key === 'Tab') {
        const widgets = [...cellElement.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (widgets.length > 1) {
          const index = widgets.indexOf(target);
          event.preventDefault();
          widgets[(index + (event.shiftKey ? -1 : 1) + widgets.length) % widgets.length]?.focus();
        }
      }
      return;
    }

    const header = cell.row === HEADER_ROW;
    const column = this.resolvedById().get(cell.column);
    const row = isBodyRow(cell.row) ? this.rowOf(cell.row) : undefined;
    const grid = this.cursorGrid();
    const mode = this.resolvedSelectionMode();

    if (header && column) {
      /* Shift+F10 and the Menu key open the column menu on the header cell. */
      if (
        (key === 'ContextMenu' || (key === 'F10' && event.shiftKey)) &&
        !target.closest(EDITABLE)
      ) {
        if (this.openColumnMenu(cell.column, cellElement, 'keyboard', event, cellElement)) {
          event.preventDefault();
          this.keyboardMenuAt = Date.now();
        }
        return;
      }
      if (ctrl && event.shiftKey && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        event.preventDefault();
        this.resizeBy(
          cell.column,
          (key === 'ArrowRight') !== mirror ? RESIZE_STEP : -RESIZE_STEP,
          event,
        );
        return;
      }
      if (ctrl && event.shiftKey && key === 'Enter') {
        event.preventDefault();
        this.fit(cell.column, 'keyboard', event);
        return;
      }
      /* F2 enters the header cell: its widgets are the column's help, its
         filter and its menu, and a reader reaches them without a pointer. */
      if (key === 'F2' && !insideWidget) {
        const first = cellElement.querySelector<HTMLElement>(
          '[data-part="column-actions"] button:not([disabled])',
        );
        if (first) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.altKey && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        event.preventDefault();
        this.moveColumn(cell.column, (key === 'ArrowRight') !== mirror ? 1 : -1, event);
        this.pendingFocus = cell;
        this.flushFocus();
        return;
      }
      if (ctrl && key === 'Enter') {
        event.preventDefault();
        cellElement.querySelector<HTMLElement>('[data-part="column-menu"]')?.click();
        return;
      }
      if ((key === 'Enter' || key === ' ') && !insideWidget) {
        event.preventDefault();
        this.pressSort(cell.column, event.shiftKey, event, 'keyboard');
        return;
      }
    }

    if (
      isGroupCursorRow(cell.row) &&
      (key === 'ArrowRight' || key === 'ArrowLeft') &&
      !event.shiftKey
    ) {
      const groupKey = cell.row.slice(GROUP_ROW_PREFIX.length);
      const held = this.expandedGroups();
      const open = held === 'all' || held.includes(groupKey);
      if (((key === 'ArrowRight') !== mirror) !== open) {
        event.preventDefault();
        this.toggleGroup(groupKey, event, 'keyboard');
        return;
      }
    }
    /* Alt with the vertical arrows moves the row, as Alt with the
       horizontal ones moves the column. */
    if (row && event.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
      event.preventDefault();
      this.moveRow(cell.row, key === 'ArrowDown' ? 1 : -1, event);
      this.pendingFocus = cell;
      return;
    }

    /* In the tree column, the horizontal arrows open a closed branch, close
       an open one, and climb to the parent from a closed row or a leaf. */
    const treeColumn = this.treeColumn();
    if (
      row &&
      treeColumn !== null &&
      cell.column === treeColumn &&
      (key === 'ArrowRight' || key === 'ArrowLeft') &&
      !event.shiftKey
    ) {
      const node = this.nodeByKey().get(cell.row);
      const branch =
        node !== undefined && (node.childCount > 0 || this.tree()?.hasChildren?.(row) === true);
      const opening = (key === 'ArrowRight') !== mirror;
      if (node && branch && opening !== node.open) {
        event.preventDefault();
        this.toggleBranch(cell.row, event, 'keyboard');
        return;
      }
      if (node && !opening && node.parent !== null) {
        event.preventDefault();
        this.setCurrent({ row: node.parent, column: cell.column }, 'keyboard', event);
        return;
      }
    }
    if (
      row &&
      cell.column === EXPANDER_COLUMN &&
      (key === 'ArrowRight' || key === 'ArrowLeft') &&
      !event.shiftKey &&
      this.isExpandable(row)
    ) {
      const open = this.expandedSet().has(cell.row);
      if (((key === 'ArrowRight') !== mirror) !== open) {
        event.preventDefault();
        this.toggleExpanded(cell.row, event, 'keyboard');
        return;
      }
    }

    if (key === ' ' && event.shiftKey && row) {
      event.preventDefault();
      if (mode === 'range') {
        const line = rowRange(grid, cell.row);
        if (line) this.requestRange(line, 'keyboard', event);
      } else this.toggleSelected(cell.row, { range: false, source: event, reason: 'keyboard' });
      return;
    }
    if (key === ' ' && ctrl && mode === 'range' && column) {
      event.preventDefault();
      const line = columnRange(grid, cell.column);
      if (line) this.requestRange(line, 'keyboard', event);
      return;
    }
    if ((key === 'a' || key === 'A') && ctrl && !insideWidget) {
      if (mode === 'multiple') {
        event.preventDefault();
        this.commitSelection(this.selectableKeys(), 'select', event);
        return;
      }
      if (mode === 'range') {
        event.preventDefault();
        const all = wholeRange(grid);
        if (all) this.requestRange(all, 'keyboard', event);
        return;
      }
    }
    if ((key === 'c' || key === 'C') && ctrl && !insideWidget) {
      const selection = cellElement.ownerDocument.getSelection();
      if (selection && selection.toString().length > 0) return;
      event.preventDefault();
      void this.copyRange(cell);
      return;
    }
    if (key === 'Escape' && mode === 'range' && this.range()) {
      event.preventDefault();
      this.requestRange(null, 'clear', event);
      return;
    }

    /* The pop-in is a cell of the row: it edits nothing, and Enter enters its
       widgets or activates the row as any other cell does. */
    if (row && (column || cell.column === POPIN_COLUMN_ID) && (key === 'Enter' || key === 'F2')) {
      const editable = column !== undefined && this.isEditable(column.column, row);
      if (editable && !insideWidget) {
        event.preventDefault();
        this.startEdit(cell);
        return;
      }
      const widgets = cellElement.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!insideWidget && widgets.length > 0) {
        event.preventDefault();
        widgets[0]!.focus();
        return;
      }
      if (key === 'Enter' && this.activatable() && !insideWidget) {
        event.preventDefault();
        this.activate.emit({ key: cell.row, reason: 'keyboard', event });
        return;
      }
    }
    if (
      row &&
      column &&
      !insideWidget &&
      key.length === 1 &&
      !ctrl &&
      !event.altKey &&
      (column.kind === 'text' || column.kind === 'number') &&
      this.isEditable(column.column, row)
    ) {
      if (column.kind === 'number' && !/[0-9.,-]/.test(key)) return;
      event.preventDefault();
      this.startEdit(cell, key);
      return;
    }

    const intents: Record<string, CursorIntent> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: mirror ? 'end' : 'start',
      ArrowRight: mirror ? 'start' : 'end',
      Home: ctrl ? 'first' : 'rowStart',
      End: ctrl ? 'last' : 'rowEnd',
      PageUp: 'pageUp',
      PageDown: 'pageDown',
    };
    const intent = intents[key];
    if (!intent) return;
    if (
      insideWidget &&
      (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') &&
      target.matches('input:not([type="checkbox"]):not([type="radio"]), textarea')
    ) {
      return;
    }
    event.preventDefault();
    const next = this.landOn(moveCursor(grid, cell, intent));
    if (event.shiftKey && key.startsWith('Arrow')) {
      if (mode === 'range' && isBodyRow(next.row)) {
        this.requestRange({ anchor: this.range()?.anchor ?? cell, focus: next }, 'keyboard', event);
      } else if (
        mode === 'multiple' &&
        (key === 'ArrowUp' || key === 'ArrowDown') &&
        isBodyRow(next.row)
      ) {
        this.toggleSelected(next.row, { range: true, source: event, reason: 'keyboard' });
      }
    }
    if (!sameCell(next, cell)) this.setCurrent(next, 'keyboard', event);
  }

  /* ── Imperative surface ─────────────────────────────────────────────── */
  scrollToRow(key: string, align: 'start' | 'center' | 'end' | 'nearest' = 'nearest') {
    const index = this.nodes().findIndex((node) => node.key === key);
    const scroller = this.scrollRef()?.nativeElement;
    if (index === -1 || !scroller) return;
    const metrics = this.metrics();
    const size = this.rowSize();
    const offset = metrics ? metrics.offsetOf(index) : index * size;
    const head = scroller.querySelector<HTMLElement>('[data-part="head"]')?.offsetHeight ?? 0;
    const height = this.viewport().height;
    let top = offset;
    if (align === 'center') top = offset - height / 2 + size;
    else if (align === 'end') top = offset - height + size + head;
    else if (align === 'nearest') {
      const visibleTop = scroller.scrollTop;
      const visibleBottom = visibleTop + height - head;
      if (offset >= visibleTop && offset + size <= visibleBottom) return;
      top = offset < visibleTop ? offset : offset - height + size + head;
    }
    scroller.scrollTo({ top: Math.max(0, top) });
    if (this.windowsRows()) this.heldRows.set([key]);
  }
  scrollToColumn(columnId: string) {
    const scroller = this.scrollRef()?.nativeElement;
    const column = this.resolvedById().get(columnId);
    if (!scroller || !column || column.pinned) return;
    const gutters = this.gutters().reduce((sum, width) => sum + width, 0);
    let offset = gutters;
    for (const entry of this.resolved()) {
      if (entry.id === columnId) break;
      if (entry.pinned === null || entry.pinned === 'start') offset += entry.width;
    }
    const startZone =
      this.resolved()
        .filter((entry) => entry.pinned === 'start')
        .reduce((sum, entry) => sum + entry.width, 0) + gutters;
    const endZone = this.resolved()
      .filter((entry) => entry.pinned === 'end')
      .reduce((sum, entry) => sum + entry.width, 0);
    const left = Math.abs(scroller.scrollLeft);
    const width = this.viewport().width;
    if (offset < left + startZone) scroller.scrollTo({ left: offset - startZone });
    else if (offset + column.width > left + width - endZone)
      scroller.scrollTo({ left: offset + column.width - width + endZone });
  }
  scrollToCell(cell: GridCell) {
    this.scrollToRow(cell.row);
    this.scrollToColumn(cell.column);
  }
  getVisibleRows(): readonly Row[] {
    return this.resolvedMode() === 'client' ? this.applied().rows : this.rows();
  }
  /** The file's text, by `toCsv`, for the consumer who sends it elsewhere. */
  toCsv(options: DataGridExportOptions = {}): string {
    const { filename: _filename, rows: which, columns: whichColumns, ...csv } = options;
    const visible = this.getVisibleRows();
    const selected = this.selectedSet();
    const chosen =
      which === 'selected' ? visible.filter((row) => selected.has(this.rowKeyOf(row))) : visible;
    const model =
      whichColumns === 'all' ? this.columns() : this.resolved().map((column) => column.column);
    return toCsv(chosen, model, {
      ...this.formatOptions(),
      ...csv,
      booleans: csv.booleans ?? this.formatOptions().booleans,
    });
  }
  /**
   * Builds the file and hands it to the browser as a download: an anchor is
   * the one way a browser saves a file without a permission prompt, and the
   * URL is revoked as soon as the click has taken it.
   */
  exportCsv(options: DataGridExportOptions = {}) {
    const text = this.toCsv(options);
    const doc = this.host.nativeElement.ownerDocument;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = doc.createElement('a');
    link.href = url;
    link.download = options.filename ?? 'export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  /* ── Forms ──────────────────────────────────────────────────────────── */
  writeValue(value: DataGridSelection | undefined) {
    this.value.set(value ?? (this.resolvedSelectionMode() === 'multiple' ? [] : null));
  }
  registerOnChange(fn: (value: DataGridSelection) => void) {
    this.notify = fn;
  }
  registerOnTouched(fn: () => void) {
    this.touched = fn;
  }
  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }
}
