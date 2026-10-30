import { writeSelectorKey } from '@slotted/core/selector-key';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import {
  SlList,
  SlListSection,
  SlListSectionLabel,
  SlListSectionList,
} from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemActions,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
  SlListItemStart,
} from '@slotted/angular/list-item';
import {
  SlMenu,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';
import { nextSelection } from '@slotted/core/collection';
import {
  dataListFieldText,
  dataListKeys,
  dataListNodes,
  describeDataListSort,
  resolveDataListLayout,
  withDataListSortColumn,
  withDataListSortDirection,
  type DataListNode,
} from '@slotted/core/data-list';
import {
  applyQuery,
  cellValue,
  emptyQuery,
  isQueryActive,
  sameQuery,
  type GridColumn,
  type GridColumnState,
  type GridQuery,
  type GridQueryChange,
  type SortDirection,
} from '@slotted/core/grid';
import { dataListMessages, type DataListMessages, type PartialMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import {
  injectDataListDefaults,
  type DataListActivateEvent,
  type DataListEmptyStatus,
  type DataListExpandedRequest,
  type DataListMode,
  type DataListQueryRequest,
  type DataListSelection,
  type DataListSelectionMode,
  type DataListSize,
  type DataListVariant,
} from './data-list-defaults';
import {
  SlDataListCellTemplate,
  SlDataListEmptyTemplate,
  SlDataListMediaTemplate,
  type DataListCellContext,
} from './data-list-templates';

/** The value that stands for "no sort" in the column group, a string no column id can be. */
const NO_SORT = '\u0000none';

/** Varied lengths, so a skeleton reads as text rather than as a stack of equal bars. */
const BAR_WIDTHS = ['9rem', '7rem', '8rem', '6.5rem', '9.5rem'];
const FIELD_WIDTHS = ['3.5rem', '5.5rem', '4rem', '5rem', '4.5rem', '6rem'];

let instances = 0;

/** A click the keyboard produced has no pointer detail. */
const pressReason = (event: Event): 'pointer' | 'keyboard' =>
  (event as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';

function asKeys(value: DataListSelection): readonly string[] {
  if (Array.isArray(value)) return value as readonly string[];
  return value === null || value === undefined ? [] : [value as string];
}

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function makeRequest<T>(value: T, previous: T, reason: ChangeReason, source: unknown, extra = {}) {
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

/** The record with this key, found without `CSS.escape`, which not every document has. */
function recordOf(root: HTMLElement, key: string): Element | null {
  for (const item of root.querySelectorAll('[data-ui="list-item"][data-key]')) {
    if (item.getAttribute('data-key') === key) return item;
  }
  return null;
}

/** The first control a record holds, where focus lands on that record. */
function firstControl(item: Element | null): HTMLElement | null {
  return (
    item?.querySelector<HTMLElement>(
      'input:not(:disabled), a[href][data-part="title"], button[data-part="title"]:not(:disabled), button[data-part="more"], [data-part="actions"] :is(a[href], button:not(:disabled))',
    ) ?? null
  );
}

/**
 * Writes a part name back on an element whose other directive erased it.
 * `slMenuTriggerFor` binds `[attr.data-part]` to `null` on a trigger that is
 * neither a bar's item nor a submenu's, which takes `slButton`'s `root` with
 * it; the binding is constant, so writing it after the first render holds.
 */
@Directive({ selector: '[slDataListPart]', standalone: true })
export class SlDataListPart {
  readonly part = input.required<string>({ alias: 'slDataListPart' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => writeSelectorKey(this.host.nativeElement, 'part', this.part()));
  }
}

/** Marks the consumer's own content for the footer, beside load-more: a pagination. */
@Directive({ selector: '[slDataListFooter]', standalone: true })
export class SlDataListFooter {}

interface FieldView<Row> {
  readonly column: GridColumn<Row>;
  readonly context: DataListCellContext<Row>;
  readonly template: TemplateRef<DataListCellContext> | null;
  readonly numeric: boolean;
}

interface RecordView<Row> {
  readonly key: string;
  readonly row: Row;
  readonly disabled: boolean;
  readonly busy: boolean;
  readonly selected: boolean;
  readonly current: boolean;
  readonly expanded: boolean;
  readonly titleText: string;
  readonly title: FieldView<Row> | null;
  readonly subtitle: FieldView<Row> | null;
  readonly trailing: FieldView<Row> | null;
  readonly actions: readonly FieldView<Row>[];
  readonly fields: readonly FieldView<Row>[];
  readonly hidden: number;
  readonly href: string | undefined;
  readonly fieldsId: string;
}

/**
 * A small tabular set drawn as a list of records. Each record is a list item:
 * the title, a subtitle, a trailing value, and the fields of highest priority
 * as pairs of a label and a value. The family reads the column model and the
 * query `sl-data-grid` reads, and it has no keyboard of its own: every control
 * is a native one in the page's tab order.
 */
@Component({
  selector: 'sl-data-list',
  standalone: true,
  exportAs: 'slDataList',
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlButtonEnd,
    SlCheckbox,
    SlDataListPart,
    SlGlyph,
    SlIcon,
    SlList,
    SlListItem,
    SlListItemActions,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
    SlListItemStart,
    SlListSection,
    SlListSectionLabel,
    SlListSectionList,
    SlMenu,
    SlMenuItem,
    SlMenuRadioGroup,
    SlMenuSeparator,
    SlMenuTrigger,
    SlResultState,
    SlResultStateActions,
    SlResultStateContent,
    SlResultStateTitle,
    SlSkeleton,
    SlSkeletonRegion,
    SlVisuallyHidden,
  ],
  styleUrls: [
    '../../../styles/src/data-list/data-list.css',
    '../../../styles/src/list/list.css',
    '../../../styles/src/list-item/list-item.css',
    '../../../styles/src/checkbox/checkbox.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'data-list',
    'data-ui-data-list': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-variant]': 'variantValue()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.aria-busy]': "refreshing() ? 'true' : null",
    '[attr.data-loading]': "refreshing() ? '' : null",
    '(focusin)': 'onFocusIn($event)',
  },
  template: `
    <div data-part="header" data-part-header="">
      @if (selectionModeValue() === 'multiple' && !showLoader()) {
        <span data-part="select-all" data-part-select-all="">
          <span
            slCheckbox
            [checked]="allSelected()"
            [indeterminate]="someSelected() && !allSelected()"
            [disabled]="allKeys().length === 0"
            [size]="sizeValue()"
            (click)="pressAll($event)"
            ><span slVisuallyHidden>{{ t('selectAll', { count: allKeys().length }) }}</span></span
          >
        </span>
      }
      <output data-part="count" data-part-count="" aria-live="polite">{{
        showLoader() ? '' : countText()
      }}</output>
      @if (layout().sortable.length > 0) {
        <span
          data-part="sort"
          data-part-sort=""
          [attr.data-direction]="firstKey()?.direction ?? null"
        >
          <button
            slButton
            slDataListPart="root"
            size="sm"
            tone="secondary"
            variant="ghost"
            [disabled]="showLoader()"
            [attr.aria-label]="sortName()"
            [slMenuTriggerFor]="sortMenu"
          >
            {{ sortText()
            }}<span slButtonEnd>
              @if (firstKey()) {
                <span slIcon size="sm"><svg slGlyph name="chevron-down"></svg></span>
              }
            </span>
          </button>
          <sl-menu #sortMenu align="end" [aria-label]="t('sort')">
            <sl-menu-radio-group
              [attr.aria-labelledby]="id + '-sort-column'"
              [value]="firstKey()?.column ?? noSort"
              (valueChangeRequest)="chooseColumn($event)"
            >
              <div data-part="group-label" data-part-group-label="" [id]="id + '-sort-column'">
                {{ t('sortColumn') }}
              </div>
              <button slMenuRadioItem [value]="noSort">{{ t('sortNone') }}</button>
              @for (column of layout().sortable; track column.id) {
                <button slMenuRadioItem [value]="column.id">{{ column.label }}</button>
              }
            </sl-menu-radio-group>
            <hr slMenuSeparator />
            <sl-menu-radio-group
              [attr.aria-labelledby]="id + '-sort-direction'"
              [value]="firstKey()?.direction ?? ''"
              (valueChangeRequest)="chooseDirection($event)"
            >
              <div data-part="group-label" data-part-group-label="" [id]="id + '-sort-direction'">
                {{ t('sortDirection') }}
              </div>
              <button slMenuRadioItem value="ascending" [disabled]="!firstKey()">
                {{ t('ascending') }}
              </button>
              <button slMenuRadioItem value="descending" [disabled]="!firstKey()">
                {{ t('descending') }}
              </button>
            </sl-menu-radio-group>
          </sl-menu>
        </span>
      }
    </div>

    @if (errorOverRows()) {
      <ng-container
        [ngTemplateOutlet]="emptyState"
        [ngTemplateOutletContext]="{ $implicit: 'error' }"
      />
    }

    @if (showLoader()) {
      <div data-part="loader" data-part-loader="">
        <div
          slSkeletonRegion
          [loading]="firstLoad()"
          [delay]="loadingDelayValue()"
          [minDuration]="loadingMinDurationValue()"
          [messages]="{ label: t('loading') }"
          (reveal)="holding.set(false)"
        >
          <ul slList aria-hidden="true" inert [variant]="variantValue()" [size]="sizeValue()">
            @for (index of skeletonIndexes(); track index) {
              <li slListItem align="start" [variant]="variantValue()" [size]="sizeValue()">
                <div slListItemContent>
                  <div slListItemBody>
                    <div slListItemLabel><span slSkeleton [inlineSize]="bar(index)"></span></div>
                    @if (layout().subtitle) {
                      <div slListItemDescription>
                        <span slSkeleton [inlineSize]="bar(index + 2)"></span>
                      </div>
                    }
                  </div>
                  @if (layout().trailing) {
                    <div slListItemEnd>
                      <span slSkeleton [inlineSize]="fieldBar(index + 3)"></span>
                    </div>
                  }
                  @if (layout().shown > 0) {
                    <dl data-part="fields" data-part-fields="">
                      @for (column of shownColumns(); track column.id; let field = $index) {
                        <div data-part="field" data-part-field="">
                          <dt data-part="field-label" data-part-field-label="">
                            {{ column.label }}
                          </dt>
                          <dd data-part="field-value" data-part-field-value="">
                            <span slSkeleton [inlineSize]="fieldBar(index + field)"></span>
                          </dd>
                        </div>
                      }
                    </dl>
                  }
                </div>
              </li>
            }
          </ul>
        </div>
      </div>
    } @else if (emptyStatus(); as status) {
      <ng-container
        [ngTemplateOutlet]="emptyState"
        [ngTemplateOutletContext]="{ $implicit: status }"
      />
    } @else {
      <ul
        slList
        [variant]="variantValue()"
        [size]="sizeValue()"
        [attr.aria-label]="labelledBy() ? null : listLabel()"
        [attr.aria-labelledby]="labelledBy() ?? null"
      >
        <ng-container
          [ngTemplateOutlet]="nodesTemplate"
          [ngTemplateOutletContext]="{ $implicit: nodes() }"
        />
      </ul>
    }

    @if (hasMore() || footers().length > 0) {
      <div data-part="footer" data-part-footer="">
        @if (hasMore() && !showLoader()) {
          <span data-part="load-more" data-part-load-more="">
            <button
              slButton
              size="sm"
              tone="secondary"
              variant="outline"
              [loading]="loadingValue() && loadingMore()"
              (click)="askForMore()"
            >
              {{ t('loadMore') }}
            </button>
          </span>
        }
        <ng-content select="[slDataListFooter]" />
      </div>
    }

    <ng-template #nodesTemplate let-list>
      @for (node of list; track node.key) {
        @if (node.kind === 'row') {
          <ng-container
            [ngTemplateOutlet]="recordTemplate"
            [ngTemplateOutletContext]="{ $implicit: record(node.key, node.row) }"
          />
        } @else {
          <li slListSection>
            <span slListSectionLabel role="heading" [attr.aria-level]="min(node.level + 2, 6)">{{
              sectionLabel(node)
            }}</span>
            <ul slListSectionList>
              <ng-container
                [ngTemplateOutlet]="nodesTemplate"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
              />
            </ul>
          </li>
        }
      }
    </ng-template>

    <ng-template #recordTemplate let-view>
      <li
        slListItem
        align="start"
        [attr.data-key]="view.key"
        [attr.data-expanded]="view.expanded ? '' : null"
        [variant]="variantValue()"
        [size]="sizeValue()"
        [selected]="view.selected"
        [current]="view.current ? (view.href === undefined ? true : 'page') : false"
        [disabled]="view.disabled"
        [loading]="view.busy"
      >
        <div slListItemContent>
          @if (selectionModeValue() !== 'none' || mediaTemplate()) {
            <div slListItemStart>
              @if (selectionModeValue() !== 'none') {
                <span data-part="selection" data-part-selection="">
                  <span
                    slCheckbox
                    [checked]="view.selected"
                    [disabled]="view.disabled"
                    [size]="sizeValue()"
                    (click)="pressRecord(view.key, $event)"
                    ><span slVisuallyHidden>{{
                      t('selectRow', { title: view.titleText })
                    }}</span></span
                  >
                </span>
              }
              @if (mediaTemplate(); as media) {
                <span data-part="media" data-part-media="">
                  <ng-container
                    [ngTemplateOutlet]="media.template"
                    [ngTemplateOutletContext]="{ $implicit: view.row }"
                  />
                </span>
              }
            </div>
          }
          <div slListItemBody>
            <div slListItemLabel>
              @if (view.href !== undefined) {
                <a
                  data-part="title"
                  data-part-title=""
                  [attr.href]="view.href"
                  [attr.aria-disabled]="view.disabled || view.busy ? 'true' : null"
                  (click)="activateLink(view, $event)"
                  ><ng-container
                    [ngTemplateOutlet]="value"
                    [ngTemplateOutletContext]="{ $implicit: view.title }"
                /></a>
              } @else if (activatable()) {
                <button
                  data-part="title"
                  data-part-title=""
                  type="button"
                  [disabled]="view.disabled || view.busy"
                  (click)="activate(view, $event)"
                >
                  <ng-container
                    [ngTemplateOutlet]="value"
                    [ngTemplateOutletContext]="{ $implicit: view.title }"
                  />
                </button>
              } @else {
                <span data-part="title" data-part-title=""
                  ><ng-container
                    [ngTemplateOutlet]="value"
                    [ngTemplateOutletContext]="{ $implicit: view.title }"
                /></span>
              }
            </div>
            @if (view.subtitle) {
              <div slListItemDescription>
                <ng-container
                  [ngTemplateOutlet]="value"
                  [ngTemplateOutletContext]="{ $implicit: view.subtitle }"
                />
              </div>
            }
          </div>
          @if (view.trailing) {
            <div slListItemEnd>
              <span data-part="trailing" data-part-trailing=""
                ><ng-container
                  [ngTemplateOutlet]="value"
                  [ngTemplateOutletContext]="{ $implicit: view.trailing }"
              /></span>
            </div>
          }
          @if (view.fields.length > 0) {
            <dl data-part="fields" data-part-fields="" [id]="view.fieldsId">
              @for (field of view.fields; track field.column.id) {
                <div data-part="field" data-part-field="">
                  <dt data-part="field-label" data-part-field-label="">{{ field.column.label }}</dt>
                  <dd
                    data-part="field-value"
                    data-part-field-value=""
                    [attr.data-numeric]="field.numeric ? '' : null"
                  >
                    <ng-container
                      [ngTemplateOutlet]="value"
                      [ngTemplateOutletContext]="{ $implicit: field }"
                    />
                  </dd>
                </div>
              }
            </dl>
          }
          @if (view.hidden > 0) {
            <button
              data-part="more"
              data-part-more=""
              type="button"
              [attr.aria-controls]="view.fieldsId"
              [attr.aria-expanded]="view.expanded"
              (click)="toggleExpanded(view.key, $event)"
            >
              {{ view.expanded ? t('less') : t('more', { count: view.hidden }) }}
              <span slIcon size="sm"><svg slGlyph name="chevron-down"></svg></span>
            </button>
          }
        </div>
        @if (view.actions.length > 0) {
          <div slListItemActions>
            @for (field of view.actions; track field.column.id) {
              <ng-container
                [ngTemplateOutlet]="value"
                [ngTemplateOutletContext]="{ $implicit: field }"
              />
            }
          </div>
        }
      </li>
    </ng-template>

    <ng-template #value let-field>
      @if (field) {
        @if (field.template) {
          <ng-container
            [ngTemplateOutlet]="field.template"
            [ngTemplateOutletContext]="field.context"
          />
        } @else if (field.context.text === '' && field.context.place !== 'actions') {
          <span data-part="field-empty" data-part-field-empty=""
            ><span aria-hidden="true">—</span><span slVisuallyHidden>{{ t('empty') }}</span></span
          >
        } @else {
          {{ field.context.text }}
        }
      }
    </ng-template>

    <ng-template #emptyState let-status>
      <div data-part="empty" data-part-empty="">
        @if (emptyTemplate(); as custom) {
          <ng-container
            [ngTemplateOutlet]="custom.template"
            [ngTemplateOutletContext]="{ $implicit: status }"
          />
        } @else {
          <section slResultState reach="section" tabindex="-1" [status]="status">
            <div slResultStateContent>
              <div slResultStateTitle>{{ emptyTitle(status) }}</div>
            </div>
            @if (status === 'no-results') {
              <div slResultStateActions>
                <button
                  slButton
                  size="md"
                  tone="secondary"
                  variant="outline"
                  (click)="clearFilters($event)"
                >
                  {{ t('clearFilters') }}
                </button>
              </div>
            } @else if (status === 'error') {
              <div slResultStateActions>
                <button
                  slButton
                  size="md"
                  tone="secondary"
                  variant="outline"
                  (click)="retry.emit()"
                >
                  {{ t('retry') }}
                </button>
              </div>
            }
          </section>
        }
      </div>
    </ng-template>
  `,
})
export class SlDataList<Row = unknown> {
  private readonly defaults = injectDataListDefaults();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly id = `slotted-data-list-${++instances}`;
  protected readonly noSort = NO_SORT;
  protected readonly min = Math.min;

  readonly rows = input.required<readonly Row[]>();
  readonly rowKey = input.required<keyof Row | ((row: Row) => string)>();
  readonly columns = input.required<readonly GridColumn<Row>[]>();
  readonly columnState = input<Partial<GridColumnState> | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly trailing = input<string | undefined>(undefined);
  readonly fields = input<number | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly labelledBy = input<string | undefined>(undefined);
  readonly mode = input<DataListMode | undefined>(undefined);
  readonly totalCount = input<number | undefined>(undefined);
  readonly selectionMode = input<DataListSelectionMode | undefined>(undefined);
  readonly disabledKeys = input<readonly string[]>([]);
  readonly loadingKeys = input<readonly string[]>([]);
  /** The record open beside the list. The family never moves it. */
  readonly current = input<string | null | undefined>(undefined);
  readonly href = input<((row: Row) => string) | undefined>(undefined);
  readonly activatable = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  /** A message, or `true` for the family's own. Rows already shown stay. */
  readonly error = input<boolean | string | null | undefined>(undefined);
  readonly hasMore = input(false, { transform: booleanAttribute });
  readonly variant = input<DataListVariant | undefined>(undefined);
  readonly size = input<DataListSize | undefined>(undefined);
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<DataListMessages> | undefined>(undefined);
  /** Formats the fields and counts; the provider's locale otherwise. */
  readonly locale = input<string | undefined>(undefined);
  readonly skeletonRows = input<number | undefined>(undefined);
  readonly loadingDelay = input<number | undefined>(undefined);
  readonly loadingMinDuration = input<number | undefined>(undefined);

  readonly query = model<GridQuery>(emptyQuery());
  readonly value = model<DataListSelection>(null);
  readonly expanded = model<readonly string[]>([]);

  readonly queryChangeRequest = output<DataListQueryRequest>();
  readonly valueChangeRequest = output<ChangeRequest<DataListSelection>>();
  readonly expandedChangeRequest = output<DataListExpandedRequest>();
  readonly activate$ = output<DataListActivateEvent<Row>>({ alias: 'activate' });
  readonly loadMore = output<void>();
  readonly retry = output<void>();

  protected readonly cellTemplates = contentChildren(SlDataListCellTemplate);
  protected readonly mediaTemplate = computed(() => this.mediaTemplates()[0] ?? null);
  protected readonly emptyTemplate = computed(() => this.emptyTemplates()[0] ?? null);
  private readonly mediaTemplates = contentChildren(SlDataListMediaTemplate);
  private readonly emptyTemplates = contentChildren(SlDataListEmptyTemplate);
  protected readonly footers = contentChildren(SlDataListFooter);

  protected readonly holding = signal(false);
  protected readonly loadingMore = signal(false);
  private anchor: string | undefined;
  private focusedKey: string | null = null;
  private previousKeys: readonly string[] = [];

  /** The family's words in the language in force, with this list's `messages` laid over them. */
  readonly t = injectMessages(dataListMessages, this.messages);
  private readonly providedLocale = injectLocale();
  protected readonly localeValue = computed(() => this.locale() ?? this.providedLocale());
  /** What a boolean field says, in the language in force. */
  private readonly booleans = computed(() => ({ true: this.t('true'), false: this.t('false') }));
  protected readonly variantValue = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly sizeValue = computed(() => this.size() ?? this.defaults.size);
  protected readonly selectionModeValue = computed(
    () => this.selectionMode() ?? this.defaults.selectionMode,
  );
  protected readonly loadingValue = computed(() => this.loading());
  protected readonly loadingDelayValue = computed(
    () => this.loadingDelay() ?? this.defaults.loadingDelay,
  );
  protected readonly loadingMinDurationValue = computed(
    () => this.loadingMinDuration() ?? this.defaults.loadingMinDuration,
  );
  protected readonly listLabel = computed(() => this.label() ?? this.writtenLabel ?? null);
  private readonly modeValue = computed(
    () => this.mode() ?? (this.totalCount() === undefined ? 'client' : 'server'),
  );

  private readonly keyOf = computed(() => {
    const rowKey = this.rowKey();
    return typeof rowKey === 'function'
      ? rowKey
      : (row: Row) => String((row as Record<PropertyKey, unknown>)[rowKey as PropertyKey]);
  });

  protected readonly layout = computed(() =>
    resolveDataListLayout(this.columns(), {
      title: this.title(),
      subtitle: this.subtitle(),
      trailing: this.trailing(),
      fields: this.fields() ?? this.defaults.fields,
      columnState: this.columnState(),
    }),
  );
  protected readonly shownColumns = computed(() =>
    this.layout().fields.slice(0, this.layout().shown),
  );

  private readonly applied = computed(() => {
    const rows = this.rows();
    const keyOf = this.keyOf();
    if (this.modeValue() === 'server') {
      return {
        nodes: rows.map((row, index) => ({ kind: 'row' as const, key: keyOf(row), row, index })),
        visible: rows,
        total: this.totalCount() ?? rows.length,
      };
    }
    const result = applyQuery(rows, this.columns(), this.query(), {
      rowKey: keyOf,
      locale: this.localeValue(),
      booleans: this.booleans(),
    });
    return { nodes: dataListNodes(result.nodes), visible: result.rows, total: result.total };
  });

  protected readonly nodes = computed<readonly DataListNode<Row>[]>(() => this.applied().nodes);
  private readonly drawnKeys = computed(() => dataListKeys(this.nodes()));
  private readonly disabledSet = computed(() => new Set(this.disabledKeys()));
  private readonly selectedKeys = computed(() => asKeys(this.value()));
  private readonly selectedSet = computed(() => new Set(this.selectedKeys()));

  protected readonly firstLoad = computed(() => this.loading() && this.rows().length === 0);
  protected readonly showLoader = computed(() => this.firstLoad() || this.holding());
  protected readonly skeletonIndexes = computed(() =>
    Array.from({ length: this.skeletonRows() ?? this.defaults.skeletonRows }, (_, index) => index),
  );

  protected readonly emptyStatus = computed<DataListEmptyStatus | null>(() => {
    if (this.showLoader()) return null;
    if (this.error() && this.rows().length === 0) return 'error';
    if (this.drawnKeys().length > 0) return null;
    return this.rows().length === 0 && !isQueryActive(this.query()) ? 'empty' : 'no-results';
  });
  protected readonly errorOverRows = computed(
    () => !!this.error() && this.rows().length > 0 && !this.showLoader(),
  );
  protected readonly refreshing = computed(
    () => this.loading() && !this.showLoader() && this.rows().length > 0 && !this.loadingMore(),
  );

  protected readonly firstKey = computed(() => this.query().sort[0]);
  protected readonly sortName = computed(() => {
    const sort = this.query().sort;
    if (sort.length === 0) return this.t('sort');
    return this.t('sortNamed', { order: describeDataListSort(sort, this.columns(), this.t) });
  });
  protected readonly sortText = computed(() => {
    const sort = this.query().sort;
    const column = this.columns().find((entry) => entry.id === sort[0]?.column);
    if (!column) return this.t('sort');
    return this.t('sortSummary', { column: column.label, more: sort.length - 1 });
  });

  protected readonly allKeys = computed(() => {
    const disabled = this.disabledSet();
    const keyOf = this.keyOf();
    const keys =
      this.modeValue() === 'client' ? this.applied().visible.map(keyOf) : this.drawnKeys();
    return keys.filter((key) => !disabled.has(key));
  });
  protected readonly allSelected = computed(() => {
    const all = this.allKeys();
    const selected = this.selectedSet();
    return all.length > 0 && all.every((key) => selected.has(key));
  });
  protected readonly someSelected = computed(() =>
    this.allKeys().some((key) => this.selectedSet().has(key)),
  );
  protected readonly countText = computed(() => {
    const selected = this.selectedKeys().length;
    const count = this.applied().total;
    return this.selectionModeValue() !== 'none' && selected > 0
      ? this.t('selectedCount', { selected, count })
      : this.t('count', { count });
  });

  constructor() {
    afterRenderEffect(() => {
      const keys = this.drawnKeys();
      const before = this.previousKeys;
      this.previousKeys = keys;
      const lost = this.focusedKey;
      if (lost === null || keys.includes(lost)) return;
      const active = this.host.ownerDocument.activeElement;
      if (active && active !== this.host.ownerDocument.body && this.host.contains(active)) return;
      const at = before.indexOf(lost);
      const next = before.slice(at + 1).find((key) => keys.includes(key));
      const previous = before
        .slice(0, Math.max(at, 0))
        .reverse()
        .find((key) => keys.includes(key));
      const target = next ?? previous;
      this.focusedKey = target ?? null;
      if (target !== undefined) firstControl(recordOf(this.host, target))?.focus();
      else
        this.host
          .querySelector<HTMLElement>('[data-part="empty"] [data-ui="result-state"]')
          ?.focus();
    });
    afterRenderEffect(() => {
      if (this.firstLoad()) this.holding.set(true);
      if (!this.loading()) this.loadingMore.set(false);
    });
  }

  protected bar(index: number) {
    return BAR_WIDTHS[index % BAR_WIDTHS.length];
  }

  protected fieldBar(index: number) {
    return FIELD_WIDTHS[index % FIELD_WIDTHS.length];
  }

  protected sectionLabel(node: Extract<DataListNode<Row>, { kind: 'section' }>) {
    const column = this.columns().find((entry) => entry.id === node.column);
    return `${column?.label ?? node.column}: ${node.text} · ${new Intl.NumberFormat(this.localeValue()).format(node.count)}`;
  }

  protected emptyTitle(status: DataListEmptyStatus) {
    if (status === 'error') {
      const error = this.error();
      return typeof error === 'string' ? error : this.t('errorTitle');
    }
    return this.t(status === 'no-results' ? 'noResultsTitle' : 'emptyTitle');
  }

  /* ── One record ────────────────────────────────────────────────────── */

  private field(
    column: GridColumn<Row>,
    row: Row,
    key: string,
    place: DataListCellContext['place'],
  ): FieldView<Row> {
    const text =
      dataListFieldText(column, row, { locale: this.localeValue(), booleans: this.booleans() }) ??
      '';
    const templates = this.cellTemplates();
    const template =
      templates.find((entry) => entry.slDataListCell() === column.id) ??
      templates.find((entry) => entry.slDataListCell() === '') ??
      null;
    return {
      column,
      numeric: column.kind === 'number' || column.numeric === true,
      template: (template?.template as TemplateRef<DataListCellContext> | undefined) ?? null,
      context: { $implicit: row, row, column, key, value: cellValue(column, row), text, place },
    };
  }

  protected record(key: string, row: Row): RecordView<Row> {
    const layout = this.layout();
    const expanded = this.expanded().includes(key);
    const current = this.current();
    const title = layout.title ? this.field(layout.title, row, key, 'title') : null;
    const columns = expanded ? layout.fields : layout.fields.slice(0, layout.shown);
    return {
      key,
      row,
      disabled: this.disabledSet().has(key),
      busy: this.loadingKeys().includes(key),
      selected: this.selectionModeValue() !== 'none' && this.selectedSet().has(key),
      current: current !== undefined && current !== null && current === key,
      expanded,
      titleText: title?.context.text || key,
      title,
      subtitle: layout.subtitle ? this.field(layout.subtitle, row, key, 'subtitle') : null,
      trailing: layout.trailing ? this.field(layout.trailing, row, key, 'trailing') : null,
      actions: layout.actions.map((column) => this.field(column, row, key, 'actions')),
      fields: columns.map((column) => this.field(column, row, key, 'field')),
      hidden: layout.fields.length - layout.shown,
      href: this.href()?.(row),
      fieldsId: `${this.id}-${key}-fields`,
    };
  }

  /* ── Requests ──────────────────────────────────────────────────────── */

  private requestQuery(
    next: GridQuery,
    change: GridQueryChange,
    reason: ChangeReason,
    source?: unknown,
  ) {
    const query = this.query();
    if (sameQuery(next, query)) return false;
    const request = makeRequest(next, query, reason, source, { change }) as DataListQueryRequest;
    this.queryChangeRequest.emit(request);
    if (request.cancelled) return false;
    this.query.set(next);
    return true;
  }

  private requestValue(next: DataListSelection, reason: ChangeReason, source?: unknown) {
    const value = this.value();
    if (sameKeys(asKeys(next), asKeys(value))) return;
    const request = makeRequest(next, value, reason, source) as ChangeRequest<DataListSelection>;
    this.valueChangeRequest.emit(request);
    if (request.cancelled) return;
    this.value.set(next);
  }

  protected toggleExpanded(key: string, event: Event) {
    const expanded = this.expanded();
    const next = expanded.includes(key)
      ? expanded.filter((entry) => entry !== key)
      : [...expanded, key];
    const request = makeRequest(next, expanded, pressReason(event), event, {
      key,
    }) as DataListExpandedRequest;
    this.expandedChangeRequest.emit(request);
    if (request.cancelled) return;
    this.expanded.set(next);
  }

  protected pressRecord(key: string, event: MouseEvent) {
    const mode = this.selectionModeValue();
    if (mode === 'none' || this.disabledSet().has(key)) return;
    const reason = pressReason(event);
    const selected = this.selectedKeys();
    const chosen = this.selectedSet();
    if (mode === 'single') {
      this.anchor = key;
      this.requestValue(chosen.has(key) ? null : key, reason, event);
      return;
    }
    const selectable = this.drawnKeys().filter((entry) => !this.disabledSet().has(entry));
    if (event.shiftKey && this.anchor !== undefined) {
      const result = nextSelection({
        action: 'range',
        mode: 'multiple',
        selected,
        keys: selectable,
        key,
        anchor: this.anchor,
        disabled: (entry) => this.disabledSet().has(entry),
      });
      const outside = selected.filter((entry) => !selectable.includes(entry));
      this.requestValue([...outside, ...result.selected], 'select', event);
      return;
    }
    this.anchor = key;
    this.requestValue(
      chosen.has(key) ? selected.filter((entry) => entry !== key) : [...selected, key],
      reason,
      event,
    );
  }

  protected pressAll(event: MouseEvent) {
    const all = this.allKeys();
    const covered = new Set(all);
    const selected = this.selectedKeys();
    const chosen = this.selectedSet();
    const everything = this.allSelected();
    const next = everything
      ? selected.filter((key) => !covered.has(key))
      : [...selected, ...all.filter((key) => !chosen.has(key))];
    this.requestValue(next, everything ? 'clear' : 'select', event);
  }

  protected chooseColumn(request: ChangeRequest<string>) {
    const next = request.value === NO_SORT ? null : request.value;
    this.sortTo(withDataListSortColumn(this.query(), next), request.reason, request.source);
  }

  protected chooseDirection(request: ChangeRequest<string>) {
    this.sortTo(
      withDataListSortDirection(this.query(), request.value as SortDirection),
      request.reason,
      request.source,
    );
  }

  private sortTo(next: GridQuery, reason: ChangeReason, source: unknown) {
    if (!this.requestQuery(next, 'sort', reason, source)) return;
    getLiveAnnouncer(this.host.ownerDocument).announce(
      next.sort.length === 0
        ? this.t('sortCleared')
        : this.t('sortedBy', { order: describeDataListSort(next.sort, this.columns(), this.t) }),
    );
  }

  protected clearFilters(event: Event) {
    const query = this.query();
    const page = query.page && 'index' in query.page ? { ...query.page, index: 0 } : query.page;
    this.requestQuery({ ...query, filter: null, search: '', page }, 'filter', 'clear', event);
  }

  protected activate(view: RecordView<Row>, event: MouseEvent) {
    this.activate$.emit({ key: view.key, row: view.row, reason: pressReason(event), event });
  }

  protected activateLink(view: RecordView<Row>, event: MouseEvent) {
    if (view.disabled || view.busy) {
      event.preventDefault();
      return;
    }
    this.activate(view, event);
  }

  protected askForMore() {
    this.loadingMore.set(true);
    this.loadMore.emit();
  }

  protected onFocusIn(event: FocusEvent) {
    const item = (event.target as HTMLElement).closest('[data-ui="list-item"][data-key]');
    this.focusedKey = item?.getAttribute('data-key') ?? this.focusedKey;
  }

  /* ── Imperative ────────────────────────────────────────────────────── */

  /** Focus goes to the first control of the first record, or to the empty state. */
  focus() {
    const first = this.host.querySelector('[data-ui="list-item"][data-key]');
    const control = firstControl(first);
    if (control) control.focus();
    else
      this.host.querySelector<HTMLElement>('[data-part="empty"] [data-ui="result-state"]')?.focus();
  }

  /** Focus goes to the first control of the record with this key. Returns whether it was found. */
  focusKey(key: string): boolean {
    const control = firstControl(recordOf(this.host, key));
    control?.focus();
    return control !== null;
  }

  /** Scrolls the record into view. Returns whether it was found. */
  scrollToKey(key: string): boolean {
    const item = recordOf(this.host, key);
    item?.scrollIntoView({ block: 'nearest' });
    return item !== null;
  }
}
