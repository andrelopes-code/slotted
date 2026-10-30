import type {
  BooleanFilter,
  DateTimeFilter,
  DateTimeOperator,
  BooleanOperator,
  DateFilter,
  DateOperator,
  FilterDescriptor,
  FilterOperator,
  NumberFilter,
  NumberOperator,
  SetFilter,
  SetOperator,
  TextFilter,
  TimeFilter,
  TimeOperator,
  TextOperator,
} from '@slotted/core/filter';
import type { PlainTime, TimeGranularity } from '@slotted/core/date';
import type { FamilyTranslator, PartialMessages, TableMessages } from '@slotted/core/i18n';
import type { TimeFieldHourCycle } from '../time-field';
import type { ChangeRequest } from '@slotted/core/state';
import type { PopoverChangeRequest, PopoverProps } from '../popover/popover.types';
import type {
  ComponentPropsWithRef,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  RefCallback,
  RefObject,
} from 'react';

/** How much of a frame the set is given. The vocabulary `description-list` set. */
export type TableVariant = 'plain' | 'ruled' | 'framed';

/**
 * Whether the first and the last column keep the cell's inset on their outer
 * side. `flush` reaches `plain` and `ruled` only: a `framed` table keeps the
 * inset, because its text stands against a border.
 */
export type TableEdges = 'inset' | 'flush';

/**
 * Whether the browser sizes the columns from their content or from what the
 * table states. `fixed` is what makes a stated width hold and a truncated cell
 * truncate at all.
 */
export type TableLayout = 'auto' | 'fixed';

export type TableSelectionMode = 'none' | 'single' | 'multiple';

/** Which edge a cell's content stands on, resolved logically. */
export type TableAlign = 'start' | 'center' | 'end';

/** What a value longer than its column does. None of the three removes it. */
export type TableText = 'wrap' | 'truncate' | 'nowrap';

/**
 * What a sticky header stays inside: the family's own scroller, or whatever
 * scrolls outside it — the page, an app shell, a scroll area.
 */
export type TableStickyTo = 'scroll' | 'page';

/** Which edge a column is pinned to while the table scrolls past it. */
export type TableSticky = 'start' | 'end';

export type TableSortDirection = 'ascending' | 'descending';

/**
 * Which column the rows are ordered by, and which way. The family holds it and
 * reorders nothing: the rows are the consumer's own children, so the consumer
 * applies the descriptor to its own array or its own query.
 */
export interface TableSortDescriptor {
  column: string;
  direction: TableSortDirection;
}

export type TableSortReason = Extract<
  ChangeRequest<TableSortDescriptor | null>['reason'],
  'pointer' | 'keyboard' | 'clear' | 'programmatic'
>;

export type TableSelectionReason = Extract<
  ChangeRequest<readonly string[]>['reason'],
  'pointer' | 'keyboard' | 'select' | 'clear' | 'programmatic'
>;

export type TableExpandedReason = Extract<
  ChangeRequest<readonly string[]>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

export type TableSortRequest = ChangeRequest<TableSortDescriptor | null>;
export type TableSelectionRequest = ChangeRequest<readonly string[]>;
export type TableExpandedRequest = ChangeRequest<readonly string[]>;

/** One value a column can be filtered to. */
export interface TableFilterOption {
  /** The value the consumer's query matches. It is what the state holds. */
  value: string;
  /** What the reader sees, when it is not the value itself. */
  label?: string | undefined;
  /**
   * How many records carry it. Optional and the consumer's own: how many rows a
   * value has is a fact about the query, not about the column.
   */
  count?: number | undefined;
}

export type TableFilterReason = Extract<
  ChangeRequest<FilterDescriptor | null>['reason'],
  'pointer' | 'keyboard' | 'clear' | 'programmatic'
>;

export type TableFilterRequest = ChangeRequest<FilterDescriptor | null>;

/** What a replaced operand area is handed, and everything it needs. */
export interface TableFilterOperandProps<Value> {
  /** Which of the operator's operands this is: the first, or a range's second. */
  index: 0 | 1;
  /** The operand as the draft holds it. */
  value: Value | null;
  /** Writes the operand back into the draft. */
  onValueChange: (value: Value | null) => void;
  /** The condition's operator, for a control whose shape depends on it. */
  operator: FilterOperator;
  /** The accessible name the family would have given the field. */
  label: string;
  /** Applies the draft, which is what `Enter` in the family's own field does. */
  apply: () => void;
}

/**
 * What every kind's filter takes. The typed value and the kind-specific props
 * are added by each of the five components; everything here is shared. The
 * panel's words are the table's `messages`, so an application translates the
 * panel once rather than per column.
 */
export interface TableFilterSharedProps extends Pick<
  PopoverProps,
  'align' | 'collisionPadding' | 'mount' | 'portal' | 'side' | 'sideOffset'
> {
  /**
   * The column's name in the trigger's own name. Read from the column header
   * around it when it is not stated, and stated when the header's text is not a
   * name a reader would recognize on its own.
   */
  columnLabel?: string | undefined;
  /**
   * How many conditions the panel offers. Two unless stated, which is AG Grid's
   * own `maxNumConditions`; the second appears once the first is complete.
   */
  conditions?: 1 | 2 | undefined;
  /** Whether the panel opens. Controlled when stated. */
  open?: boolean | undefined;
  /** The panel's starting state when nobody owns it. */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: PopoverChangeRequest) => void) | undefined;
  /**
   * The trigger's whole accessible name, replacing the one the catalog writes.
   * It is the trigger's `aria-label`, which no other prop reaches.
   */
  label?: string | undefined;
}

/** The props every condition-shaped filter takes, over its own operator type. */
export interface TableConditionFilterProps<
  Filter,
  Operator extends string,
  Value,
> extends TableFilterSharedProps {
  /** The filter an uncontrolled column starts from, read once. */
  defaultValue?: Filter | null | undefined;
  /** The filter the column holds. Controlled when stated. */
  value?: Filter | null | undefined;
  onValueChange?: ((value: Filter | null, request: TableFilterRequest) => void) | undefined;
  /**
   * The operators this column offers, narrowing the kind's own list. It is AG
   * Grid's `filterOptions`, and the order given is the order shown.
   */
  operators?: readonly Operator[] | undefined;
  /** Which one the panel opens on. The kind's own default unless stated. */
  defaultOperator?: Operator | undefined;
  /** Replaces the field the family would have drawn, and keeps everything else. */
  renderOperand?: ((props: TableFilterOperandProps<Value>) => ReactNode) | undefined;
}

export type TableTextFilterProps = TableConditionFilterProps<TextFilter, TextOperator, string>;

export interface TableNumberFilterProps extends TableConditionFilterProps<
  NumberFilter,
  NumberOperator,
  number
> {
  /** How the operand is written and read back, through `Intl.NumberFormat`. */
  format?: Intl.NumberFormatOptions | undefined;
  /** BCP 47, for the operand's own parsing. Defaults to the runtime's. */
  locale?: string | undefined;
  /** The amount the operand's steppers move by. */
  step?: number | undefined;
}

export interface TableDateFilterProps extends TableConditionFilterProps<
  DateFilter,
  DateOperator,
  string
> {
  /** BCP 47. Decides the operand's field order and separators. */
  locale?: string | undefined;
  /** The earliest day the operand accepts, as an ISO day. */
  min?: string | undefined;
  /** The latest, as an ISO day. */
  max?: string | undefined;
  /**
   * The application's own ranges — this week, this month — as
   * `DateRangePickerPreset`s, offered inside the range picker `between` draws.
   * The descriptor still receives two ISO days; the preset is how they were
   * chosen.
   */
  presets?: ReactNode | undefined;
}

/**
 * A column of times of day. The operand is `time-picker`, and the descriptor
 * holds the ISO text it writes at the column's own granularity: `HH:MM` at a
 * minute, `HH:MM:SS` at a second. The engine compares at that precision.
 */
export interface TableTimeFilterProps extends TableConditionFilterProps<
  TimeFilter,
  TimeOperator,
  string
> {
  /** BCP 47. Decides the operand's hour cycle and separators. */
  locale?: string | undefined;
  /** Twelve or twenty-four hours, overriding what the locale says. */
  hourCycle?: TimeFieldHourCycle | undefined;
  /** The last unit the operand writes. Minute unless stated. */
  granularity?: TimeGranularity | undefined;
  /** The list's step, in seconds. */
  step?: number | undefined;
  /** The list's own entries, replacing the step. */
  options?: readonly PlainTime[] | undefined;
  /** The earliest time the operand accepts, as ISO time text. */
  min?: string | undefined;
  /** The latest, as ISO time text. */
  max?: string | undefined;
  /**
   * The application's own windows — the morning shift, the night shift — as
   * `TimeRangePickerPreset`s, offered inside the range picker `between` draws.
   * The descriptor still receives two ISO times.
   */
  presets?: ReactNode | undefined;
}

/**
 * A column of dates with times. The operand is `datetime-picker`, and the
 * descriptor holds `YYYY-MM-DDTHH:MM` or `…:SS` at the column's granularity. A
 * condition whose operand has one half missing is inactive until both exist.
 */
export interface TableDateTimeFilterProps extends TableConditionFilterProps<
  DateTimeFilter,
  DateTimeOperator,
  string
> {
  /** BCP 47. Decides the operand's field order and separators. */
  locale?: string | undefined;
  /** Twelve or twenty-four hours, overriding what the locale says. */
  hourCycle?: TimeFieldHourCycle | undefined;
  /** The last unit the operand writes. Minute unless stated. */
  granularity?: TimeGranularity | undefined;
  /** The list's step, in seconds. */
  step?: number | undefined;
  /** The earliest date-time the operand accepts, as ISO date-time text. */
  min?: string | undefined;
  /** The latest, as ISO date-time text. */
  max?: string | undefined;
  /** The zone "now" is read in. Defaults to the runtime's. */
  timeZone?: string | undefined;
  /**
   * The application's own windows — the last 24 hours, this week — as
   * `DateTimeRangePickerPreset`s, offered inside the range picker `between`
   * draws. The descriptor still receives two ISO date-times.
   */
  presets?: ReactNode | undefined;
}

/** A column of two answers, called by the catalog's `true` and `false`. */
export type TableBooleanFilterProps = TableConditionFilterProps<
  BooleanFilter,
  BooleanOperator,
  boolean
>;

export interface TableSetFilterProps extends TableConditionFilterProps<
  SetFilter,
  SetOperator,
  readonly string[]
> {
  /**
   * How the values are chosen. `list` is the search, the covering checkbox and
   * the values; `tags` is `tags-input`, for a list too long to tick — the
   * chosen values are chips, and `options` become a `datalist` of suggestions
   * and the set a typed value must belong to. The descriptor is the same list
   * either way.
   */
  operand?: 'list' | 'tags' | undefined;
  /**
   * The values this column can be filtered to, and optionally their counts.
   * Optional with `tags`, where a column may hold more values than a page
   * knows; without it any typed value is admitted.
   */
  options?: readonly TableFilterOption[] | undefined;
  /**
   * Whether the panel carries a search. Unstated, it appears once there are
   * `searchThreshold` values: a search over four values is a control a reader
   * has to skip, and a list of forty without one is a scroll.
   */
  searchable?: boolean | undefined;
  /** How many values bring the search with them. Eight unless stated. */
  searchThreshold?: number | undefined;
}

/** What an application sets once for every table under it. */
export interface TableDefaults {
  cellAlign?: TableAlign | undefined;
  columns?: number | undefined;
  edges?: TableEdges | undefined;
  layout?: TableLayout | undefined;
  selectionMode?: TableSelectionMode | undefined;
  stickyFooter?: boolean | undefined;
  stickyHeader?: boolean | undefined;
  stickyTo?: TableStickyTo | undefined;
  striped?: boolean | undefined;
  variant?: TableVariant | undefined;
}

export interface TableDefaultsProviderProps extends TableDefaults {
  children?: ReactNode | undefined;
}

/** What `render` receives for the root, so it can be spread onto any element. */
export interface TableRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-cell-align'?: TableAlign | undefined;
  'data-edges': TableEdges;
  'data-layout': TableLayout;
  'data-loading'?: '' | undefined;
  'data-part': string;
  'data-sticky-footer'?: '' | undefined;
  'data-sticky-header'?: '' | undefined;
  'data-sticky-to'?: TableStickyTo | undefined;
  'data-striped'?: '' | undefined;
  'data-ui': string;
  'data-variant': TableVariant;
  /**
   * Named here, unlike a part whose element the family never reads, because the
   * range and the select-all read the rows out of this element at the moment
   * they act. A consumer who substitutes the element still hands the family the
   * node those two questions are asked of.
   */
  ref: RefCallback<HTMLDivElement>;
}

export interface TableProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /**
   * Where every cell's content sits in a row as tall as its tallest cell. A
   * cell states `blockAlign` to answer differently.
   */
  cellAlign?: TableAlign | undefined;
  /**
   * How many columns the table renders. The spanning parts — the detail row,
   * the empty cell, the skeleton rows — need the number, and reading it from
   * the DOM would be nothing on the server and a count on the client.
   */
  columns?: number | undefined;
  defaultExpanded?: readonly string[] | undefined;
  defaultSort?: TableSortDescriptor | null | undefined;
  defaultValue?: readonly string[] | undefined;
  expanded?: readonly string[] | undefined;
  layout?: TableLayout | undefined;
  /** A refresh over rows already shown: `aria-busy`, and nothing moves. */
  loading?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * selection, expansion and sort words, the scrolling region's name and every
   * word of the column filters.
   */
  messages?: PartialMessages<TableMessages> | undefined;
  onExpandedChange?: (value: readonly string[], request: TableExpandedRequest) => void;
  onSortChange?: (value: TableSortDescriptor | null, request: TableSortRequest) => void;
  onValueChange?: (value: readonly string[], request: TableSelectionRequest) => void;
  render?: ((props: TableRootProps) => ReactNode) | undefined;
  selectionMode?: TableSelectionMode | undefined;
  sort?: TableSortDescriptor | null | undefined;
  /**
   * Holds the summary rows against the bottom of the same box the header is
   * held against the top of, so a total does not scroll out of the view that
   * exists to show it. It pins the `tfoot` and not the footer bar, which is
   * outside the scroller and never leaves.
   */
  stickyFooter?: boolean | undefined;
  stickyHeader?: boolean | undefined;
  /**
   * What the sticky header stays inside. `page` releases the family's own
   * scroll container, so the table can no longer scroll sideways in its frame.
   */
  stickyTo?: TableStickyTo | undefined;
  striped?: boolean | undefined;
  value?: readonly string[] | undefined;
  variant?: TableVariant | undefined;
  /**
   * Whether the first and the last column keep the cell's inset on their outer
   * side. `flush` lines a `plain` or `ruled` table's text up with the heading
   * around it; a `framed` table ignores it. The theme's
   * `--slotted-table-edge-inset` is what `flush` leaves, nought unless it is set.
   */
  edges?: TableEdges | undefined;
}

/** The one action a consumer cannot express declaratively. */
export interface TableHandle {
  /** Brings one row into view by the shortest movement that does it. */
  scrollToRow: (value: string) => void;
  /** Whether the table is wider than the box that holds it. */
  overflowing: () => boolean;
  /** Measures again, after rows arrive or a column changes width. */
  refresh: () => void;
}

export interface TableContextValue {
  columns: number;
  /** `page` means the family owns no scroller, so nothing is measured. */
  stickyTo: TableStickyTo;
  expanded: readonly string[];
  id: string;
  isExpanded: (value: string) => boolean;
  isSelected: (value: string) => boolean;
  loading: boolean;
  requestSort: (column: string, source: unknown) => void;
  /** Every selectable row's value, in the order the body renders them. */
  rows: () => readonly string[];
  selectionMode: TableSelectionMode;
  sort: TableSortDescriptor | null;
  toggleExpanded: (value: string, source: unknown) => void;
  toggleSelected: (value: string, options: { range: boolean; source: unknown }) => void;
  toggleSelectAll: (source: unknown) => void;
  /** The family's words in the language in force, with this table's `messages` laid over them. */
  t: FamilyTranslator<TableMessages>;
  value: readonly string[];
}

export interface TableContentProps extends ComponentPropsWithRef<'table'> {
  handleRef?: RefObject<TableHandle | null> | undefined;
  /** The element that names the scrolling region, which is usually the caption. */
  scrollLabelledBy?: string | undefined;
  /**
   * Props for the scroller the family draws around the table. Its `aria-label`
   * wins over the catalog's name for the scrolling region.
   */
  scrollProps?: ComponentPropsWithRef<'div'> | undefined;
  /**
   * The total number of rows behind a paged or filtered table. Written as
   * `aria-rowcount` with `aria-rowindex` on every row, and only then: the
   * practice requires the pair exactly when the DOM is not the whole set.
   */
  totalRowCount?: number | undefined;
}

export interface TableRowContextValue {
  detailId: string;
  disabled: boolean;
  expanded: boolean;
  selected: boolean;
  value: string | undefined;
}

export interface TableRowProps extends ComponentPropsWithRef<'tr'> {
  /**
   * The row the page is showing elsewhere — the record open in a detail pane
   * beside the table. Written as `aria-current="true"` and painted with a
   * ground of its own; it is not the selection, which the checkbox owns.
   */
  current?: boolean | undefined;
  disabled?: boolean | undefined;
  /**
   * Paints the row as a thing the pointer can press. On by default once
   * `onAction` is given.
   */
  interactive?: boolean | undefined;
  /**
   * Called by a click anywhere in the row that does not land on a control of
   * its own — a link, a button, a field, a label. The row takes no tab stop:
   * the keyboard reaches the record through the first link or button in it.
   */
  onAction?: ((event: MouseEvent<HTMLTableRowElement>) => void) | undefined;
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
  /**
   * The row's position in the whole set, one-based. Written as
   * `aria-rowindex`, and only where the table states a `totalRowCount`: the
   * practice warns that setting it on some rows and not others has devastating
   * effects on assistive technology.
   */
  rowIndex?: number | undefined;
  /** The row's key, required wherever selection or expansion is on. */
  value?: string | undefined;
}

/** Every axis a cell answers, shared by the three cell parts. */
export interface TableCellAxes {
  align?: TableAlign | undefined;
  /**
   * Where this cell's content sits in a row as tall as its tallest cell. The
   * table states it once through `cellAlign`; this overrides it for the one
   * cell that wants the other answer.
   */
  blockAlign?: TableAlign | undefined;
  numeric?: boolean | undefined;
  sticky?: TableSticky | undefined;
  /**
   * Where a pinned column stops, as a CSS length. Nought unless stated: two
   * columns pinned to the same edge need the second to know how wide the first
   * is, and the family states that rather than measuring it — measuring would
   * mean reading the layout during render.
   */
  stickyOffset?: string | undefined;
  text?: TableText | undefined;
}

export interface TableCellProps extends Omit<ComponentPropsWithRef<'td'>, 'align'>, TableCellAxes {}

export interface TableRowHeaderProps
  extends Omit<ComponentPropsWithRef<'th'>, 'align'>, TableCellAxes {}

export interface TableColumnHeaderProps
  extends Omit<ComponentPropsWithRef<'th'>, 'align'>, TableCellAxes {
  /** The column's own key, which the sort descriptor names. */
  column?: string | undefined;
}

export interface TableSortProps extends ComponentPropsWithRef<'button'> {
  /** Overrides the column the header states, where a header holds two. */
  column?: string | undefined;
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export type TableColumnActionsProps = ComponentPropsWithRef<'span'>;

export interface TableSelectProps
  extends Omit<ComponentPropsWithRef<'td'>, 'align' | 'children'>, TableCellAxes {
  /** The row this checkbox chooses. Read from the row when it is not stated. */
  value?: string | undefined;
}

export interface TableSelectAllProps
  extends Omit<ComponentPropsWithRef<'th'>, 'align' | 'children'>, TableCellAxes {}

/** Children replace the chevron the expander draws by default. */
export interface TableExpanderProps extends ComponentPropsWithRef<'button'> {
  value?: string | undefined;
}

export interface TableDetailProps extends ComponentPropsWithRef<'tr'> {
  /** How many columns the detail spans. Defaults to the table's own count. */
  colSpan?: number | undefined;
  /** The row the detail belongs to. */
  value: string;
}

export interface TableGroupRowProps extends Omit<ComponentPropsWithRef<'tr'>, 'children'> {
  /** The group's name: a day, a period, a category. */
  children?: ReactNode | undefined;
  /** How many columns the band spans. Defaults to the table's own count. */
  colSpan?: number | undefined;
  /** What stands at the end of the band: the group's total or net. */
  end?: ReactNode | undefined;
  /** Holds the band under the header while its rows scroll past. */
  sticky?: boolean | undefined;
}

export interface TableEmptyProps extends ComponentPropsWithRef<'td'> {
  colSpan?: number | undefined;
}

export interface TableLoaderProps extends Omit<ComponentPropsWithRef<'tbody'>, 'children'> {
  /** How many skeleton rows a first load draws. */
  skeletonRows?: number | undefined;
  children?: ReactNode | undefined;
}

export type TableCaptionProps = ComponentPropsWithRef<'caption'>;
export type TableHeadProps = ComponentPropsWithRef<'thead'>;
export type TableBodyProps = ComponentPropsWithRef<'tbody'>;
export type TableSummaryProps = ComponentPropsWithRef<'tfoot'>;
export type TableFooterProps = ComponentPropsWithRef<'div'>;
