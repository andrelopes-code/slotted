import { nextSelection } from '@slotted/core/collection';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { injectMessages } from '@slotted/angular/i18n';
import { tableMessages, type PartialMessages, type TableMessages } from '@slotted/core/i18n';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';

import {
  injectTableDefaults,
  SlTableIdFactory,
  type TableAlign,
  type TableEdges,
  type TableLayout,
  type TableSelectionMode,
  type TableSelectionReason,
  type TableSortDescriptor,
  type TableStickyTo,
  type TableVariant,
} from './table-defaults';

export type {
  TableAlign,
  TableDefaults,
  TableEdges,
  TableExpandedReason,
  TableLayout,
  TableSelectionMode,
  TableSelectionReason,
  TableSortDescriptor,
  TableSortDirection,
  TableSortReason,
  TableSticky,
  TableStickyTo,
  TableText,
  TableVariant,
} from './table-defaults';

/** Every selectable row, in the order the body renders them. */
export const TABLE_ROW_SELECTOR = '[data-part="body"] > [data-part="row"][data-value]';

/**
 * A table of moderate data: the platform's own structure, with sorting,
 * selection, expansion and a place for a paging control.
 *
 * **The role is `table`, not `grid`.** The APG is explicit — a table "is not an
 * interactive widget. Thus, its cells are not focusable or selectable" — so
 * every control inside it is its own tab stop and the family binds no key of
 * its own. `data-grid` is the composite widget with a cell cursor.
 *
 * **The family holds the sort and reorders nothing.** The rows are the
 * consumer's own, written with `@for` over their own array; reordering them
 * would mean owning the data, which is the line between this family and
 * `data-grid`.
 *
 * **The selection is a form value.** A bulk-action screen is a reactive form
 * rather than a component with a callback, which no surveyed Angular table
 * offers.
 */
@Component({
  selector: 'div[slTable]',
  standalone: true,
  exportAs: 'slTable',
  template: '<ng-content />',
  styleUrls: [
    '../../../styles/src/table/table.css',
    '../../../styles/src/checkbox/checkbox.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTable), multi: true }],
  host: {
    'data-ui': 'table',
    'data-ui-table': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-edges]': 'resolvedEdges()',
    '[attr.data-layout]': 'resolvedLayout()',
    '[attr.data-cell-align]': 'resolvedCellAlign()',
    '[attr.data-striped]': "resolvedStriped() ? '' : null",
    '[attr.data-sticky-header]': "resolvedStickyHeader() ? '' : null",
    '[attr.data-sticky-footer]': "resolvedStickyFooter() ? '' : null",
    '[attr.data-sticky-to]': 'resolvedStickyTo()',
    '[attr.data-loading]': "loading() ? '' : null",
  },
})
export class SlTable implements ControlValueAccessor {
  /** Which column the rows are ordered by. Two-way, so a template binds it. */
  readonly sort = model<TableSortDescriptor | null>(null);
  /** The chosen rows, in the collection's own order. */
  readonly value = model<readonly string[]>([]);
  /** The rows whose detail is open. */
  readonly expanded = model<readonly string[]>([]);

  readonly variant = input<TableVariant | undefined>(undefined);
  /**
   * Whether the first and the last column keep the cell's inset on their outer
   * side. `flush` lines a `plain` or `ruled` table's text up with the heading
   * around it; a `framed` table ignores it.
   */
  readonly edges = input<TableEdges | undefined>(undefined);
  readonly layout = input<TableLayout | undefined>(undefined);
  readonly selectionMode = input<TableSelectionMode | undefined>(undefined);
  /**
   * Where every cell's content sits in a row as tall as its tallest cell. A
   * cell states `blockAlign` to answer differently.
   */
  readonly cellAlign = input<TableAlign | undefined>(undefined);
  readonly striped = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  readonly stickyHeader = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * Holds the summary rows against the bottom of the same box the header is
   * held against the top of, so a total does not scroll out of the view that
   * exists to show it. It pins the `tfoot` and not the footer bar, which is
   * outside the scroller and never leaves.
   */
  readonly stickyFooter = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * What the sticky header stays inside. `page` releases the family's own
   * scroll container, so the table can no longer scroll sideways in its frame.
   */
  readonly stickyTo = input<TableStickyTo | undefined>(undefined);
  /**
   * How many columns the table renders. The spanning parts — the detail row,
   * the empty cell, the skeleton rows — need the number, and reading it from
   * the DOM would be nothing on the server and a count on the client.
   */
  readonly columns = input<number | undefined, number | string | undefined>(undefined, {
    transform: (count) => (count === undefined ? undefined : numberAttribute(count)),
  });
  /** A refresh over rows already shown: `aria-busy`, and nothing moves. */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * selection, expansion and sort words, the scrolling region's name and every
   * word of the column filters.
   */
  readonly messages = input<PartialMessages<TableMessages> | undefined>(undefined);

  /** One output per transition, each carrying the reason and the event. */
  readonly sortChangeRequest = output<ChangeRequest<TableSortDescriptor | null>>();
  readonly valueChangeRequest = output<ChangeRequest<readonly string[]>>();
  readonly expandedChangeRequest = output<ChangeRequest<readonly string[]>>();

  private readonly defaults = injectTableDefaults();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly id = inject(SlTableIdFactory).next();

  /** Where a range starts: the row of the last press that held no modifier. */
  private anchor: string | undefined = undefined;
  private touched: (() => void) | undefined = undefined;
  private notify: ((value: readonly string[]) => void) | undefined = undefined;
  private readonly formDisabled = signal(false);

  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedEdges = computed(() => this.edges() ?? this.defaults.edges);
  readonly resolvedLayout = computed(() => this.layout() ?? this.defaults.layout);
  readonly resolvedCellAlign = computed(() => this.cellAlign() ?? this.defaults.cellAlign);
  readonly resolvedMode = computed(() => this.selectionMode() ?? this.defaults.selectionMode);
  readonly resolvedStriped = computed(() => this.striped() ?? this.defaults.striped);
  readonly resolvedStickyHeader = computed(() => this.stickyHeader() ?? this.defaults.stickyHeader);
  readonly resolvedStickyFooter = computed(() => this.stickyFooter() ?? this.defaults.stickyFooter);
  readonly resolvedStickyTo = computed(() => this.stickyTo() ?? this.defaults.stickyTo);
  readonly resolvedColumns = computed(() => this.columns() ?? this.defaults.columns);
  /** The family's words in the language in force, with this table's `messages` laid over them. */
  readonly t = injectMessages(tableMessages, this.messages);

  isSelected(key: string) {
    return this.value().includes(key);
  }

  isExpanded(key: string) {
    return this.expanded().includes(key);
  }

  /**
   * Every selectable row's value, read out of the DOM at the moment it is
   * needed rather than kept in a registry. A registry holds the order rows were
   * created in, and a sorted table renders the same rows in a new order without
   * destroying one of them — so the range and the select-all would run against
   * the order before the sort.
   */
  rows(): readonly string[] {
    return [...this.host.nativeElement.querySelectorAll(TABLE_ROW_SELECTOR)]
      .filter((row) => !row.hasAttribute('data-disabled'))
      .map((row) => row.getAttribute('data-value') ?? '');
  }

  requestSort(column: string, source: Event | undefined) {
    /**
     * Ascending, descending, then none — the third state Material and Ant both
     * ship and Carbon does not. A reader who sorted a column by accident has no
     * other way back.
     */
    const held = this.sort();
    const next: TableSortDescriptor | null =
      held?.column !== column
        ? { column, direction: 'ascending' }
        : held.direction === 'ascending'
          ? { column, direction: 'descending' }
          : null;

    const state = createControllable<TableSortDescriptor | null>({
      initial: held,
      equals: (a, b) => a?.column === b?.column && a?.direction === b?.direction,
      onRequest: (request) => this.sortChangeRequest.emit(request),
    });
    const moved = state.request(next, next === null ? 'clear' : 'pointer', source);

    /**
     * `aria-sort` is a property, and a property that changes silently is a
     * change no reader hears. None of the six surveyed implementations says it.
     */
    const heading = (source?.currentTarget as HTMLElement | null)?.textContent?.trim() ?? column;
    const said =
      next === null
        ? this.t('sortCleared', { column: heading })
        : next.direction === 'ascending'
          ? this.t('sortedAscending', { column: heading })
          : this.t('sortedDescending', { column: heading });
    getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(said);

    if (moved) this.sort.set(next);
  }

  toggleSelected(key: string, options: { range: boolean; source: Event | undefined }) {
    const result = nextSelection({
      action: options.range && this.resolvedMode() === 'multiple' ? 'range' : 'toggle',
      anchor: this.anchor,
      behavior: 'toggle',
      key,
      keys: this.rows(),
      mode: this.resolvedMode(),
      selected: this.value(),
    });
    if (!options.range) this.anchor = key;
    this.requestValue(result.selected, options.range ? 'select' : 'pointer', options.source);
  }

  toggleSelectAll(source: Event | undefined) {
    const result = nextSelection({
      action: 'all',
      keys: this.rows(),
      mode: this.resolvedMode(),
      selected: this.value(),
    });
    this.requestValue(result.selected, result.selected.length === 0 ? 'clear' : 'select', source);
  }

  toggleExpanded(key: string, source: Event | undefined) {
    const held = this.expanded();
    const next = held.includes(key) ? held.filter((open) => open !== key) : [...held, key];
    const state = createControllable<readonly string[]>({
      initial: held,
      equals: (a, b) => a.length === b.length && a.every((open, index) => open === b[index]),
      onRequest: (request) => this.expandedChangeRequest.emit(request),
    });
    if (state.request(next, 'pointer', source)) this.expanded.set(next);
  }

  /** The form's own value is the selection, which is what a bulk action acts on. */
  writeValue(value: readonly string[] | null | undefined) {
    this.value.set(value ?? []);
  }

  registerOnChange(fn: (value: readonly string[]) => void) {
    this.notify = fn;
  }

  registerOnTouched(fn: () => void) {
    this.touched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  readonly disabledByForm = computed(() => this.formDisabled());

  private requestValue(
    next: readonly string[],
    reason: TableSelectionReason,
    source: Event | undefined,
  ) {
    const state = createControllable<readonly string[]>({
      initial: this.value(),
      equals: (a, b) => a.length === b.length && a.every((key, index) => key === b[index]),
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (!state.request(next, reason, source)) return;
    this.value.set(next);
    this.notify?.(next);
    this.touched?.();
  }
}
