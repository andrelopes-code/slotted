import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { isRowAction } from '@slotted/core/pointer-intent';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlSkeleton } from '@slotted/angular/skeleton';
import {
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
  provideTooltipDefaults,
} from '@slotted/angular/tooltip';

import { SlTable } from './table';
import type { TableAlign, TableSticky, TableText } from './table-defaults';

/**
 * The axes every cell answers, written once. `numeric` and `align` are two facts
 * rather than one axis: a number is set in tabular figures whichever way it is
 * aligned, and a right-aligned label is not a number.
 */
@Directive({
  standalone: true,
  host: {
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-block-align]': 'blockAlign() ?? null',
    '[attr.data-numeric]': "numeric() ? '' : null",
    '[attr.data-text]': 'text() ?? null',
    '[attr.data-sticky]': 'sticky() ?? null',
    '[style.--slotted-table-sticky-inset]': 'stickyOffset() ?? null',
  },
})
export class SlTableCellAxes {
  readonly align = input<TableAlign | undefined>(undefined);
  /**
   * Where this cell's content sits in a row as tall as its tallest cell. The
   * table states it once through `cellAlign`; this overrides it for the one
   * cell that wants the other answer.
   */
  readonly blockAlign = input<TableAlign | undefined>(undefined);
  readonly numeric = input(false, { transform: booleanAttribute });
  readonly text = input<TableText | undefined>(undefined);
  readonly sticky = input<TableSticky | undefined>(undefined);
  /**
   * Where a pinned column stops, as a CSS length. Nought unless stated: two
   * columns pinned to the same edge need the second to know how wide the first
   * is, and the family states that rather than measuring it — measuring would
   * mean reading the layout during change detection.
   */
  readonly stickyOffset = input<string | undefined>(undefined);
}

/**
 * The table's name, and the element the platform already associates with it. A
 * `caption` is the accessible name whether it is read or hidden, so the family
 * writes no `aria-labelledby` restating what the browser states.
 */
@Directive({
  selector: 'caption[slTableCaption]',
  standalone: true,
  exportAs: 'slTableCaption',
  host: { 'data-part': 'caption', 'data-part-caption': '' },
})
export class SlTableCaption {}

@Directive({
  selector: 'thead[slTableHead]',
  standalone: true,
  exportAs: 'slTableHead',
  host: { 'data-part': 'head', 'data-part-head': '' },
})
export class SlTableHead {}

@Directive({
  selector: 'tbody[slTableBody]',
  standalone: true,
  exportAs: 'slTableBody',
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlTableBody {}

/**
 * The `tfoot`, which the HTML Standard calls the column summaries of the table.
 * It is not `slTableFooter`, which is the bar outside the table holding the
 * consumer's own controls.
 */
@Directive({
  selector: 'tfoot[slTableSummary]',
  standalone: true,
  exportAs: 'slTableSummary',
  host: { 'data-part': 'summary', 'data-part-summary': '' },
})
export class SlTableSummary {}

/**
 * The bar under the table and inside its frame, where a paged listing puts its
 * control. It is a sibling of the scroller rather than a child, so a table
 * scrolled sideways does not take its pagination with it.
 */
@Directive({
  selector: 'div[slTableFooter]',
  standalone: true,
  exportAs: 'slTableFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlTableFooter {}

/**
 * One record. It carries `data-selected` and `data-expanded` for the stylesheet
 * and `data-value` for the range and the select-all, which read the rows out of
 * the DOM at the moment they act.
 *
 * A row is not selectable under the `table` role, so it carries no
 * `aria-selected`: the state is painted here and announced by the checkbox.
 */
@Directive({
  selector: 'tr[slTableRow]',
  standalone: true,
  exportAs: 'slTableRow',
  host: {
    'data-part': 'row',
    'data-part-row': '',
    '[attr.data-value]': 'value() ?? null',
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-expanded]': "expanded() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.aria-rowindex]': 'rowIndex() ?? null',
    '[attr.aria-current]': "current() ? 'true' : null",
    '[attr.data-current]': "current() ? '' : null",
    '[attr.data-interactive]': "interactive() ? '' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlTableRow {
  /** The row's key, required wherever selection or expansion is on. */
  readonly value = input<string | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * The row the page is showing elsewhere — the record open in a detail pane
   * beside the table. Written as `aria-current="true"`; it is not the
   * selection, which the checkbox owns.
   */
  readonly current = input(false, { transform: booleanAttribute });
  /**
   * Paints the row as a thing the pointer can press. Stated beside `(action)`,
   * because an output does not say whether anything listens to it.
   */
  readonly interactive = input(false, { transform: booleanAttribute });
  /**
   * A click anywhere in the row that does not land on a control of its own — a
   * link, a button, a field, a label. The row takes no tab stop: the keyboard
   * reaches the record through the first link or button in it.
   */
  readonly action = output<MouseEvent>();
  /**
   * The row's position in the whole set, one-based, written only where the
   * table states a total: the practice warns that setting `aria-rowindex` on
   * some rows and not others has devastating effects on assistive technology.
   */
  readonly rowIndex = input<number | undefined, number | string | undefined>(undefined, {
    transform: (index) => (index === undefined ? undefined : numberAttribute(index)),
  });

  readonly table = inject(SlTable);

  readonly selected = computed(() => {
    const key = this.value();
    return key !== undefined && this.table.isSelected(key);
  });

  readonly expanded = computed(() => {
    const key = this.value();
    return key !== undefined && this.table.isExpanded(key);
  });

  readonly detailId = computed(() => `${this.table.id}-detail-${this.value() ?? ''}`);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || this.disabled()) return;
    if (isRowAction(this.host.nativeElement, event.target)) this.action.emit(event);
  }
}

/**
 * A column's name. `scope="col"` is what makes a screen reader repeat it for
 * every cell under it, and `aria-sort` is written here and on no other header.
 *
 * A name cut by its own box — `text="truncate"` on a column with no room —
 * reads `Op…` to the eye while the whole of it is still what a screen reader
 * repeats under every cell. The hint closes that gap: it opens only while the
 * name is measured as cut, which a header that wraps or fits never is, and it
 * is shown rather than read — `describes="none"`, because the header already
 * states the words.
 */
@Component({
  selector: 'th[slTableColumnHeader]',
  standalone: true,
  exportAs: 'slTableColumnHeader',
  imports: [SlTooltipContent, SlTooltipLayer],
  template: `<ng-content />
    <ng-template slTooltipLayer>
      <div slTooltipContent>{{ hint() }}</div>
    </ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: SlTableCellAxes,
      inputs: ['align', 'blockAlign', 'numeric', 'text', 'sticky', 'stickyOffset'],
    },
    SlTooltip,
    SlTooltipTrigger,
  ],
  providers: [
    provideTooltipDefaults({
      describes: 'none',
      openOn: 'hover',
      side: 'bottom',
      whenClipped: true,
    }),
  ],
  host: {
    'data-part': 'column-header',
    'data-part-column-header': '',
    '[attr.scope]': "scope() ?? 'col'",
    '[attr.aria-sort]': 'ariaSort()',
  },
})
export class SlTableColumnHeader {
  /** The column's own key, which the sort descriptor names. */
  readonly column = input<string | undefined>(undefined);
  readonly scope = input<string | undefined>(undefined);

  private readonly table = inject(SlTable);
  private readonly tooltip = inject(SlTooltip);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  readonly ariaSort = computed(() => {
    const sort = this.table.sort();
    return sort !== null && sort.column === this.column() ? sort.direction : null;
  });

  /** The words the header itself holds, read when the hint is about to show them. */
  protected readonly hint = computed(() =>
    this.tooltip.isOpen() ? (this.native.textContent ?? '').trim() : '',
  );
}

/**
 * The cell that identifies the record, which a screen reader repeats in each of
 * the cells beside it. It states no colour of its own, so a selected record's
 * name turns with the row and a disabled one dims with it.
 */
@Directive({
  selector: 'th[slTableRowHeader]',
  standalone: true,
  exportAs: 'slTableRowHeader',
  hostDirectives: [
    {
      directive: SlTableCellAxes,
      inputs: ['align', 'blockAlign', 'numeric', 'text', 'sticky', 'stickyOffset'],
    },
  ],
  host: {
    'data-part': 'row-header',
    'data-part-row-header': '',
    '[attr.scope]': "scope() ?? 'row'",
  },
})
export class SlTableRowHeader {
  readonly scope = input<string | undefined>(undefined);
}

@Directive({
  selector: 'td[slTableCell]',
  standalone: true,
  exportAs: 'slTableCell',
  hostDirectives: [
    {
      directive: SlTableCellAxes,
      inputs: ['align', 'blockAlign', 'numeric', 'text', 'sticky', 'stickyOffset'],
    },
  ],
  host: { 'data-part': 'cell', 'data-part-cell': '' },
})
export class SlTableCell {}

/**
 * The column's name wrapped in a button, which is what the APG's own sortable
 * example does. The cycle is ascending, descending, then none.
 *
 * The consumer's own listener runs as well: this is a listener on the host, so
 * both fire and a consumer who calls `preventDefault()` keeps the sort still.
 */
@Component({
  selector: 'button[slTableSort]',
  standalone: true,
  exportAs: 'slTableSort',
  imports: [SlGlyph, SlIcon],
  /* The direction mark follows the name: one chevron the stylesheet turns over
     for ascending and shows, muted, under the pointer on an unsorted column. */
  template: `<ng-content /><span slIcon><svg slGlyph name="chevron-down"></svg></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'sort',
    'data-part-sort': '',
    type: 'button',
    '(click)': 'press($event)',
  },
})
export class SlTableSort {
  /** Overrides the column the header states, where a header holds two. */
  readonly column = input<string | undefined>(undefined);

  private readonly table = inject(SlTable);
  private readonly header = inject(SlTableColumnHeader, { optional: true });

  press(event: Event) {
    if (event.defaultPrevented) return;
    const key = this.column() ?? this.header?.column();
    if (key === undefined) return;
    this.table.requestSort(key, event);
  }
}

/**
 * The slot beside a column's name for the controls it carries: a filter
 * trigger, a column menu, a help hint. The family holds the place and the
 * geometry; what a filter means is the consumer's query.
 */
@Directive({
  selector: 'span[slTableColumnActions]',
  standalone: true,
  exportAs: 'slTableColumnActions',
  host: { 'data-part': 'column-actions', 'data-part-column-actions': '' },
})
export class SlTableColumnActions {}

/**
 * A row's own checkbox, in the cell the family lays out. The control is
 * `checkbox`'s: the cell is this family's and the chooser is not, which is the
 * division `list-item` recorded. Its name is a visually hidden label rather
 * than an `aria-label` on the wrapper, because the wrapper is not the control.
 *
 * `Shift` while pressing selects every row from the anchor to this one.
 */
@Component({
  selector: 'td[slTableSelect]',
  standalone: true,
  exportAs: 'slTableSelect',
  imports: [SlCheckbox],
  template: `<span
    slCheckbox
    [checked]="checked()"
    [disabled]="row.disabled()"
    (click)="press($event)"
  >
    <span data-ui="visually-hidden" data-ui-visually-hidden="" data-part="root" data-part-root="">{{
      name()
    }}</span>
  </span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: SlTableCellAxes,
      inputs: ['align', 'blockAlign', 'numeric', 'text', 'sticky', 'stickyOffset'],
    },
  ],
  host: { 'data-part': 'selection', 'data-part-selection': '' },
})
export class SlTableSelect {
  /** The row this checkbox chooses. Read from the row when it is not stated. */
  readonly value = input<string | undefined>(undefined);

  readonly table = inject(SlTable);
  readonly row = inject(SlTableRow);

  readonly key = computed(() => this.value() ?? this.row.value());
  readonly checked = computed(() => {
    const key = this.key();
    return key !== undefined && this.table.isSelected(key);
  });
  readonly name = computed(() => {
    const key = this.key();
    return this.table.t('selectRow', { row: key ?? '' }).trim();
  });

  press(event: MouseEvent) {
    const key = this.key();
    if (key === undefined || this.row.disabled()) return;
    this.table.toggleSelected(key, { range: event.shiftKey, source: event });
  }
}

/**
 * The header's checkbox. It covers the rows in the DOM, is indeterminate while
 * some of them are selected, and states the count it covers in its own name — a
 * selection over a whole result set is a decision only the consumer's query can
 * make.
 */
@Component({
  selector: 'th[slTableSelectAll]',
  standalone: true,
  exportAs: 'slTableSelectAll',
  imports: [SlCheckbox],
  template: `<span
    slCheckbox
    [checked]="checked()"
    [indeterminate]="indeterminate()"
    (click)="press($event)"
  >
    <span data-ui="visually-hidden" data-ui-visually-hidden="" data-part="root" data-part-root="">{{
      name()
    }}</span>
  </span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: SlTableCellAxes,
      inputs: ['align', 'blockAlign', 'numeric', 'text', 'sticky', 'stickyOffset'],
    },
  ],
  host: { 'data-part': 'selection', 'data-part-selection': '', scope: 'col' },
})
export class SlTableSelectAll {
  readonly table = inject(SlTable);

  readonly checked = computed(() => {
    const chosen = this.table.value().length;
    return chosen > 0 && chosen === this.table.rows().length;
  });

  readonly indeterminate = computed(() => {
    const chosen = this.table.value().length;
    return chosen > 0 && chosen < this.table.rows().length;
  });

  readonly name = computed(() => {
    return this.table.t('selectAll', { count: this.table.value().length });
  });

  press(event: MouseEvent) {
    this.table.toggleSelectAll(event);
  }
}

/**
 * The Disclosure pattern, borrowed whole: a `button` carrying `aria-expanded`
 * and naming the row it opens.
 */
@Component({
  selector: 'button[slTableExpander]',
  standalone: true,
  exportAs: 'slTableExpander',
  imports: [SlGlyph, SlIcon],
  /* The chevron is drawn unless the consumer wrote content of their own. */
  template: `<ng-content
    ><span slIcon><svg slGlyph name="chevron-right"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'expander',
    'data-part-expander': '',
    type: 'button',
    '[attr.aria-expanded]': 'row.expanded()',
    '[attr.aria-controls]': 'row.expanded() ? row.detailId() : null',
    '[attr.aria-label]': 'name()',
    '(click)': 'press($event)',
  },
})
export class SlTableExpander {
  readonly value = input<string | undefined>(undefined);

  readonly table = inject(SlTable);
  readonly row = inject(SlTableRow);

  readonly name = computed(() => {
    return this.row.expanded() ? this.table.t('collapse') : this.table.t('expand');
  });

  press(event: Event) {
    if (event.defaultPrevented) return;
    const key = this.value() ?? this.row.value();
    if (key === undefined) return;
    this.table.toggleExpanded(key, event);
  }
}

/**
 * One row holding one cell that spans the table.
 *
 * **The consumer writes the `@if`.** Angular's own control flow is what keeps a
 * closed detail out of the DOM entirely, and a component whose host is the `tr`
 * cannot remove that `tr` from inside itself — an empty row is a row a screen
 * reader still counts. React returns `null` from the component instead, and the
 * two reach the same DOM; the asymmetry is the frameworks', not the family's.
 */
@Component({
  selector: 'tr[slTableDetail]',
  standalone: true,
  exportAs: 'slTableDetail',
  template: `<td [attr.colspan]="span()" data-part="cell" data-part-cell=""><ng-content /></td>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'detail', 'data-part-detail': '', '[attr.id]': 'detailId()' },
})
export class SlTableDetail {
  /** The row the detail belongs to. */
  readonly value = input.required<string>();
  /** How many columns the detail spans. Defaults to the table's own count. */
  readonly colSpan = input<number | undefined, number | string | undefined>(undefined, {
    transform: (count) => (count === undefined ? undefined : numberAttribute(count)),
  });

  private readonly table = inject(SlTable);

  readonly span = computed(() => this.colSpan() ?? this.table.resolvedColumns());
  readonly detailId = computed(() => `${this.table.id}-detail-${this.value()}`);
}

/** Marks what stands at the end of a group's band: its total or net. */
@Directive({
  selector: '[slTableGroupRowEnd]',
  standalone: true,
})
export class SlTableGroupRowEnd {}

/**
 * The band that opens a group of rows — a day of a ledger, with its net at the
 * end. One header cell spans every column; `scope="rowgroup"` names the rows
 * of the `tbody` it opens, so a ledger writes one body per group.
 */
@Component({
  selector: 'tr[slTableGroupRow]',
  standalone: true,
  exportAs: 'slTableGroupRow',
  template: `<th
    [attr.colspan]="span()"
    data-part="group-header"
    data-part-group-header=""
    scope="rowgroup"
  >
    <div data-part="group-content" data-part-group-content="">
      <span data-part="group-start" data-part-group-start=""><ng-content /></span>
      @if (end()) {
        <span data-part="group-end" data-part-group-end=""
          ><ng-content select="[slTableGroupRowEnd]"
        /></span>
      }
    </div>
  </th>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'group-row',
    'data-part-group-row': '',
    '[attr.data-sticky]': "sticky() ? '' : null",
  },
})
export class SlTableGroupRow {
  /** How many columns the band spans. Defaults to the table's own count. */
  readonly colSpan = input<number | undefined, number | string | undefined>(undefined, {
    transform: (count) => (count === undefined ? undefined : numberAttribute(count)),
  });
  /** Holds the band under the header while its rows scroll past. */
  readonly sticky = input(false, { transform: booleanAttribute });

  private readonly table = inject(SlTable);

  protected readonly end = contentChild(SlTableGroupRowEnd);
  readonly span = computed(() => this.colSpan() ?? this.table.resolvedColumns());
}

/**
 * What is shown when there is nothing. It takes a `result-state`, whose status
 * axis already separates an empty set from a set a filter emptied. The cell
 * goes in a plain `tr`, not an `slTableRow`: the row is not a record, so it
 * takes no hover, stripe or selection — the row React's `TableEmpty` writes.
 */
@Directive({
  selector: 'td[slTableEmpty]',
  standalone: true,
  exportAs: 'slTableEmpty',
  host: { 'data-part': 'empty', 'data-part-empty': '', '[attr.colspan]': 'span()' },
})
export class SlTableEmpty {
  readonly colSpan = input<number | undefined, number | string | undefined>(undefined, {
    transform: (count) => (count === undefined ? undefined : numberAttribute(count)),
  });

  private readonly table = inject(SlTable);

  readonly span = computed(() => this.colSpan() ?? this.table.resolvedColumns());
}

/**
 * The skeleton rows of a first load: the table's shape before its content. A
 * refresh over rows already read is the other state and is not this one —
 * `loading` on the table dims the body and moves nothing.
 */
@Component({
  selector: 'tbody[slTableLoader]',
  standalone: true,
  exportAs: 'slTableLoader',
  imports: [SlSkeleton],
  template: `@for (row of skeleton(); track row) {
    <tr data-part="row" data-part-row="">
      @for (cell of cells(); track cell) {
        <td data-part="cell" data-part-cell="">
          <span slSkeleton loading inlineSize="100%"></span>
        </td>
      }
    </tr>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'loader', 'data-part-loader': '', 'aria-hidden': 'true' },
})
export class SlTableLoader {
  /** How many skeleton rows a first load draws. */
  readonly skeletonRows = input(5, { transform: numberAttribute });

  private readonly table = inject(SlTable);

  readonly skeleton = computed(() =>
    Array.from({ length: this.skeletonRows() }, (_row, index) => index),
  );
  readonly cells = computed(() =>
    Array.from({ length: this.table.resolvedColumns() }, (_cell, index) => index),
  );
}

/** Every part of the family, for a template that imports the set at once. */
export const SL_TABLE_PARTS = [
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnActions,
  SlTableColumnHeader,
  SlTableDetail,
  SlTableEmpty,
  SlTableExpander,
  SlTableFooter,
  SlTableGroupRow,
  SlTableGroupRowEnd,
  SlTableHead,
  SlTableLoader,
  SlTableRow,
  SlTableRowHeader,
  SlTableSelect,
  SlTableSelectAll,
  SlTableSort,
  SlTableSummary,
] as const;
