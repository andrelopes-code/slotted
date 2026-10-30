import { createFilter } from '@slotted/core/collection';
import {
  isPlainDate,
  isPlainDateTime,
  isPlainTime,
  parseISODate,
  parseISODateTime,
  parseISOTime,
  toISODate,
  toISOTime,
} from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime, TimeGranularity } from '@slotted/core/date';
import {
  defaultOperator as kindDefaultOperator,
  describeFilter,
  emptyFilter,
  isConditionActive,
  isFilterActive,
  normalizeFilter,
  operandCount,
  operatorsFor,
  serializeFilter,
  withCondition,
  withJoin,
} from '@slotted/core/filter';
import type {
  BooleanFilter,
  DateFilter,
  DateTimeFilter,
  FilterCondition,
  FilterDescriptor,
  FilterJoin,
  FilterKind,
  FilterOperator,
  NumberFilter,
  SetFilter,
  TextFilter,
  TimeFilter,
} from '@slotted/core/filter';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlDateRangePicker, SlDateRangePickerPresets } from '@slotted/angular/date-range-picker';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import {
  SlDateTimeRangePicker,
  SlDateTimeRangePickerPresets,
} from '@slotted/angular/datetime-range-picker';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import {
  SlPopover,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlTagsInput } from '@slotted/angular/tags-input';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlTimePicker } from '@slotted/angular/time-picker';
import { SlTimeRangePicker, SlTimeRangePickerPresets } from '@slotted/angular/time-range-picker';

import { SlTable } from './table';
import { SlTableColumnHeader } from './table-parts';

/** One value a column can be filtered to. */
export interface TableFilterOption {
  /** The value the consumer's query matches. It is what the state holds. */
  value: string;
  /** What the reader sees, when it is not the value itself. */
  label?: string;
  /**
   * How many records carry it. Optional and the consumer's own: how many rows a
   * value has is a fact about the query, not about the column.
   */
  count?: number;
}

export type TableFilterReason = 'pointer' | 'keyboard' | 'clear' | 'programmatic';

type Condition = FilterCondition<string, unknown>;

/** What the operand template is handed, once per condition. */
export interface TableFilterOperandContext {
  /** Applies the draft, which is what `Enter` in the family's own field does. */
  apply: () => void;
  condition: Condition;
  /** The name the family would have given each field. */
  label: (slot: 0 | 1) => string;
  /** Writes one operand back into the draft. */
  set: (slot: 0 | 1, value: unknown) => void;
  /**
   * Writes both operands of a range at once, for a control that holds both.
   * Two calls to `set` from one event would each read the draft the other did
   * not write.
   */
  setBoth: (value: unknown, end: unknown) => void;
  /** Which operands this operator takes: none, the first, or both. */
  slots: readonly (0 | 1)[];
}

/**
 * Everything the five filters share: the draft, the conditions, the join, the
 * announcements and the request that carries a reason. What each of them adds
 * is its kind, its own typed `value`, and the control inside `filter-operand`.
 *
 * The panel edits a **draft**. Nothing reaches the consumer until Apply, and
 * Escape or a press outside restores the descriptor the panel opened with. The
 * family applies nothing: it reports the descriptor, and
 * `createFilterPredicate` in `@slotted/core/filter` is what a consumer applies
 * to its own rows.
 */
@Directive()
export abstract class SlTableFilterBase {
  /** Which vocabulary this column's conditions are written in. */
  abstract readonly kind: FilterKind;
  /** The committed descriptor, read from the component's own typed model. */
  protected abstract readValue(): FilterDescriptor | null;
  /** Writes it back into that model. */
  protected abstract writeValue(next: FilterDescriptor | null): void;

  /**
   * The operators this column offers, narrowing the kind's own list. Declared
   * once here rather than per component: the narrow operator type is the one
   * thing a shared base cannot keep, and the value — which is what a consumer
   * reads — stays exact on each of the five.
   */
  readonly operators = input<readonly string[] | undefined>(undefined);
  /** Which one the panel opens on. The kind's own default unless stated. */
  readonly defaultOperator = input<string | undefined>(undefined);
  /**
   * How many conditions the panel offers, which is AG Grid's
   * `maxNumConditions`. The second appears once the first is complete.
   */
  readonly conditions = input(2, { transform: numberAttribute });
  /**
   * The column's name in the trigger's own name. Read from the column header
   * around it when it is not stated.
   */
  readonly columnLabel = input<string | undefined>(undefined);
  /**
   * The trigger's whole accessible name, replacing the one the catalog writes.
   * It is the trigger's `aria-label`, which no other input reaches.
   */
  readonly label = input<string | undefined>(undefined);
  /**
   * Whether the panel is drawn at the end of the document. On by default, and
   * that is not a preference: a framed table clips its own overflow, so an
   * unportalled panel is cut off at the frame's edge — read on the Angular
   * reference page, where the join and both actions were simply not there. The
   * React binding takes `popover`'s own default, which is the same answer.
   */
  readonly portal = input(true, { transform: booleanAttribute });

  /** The request behind every committed change, with the reason it carries. */
  readonly valueChangeRequest = output<ChangeRequest<FilterDescriptor | null>>();

  readonly table = inject(SlTable);
  private readonly header = inject(SlTableColumnHeader, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly open = model(false);
  readonly draft = signal<FilterDescriptor>(emptyFilter('text'));

  /** The table's words, which the panel speaks in. */
  readonly t = this.table.t;

  protected readonly start = computed(
    () => this.defaultOperator() ?? (kindDefaultOperator(this.kind) as string),
  );

  readonly offered = computed(
    () => this.operators() ?? (operatorsFor(this.kind) as readonly string[]),
  );

  private readonly format = {
    join: (join: FilterJoin) => this.t(`filterJoins.${join}`),
    operator: (operator: FilterOperator) => this.t(`filterOperators.${operator}`),
  };

  operatorName(operator: string) {
    return this.format.operator(operator as FilterOperator);
  }

  /** Every operator as a labelled option, so the closed chooser names its own. */
  readonly operatorItems = computed(() =>
    this.offered().map((operator) => ({ label: this.operatorName(operator), value: operator })),
  );

  joinName(join: FilterJoin) {
    return this.format.join(join);
  }

  readonly filtered = computed(() => isFilterActive(this.readValue()));

  readonly name = computed(() => {
    const stated = this.label();
    if (stated !== undefined) return stated;
    const column = this.columnName();
    const committed = this.readValue();
    return isFilterActive(committed)
      ? this.t('filterApplied', { column, filter: describeFilter(committed, this.format) })
      : this.t('filterColumn', { column }).trim();
  });

  /** One condition, or the two the panel can hold. */
  readonly rows = computed<readonly Condition[]>(() => {
    const draft = this.draft();
    const first = draft.conditions[0] ?? { operator: this.start() };
    /* AG Grid's own reveal: the second appears once the first is complete. A
       button would be one more word to translate before the common case, and an
       empty second row is noise in every panel that never needs it. */
    if (this.allowed() < 2 || !isConditionActive(this.kind, first)) return [first];
    return [first, draft.conditions[1] ?? { operator: this.start() }];
  });

  protected allowed() {
    return this.conditions();
  }

  readonly hasSecond = computed(() => this.rows().length === 2);

  /**
   * Whether the operand template draws one control for both ends of a range,
   * written as `data-range` on `filter-operand` so the two-column operand grid
   * collapses to one. The date, time and date-time filters say yes.
   */
  protected rangeOperand(): boolean {
    return false;
  }

  /** Which of a kind's operands is drawn, written as `data-operand`. */
  operandName(): string | null {
    return null;
  }

  /** `data-range`, for the condition whose operator takes two operands. */
  rangeMark(condition: Condition): '' | null {
    return this.rangeOperand() && this.slotsOf(condition).length === 2 ? '' : null;
  }

  slotsOf(condition: Condition): readonly (0 | 1)[] {
    const operands = operandCount(condition.operator as FilterOperator);
    return operands === 0 ? [] : operands === 1 ? [0] : [0, 1];
  }

  operandLabel(condition: Condition, slot: 0 | 1) {
    if (operandCount(condition.operator as FilterOperator) < 2) return this.t('filterValue');
    return slot === 0 ? this.t('filterFrom') : this.t('filterTo');
  }

  context(index: number): TableFilterOperandContext {
    const condition = this.rows()[index] ?? { operator: this.start() };
    return {
      apply: () => this.applyDraft(null, 'keyboard'),
      condition,
      label: (slot) => this.operandLabel(condition, slot),
      set: (slot, value) => this.setOperand(index, slot, value),
      setBoth: (value, end) => this.setOperands(index, value, end),
      slots: this.slotsOf(condition),
    };
  }

  announce(message: string) {
    getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(message);
  }

  /**
   * Opens and closes, and resets the draft either way: the draft starts from
   * what is committed every time the panel opens, and closing puts it back —
   * closing is cancelling, and Apply closes the panel itself after committing.
   */
  toggle(next: boolean) {
    this.open.set(next);
    this.draft.set(this.readValue() ?? this.blank());
  }

  protected blank(): FilterDescriptor {
    return emptyFilter(this.kind, this.start() as never) as FilterDescriptor;
  }

  setOperator(index: number, operator: string) {
    const condition = this.rows()[index] ?? { operator: this.start() };
    const before = operandCount(condition.operator as FilterOperator);
    const after = operandCount(operator as FilterOperator);

    /* An operand the new operator still takes survives the change: a reader who
       typed a value and then chose a different comparison meant to keep it. */
    const next: Condition = {
      operator,
      ...(after >= 1 && before >= 1 ? { value: condition.value } : {}),
      ...(after === 2 && before === 2 ? { end: condition.end } : {}),
    };

    this.draft.set(withCondition(this.draft(), index, next as never));
    /* The panel grows a field or loses two. Announced, because a form that
       changes shape under a reader who cannot see it says nothing otherwise. */
    if (after !== before) {
      this.announce(
        this.t('filterOperands', { operator: this.operatorName(operator), count: after }),
      );
    }
  }

  setOperand(index: number, slot: 0 | 1, operand: unknown) {
    const condition = this.rows()[index] ?? { operator: this.start() };
    const wasActive = isConditionActive(this.kind, condition);
    const next: Condition =
      slot === 0 ? { ...condition, value: operand } : { ...condition, end: operand };

    this.draft.set(withCondition(this.draft(), index, next as never));
    if (index === 0 && this.allowed() >= 2 && !wasActive && isConditionActive(this.kind, next)) {
      this.announce(this.t('filterConditionAdded'));
    }
  }

  setOperands(index: number, value: unknown, end: unknown) {
    const condition = this.rows()[index] ?? { operator: this.start() };
    const wasActive = isConditionActive(this.kind, condition);
    const next: Condition = { ...condition, value, end };

    this.draft.set(withCondition(this.draft(), index, next as never));
    if (index === 0 && this.allowed() >= 2 && !wasActive && isConditionActive(this.kind, next)) {
      this.announce(this.t('filterConditionAdded'));
    }
  }

  setJoin(join: string) {
    this.draft.set(withJoin(this.draft(), join as FilterJoin));
  }

  /**
   * Named for what it does rather than `apply`, which reads as
   * `Function.prototype.apply` to a linter and to the next reader after it.
   */
  applyDraft(source: unknown, reason: TableFilterReason = 'pointer') {
    const next = normalizeFilter(this.draft());
    this.request(next, reason, source);
    const column = this.columnName();
    this.announce(
      next
        ? this.t('filterApplied', { column, filter: describeFilter(next, this.format) })
        : this.t('filterCleared', { column }),
    );
    this.open.set(false);
  }

  clear(source: unknown) {
    this.draft.set(this.blank());
    this.announce(this.t('filterCleared', { column: this.columnName() }));
    this.request(null, 'clear', source);
    this.open.set(false);
  }

  readonly canClear = computed(() => isFilterActive(this.draft()));

  private columnName() {
    return this.columnLabel() ?? this.header?.column() ?? '';
  }

  private request(next: FilterDescriptor | null, reason: TableFilterReason, source: unknown) {
    const state = createControllable<FilterDescriptor | null>({
      initial: this.readValue(),
      /* Two descriptors are the same filter when they serialise the same. */
      equals: (a, b) => serializeFilter(a) === serializeFilter(b),
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.writeValue(next);
  }
}

/**
 * The panel every kind shares, drawn around an operand its owner projects.
 *
 * The operand is an `ng-template` rather than projected content, because it is
 * rendered once per condition: content would be built once and then belong to
 * whichever condition asked for it first.
 */
@Component({
  selector: 'span[slTableFilterShell]',
  standalone: true,
  exportAs: 'slTableFilterShell',
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlPopover,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
    SlRadio,
    SlRadioGroup,
    SlSelect,
    SlSelectItem,
  ],
  template: `<ng-container
    slPopover
    [portal]="owner().portal()"
    [open]="owner().open()"
    (openChange)="owner().toggle($event)"
  >
    <button
      slPopoverTrigger
      type="button"
      data-part="filter"
      data-part-filter=""
      [attr.data-filtered]="owner().filtered() ? '' : null"
      [attr.aria-label]="owner().name()"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
      </svg>
    </button>

    <ng-template slPopoverLayer>
      <div slPopoverContent [attr.aria-label]="owner().name()">
        <!-- The parts are on this family's own element rather than on the
             popover's: slPopoverContent names its own identity, and a second
             data-ui on the same element is one of them lost — the surface, the
             radius and the shadow all came off the panel. -->
        <div
          data-ui="table"
          data-ui-table=""
          data-part="filter-panel"
          data-part-filter-panel=""
          [attr.data-kind]="owner().kind"
        >
          @for (row of owner().rows(); track $index) {
            @if ($index === 1) {
              <div data-part="filter-join" data-part-filter-join="">
                <span data-label>{{ owner().t('filterJoin') }}</span>
                <div
                  slRadioGroup
                  orientation="horizontal"
                  size="sm"
                  [attr.aria-label]="owner().t('filterJoin')"
                  [value]="owner().draft().join"
                  (valueChange)="owner().setJoin($event.value ?? 'and')"
                >
                  <div slRadio value="and">{{ owner().joinName('and') }}</div>
                  <div slRadio value="or">{{ owner().joinName('or') }}</div>
                </div>
              </div>
            }

            <div
              data-part="filter-condition"
              data-part-filter-condition=""
              [attr.data-operands]="owner().slotsOf(row).length"
            >
              <div data-part="filter-operator" data-part-filter-operator="">
                <!-- items names every operator for the closed control: without
                     it the trigger falls back to the value itself and a reader
                     sees the raw between the engine speaks. -->
                <sl-select
                  size="sm"
                  [fullWidth]="true"
                  [items]="owner().operatorItems()"
                  [attr.aria-label]="owner().t('filterOperator')"
                  [value]="row.operator"
                  (valueChange)="owner().setOperator($index, $any($event))"
                >
                  @for (operator of owner().offered(); track operator) {
                    <sl-select-item [value]="operator">
                      {{ owner().operatorName(operator) }}
                    </sl-select-item>
                  }
                </sl-select>
              </div>

              @if (owner().slotsOf(row).length > 0) {
                <div
                  data-part="filter-operand"
                  data-part-filter-operand=""
                  [attr.data-kind]="owner().kind"
                  [attr.data-operand]="owner().operandName()"
                  [attr.data-range]="owner().rangeMark(row)"
                >
                  <ng-container
                    [ngTemplateOutlet]="operand()"
                    [ngTemplateOutletContext]="{ $implicit: owner().context($index) }"
                  />
                </div>
              }
            </div>
          }

          <div data-part="filter-actions" data-part-filter-actions="">
            <button
              slButton
              type="button"
              size="sm"
              tone="secondary"
              variant="ghost"
              [disabled]="!owner().canClear()"
              (click)="owner().clear($event)"
            >
              {{ owner().t('filterClear') }}
            </button>
            <button slButton type="button" size="sm" (click)="owner().applyDraft($event)">
              {{ owner().t('filterApply') }}
            </button>
          </div>
        </div>
      </div>
    </ng-template>
  </ng-container>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlTableFilterShell {
  /** The filter this shell draws for. */
  readonly owner = input.required<SlTableFilterBase>({ alias: 'slTableFilterShell' });
  /** The control inside `filter-operand`, rendered once per condition. */
  readonly operand = input.required<TemplateRef<{ $implicit: TableFilterOperandContext }>>();
}

/** A column of words. Its comparisons are the collator's, never a fold. */
@Component({
  selector: 'span[slTableTextFilter]',
  exportAs: 'slTableTextFilter',
  imports: [SlTableFilterShell, SlTextField, SlTextFieldInput],
  template: `<span [slTableFilterShell]="this" [operand]="operand"></span>
    <ng-template #operand let-context>
      @for (slot of context.slots; track slot) {
        <div slTextField size="sm">
          <input
            slTextFieldInput
            [value]="$any(slot === 0 ? context.condition.value : context.condition.end) ?? ''"
            [attr.aria-label]="context.label(slot)"
            [attr.placeholder]="context.label(slot)"
            (input)="context.set(slot, $any($event.target).value)"
            (keydown.enter)="context.apply()"
          />
        </div>
      }
    </ng-template>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlTableTextFilter extends SlTableFilterBase {
  override readonly kind = 'text' as const;
  /** The filter the column holds. Two-way, so a template binds it. */
  readonly value = model<TextFilter | null>(null);

  protected override readValue() {
    return this.value();
  }

  protected override writeValue(next: FilterDescriptor | null) {
    this.value.set(next as TextFilter | null);
  }
}

/** A column of quantities. The operand parses in the reader's own locale. */
@Component({
  selector: 'span[slTableNumberFilter]',
  exportAs: 'slTableNumberFilter',
  imports: [SlTableFilterShell, SlNumberField, SlNumberFieldInput],
  template: `<span [slTableFilterShell]="this" [operand]="operand"></span>
    <ng-template #operand let-context>
      @for (slot of context.slots; track slot) {
        <div slNumberField size="sm">
          <input
            slNumberFieldInput
            [value]="$any(slot === 0 ? context.condition.value : context.condition.end) ?? null"
            [locale]="locale()"
            [attr.aria-label]="context.label(slot)"
            [attr.placeholder]="context.label(slot)"
            (valueChange)="context.set(slot, $event.value)"
            (keydown.enter)="context.apply()"
          />
        </div>
      }
    </ng-template>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlTableNumberFilter extends SlTableFilterBase {
  override readonly kind = 'number' as const;
  readonly value = model<NumberFilter | null>(null);
  /** BCP 47, for the operand's own parsing. Defaults to the runtime's. */
  readonly locale = input<string | undefined>(undefined);

  protected override readValue() {
    return this.value();
  }

  protected override writeValue(next: FilterDescriptor | null) {
    this.value.set(next as NumberFilter | null);
  }
}

/**
 * A column of days. The operand is the whole date picker — the segmented field
 * and the calendar behind it — rather than the field alone: every surveyed
 * implementation that filters a date column offers a grid to point at, and a
 * reader who has to type a date they could have pointed at is the one thing a
 * date filter exists to spare them. The calendar opens a layer inside the
 * panel's layer, which `dismissable-layer` already stacks for the operator
 * chooser beside it.
 *
 * `between` is one `date-range-picker` rather than two pickers: it says the
 * run's length while it is drawn, takes the ends in either order and carries
 * the application's own presets. The descriptor holds the ISO days the
 * pickers produce, never a `Date`, and is the same object either way.
 */
@Component({
  selector: 'span[slTableDateFilter]',
  exportAs: 'slTableDateFilter',
  imports: [
    NgTemplateOutlet,
    SlTableFilterShell,
    SlDatePicker,
    SlDateRangePicker,
    SlDateRangePickerPresets,
  ],
  template: `<span [slTableFilterShell]="this" [operand]="operand"></span>
    <ng-template #operand let-context>
      @if (context.slots.length === 2) {
        <div
          slDateRangePicker
          size="sm"
          [locale]="locale()"
          [messages]="{ start: context.label(0), end: context.label(1) }"
          [value]="range(context.condition)"
          (valueChange)="context.setBoth(iso($event.value?.start), iso($event.value?.end))"
          (keydown.enter)="context.apply()"
        >
          @if (presets(); as presetsTemplate) {
            <div slDateRangePickerPresets>
              <ng-container [ngTemplateOutlet]="presetsTemplate" />
            </div>
          }
        </div>
      } @else {
        <div
          slDatePicker
          size="sm"
          [locale]="locale()"
          [value]="day(context.condition.value)"
          [attr.aria-label]="context.label(0)"
          (valueChange)="context.set(0, iso($event.value))"
          (keydown.enter)="context.apply()"
        ></div>
      }
    </ng-template>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlTableDateFilter extends SlTableFilterBase {
  override readonly kind = 'date' as const;
  readonly value = model<DateFilter | null>(null);
  /** BCP 47. Decides the operand's field order and separators. */
  readonly locale = input<string | undefined>(undefined);
  /**
   * The application's own ranges — this week, this month — as
   * `slDateRangePickerPreset` buttons in a template, offered inside the range
   * picker `between` draws. The descriptor still receives two ISO days.
   */
  readonly presets = input<TemplateRef<unknown> | undefined>(undefined);

  protected override rangeOperand() {
    return true;
  }

  /** The descriptor's ISO day as the field's own value, and back. */
  day(value: unknown): PlainDate | null {
    return value ? parseISODate(String(value)) : null;
  }

  iso(value: unknown) {
    return isPlainDate(value) ? toISODate(value) : null;
  }

  range(condition: Condition): { start: PlainDate | null; end: PlainDate | null } {
    return { start: this.day(condition.value), end: this.day(condition.end) };
  }

  protected override readValue() {
    return this.value();
  }

  protected override writeValue(next: FilterDescriptor | null) {
    this.value.set(next as DateFilter | null);
  }
}

/** `HH` and `HH:MM` are prefixes the engine accepts and the field cannot read. */
function timeOf(text: unknown): PlainTime | null {
  if (!text) return null;
  const written = String(text);
  return parseISOTime(/^\d{2}$/.test(written) ? `${written}:00` : written);
}

/** A day, or a day and an hour, padded to the `T…:MM` the field reads. */
function dateTimeOf(text: unknown): PlainDateTime | null {
  if (!text) return null;
  const written = String(text);
  if (/^\d{4}-\d{2}-\d{2}$/.test(written)) return parseISODateTime(`${written}T00:00`);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(written)) return parseISODateTime(`${written}:00`);
  return parseISODateTime(written);
}

/**
 * A column of times of day. The operand is `time-picker` — the segmented field
 * and the list behind it — at the column's own granularity, which decides the
 * precision the descriptor is written at and the engine compares at: a picker
 * writing minutes produces `09:14`, and `is 09:14` then matches every second
 * of that minute.
 *
 * `between` is one `time-range-picker` rather than two pickers: it says the
 * run's length while it is drawn, its end list refuses the times before the
 * start, and it carries the application's presets. The descriptor is
 * unchanged. A pair whose start is later than its end is the overnight window
 * to the engine and `order` to the picker; the pair reaches the descriptor
 * either way, and the picker's `wrap`, pending in `docs/process/build-order.md`, is
 * what lifts the mark. No `(keydown.enter)` on the range picker: its frame
 * is a button, and `Enter` on it opens the picker.
 */
@Component({
  selector: 'span[slTableTimeFilter]',
  exportAs: 'slTableTimeFilter',
  imports: [
    NgTemplateOutlet,
    SlTableFilterShell,
    SlTimePicker,
    SlTimeRangePicker,
    SlTimeRangePickerPresets,
  ],
  template: `<span [slTableFilterShell]="this" [operand]="operand"></span>
    <ng-template #operand let-context>
      @if (context.slots.length === 2) {
        <div
          slTimeRangePicker
          size="sm"
          [locale]="locale()"
          [hourCycle]="hourCycle()"
          [granularity]="granularity()"
          [step]="step()"
          [options]="options()"
          [min]="timeOf(min())"
          [max]="timeOf(max())"
          [messages]="{ start: context.label(0), end: context.label(1) }"
          [value]="range(context.condition)"
          (valueChange)="context.setBoth(iso($event.value?.start), iso($event.value?.end))"
        >
          @if (presets(); as presetsTemplate) {
            <div slTimeRangePickerPresets>
              <ng-container [ngTemplateOutlet]="presetsTemplate" />
            </div>
          }
        </div>
      } @else {
        <div
          slTimePicker
          size="sm"
          [locale]="locale()"
          [hourCycle]="hourCycle()"
          [granularity]="granularity()"
          [step]="step()"
          [options]="options()"
          [min]="timeOf(min())"
          [max]="timeOf(max())"
          [value]="timeOf(context.condition.value)"
          [attr.aria-label]="context.label(0)"
          (valueChange)="context.set(0, iso($event.value))"
          (keydown.enter)="context.apply()"
        ></div>
      }
    </ng-template>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlTableTimeFilter extends SlTableFilterBase {
  override readonly kind = 'time' as const;
  readonly value = model<TimeFilter | null>(null);
  /** BCP 47. Decides the operand's hour cycle and separators. */
  readonly locale = input<string | undefined>(undefined);
  /** Twelve or twenty-four hours, overriding what the locale says. */
  readonly hourCycle = input<12 | 24 | undefined>(undefined);
  /** The last unit the operand writes. Minute unless stated. */
  readonly granularity = input<TimeGranularity | undefined>(undefined);
  /** The list's step, in seconds. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  /** The list's own entries, replacing the step. */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);
  /** The earliest time the operand accepts, as ISO time text. */
  readonly min = input<string | undefined>(undefined);
  /** The latest, as ISO time text. */
  readonly max = input<string | undefined>(undefined);
  /**
   * The application's own windows — the morning shift, the night shift — as
   * `slTimeRangePickerPreset` buttons in a template, offered inside the range
   * picker `between` draws. The descriptor still receives two ISO times.
   */
  readonly presets = input<TemplateRef<unknown> | undefined>(undefined);

  protected override rangeOperand() {
    return true;
  }

  timeOf(value: unknown): PlainTime | undefined {
    return timeOf(value) ?? undefined;
  }

  iso(value: unknown) {
    return isPlainTime(value) ? toISOTime(value, this.granularity() ?? 'minute') : null;
  }

  range(condition: Condition): { start: PlainTime | null; end: PlainTime | null } {
    return { start: timeOf(condition.value), end: timeOf(condition.end) };
  }

  protected override readValue() {
    return this.value();
  }

  protected override writeValue(next: FilterDescriptor | null) {
    this.value.set(next as TimeFilter | null);
  }
}

/**
 * A column of dates with times. The operand is `datetime-picker`, the
 * seven-segment field and the two surfaces behind it. A value with one half
 * missing reaches the draft as no operand at all, so the condition stays
 * inactive until both halves exist — the engine's one rule for a missing
 * operand, and the reason Apply reports nothing for a date without a time.
 *
 * `between` is one `datetime-range-picker`: the run's length said while it is
 * drawn, the dates ordered with each time kept on its end, and the
 * application's presets. No `(keydown.enter)` on it: the frame is a button,
 * and `Enter` on it opens the picker.
 */
@Component({
  selector: 'span[slTableDateTimeFilter]',
  exportAs: 'slTableDateTimeFilter',
  imports: [
    NgTemplateOutlet,
    SlTableFilterShell,
    SlDateTimePicker,
    SlDateTimeRangePicker,
    SlDateTimeRangePickerPresets,
  ],
  template: `<span [slTableFilterShell]="this" [operand]="operand"></span>
    <ng-template #operand let-context>
      @if (context.slots.length === 2) {
        <div
          slDateTimeRangePicker
          size="sm"
          [locale]="locale()"
          [timeZone]="timeZone()"
          [hourCycle]="hourCycle()"
          [granularity]="granularity()"
          [step]="step()"
          [min]="dateTimeOf(min())"
          [max]="dateTimeOf(max())"
          [messages]="{ start: context.label(0), end: context.label(1) }"
          [value]="range(context.condition)"
          (valueChange)="context.setBoth(iso($event.value?.start), iso($event.value?.end))"
        >
          @if (presets(); as presetsTemplate) {
            <div slDateTimeRangePickerPresets>
              <ng-container [ngTemplateOutlet]="presetsTemplate" />
            </div>
          }
        </div>
      } @else {
        <div
          slDateTimePicker
          size="sm"
          [locale]="locale()"
          [timeZone]="timeZone()"
          [hourCycle]="hourCycle()"
          [granularity]="granularity()"
          [step]="step()"
          [min]="dateTimeOf(min())"
          [max]="dateTimeOf(max())"
          [value]="dateTimeOf(context.condition.value)"
          [attr.aria-label]="context.label(0)"
          (valueChange)="context.set(0, iso($event.value))"
          (keydown.enter)="context.apply()"
        ></div>
      }
    </ng-template>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlTableDateTimeFilter extends SlTableFilterBase {
  override readonly kind = 'datetime' as const;
  readonly value = model<DateTimeFilter | null>(null);
  /** BCP 47. Decides the operand's field order and separators. */
  readonly locale = input<string | undefined>(undefined);
  /** The zone "now" is read in. Defaults to the runtime's. */
  readonly timeZone = input<string | undefined>(undefined);
  /** Twelve or twenty-four hours, overriding what the locale says. */
  readonly hourCycle = input<12 | 24 | undefined>(undefined);
  /** The last unit the operand writes. Minute unless stated. */
  readonly granularity = input<TimeGranularity | undefined>(undefined);
  /** The list's step, in seconds. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  /** The earliest date-time the operand accepts, as ISO date-time text. */
  readonly min = input<string | undefined>(undefined);
  /** The latest, as ISO date-time text. */
  readonly max = input<string | undefined>(undefined);
  /**
   * The application's own windows — the last 24 hours, this week — as
   * `slDateTimeRangePickerPreset` buttons in a template, offered inside the
   * range picker `between` draws. The descriptor still receives two ISO
   * date-times.
   */
  readonly presets = input<TemplateRef<unknown> | undefined>(undefined);

  protected override rangeOperand() {
    return true;
  }

  dateTimeOf(value: unknown): PlainDateTime | undefined {
    return dateTimeOf(value) ?? undefined;
  }

  range(condition: Condition): { start: PlainDateTime | null; end: PlainDateTime | null } {
    return { start: dateTimeOf(condition.value), end: dateTimeOf(condition.end) };
  }

  iso(value: unknown) {
    return isPlainDateTime(value)
      ? `${toISODate(value.date)}T${toISOTime(value.time, this.granularity() ?? 'minute')}`
      : null;
  }

  protected override readValue() {
    return this.value();
  }

  protected override writeValue(next: FilterDescriptor | null) {
    this.value.set(next as DateTimeFilter | null);
  }
}

/**
 * A column of yes and no. Three answers rather than two: the third is not being
 * filtered at all, which is what Clear leaves and what an empty draft is.
 */
@Component({
  selector: 'span[slTableBooleanFilter]',
  exportAs: 'slTableBooleanFilter',
  imports: [SlTableFilterShell, SlRadio, SlRadioGroup],
  template: `<span [slTableFilterShell]="this" [operand]="operand"></span>
    <ng-template #operand let-context>
      <div
        slRadioGroup
        orientation="horizontal"
        size="sm"
        [attr.aria-label]="context.label(0)"
        [value]="answer(context.condition.value)"
        (valueChange)="context.set(0, $event.value === 'true')"
      >
        <div slRadio value="true">{{ t('true') }}</div>
        <div slRadio value="false">{{ t('false') }}</div>
      </div>
    </ng-template>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlTableBooleanFilter extends SlTableFilterBase {
  override readonly kind = 'boolean' as const;
  readonly value = model<BooleanFilter | null>(null);

  answer(value: unknown) {
    return value === undefined || value === null ? '' : String(value);
  }

  protected override readValue() {
    return this.value();
  }

  protected override writeValue(next: FilterDescriptor | null) {
    this.value.set(next as BooleanFilter | null);
  }
}

/**
 * A column filtered to values the consumer named: the list, its search and the
 * checkbox that covers what the search left.
 *
 * One condition, and the design says why: `anyOf A and anyOf B` is
 * `anyOf (A ∩ B)`, so every pair of set conditions collapses to a single list.
 */
@Component({
  selector: 'span[slTableSetFilter]',
  exportAs: 'slTableSetFilter',
  imports: [SlTableFilterShell, SlCheckbox, SlTagsInput, SlTextField, SlTextFieldInput],
  template: `<span [slTableFilterShell]="this" [operand]="operandTemplate"></span>
    <!-- The template is not named operand: that is the input that says which
         of the two operands is drawn, and a template variable of the same name
         would shadow it in every binding below. -->
    <ng-template #operandTemplate let-context>
      @if (operand() === 'tags') {
        <!-- The chosen values as chips, for a list too long to tick. With
             options, a typed value outside them is refused and announced by
             tags-input's own validation, and the options are a datalist:
             native completion in every engine, with no second listbox inside
             the panel. Enter with pending text commits a chip, which is
             tags-input's key; Enter on an empty field applies, which is the
             panel's. -->
        <sl-tags-input
          size="sm"
          [fullWidth]="true"
          [attr.aria-label]="context.label(0)"
          [formatLabel]="optionLabel"
          [list]="constrained() ? listId : undefined"
          [validateValue]="constrained() ? known : undefined"
          [invalidValues]="constrained() ? 'refuse' : undefined"
          [value]="chosen(context)"
          (valueChange)="context.set(0, $event)"
          (keydown.enter)="applyOnEmpty($event, context)"
        ></sl-tags-input>
        @if (constrained()) {
          <datalist [id]="listId">
            @for (option of options(); track option.value) {
              <option [value]="option.value">{{ option.label ?? option.value }}</option>
            }
          </datalist>
        }
      } @else {
        @if (searching()) {
          <div data-part="filter-search" data-part-filter-search="">
            <div slTextField size="sm" clearable>
              <input
                slTextFieldInput
                [value]="query()"
                [attr.aria-label]="t('filterSearch')"
                [attr.placeholder]="t('filterSearch')"
                (input)="search($event)"
              />
            </div>
          </div>
        }

        @if (shown().length === 0) {
          <p data-part="filter-empty" data-part-filter-empty="">{{ t('filterEmpty') }}</p>
        } @else {
          <div data-part="filter-list" data-part-filter-list="">
            <div data-part="filter-option" data-part-filter-option="" data-covering>
              <span
                slCheckbox
                [checked]="allCovered(context)"
                [indeterminate]="someCovered(context)"
                (checkedChange)="coverAll(context, !allCovered(context))"
              >
                {{ t('filterSelectAll') }}
              </span>
              <span data-count>{{ shown().length }}</span>
            </div>

            @for (option of shown(); track option.value) {
              <div data-part="filter-option" data-part-filter-option="">
                <span
                  slCheckbox
                  [checked]="chosen(context).includes(option.value)"
                  (checkedChange)="hold(context, option.value, $event.value)"
                >
                  {{ option.label ?? option.value }}
                </span>
                @if (option.count !== undefined) {
                  <span data-count>{{ option.count }}</span>
                }
              </div>
            }
          </div>
        }
      }
    </ng-template>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlTableSetFilter extends SlTableFilterBase {
  override readonly kind = 'set' as const;
  readonly value = model<SetFilter | null>(null);
  /**
   * How the values are chosen. `list` is the search, the covering checkbox and
   * the values; `tags` is `tags-input`, for a list too long to tick — the
   * chosen values are chips, and `options` become a datalist of suggestions
   * and the set a typed value must belong to. The descriptor is the same list
   * either way.
   */
  readonly operand = input<'list' | 'tags'>('list');
  /**
   * The values this column can be filtered to, and optionally their counts.
   * Optional with `tags`, where a column may hold more values than a page
   * knows; without it any typed value is admitted.
   */
  readonly options = input<readonly TableFilterOption[]>([]);
  /**
   * Whether the panel carries a search. Unstated, it appears once there are
   * `searchThreshold` values.
   */
  readonly searchable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** How many values bring the search with them. Eight unless stated. */
  readonly searchThreshold = input(8, { transform: numberAttribute });

  readonly query = signal('');
  readonly listId = `sl-table-filter-options-${Math.random().toString(36).slice(2, 8)}`;

  override operandName() {
    return this.operand();
  }

  /** Whether a typed value has to be one of the options. */
  readonly constrained = computed(() => this.operand() === 'tags' && this.options().length > 0);

  private readonly byValue = computed(
    () => new Map(this.options().map((option) => [option.value, option])),
  );

  /** The chip's text for a value, and the judgement on a typed one. */
  readonly optionLabel = (value: string) => this.byValue().get(value)?.label ?? value;
  readonly known = (text: string) => this.byValue().has(text);

  applyOnEmpty(event: Event, context: TableFilterOperandContext) {
    const input = event.target as HTMLInputElement | null;
    if (!event.defaultPrevented && input?.value === '') context.apply();
  }

  /**
   * The collator `combobox` filters its own options with, rather than a fold
   * that strips combining marks: `normalize('NFD')` is an English answer
   * wearing a Unicode one — it turns `ø` into `ø` and leaves `ß` alone.
   */
  private readonly compare = createFilter({ sensitivity: 'base' });

  /** Two set conditions collapse to one list, so the panel offers one. */
  protected override allowed() {
    return 1;
  }

  /** What the search left. The covering checkbox answers for exactly this. */
  readonly shown = computed(() => {
    const query = this.query();
    const options = this.options();
    if (query === '') return options;
    return options.filter((option) => this.compare.contains(option.label ?? option.value, query));
  });

  readonly searching = computed(
    () => this.searchable() ?? this.options().length >= this.searchThreshold(),
  );

  chosen(context: TableFilterOperandContext): readonly string[] {
    return (context.condition.value as readonly string[] | null) ?? [];
  }

  private covered(context: TableFilterOperandContext) {
    const chosen = this.chosen(context);
    return this.shown().filter((option) => chosen.includes(option.value)).length;
  }

  allCovered(context: TableFilterOperandContext) {
    const covered = this.covered(context);
    return covered > 0 && covered === this.shown().length;
  }

  someCovered(context: TableFilterOperandContext) {
    const covered = this.covered(context);
    return covered > 0 && covered < this.shown().length;
  }

  search(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
    /* A list that shortens under a reader who cannot see it says nothing. */
    this.announce(this.t('filterMatches', { count: this.shown().length }));
  }

  hold(context: TableFilterOperandContext, value: string, next: boolean) {
    const chosen = this.chosen(context);
    context.set(0, next ? [...chosen, value] : chosen.filter((held) => held !== value));
  }

  coverAll(context: TableFilterOperandContext, next: boolean) {
    const visible = this.shown().map((option) => option.value);
    const chosen = this.chosen(context);
    context.set(
      0,
      next
        ? [...new Set([...chosen, ...visible])]
        : chosen.filter((held) => !visible.includes(held)),
    );
  }

  protected override readValue() {
    return this.value();
  }

  protected override writeValue(next: FilterDescriptor | null) {
    this.value.set(next as SetFilter | null);
  }
}

export type {
  BooleanOperator,
  DateOperator,
  DateTimeOperator,
  NumberOperator,
  SetOperator,
  TextOperator,
  TimeOperator,
} from '@slotted/core/filter';
