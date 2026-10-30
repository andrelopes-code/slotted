import { NgTemplateOutlet } from '@angular/common';
import {
  afterEveryRender,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SlButton, SlButtonStart, SlIconButton } from '@slotted/angular/button';
import {
  SlCard,
  SlCardActions,
  SlCardBody,
  SlCardFooter,
  SlCardHeader,
} from '@slotted/angular/card';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  SlMenu,
  SlMenuItem,
  SlMenuSeparator,
  SlMenuTrigger,
  type MenuSelectEvent,
} from '@slotted/angular/menu';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlHeadingLevel } from '@slotted/angular/typography';
import {
  cellAt,
  DASHBOARD_SUBROWS,
  dashboardKeyIntent,
  handleShortcuts,
  layoutsEqual,
  materializeLayout,
  measureTiles,
  moveTile,
  moveTileBy,
  observeContentSpan,
  parseDuration,
  playFlip,
  playResize,
  resizeTileBy,
  resizeTileInClass,
  resolveColumns,
  resolveTiles,
  setTileHidden,
  sizeClassOf,
  spanFromTravel,
  swapTiles,
  tileStyle,
  type DashboardBox,
  type DashboardColumnsInput,
  type DashboardDirection,
  type DashboardLayout,
  type DashboardLayoutChange,
  type DashboardSizeClass,
  type DashboardTile,
  type MeasuredTile,
} from '@slotted/core/dashboard-grid';
import { createDragController, type DropTarget } from '@slotted/core/drag';
import {
  dashboardGridMessages,
  dragMessages,
  type DashboardGridMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { ChangeReason } from '@slotted/core/state';

import {
  injectDashboardGridDefaults,
  SlDashboardGridIdFactory,
  SlDashboardGridWords,
  SlDashboardWidgetHost,
  type DashboardEditingReason,
  type DashboardEditingRequest,
  type DashboardHeadingLevel,
  type DashboardLayoutReason,
  type DashboardLayoutRequest,
} from './dashboard-grid-defaults';
import { SlDashboardPart, SlDashboardWidget } from './dashboard-widget';

const EMPTY_LAYOUT: DashboardLayout = [];
const GRID = 'dashboard-grid';
const ADD = `${GRID}:add`;
const PLACEHOLDER = '\u0000placeholder';

/** An edge a widget is pulled by. The top is not one: gravity decides it. */
type DashboardEdge = 'start' | 'end' | 'bottom' | 'bottom-start' | 'bottom-end';

const EDGES: readonly DashboardEdge[] = ['start', 'end', 'bottom', 'bottom-start', 'bottom-end'];

/** A click with no coordinates is a key. */
function pressReason(event: MouseEvent): 'pointer' | 'keyboard' {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

function directionOf(element: Element): 'ltr' | 'rtl' {
  return getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
}

/** A grid not laid out yet — hidden, or in a test — is drawn in its stored class. */
function classOf(root: HTMLElement, expandedFrom?: number): DashboardSizeClass {
  return root.clientWidth > 0 ? sizeClassOf(root.clientWidth, expandedFrom) : 'expanded';
}

function makeRequest<T, Extra extends object>(
  value: T,
  previous: T,
  reason: ChangeReason,
  source: unknown,
  extra: Extra,
) {
  let cancelled = false;
  return {
    value,
    previous,
    reason,
    source,
    ...extra,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/** The tracks the grid is drawn with in the class it is in, read from its style. */
interface Tracks {
  readonly columns: number;
  readonly track: number;
  readonly columnGap: number;
  readonly row: number;
  readonly rowGap: number;
}

function tracksOf(list: HTMLElement, columns: number): Tracks {
  const styles = getComputedStyle(list);
  const columnGap = parseFloat(styles.columnGap) || 0;
  const track = (list.clientWidth - columnGap * (columns - 1)) / Math.max(1, columns);
  /* The tracks are sub-rows with no gap between them; a row is twelve of them
     less the gap its widget draws below itself. */
  const pitch = (parseFloat(styles.gridAutoRows) || 0) * DASHBOARD_SUBROWS;
  const row = Math.max(0, pitch - columnGap);
  return { columns, track, columnGap, row, rowGap: columnGap };
}

/** Where a widget was picked up, relative to the grid, in logical terms. */
interface Origin {
  readonly inlineStart: number;
  readonly blockStart: number;
  readonly inlineSize: number;
  readonly blockSize: number;
}

function originOf(element: HTMLElement, list: HTMLElement, rtl: boolean): Origin {
  const box = element.getBoundingClientRect();
  const frame = list.getBoundingClientRect();
  return {
    inlineStart: rtl ? frame.right - box.right : box.left - frame.left,
    blockStart: box.top - frame.top,
    inlineSize: box.width,
    blockSize: box.height,
  };
}

/* The widget in hand is placed and moved by its own geometry, never by a
   custom property: one restyles everything under the widget, and it is
   written every frame. */
const LIFT = ['inset-inline-start', 'inset-block-start', 'inline-size', 'block-size', 'translate'];

function writeOrigin(element: HTMLElement, origin: Origin) {
  element.style.setProperty('inset-inline-start', `${origin.inlineStart}px`);
  element.style.setProperty('inset-block-start', `${origin.blockStart}px`);
  element.style.setProperty('inline-size', `${origin.inlineSize}px`);
  element.style.setProperty('block-size', `${origin.blockSize}px`);
}

function clearLift(element: HTMLElement | undefined) {
  if (element === undefined) return;
  for (const name of LIFT) element.style.removeProperty(name);
}

function boxOf(element: HTMLElement): MeasuredTile {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

/** What a gesture has reached, as the grid draws it. */
type Gesture =
  | { readonly kind: 'move'; readonly key: string; readonly preview: DashboardLayout }
  | {
      readonly kind: 'resize';
      readonly key: string;
      readonly edge: DashboardEdge;
      readonly preview: DashboardLayout;
      readonly sizeClass: DashboardSizeClass;
    };

/** What the template draws for one widget. */
interface Slot {
  readonly widget: SlDashboardWidget;
  readonly tile: DashboardTile;
  readonly style: Record<string, string>;
  readonly dragging: boolean;
  readonly resizing: boolean;
  /** The edge a pointer is pulling, while it pulls. */
  readonly edge: DashboardEdge | null;
  /** The size the pull has reached, already filled. */
  readonly readout: string | null;
  /** Whether the widget has a size to change in the class it is drawn in. */
  readonly sizable: boolean;
  readonly handle: boolean;
  readonly can: {
    readonly up: boolean;
    readonly down: boolean;
    readonly left: boolean;
    readonly right: boolean;
    readonly wider: boolean;
    readonly narrower: boolean;
    readonly taller: boolean;
    readonly shorter: boolean;
  };
}

/**
 * A surface of widgets the reader places and sizes. The widgets are
 * `sl-dashboard-widget` children, each with its own `value`; the grid draws
 * them where the layout puts them, by row and then column, which is the
 * reading order, the focus order and the picture at every width.
 *
 * The host is the root. `aria-label` and `aria-labelledby` written on it name
 * the list inside, which is what a reader meets.
 */
@Component({
  selector: '[slDashboardGrid]',
  standalone: true,
  exportAs: 'slDashboardGrid',
  providers: [
    { provide: SlDashboardGridWords, useExisting: forwardRef(() => SlDashboardGrid) },
    { provide: SlDashboardWidgetHost, useExisting: forwardRef(() => SlDashboardGrid) },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    '../../../styles/src/dashboard-grid/dashboard-grid.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlButtonStart,
    SlCard,
    SlCardActions,
    SlCardBody,
    SlCardFooter,
    SlCardHeader,
    SlDashboardPart,
    SlGlyph,
    SlIcon,
    SlIconButton,
    SlMenu,
    SlMenuItem,
    SlMenuSeparator,
    SlMenuTrigger,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlSkeleton,
  ],
  host: {
    'data-ui': 'dashboard-grid',
    'data-ui-dashboard-grid': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-editing]': 'isEditing() ? "" : null',
    '[attr.data-size-class]': 'measuredClass()',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[style.--_dg-columns-expanded]': 'grid().expanded',
    '[style.--_dg-columns-medium]': 'grid().medium',
    '[style.--_dg-columns-compact]': 'grid().compact',
  },
  template: `
    @if (isEditing() && resolvedEditBar()) {
      <div data-part="edit-bar" data-part-edit-bar="" role="group" [attr.aria-label]="t('editBar')">
        <p data-part="edit-status" data-part-edit-status="" [id]="statusId">
          {{ t('editStatus') }}
        </p>
        <div data-part="edit-actions" data-part-edit-actions="">
          @if (hiddenTiles().length > 0) {
            <button
              slButton
              slDashboardPart="add"
              data-dashboard-add
              size="sm"
              tone="secondary"
              variant="outline"
              [slMenuTriggerFor]="addMenu"
            >
              <span slButtonStart
                ><span slIcon><svg slGlyph name="plus"></svg></span></span
              >{{ t('add') }}
            </button>
            <sl-menu #addMenu>
              @for (tile of hiddenTiles(); track tile.key) {
                <button slMenuItem (select)="show(tile.key, reasonOf($event), $event.source)">
                  {{ titleOf(tile.key) }}
                </button>
              }
            </sl-menu>
          }
          <button
            slButton
            slDashboardPart="reset"
            size="sm"
            tone="secondary"
            variant="ghost"
            (click)="reset(pressReason($event), $event)"
          >
            {{ t('reset') }}
          </button>
          <button
            slButton
            slDashboardPart="cancel"
            size="sm"
            tone="secondary"
            variant="outline"
            (click)="cancelEditing(pressReason($event), $event)"
          >
            {{ t('cancel') }}
          </button>
          <button
            slButton
            slDashboardPart="done"
            size="sm"
            tone="accent"
            variant="solid"
            (click)="commitEditing('submit', $event)"
          >
            {{ t('done') }}
          </button>
        </div>
      </div>
    }
    @if (isEditing() && !resolvedEditBar()) {
      <p
        data-part="edit-status"
        data-part-edit-status=""
        data-ui="visually-hidden"
        data-ui-visually-hidden=""
        [id]="statusId"
      >
        {{ t('editStatus') }}
      </p>
    }
    <ul
      #list
      data-part="grid"
      data-part-grid=""
      [attr.data-gesture]="gesture() === null ? null : ''"
      role="list"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabelledBy() ?? null"
      [hidden]="slots().length === 0"
    >
      @for (slot of slots(); track slot.tile.key) {
        <li
          data-part="widget"
          data-part-widget=""
          [attr.data-key]="slot.tile.key"
          [attr.data-rows]="slot.widget.rows() ?? null"
          [attr.data-status]="slot.widget.status()"
          [attr.data-loading]="slot.widget.painted() ? '' : null"
          [attr.data-movable]="slot.tile.movable ? '' : null"
          [attr.data-resizable]="slot.tile.resizable ? '' : null"
          [attr.data-dragging]="slot.dragging ? '' : null"
          [attr.data-resizing]="slot.resizing ? '' : null"
          [style]="slot.style"
        >
          <article
            slCard
            [fill]="slot.widget.fill()"
            [size]="slot.widget.size()"
            [attr.aria-labelledby]="titleId(slot.tile.key)"
            [attr.aria-describedby]="
              slot.widget.description() === undefined
                ? null
                : titleId(slot.tile.key) + '-description'
            "
            [attr.aria-busy]="slot.widget.painted() || slot.widget.busy() ? true : null"
          >
            <div slCardHeader>
              @switch (levelOf(slot.widget)) {
                @case (2) {
                  <h2 data-part="title" data-part-title="" [id]="titleId(slot.tile.key)">
                    {{ slot.widget.title() }}
                  </h2>
                }
                @case (4) {
                  <h4 data-part="title" data-part-title="" [id]="titleId(slot.tile.key)">
                    {{ slot.widget.title() }}
                  </h4>
                }
                @case (5) {
                  <h5 data-part="title" data-part-title="" [id]="titleId(slot.tile.key)">
                    {{ slot.widget.title() }}
                  </h5>
                }
                @case (6) {
                  <h6 data-part="title" data-part-title="" [id]="titleId(slot.tile.key)">
                    {{ slot.widget.title() }}
                  </h6>
                }
                @default {
                  <h3 data-part="title" data-part-title="" [id]="titleId(slot.tile.key)">
                    {{ slot.widget.title() }}
                  </h3>
                }
              }
              @if (slot.widget.description(); as description) {
                <p
                  data-part="description"
                  data-part-description=""
                  [id]="titleId(slot.tile.key) + '-description'"
                >
                  {{ description }}
                </p>
              }
              @if (
                slot.widget.hasActions() ||
                slot.widget.hasDetail() ||
                slot.widget.detailHref() !== undefined ||
                slot.widget.detailable()
              ) {
                <div slCardActions>
                  <ng-container [ngTemplateOutlet]="slot.widget.actionsTemplate()" />
                  @if (slot.widget.hasDetail()) {
                    <ng-container [ngTemplateOutlet]="slot.widget.detailTemplate()" />
                  } @else if (slot.widget.detailHref(); as href) {
                    <a
                      data-ui="button"
                      data-ui-button=""
                      data-part="detail"
                      data-part-detail=""
                      data-tone="secondary"
                      data-variant="ghost"
                      data-size="sm"
                      data-shape="square"
                      [attr.href]="href"
                      [attr.aria-label]="t('detail', { title: slot.widget.title() })"
                      (click)="slot.widget.detail.emit($event)"
                      ><span data-part="icon" data-part-icon="" aria-hidden="true"
                        ><span slIcon directional><svg slGlyph name="external"></svg></span></span
                    ></a>
                  } @else if (slot.widget.detailable()) {
                    <button
                      slIconButton
                      slDashboardPart="detail"
                      size="sm"
                      tone="secondary"
                      variant="ghost"
                      [attr.aria-label]="t('detail', { title: slot.widget.title() })"
                      (click)="slot.widget.detail.emit($event)"
                    >
                      <span slIcon directional><svg slGlyph name="external"></svg></span>
                    </button>
                  }
                </div>
              }
            </div>
            <div slCardBody>
              @if (slot.widget.busy() && !slot.widget.painted()) {
                <span
                  data-part="busy-indicator"
                  data-part-busy-indicator=""
                  aria-hidden="true"
                ></span>
              }
              @if (slot.widget.painted()) {
                <div data-part="skeleton" data-part-skeleton="">
                  @if (slot.widget.hasSkeleton()) {
                    <ng-container [ngTemplateOutlet]="slot.widget.skeletonTemplate()" />
                  } @else {
                    <span slSkeleton shape="block"></span>
                  }
                </div>
              } @else if (slot.widget.status() === 'empty') {
                <div data-part="message" data-part-message="">
                  <section slResultState status="empty" reach="section" align="center" live="off">
                    <div slResultStateContent>
                      <div slResultStateTitle>
                        {{ slot.widget.emptyTitle() ?? t('emptyTitle') }}
                      </div>
                      @if (slot.widget.emptyDescription(); as description) {
                        <p slResultStateDescription>{{ description }}</p>
                      }
                    </div>
                    @if (slot.widget.hasEmptyAction()) {
                      <div slResultStateActions>
                        <ng-container [ngTemplateOutlet]="slot.widget.emptyActionTemplate()" />
                      </div>
                    }
                  </section>
                </div>
              } @else if (slot.widget.status() === 'error') {
                <div data-part="message" data-part-message="">
                  <section
                    slResultState
                    status="error"
                    reach="section"
                    align="center"
                    live="polite"
                  >
                    <div slResultStateContent>
                      <div slResultStateTitle>
                        {{ slot.widget.errorTitle() ?? t('errorTitle') }}
                      </div>
                      @if (slot.widget.errorDescription(); as description) {
                        <p slResultStateDescription>{{ description }}</p>
                      }
                    </div>
                    @if (slot.widget.retryable()) {
                      <div slResultStateActions>
                        <button
                          slButton
                          slDashboardPart="retry"
                          size="sm"
                          tone="secondary"
                          variant="outline"
                          (click)="slot.widget.retry.emit($event)"
                        >
                          <span slButtonStart
                            ><span slIcon><svg slGlyph name="rotate-ccw"></svg></span></span
                          >{{ t('retry') }}
                        </button>
                      </div>
                    }
                  </section>
                </div>
              } @else {
                <ng-container [ngTemplateOutlet]="slot.widget.bodyTemplate()" />
              }
            </div>
            @if (slot.widget.hasFooter()) {
              <div slCardFooter>
                <ng-container [ngTemplateOutlet]="slot.widget.footerTemplate()" />
              </div>
            }
          </article>
          @if (slot.handle) {
            <button
              slDashboardPart="handle"
              [attr.data-handle]="slot.tile.key"
              [attr.aria-label]="t('handle', { title: slot.widget.title() })"
              [attr.aria-describedby]="statusId"
              [attr.aria-keyshortcuts]="shortcuts(slot.tile.removable)"
              [slMenuTriggerFor]="handleMenu"
            >
              <span slIcon><svg slGlyph name="grip-horizontal"></svg></span>
            </button>
            <sl-menu #handleMenu>
              @if (slot.tile.movable) {
                <button
                  slMenuItem
                  shortcut="Alt+ArrowUp"
                  [disabled]="!slot.can.up"
                  (select)="move(slot.tile.key, 'up', reasonOf($event), $event.source)"
                >
                  {{ t('moveUp') }}
                </button>
                <button
                  slMenuItem
                  shortcut="Alt+ArrowDown"
                  [disabled]="!slot.can.down"
                  (select)="move(slot.tile.key, 'down', reasonOf($event), $event.source)"
                >
                  {{ t('moveDown') }}
                </button>
                @if (!flows()) {
                  <button
                    slMenuItem
                    shortcut="Alt+ArrowLeft"
                    [disabled]="!slot.can.left"
                    (select)="move(slot.tile.key, 'left', reasonOf($event), $event.source)"
                  >
                    {{ t('moveStart') }}
                  </button>
                  <button
                    slMenuItem
                    shortcut="Alt+ArrowRight"
                    [disabled]="!slot.can.right"
                    (select)="move(slot.tile.key, 'right', reasonOf($event), $event.source)"
                  >
                    {{ t('moveEnd') }}
                  </button>
                }
              }
              @if (slot.tile.movable && slot.sizable) {
                <hr slMenuSeparator />
              }
              @if (slot.sizable) {
                <button
                  slMenuItem
                  shortcut="Shift+ArrowRight"
                  [disabled]="!slot.can.wider"
                  (select)="resize(slot.tile.key, 1, 0, reasonOf($event), $event.source)"
                >
                  {{ t('wider') }}
                </button>
                <button
                  slMenuItem
                  shortcut="Shift+ArrowLeft"
                  [disabled]="!slot.can.narrower"
                  (select)="resize(slot.tile.key, -1, 0, reasonOf($event), $event.source)"
                >
                  {{ t('narrower') }}
                </button>
                <button
                  slMenuItem
                  shortcut="Shift+ArrowDown"
                  [disabled]="!slot.can.taller"
                  (select)="resize(slot.tile.key, 0, 1, reasonOf($event), $event.source)"
                >
                  {{ t('taller') }}
                </button>
                <button
                  slMenuItem
                  shortcut="Shift+ArrowUp"
                  [disabled]="!slot.can.shorter"
                  (select)="resize(slot.tile.key, 0, -1, reasonOf($event), $event.source)"
                >
                  {{ t('shorter') }}
                </button>
              }
              @if (slot.tile.removable) {
                @if (slot.tile.movable || slot.sizable) {
                  <hr slMenuSeparator />
                }
                <button
                  slMenuItem
                  tone="danger"
                  shortcut="Delete"
                  (select)="hide(slot.tile.key, 'remove', $event.source)"
                >
                  {{ t('hide') }}
                </button>
              }
            </sl-menu>
          }
          @if (isEditing() && slot.sizable) {
            @for (edge of edges; track edge) {
              <span
                data-part="resize-handle"
                data-part-resize-handle=""
                aria-hidden="true"
                [attr.data-edge]="edge"
                [attr.data-active]="slot.edge === edge ? '' : null"
                (pointerdown)="onResizePointerDown(slot.tile.key, edge, $event)"
              ></span>
            }
          }
          @if (slot.readout !== null) {
            <span
              data-part="size-readout"
              data-part-size-readout=""
              aria-hidden="true"
              [attr.data-edge]="slot.edge"
              >{{ slot.readout }}</span
            >
          }
        </li>
      }
      @if (placeholder(); as style) {
        <li
          data-part="placeholder"
          data-part-placeholder=""
          aria-hidden="true"
          [style]="style"
        ></li>
      }
    </ul>
    @if (slots().length === 0) {
      <div data-part="empty" data-part-empty="">
        <section slResultState status="empty" reach="section" live="polite">
          <div slResultStateContent>
            <div slResultStateTitle>{{ t('empty') }}</div>
            @if (isEditing()) {
              <p slResultStateDescription>{{ t('emptyEditing') }}</p>
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class SlDashboardGrid implements SlDashboardGridWords, SlDashboardWidgetHost {
  /**
   * Where each widget stands and how big it is: `[{ key, x, y, w, h, hidden? }]`
   * in cells of the expanded class. Bound at all, it is the value; unbound,
   * the grid keeps its own.
   */
  readonly layout = model<DashboardLayout | undefined>(undefined);
  /** The layout an unbound grid starts from. Default: every widget at its defaults. */
  readonly defaultLayout = input<DashboardLayout | undefined>(undefined);
  readonly editing = model<boolean | undefined>(undefined);
  readonly defaultEditing = input(false, { transform: booleanAttribute });
  /** Columns of the expanded class, or one count per class. Default 12, 6, 1. */
  readonly columns = input<DashboardColumnsInput | undefined>(undefined);
  readonly editBar = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : booleanAttribute(given)),
  });
  /**
   * The grid's own width, in pixels, from which the expanded class applies. Default 1024. A grid
   * beside a navigation rail is narrower than its page, so a lower threshold keeps its layout.
   */
  readonly expandedFrom = input<number | undefined>(undefined);
  readonly headingLevel = input<DashboardHeadingLevel | undefined>(undefined);
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<DashboardGridMessages> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  readonly layoutChangeRequest = output<DashboardLayoutRequest>();
  readonly editingChangeRequest = output<DashboardEditingRequest>();

  /* ── State ────────────────────────────────────────────────────────── */

  private readonly defaults = injectDashboardGridDefaults();
  private readonly base = inject(SlDashboardGridIdFactory).next();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly list = viewChild<ElementRef<HTMLUListElement>>('list');
  /**
   * The widgets in the order they are written, then those a component of the
   * consumer's renders, in the order they were created: the content query
   * reaches only the grid's own content.
   */
  private readonly written = contentChildren(SlDashboardWidget);
  private readonly declared = signal<readonly SlDashboardWidget[]>([]);
  protected readonly widgets = computed(() => {
    const written = this.written();
    return [...written, ...this.declared().filter((widget) => !written.includes(widget))];
  });

  protected readonly statusId = `${this.base}-edit-status`;
  protected readonly edges = EDGES;
  protected readonly pressReason = pressReason;
  protected readonly shortcuts = handleShortcuts;

  /** The family's words in the language in force, with this grid's `messages` laid over them. */
  protected readonly t = injectMessages(dashboardGridMessages, this.messages);
  /** What a drag of a widget says when no position is left, in the language in force. */
  private readonly dragT = injectMessages(dragMessages);
  protected readonly grid = computed(() => resolveColumns(this.columns() ?? this.defaults.columns));
  protected readonly resolvedEditBar = computed(() => this.editBar() ?? this.defaults.editBar);

  readonly currentLayout = computed(() => this.layout() ?? this.defaultLayout() ?? EMPTY_LAYOUT);
  readonly isEditing = computed(() => this.editing() ?? this.defaultEditing());

  private readonly specs = computed(() => this.widgets().map((widget) => widget.spec()));
  private readonly byKey = computed(
    () => new Map(this.widgets().map((widget) => [widget.value(), widget])),
  );
  private readonly tiles = computed(() =>
    resolveTiles(this.currentLayout(), this.specs(), this.grid()),
  );
  private readonly visible = computed(() => this.tiles().filter((tile) => !tile.hidden));
  protected readonly hiddenTiles = computed(() => this.tiles().filter((tile) => tile.hidden));

  protected readonly gesture = signal<Gesture | null>(null);
  /* The class the grid is drawn in, from its width observed after the first
     render, so a server render and the first client render agree on
     `expanded`. Once measured it is written on the root, and the stylesheet
     follows it. */
  private readonly outline = inject(SlHeadingLevel, { optional: true });
  private readonly width = signal(0);
  protected readonly measuredClass = computed(() =>
    this.width() > 0 ? sizeClassOf(this.width(), this.expandedFrom()) : null,
  );
  private readonly drawnClass = computed(() => this.measuredClass() ?? 'expanded');
  protected readonly flows = computed(() => this.drawnClass() !== 'expanded');

  /** What is drawn: the committed layout, or the one a gesture previews. */
  private readonly drawn = computed(() => {
    const gesture = this.gesture();
    return gesture === null
      ? this.tiles()
      : resolveTiles(gesture.preview, this.specs(), this.grid());
  });
  private readonly drawnVisible = computed(() => this.drawn().filter((tile) => !tile.hidden));

  protected readonly slots = computed<Slot[]>(() => {
    const gesture = this.gesture();
    const drawn = this.drawn();
    const order = new Map(this.drawnVisible().map((tile, index) => [tile.key, index]));
    const widgets = this.byKey();
    const editing = this.isEditing();
    const drawnClass = this.drawnClass();
    const layout = this.currentLayout();
    const specs = this.specs();
    const grid = this.grid();
    const committed = materializeLayout(layout, specs, grid);
    const differs = (next: DashboardLayout) =>
      !layoutsEqual(materializeLayout(next, specs, grid), committed);
    const slots: Slot[] = [];
    for (const tile of this.visible()) {
      const widget = widgets.get(tile.key);
      if (widget === undefined) continue;
      const shown = drawn.find((each) => each.key === tile.key) ?? tile;
      const inHand = gesture !== null && gesture.key === tile.key;
      const resizing = inHand && gesture.kind === 'resize';
      const sizable = tile.resizable && drawnClass !== 'compact';
      const at = (direction: DashboardDirection) =>
        editing && differs(moveTileBy(layout, specs, grid, tile.key, direction, drawnClass));
      const by = (columns: number, rows: number) =>
        editing &&
        differs(resizeTileBy(layout, specs, grid, tile.key, { columns, rows }, drawnClass));
      const style = tileStyle(shown);
      if (gesture !== null) style['order'] = String(order.get(tile.key) ?? 0);
      slots.push({
        widget,
        tile: shown,
        style,
        dragging: inHand && gesture.kind === 'move',
        resizing,
        edge: resizing ? gesture.edge : null,
        readout: resizing
          ? this.t('size', {
              columns: gesture.sizeClass === 'medium' ? shown.medium : shown.w,
              rows: shown.h,
            })
          : null,
        sizable,
        handle: editing && (tile.movable || sizable || tile.removable),
        can: {
          up: at('up'),
          down: at('down'),
          left: at('left'),
          right: at('right'),
          wider: by(1, 0),
          narrower: by(-1, 0),
          taller: by(0, 1),
          shorter: by(0, -1),
        },
      });
    }
    return slots;
  });

  /** The cells the widget in hand will land in, while a gesture lasts. */
  protected readonly placeholder = computed<Record<string, string> | null>(() => {
    const gesture = this.gesture();
    if (gesture === null) return null;
    const visible = this.drawnVisible();
    const index = visible.findIndex((tile) => tile.key === gesture.key);
    const tile = visible[index];
    return tile === undefined ? null : { ...tileStyle(tile), order: String(index) };
  });

  /** Measured before a change of what is drawn, played after it lands. */
  private flipFrom: Map<string, MeasuredTile> | null = null;
  private settleFrom: { key: string; box: MeasuredTile } | null = null;
  private focusAfter: string | null = null;
  private snapshot: DashboardLayout | null = null;
  private returnFocus: Element | null = null;
  private wasEditing = false;
  private resizeTeardown: (() => void) | null = null;
  private dragTeardown: (() => void) | null = null;
  private dragKeys = '';

  constructor() {
    /* Each widget sized by its content is measured once its card is drawn. */
    afterRenderEffect((onCleanup) => {
      const list = this.list()?.nativeElement;
      const auto = this.widgets().filter((widget) => widget.rows() === 'auto');
      if (list === undefined || auto.length === 0) return;
      const nodes = this.widgetNodes();
      const stops = auto.map((widget) => {
        const card = nodes
          .get(widget.value())
          ?.querySelector<HTMLElement>(':scope > [data-ui="card"]');
        return card
          ? observeContentSpan(card, list, (span) => widget.contentSpan.set(span))
          : () => {};
      });
      onCleanup(() => {
        for (const stop of stops) stop();
      });
    });
    const onKeyDown = (event: KeyboardEvent) => this.onHandleKeyDown(event);
    afterNextRender(() => {
      this.host.nativeElement.addEventListener('keydown', onKeyDown, true);
      if (typeof ResizeObserver === 'undefined') return;
      const root = this.host.nativeElement;
      const observer = new ResizeObserver(() => this.width.set(root.clientWidth));
      observer.observe(root);
      this.width.set(root.clientWidth);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
    this.destroyRef.onDestroy(() => {
      this.host.nativeElement.removeEventListener('keydown', onKeyDown, true);
      this.resizeTeardown?.();
      this.dragTeardown?.();
    });

    afterEveryRender(() => {
      this.syncEditing();
      this.syncDrag();
      this.settle();
    });
  }

  /* ── Reading ──────────────────────────────────────────────────────── */

  protected titleId(key: string) {
    return `${this.base}-${key}-title`;
  }

  detailLabel(title: string): string {
    return this.t('detail', { title });
  }

  declare(widget: object): () => void {
    const declared = widget as SlDashboardWidget;
    this.declared.update((current) => [...current, declared]);
    return () => this.declared.update((current) => current.filter((item) => item !== declared));
  }

  protected titleOf(key: string) {
    return this.byKey().get(key)?.title() ?? key;
  }

  protected levelOf(widget: SlDashboardWidget): Exclude<DashboardHeadingLevel, 'auto'> {
    const level = widget.headingLevel() ?? this.headingLevel() ?? this.defaults.headingLevel;
    return level === 'auto' ? (Math.max(2, this.outline?.level ?? 1) as 2) : level;
  }

  protected reasonOf(event: MenuSelectEvent): DashboardLayoutReason {
    return event.reason === 'keyboard' ? 'keyboard' : 'pointer';
  }

  private sizeClass(): DashboardSizeClass {
    return classOf(this.host.nativeElement, this.expandedFrom());
  }

  private widgetNodes() {
    const nodes = new Map<string, HTMLElement>();
    for (const node of this.list()?.nativeElement.querySelectorAll<HTMLElement>(
      ':scope > [data-part="widget"]',
    ) ?? []) {
      const key = node.dataset['key'];
      if (key !== undefined) nodes.set(key, node);
    }
    return nodes;
  }

  private placeholderNode() {
    return (
      this.list()?.nativeElement.querySelector<HTMLElement>(':scope > [data-part="placeholder"]') ??
      null
    );
  }

  private handleOf(key: string) {
    return (
      this.widgetNodes().get(key)?.querySelector<HTMLElement>(':scope > [data-handle]') ?? null
    );
  }

  private cardOf(key: string) {
    return (
      this.widgetNodes().get(key)?.querySelector<HTMLElement>(':scope > [data-ui="card"]') ?? null
    );
  }

  /** The widgets that glide, and the placeholder; not the one in hand. */
  private flipNodes() {
    const nodes = this.widgetNodes();
    const key = this.gesture()?.key;
    if (key !== undefined) nodes.delete(key);
    const placeholder = this.placeholderNode();
    if (placeholder !== null) nodes.set(PLACEHOLDER, placeholder);
    return nodes;
  }

  private measureAll() {
    this.flipFrom = measureTiles(this.flipNodes());
  }

  private setGesture(next: Gesture | null) {
    this.measureAll();
    this.gesture.set(next);
  }

  /* ── Requests ─────────────────────────────────────────────────────── */

  private announce(message: string) {
    if (message !== '') getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(message);
  }

  private full(layout: DashboardLayout) {
    return materializeLayout(layout, this.specs(), this.grid());
  }

  private change(
    next: DashboardLayout,
    reason: DashboardLayoutReason,
    change: DashboardLayoutChange,
    source: unknown,
    message: (layout: DashboardLayout) => string,
  ): boolean {
    const full = this.full(next);
    const previous = this.full(this.currentLayout());
    if (layoutsEqual(full, previous)) return false;
    if (this.flipFrom === null) this.measureAll();
    const request = makeRequest(full, previous, reason, source, { change });
    this.layoutChangeRequest.emit(request as DashboardLayoutRequest);
    if (request.cancelled) {
      this.flipFrom = null;
      return false;
    }
    this.layout.set(full);
    this.announce(message(full));
    return true;
  }

  private requestEditing(next: boolean, reason: DashboardEditingReason, source: unknown) {
    const previous = this.isEditing();
    if (previous === next) return;
    const request = makeRequest(next, previous, reason, source, {});
    this.editingChangeRequest.emit(request as DashboardEditingRequest);
    if (request.cancelled) return;
    this.editing.set(next);
  }

  private movedMessage(key: string, drawnIn: DashboardSizeClass) {
    return (layout: DashboardLayout) => {
      const placed = resolveTiles(layout, this.specs(), this.grid()).filter((tile) => !tile.hidden);
      const index = placed.findIndex((tile) => tile.key === key);
      const tile = placed[index];
      if (tile === undefined) return '';
      return drawnIn === 'expanded'
        ? this.t('moved', {
            title: this.titleOf(key),
            row: tile.y + 1,
            column: tile.x + 1,
          })
        : this.t('movedInOrder', {
            title: this.titleOf(key),
            position: index + 1,
            total: placed.length,
          });
    };
  }

  private resizedMessage(key: string, drawnIn: DashboardSizeClass) {
    return (layout: DashboardLayout) => {
      const tile = resolveTiles(layout, this.specs(), this.grid()).find((each) => each.key === key);
      return tile === undefined
        ? ''
        : this.t('resized', {
            title: this.titleOf(key),
            columns: drawnIn === 'medium' ? tile.medium : tile.w,
            rows: tile.h,
          });
    };
  }

  protected move(
    key: string,
    direction: DashboardDirection,
    reason: DashboardLayoutReason,
    source?: unknown,
  ) {
    const drawnIn = this.sizeClass();
    const next = moveTileBy(
      this.currentLayout(),
      this.specs(),
      this.grid(),
      key,
      direction,
      drawnIn,
    );
    this.focusAfter = key;
    if (
      !this.change(next, reason, { kind: 'move', key }, source, this.movedMessage(key, drawnIn))
    ) {
      this.focusAfter = null;
    }
  }

  protected resize(
    key: string,
    columns: number,
    rows: number,
    reason: DashboardLayoutReason,
    source?: unknown,
  ) {
    const drawnIn = this.sizeClass();
    const next = resizeTileBy(
      this.currentLayout(),
      this.specs(),
      this.grid(),
      key,
      { columns, rows },
      drawnIn,
    );
    this.focusAfter = key;
    const message = this.resizedMessage(key, drawnIn);
    if (!this.change(next, reason, { kind: 'resize', key }, source, message)) {
      this.focusAfter = null;
    }
  }

  protected hide(key: string, reason: DashboardLayoutReason, source?: unknown) {
    const visible = this.visible();
    const at = visible.findIndex((tile) => tile.key === key);
    const tile = visible[at];
    if (tile === undefined || !tile.removable) return;
    this.focusAfter = (visible[at + 1] ?? visible[at - 1])?.key ?? ADD;
    const next = setTileHidden(this.currentLayout(), this.specs(), this.grid(), key, true);
    const done = this.change(next, reason, { kind: 'hide', key }, source, () =>
      this.t('hidden', { title: this.titleOf(key) }),
    );
    if (!done) this.focusAfter = null;
  }

  protected show(key: string, reason: DashboardLayoutReason, source?: unknown) {
    this.focusAfter = key;
    const next = setTileHidden(this.currentLayout(), this.specs(), this.grid(), key, false);
    this.change(next, reason, { kind: 'show', key }, source, () =>
      this.t('shown', { title: this.titleOf(key) }),
    );
  }

  protected reset(reason: DashboardLayoutReason, source?: unknown) {
    this.change(
      this.defaultLayout() ?? EMPTY_LAYOUT,
      reason,
      { kind: 'reset', key: null },
      source,
      () => this.t('resetDone'),
    );
  }

  /** Leaves editing, as Done does. */
  commitEditing(reason: DashboardEditingReason = 'programmatic', source?: unknown) {
    this.requestEditing(false, reason, source);
  }

  /** Asks for the layout editing began from, then leaves, as Cancel does. */
  cancelEditing(reason: DashboardEditingReason = 'programmatic', source?: unknown) {
    const back = this.snapshot;
    if (back !== null) {
      this.change(back, 'dismiss', { kind: 'cancel', key: null }, source, () =>
        this.t('cancelled'),
      );
    }
    this.requestEditing(false, reason, source);
  }

  /** Focuses a widget's handle while editing, or the widget's first control. */
  focusWidget(key: string) {
    const target =
      (this.isEditing() ? this.handleOf(key) : null) ??
      this.widgetNodes()
        .get(key)
        ?.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
    target?.focus();
  }

  /* ── Keyboard ─────────────────────────────────────────────────────── */

  /**
   * Taken in the capture phase, before the handle's menu trigger reads
   * ArrowDown and ArrowUp: `Alt` and `Shift` with an arrow belong to the
   * layout, and the trigger does not look at modifiers.
   */
  private onHandleKeyDown(event: KeyboardEvent) {
    const handle = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-handle]');
    const key = handle?.getAttribute('data-handle');
    if (!handle || !key || !this.isEditing()) return;
    const intent = dashboardKeyIntent(event, directionOf(handle));
    if (intent === null) return;
    const tile = this.visible().find((each) => each.key === key);
    if (tile === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    if (intent.kind === 'move' && tile.movable) this.move(key, intent.direction, 'keyboard', event);
    if (intent.kind === 'resize' && tile.resizable) {
      this.resize(key, intent.columns, intent.rows, 'keyboard', event);
    }
    if (intent.kind === 'hide') this.hide(key, 'remove', event);
  }

  /* ── Pointer: resize ──────────────────────────────────────────────── */

  protected onResizePointerDown(key: string, edge: DashboardEdge, event: PointerEvent) {
    if (event.button !== 0 || this.resizeTeardown !== null) return;
    const tile = this.visible().find((each) => each.key === key);
    const list = this.list()?.nativeElement;
    const element = this.widgetNodes().get(key);
    if (tile === undefined || !tile.resizable || list === undefined || element === undefined) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const drawnIn = this.sizeClass();
    if (drawnIn === 'compact') return;
    const handle = event.currentTarget as HTMLElement;
    const rtl = directionOf(list) === 'rtl';
    const tracks = tracksOf(list, this.grid()[drawnIn]);
    const origin = originOf(element, list, rtl);
    const start = { x: event.clientX, y: event.clientY };
    const span = drawnIn === 'medium' ? tile.medium : tile.w;
    const pullsStart = edge === 'start' || edge === 'bottom-start';
    const pullsEnd = edge === 'end' || edge === 'bottom-end';
    const pullsBottom = edge !== 'start' && edge !== 'end';
    let snapped: DashboardBox = { x: tile.x, y: tile.y, w: span, h: tile.h };
    let preview: DashboardLayout = this.full(this.currentLayout());

    writeOrigin(element, origin);
    this.setGesture({ kind: 'resize', key, edge, preview, sizeClass: drawnIn });

    const onMove = (moved: PointerEvent) => {
      const dx = moved.clientX - start.x;
      const dy = moved.clientY - start.y;
      /* Travel toward the inline end, whichever way the document reads. */
      const along = rtl ? -dx : dx;
      const floor = tracks.track;
      const inlineSize = pullsEnd
        ? Math.max(floor, origin.inlineSize + along)
        : pullsStart
          ? Math.max(floor, origin.inlineSize - along)
          : origin.inlineSize;
      const blockSize = pullsBottom
        ? Math.max(tracks.row, origin.blockSize + dy)
        : origin.blockSize;
      element.style.setProperty('inline-size', `${inlineSize}px`);
      element.style.setProperty('block-size', `${blockSize}px`);
      /* Pulled by its start, the widget keeps its end still: the element is
         anchored at its start, so it moves by what it grew. */
      const shift = pullsStart ? origin.inlineSize - inlineSize : 0;
      element.style.setProperty('translate', `${rtl ? -shift : shift}px 0px`);

      const w = spanFromTravel({
        span,
        track: tracks.track,
        gap: tracks.columnGap,
        travel: inlineSize - origin.inlineSize,
      });
      const h = pullsBottom
        ? spanFromTravel({
            span: tile.h,
            track: tracks.row,
            gap: tracks.rowGap,
            travel: blockSize - origin.blockSize,
          })
        : tile.h;
      const x = pullsStart ? tile.x + tile.w - w : tile.x;
      if (w === snapped.w && h === snapped.h && x === snapped.x) return;
      snapped = { x, y: tile.y, w, h };
      preview = resizeTileInClass(
        this.currentLayout(),
        this.specs(),
        this.grid(),
        key,
        snapped,
        drawnIn,
      );
      this.setGesture({ kind: 'resize', key, edge, preview, sizeClass: drawnIn });
    };

    const finish = (commit: boolean, source?: Event) => {
      this.resizeTeardown?.();
      this.settleFrom = { key, box: boxOf(element) };
      clearLift(element);
      this.setGesture(null);
      if (!commit) return;
      this.change(
        preview,
        'pointer',
        { kind: 'resize', key },
        source,
        this.resizedMessage(key, drawnIn),
      );
    };
    const onUp = (up: PointerEvent) => finish(true, up);
    const onCancel = () => finish(false);
    const onKey = (down: KeyboardEvent) => {
      if (down.key !== 'Escape') return;
      down.preventDefault();
      down.stopPropagation();
      finish(false);
    };
    const document = handle.ownerDocument;
    handle.setPointerCapture?.(event.pointerId);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onCancel);
    document.addEventListener('keydown', onKey, true);
    this.resizeTeardown = () => {
      this.resizeTeardown = null;
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onCancel);
      document.removeEventListener('keydown', onKey, true);
      if (handle.hasPointerCapture?.(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
    };
  }

  /* ── Pointer: move ────────────────────────────────────────────────── */

  /**
   * One drag controller while editing, rebuilt when the set of widgets that
   * can be picked up changes, and never while one is carried. A widget is
   * picked up by its card, by a mouse or a pen — a finger on a card scrolls
   * the page — and by its handle, by anything.
   */
  private syncDrag() {
    const list = this.list()?.nativeElement;
    const keys = this.isEditing()
      ? this.visible()
          .filter((tile) => tile.movable)
          .map((tile) => tile.key)
          .sort()
          .join('\n')
      : '';
    if (keys === this.dragKeys && (keys === '' || this.dragTeardown !== null)) return;
    if (this.gesture()?.kind === 'move') return;
    this.dragTeardown?.();
    this.dragTeardown = null;
    this.dragKeys = keys;
    if (keys === '' || list === undefined) return;

    const root = this.host.nativeElement;
    const document = root.ownerDocument;

    /** Where the press landed, and where in the widget. */
    let press: { x: number; y: number; grabX: number; grabY: number } | null = null;
    let target: string | null = null;
    let drawnIn: DashboardSizeClass = 'expanded';
    let rtl = false;
    let tracks: Tracks | null = null;

    const onPress = (event: PointerEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>(
        '[data-part="widget"]',
      );
      if (!element || element.parentElement !== list) return;
      const box = element.getBoundingClientRect();
      press = {
        x: event.clientX,
        y: event.clientY,
        grabX: event.clientX - box.left,
        grabY: event.clientY - box.top,
      };
    };
    list.addEventListener('pointerdown', onPress, true);

    /** The preview a target stands for. */
    const previewOf = (key: string, at: string): DashboardLayout => {
      if (at.startsWith('swap:')) {
        return swapTiles(this.currentLayout(), this.specs(), this.grid(), key, at.slice(5));
      }
      const [x, y] = at.split(',').map(Number);
      return moveTile(this.currentLayout(), this.specs(), this.grid(), key, {
        x: x ?? 0,
        y: y ?? 0,
      });
    };

    const controller = createDragController({
      document,
      restoreFocus: false,
      preview: false,
      autoScroll: { axis: 'y' },
      t: this.dragT,
      /* The move says what happened once, in the family's own words. */
      silent: ['pickedUp', 'moved', 'dropped', 'cancelled'],
      /**
       * In the expanded class the target is a cell: the one the card's leading
       * corner is nearest, so a widget lands where it is drawn under the
       * pointer. In the classes that flow the target is the widget under the
       * pointer, which the carried one exchanges places with.
       */
      resolveTarget: (point) => {
        const carried = controller.state.items[0];
        if (carried === undefined || press === null || tracks === null) return null;
        const frame = list.getBoundingClientRect();
        if (drawnIn === 'expanded') {
          const left = point.x - press.grabX;
          const top = point.y - press.grabY;
          const tile = this.visible().find((each) => each.key === carried);
          const width = tile ? tile.w * tracks.track + (tile.w - 1) * tracks.columnGap : 0;
          const lead = rtl ? left + width - tracks.track / 2 : left + tracks.track / 2;
          const cell = cellAt(
            { x: lead, y: top + tracks.row / 2 },
            { left: frame.left, top: frame.top, width: frame.width },
            { columns: tracks.columns, row: tracks.row, gap: tracks.columnGap },
            rtl ? 'rtl' : 'ltr',
          );
          target = `${cell.x},${cell.y}`;
        } else {
          for (const [key, element] of this.widgetNodes()) {
            if (key === carried) continue;
            const rect = element.getBoundingClientRect();
            if (
              point.x >= rect.left &&
              point.x <= rect.right &&
              point.y >= rect.top &&
              point.y <= rect.bottom
            ) {
              target = `swap:${key}`;
              break;
            }
          }
        }
        return target === null
          ? null
          : ({ kind: 'on', container: GRID, key: target } satisfies DropTarget);
      },
      onTargetChange: ({ state }) => {
        const key = state.items[0];
        if (key === undefined || state.target?.kind !== 'on') return;
        this.setGesture({ kind: 'move', key, preview: previewOf(key, state.target.key) });
      },
      onDrop: ({ items, target: dropped, reason, event }) => {
        const key = items[0];
        if (key === undefined || dropped.kind !== 'on') return;
        this.focusAfter = null;
        this.change(
          previewOf(key, dropped.key),
          reason === 'keyboard' ? 'keyboard' : 'pointer',
          { kind: 'move', key },
          event,
          this.movedMessage(key, drawnIn),
        );
      },
    });

    const unregister = controller.registerContainer({
      key: GRID,
      items: () => this.visible().map((tile) => tile.key),
      orientation: 'grid',
      targets: ['on'],
      element: () => list,
      itemElement: (key) => this.widgetNodes().get(key) ?? null,
      label: () => this.t('editBar'),
      itemLabel: (key) => this.titleOf(key),
    });

    /* The click the browser fires after a pointer drag belongs to the drag,
       not to the handle it started on, which would open the handle's menu. */
    let swallow = false;
    let dragging: string | null = null;
    const onClick = (event: Event) => {
      if (!swallow) return;
      swallow = false;
      event.preventDefault();
      event.stopPropagation();
    };
    root.addEventListener('click', onClick, true);

    const unsubscribe = controller.subscribe((state) => {
      if (state.status !== 'dragging') {
        if (dragging !== null) {
          const element = this.widgetNodes().get(dragging);
          if (element) this.settleFrom = { key: dragging, box: boxOf(element) };
          clearLift(element);
          swallow = state.reason === 'pointer' || state.reason === null;
          setTimeout(() => (swallow = false), 0);
          dragging = null;
          target = null;
          if (this.gesture()?.kind === 'move') this.setGesture(null);
        }
        return;
      }
      const key = state.items[0];
      if (key === undefined || press === null) return;
      const element = this.widgetNodes().get(key);
      if (element === undefined) return;
      if (dragging === null) {
        dragging = key;
        drawnIn = classOf(root);
        rtl = directionOf(list) === 'rtl';
        tracks = tracksOf(list, this.grid()[drawnIn]);
        writeOrigin(element, originOf(element, list, rtl));
        this.setGesture({ kind: 'move', key, preview: this.full(this.currentLayout()) });
      }
      if (state.point !== null) {
        element.style.setProperty(
          'translate',
          `${state.point.x - press.x}px ${state.point.y - press.y}px`,
        );
      }
    });

    const detachments: (() => void)[] = [];
    const nodes = this.widgetNodes();
    for (const tile of this.visible()) {
      if (!tile.movable) continue;
      const element = nodes.get(tile.key);
      if (element === undefined) continue;
      const card = this.cardOf(tile.key);
      const handle = this.handleOf(tile.key);
      if (card !== null) {
        detachments.push(
          controller.attachDraggable(element, {
            container: GRID,
            key: tile.key,
            handle: () => card,
            canDrag: (event) => event.pointerType !== 'touch',
          }),
        );
      }
      if (handle !== null) {
        detachments.push(
          controller.attachDraggable(element, {
            container: GRID,
            key: tile.key,
            handle: () => handle,
            delay: { touch: 0 },
          }),
        );
      }
    }

    this.dragTeardown = () => {
      for (const detach of detachments) detach();
      list.removeEventListener('pointerdown', onPress, true);
      root.removeEventListener('click', onClick, true);
      unsubscribe();
      unregister();
      controller.destroy();
    };
  }

  /* ── After a render ───────────────────────────────────────────────── */

  private syncEditing() {
    const editing = this.isEditing();
    const document = this.host.nativeElement.ownerDocument;
    if (editing && !this.wasEditing) {
      this.snapshot = this.full(this.currentLayout());
      this.returnFocus = document.activeElement;
    }
    if (!editing && this.wasEditing) {
      const active = document.activeElement;
      const lost = active === null || active === document.body || !active.isConnected;
      const back = this.returnFocus;
      if (lost && back instanceof HTMLElement && back.isConnected) back.focus();
      this.snapshot = null;
      this.returnFocus = null;
    }
    this.wasEditing = editing;
  }

  private timing() {
    const styles = getComputedStyle(this.host.nativeElement);
    return {
      duration: parseDuration(styles.getPropertyValue('--slotted-duration-medium')),
      easing: styles.getPropertyValue('--slotted-easing-standard').trim() || 'ease',
    };
  }

  private settle() {
    const root = this.host.nativeElement;
    const before = this.flipFrom;
    if (before !== null) {
      this.flipFrom = null;
      playFlip(this.flipNodes(), before, this.timing());
    }
    const settling = this.settleFrom;
    if (settling !== null && this.gesture() === null) {
      this.settleFrom = null;
      const element = this.widgetNodes().get(settling.key);
      if (element) playResize(element, settling.box, this.timing());
    }
    const key = this.focusAfter;
    if (key === null) return;
    this.focusAfter = null;
    const target =
      key === ADD
        ? root.querySelector<HTMLElement>('[data-dashboard-add]')
        : this.isEditing()
          ? this.handleOf(key)
          : null;
    if (target && target !== root.ownerDocument.activeElement) target.focus();
  }
}
