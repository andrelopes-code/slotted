import {
  isPlainDate,
  isPlainDateTime,
  isPlainTime,
  parseISODate,
  parseISODateTime,
  parseISOTime,
  toISODate,
  toISODateTime,
  toISOTime,
} from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import {
  defaultOperator,
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
import type { DataGridMessages, FamilyTranslator } from '@slotted/core/i18n';
import type {
  FilterCondition,
  FilterDescriptor,
  FilterJoin,
  FilterKind,
  FilterOperator,
} from '@slotted/core/filter';
import type { GridColumn, ResolvedGridColumn } from '@slotted/core/grid';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { TemplateRef } from '@angular/core';

import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlDateField } from '@slotted/angular/date-field';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlDateTimeField } from '@slotted/angular/datetime-field';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlDateTimeRangePicker } from '@slotted/angular/datetime-range-picker';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlMultiSelect, SlMultiSelectItem } from '@slotted/angular/multi-select';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlTimeField } from '@slotted/angular/time-field';
import { SlTimePicker } from '@slotted/angular/time-picker';
import { SlTimeRangePicker } from '@slotted/angular/time-range-picker';
import type { DataGridFilterOperandContext } from './data-grid-defaults';

type Condition = FilterCondition<string, unknown>;

const FILTER_KINDS: readonly string[] = [
  'text',
  'number',
  'date',
  'time',
  'datetime',
  'boolean',
  'set',
];

export function filterKindOf(kind: string): FilterKind | null {
  return FILTER_KINDS.includes(kind) ? (kind as FilterKind) : null;
}

export function timeOf(text: unknown): PlainTime | null {
  if (!text) return null;
  const written = String(text);
  return parseISOTime(/^\d{2}$/.test(written) ? `${written}:00` : written);
}

export function dateTimeOf(text: unknown): PlainDateTime | null {
  if (!text) return null;
  const written = String(text);
  if (/^\d{4}-\d{2}-\d{2}$/.test(written)) return parseISODateTime(`${written}T00:00`);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(written)) return parseISODateTime(`${written}:00`);
  return parseISODateTime(written);
}

export function dateOf(text: unknown): PlainDate | null {
  return text ? parseISODate(String(text)) : null;
}

function sameFilter(a: FilterDescriptor | null, b: FilterDescriptor | null) {
  return serializeFilter(a) === serializeFilter(b);
}

/**
 * The control an operand of a kind is edited in: one family per kind, all at
 * `sm`; `plain` in the filter row and `outline` in the panel. A date, a time
 * and a date-time are pickers — the field with the control that opens the
 * calendar or the list beside it — because a reader who does not type dates
 * still has to filter by one.
 */
@Component({
  selector: 'sl-data-grid-operand',
  standalone: true,
  imports: [
    SlDatePicker,
    SlDateTimePicker,
    SlMultiSelect,
    SlMultiSelectItem,
    SlNumberField,
    SlNumberFieldInput,
    SlSelect,
    SlSelectItem,
    SlTextField,
    SlTextFieldInput,
    SlTimePicker,
  ],
  template: `
    @switch (kind()) {
      @case ('number') {
        <div slNumberField size="sm" stepper="none" [variant]="variant()">
          <input
            slNumberFieldInput
            [value]="numberValue()"
            [locale]="locale()"
            [attr.aria-label]="label()"
            [attr.placeholder]="placeholder() ?? label()"
            (valueChange)="valueChange.emit($event.value)"
            (keydown.enter)="applyRequest.emit()"
          />
        </div>
      }
      @case ('date') {
        <div
          slDatePicker
          size="sm"
          [variant]="variant()"
          [value]="dateValue()"
          [locale]="locale()"
          [attr.aria-label]="label()"
          (valueChange)="valueChange.emit(isoDay($event.value))"
          (keydown.enter)="applyRequest.emit()"
        ></div>
      }
      @case ('time') {
        <div
          slTimePicker
          size="sm"
          [variant]="variant()"
          [value]="timeValue()"
          [locale]="locale()"
          [attr.aria-label]="label()"
          (valueChange)="valueChange.emit(isoTime($event.value))"
          (keydown.enter)="applyRequest.emit()"
        ></div>
      }
      @case ('datetime') {
        <div
          slDateTimePicker
          size="sm"
          [variant]="variant()"
          [value]="dateTimeValue()"
          [locale]="locale()"
          [attr.aria-label]="label()"
          (valueChange)="valueChange.emit(isoDateTime($event.value))"
          (keydown.enter)="applyRequest.emit()"
        ></div>
      }
      @case ('boolean') {
        <sl-select
          size="sm"
          width="content"
          [variant]="variant()"
          [fullWidth]="true"
          [items]="truths()"
          [placeholder]="t()('filterAny')"
          [aria-label]="label()"
          [value]="value() === true ? 'true' : value() === false ? 'false' : null"
          (valueChange)="
            valueChange.emit($event === 'true' ? true : $event === 'false' ? false : null)
          "
        >
          <sl-select-item value="true">{{ t()('filterYes') }}</sl-select-item>
          <sl-select-item value="false">{{ t()('filterNo') }}</sl-select-item>
        </sl-select>
      }
      @case ('set') {
        <sl-multi-select
          size="sm"
          width="content"
          overflow="collapse"
          [variant]="variant()"
          [fullWidth]="true"
          [items]="setItems()"
          [locale]="locale()"
          [placeholder]="t()('filterAny')"
          [aria-label]="label()"
          [value]="setValue()"
          (valueChange)="valueChange.emit([...$event])"
        >
          @for (option of setOptions(); track option.value) {
            <sl-multi-select-item
              [value]="option.value"
              [label]="option.label + countOf(option.value)"
            />
          }
        </sl-multi-select>
      }
      @default {
        <div slTextField size="sm" [variant]="variant()">
          <input
            slTextFieldInput
            [value]="textValue()"
            [attr.aria-label]="label()"
            [attr.placeholder]="placeholder() ?? label()"
            (input)="valueChange.emit($any($event.target).value)"
            (keydown.enter)="applyRequest.emit()"
          />
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class SlDataGridOperand {
  readonly kind = input.required<FilterKind>();
  readonly column = input.required<GridColumn<unknown>>();
  readonly value = input<unknown>(null);
  readonly label = input.required<string>();
  /** The grid's words, in the language in force. */
  readonly t = input.required<FamilyTranslator<DataGridMessages>>();
  readonly variant = input<'plain' | 'outline'>('outline');
  readonly locale = input<string | undefined>(undefined);
  readonly counts = input<ReadonlyMap<string, number> | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly valueChange = output<unknown>();
  readonly applyRequest = output<void>();

  protected readonly numberValue = computed(() =>
    typeof this.value() === 'number' ? (this.value() as number) : null,
  );
  protected readonly textValue = computed(() => {
    const value = this.value();
    return value === null || value === undefined ? '' : String(value);
  });
  protected readonly dateValue = computed(() => dateOf(this.value()));
  protected readonly timeValue = computed(() => timeOf(this.value()));
  protected readonly dateTimeValue = computed(() => dateTimeOf(this.value()));
  protected readonly truths = computed(() => [
    { label: this.t()('filterYes'), value: 'true' },
    { label: this.t()('filterNo'), value: 'false' },
  ]);
  protected readonly setOptions = computed(() => {
    const known = this.column().options ?? [];
    const seen = new Set(known.map((option) => option.value));
    const counts = this.counts();
    const extra = counts
      ? [...counts.keys()]
          .filter((key) => !seen.has(key))
          .map((key) => ({ value: key, label: key }))
      : [];
    return [...known, ...extra];
  });
  protected readonly setItems = computed(() =>
    this.setOptions().map((option) => ({ label: option.label, value: option.value })),
  );
  protected readonly setValue = computed(() =>
    Array.isArray(this.value()) ? (this.value() as readonly string[]) : [],
  );

  protected countOf(value: string) {
    const count = this.counts()?.get(value);
    return count === undefined ? '' : ` (${count})`;
  }
  protected asList(value: unknown) {
    return Array.isArray(value) ? value : value === null ? [] : [value];
  }
  protected isoDay(value: unknown) {
    return isPlainDate(value) ? toISODate(value) : null;
  }
  protected isoTime(value: unknown) {
    return isPlainTime(value) ? toISOTime(value, 'minute') : null;
  }
  protected isoDateTime(value: unknown) {
    return isPlainDateTime(value) ? toISODateTime(value) : null;
  }
}

/** The kinds whose `between` is one range picker rather than two fields. */
const RANGE_PICKER_KINDS: readonly string[] = ['date', 'time', 'datetime'];

/** Whether the operator's two operands are edited in one control. */
export function isRangeOperand(kind: FilterKind, operator: string) {
  return operandCount(operator as FilterOperator) === 2 && RANGE_PICKER_KINDS.includes(kind);
}

/**
 * A `between` on a date, a time or a date-time is one range picker: one
 * frame that says the run while it is drawn, takes the ends in either order
 * and fits a column's width, where two fields side by side broke into two
 * lines at the widths a filter row has. The rule `table` took in its second
 * reopening. The descriptor is unchanged: two ISO operands.
 */
@Component({
  selector: 'sl-data-grid-range-operand',
  standalone: true,
  imports: [SlDateRangePicker, SlDateTimeRangePicker, SlTimeRangePicker],
  template: `
    @switch (kind()) {
      @case ('time') {
        <div
          slTimeRangePicker
          size="sm"
          [variant]="variant()"
          [locale]="locale()"
          [messages]="{ start: t()('filterFrom'), end: t()('filterTo') }"
          [value]="timeRange()"
          (valueChange)="
            rangeChange.emit({
              start: isoTime($event.value?.start),
              end: isoTime($event.value?.end),
            })
          "
        ></div>
      }
      @case ('datetime') {
        <div
          slDateTimeRangePicker
          size="sm"
          [variant]="variant()"
          [locale]="locale()"
          [messages]="{ start: t()('filterFrom'), end: t()('filterTo') }"
          [value]="dateTimeRange()"
          (valueChange)="
            rangeChange.emit({
              start: isoDateTime($event.value?.start),
              end: isoDateTime($event.value?.end),
            })
          "
        ></div>
      }
      @default {
        <div
          slDateRangePicker
          size="sm"
          [variant]="variant()"
          [locale]="locale()"
          [messages]="{ start: t()('filterFrom'), end: t()('filterTo') }"
          [value]="dateRange()"
          (valueChange)="
            rangeChange.emit({ start: isoDay($event.value?.start), end: isoDay($event.value?.end) })
          "
        ></div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class SlDataGridRangeOperand {
  readonly kind = input.required<FilterKind>();
  readonly start = input<unknown>(null);
  readonly end = input<unknown>(null);
  /** The grid's words, in the language in force. */
  readonly t = input.required<FamilyTranslator<DataGridMessages>>();
  readonly variant = input<'plain' | 'outline'>('outline');
  readonly locale = input<string | undefined>(undefined);
  readonly rangeChange = output<{ start: string | null; end: string | null }>();

  protected readonly dateRange = computed(() => ({
    start: dateOf(this.start()),
    end: dateOf(this.end()),
  }));
  protected readonly timeRange = computed(() => ({
    start: timeOf(this.start()),
    end: timeOf(this.end()),
  }));
  protected readonly dateTimeRange = computed(() => ({
    start: dateTimeOf(this.start()),
    end: dateTimeOf(this.end()),
  }));

  protected isoDay(value: unknown) {
    return isPlainDate(value) ? toISODate(value) : null;
  }
  protected isoTime(value: unknown) {
    return isPlainTime(value) ? toISOTime(value, 'minute') : null;
  }
  protected isoDateTime(value: unknown) {
    return isPlainDateTime(value) ? toISODateTime(value) : null;
  }
}

/**
 * The compact panel: one line per condition, the join as two words on the
 * second, Clear and Apply at the end. It edits a draft; nothing reaches the
 * grid until Apply.
 */
@Component({
  selector: 'sl-data-grid-filter-panel',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlDataGridOperand,
    SlDataGridRangeOperand,
    SlSegment,
    SlSegmentedControl,
    SlSelect,
    SlSelectItem,
  ],
  template: `
    <div
      data-ui="data-grid"
      data-ui-data-grid=""
      data-part="filter-panel"
      data-part-filter-panel=""
      [attr.data-kind]="kind()"
    >
      @for (index of lines(); track index) {
        <div
          data-part="filter-condition"
          data-part-filter-condition=""
          [attr.data-operands]="operandsOf(index)"
        >
          @if (index === 1) {
            <div data-part="filter-join" data-part-filter-join="">
              <div
                slSegmentedControl
                size="sm"
                [value]="draft().join"
                [attr.aria-label]="t()('filterJoin')"
                (valueChange)="setJoin($event.value ?? 'and')"
              >
                <label slSegment value="and">{{ joinName('and') }}</label>
                <label slSegment value="or">{{ joinName('or') }}</label>
              </div>
            </div>
          }
          <div data-part="filter-operator" data-part-filter-operator="">
            <sl-select
              size="sm"
              width="content"
              [fullWidth]="true"
              [items]="operatorItems()"
              [attr.aria-label]="t()('filterOperator')"
              [value]="conditionAt(index).operator"
              (valueChange)="setOperator(index, $any($event))"
            >
              @for (operator of operators(); track operator) {
                <sl-select-item [value]="operator">{{ operatorName(operator) }}</sl-select-item>
              }
            </sl-select>
          </div>
          <div
            data-part="filter-operand"
            data-part-filter-operand=""
            [attr.data-kind]="kind()"
            [attr.data-range]="operandsOf(index) === 2 && !rangeAt(index) ? '' : null"
          >
            @if (rangeAt(index) && !customTemplate()) {
              <sl-data-grid-range-operand
                [kind]="kind()"
                [start]="operandOf(index, 0)"
                [end]="operandOf(index, 1)"
                [t]="t()"
                [locale]="locale()"
                variant="outline"
                (rangeChange)="setOperands(index, $event.start, $event.end)"
              />
            } @else {
              @for (slot of slotsOf(index); track slot) {
                @if (customTemplate(); as custom) {
                  <span>
                    <ng-container
                      [ngTemplateOutlet]="custom"
                      [ngTemplateOutletContext]="context(index, slot)"
                    />
                  </span>
                } @else {
                  <sl-data-grid-operand
                    [kind]="kind()"
                    [column]="column().column"
                    [value]="operandOf(index, slot)"
                    [label]="operandLabel(index, slot)"
                    [t]="t()"
                    [locale]="locale()"
                    [counts]="counts()"
                    variant="outline"
                    (valueChange)="setOperand(index, slot, $event)"
                    (applyRequest)="apply('keyboard')"
                  />
                }
              }
            }
          </div>
        </div>
      }
      <div data-part="filter-actions" data-part-filter-actions="">
        <button
          slButton
          type="button"
          size="sm"
          tone="secondary"
          variant="ghost"
          [disabled]="!clearable()"
          (click)="clear()"
        >
          {{ t()('filterClear') }}
        </button>
        <button slButton type="button" size="sm" (click)="apply('pointer')">
          {{ t()('filterApply') }}
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class SlDataGridFilterPanel {
  readonly column = input.required<ResolvedGridColumn<unknown>>();
  readonly kind = input.required<FilterKind>();
  readonly committed = input<FilterDescriptor | null>(null);
  /** The grid's words, in the language in force. */
  readonly t = input.required<FamilyTranslator<DataGridMessages>>();
  readonly locale = input<string | undefined>(undefined);
  readonly counts = input<ReadonlyMap<string, number> | undefined>(undefined);
  readonly customTemplate = input<TemplateRef<DataGridFilterOperandContext> | null>(null);
  /** The normalised descriptor, or null, with how it was applied. */
  readonly applyRequest = output<{
    filter: FilterDescriptor | null;
    reason: 'pointer' | 'keyboard' | 'clear';
    said: string;
  }>();

  /** Written by the effect below before the first read: the inputs are not set at construction. */
  readonly draft = signal<FilterDescriptor>(emptyFilter('text') as FilterDescriptor);

  constructor() {
    /* The draft starts from what is committed, every time the panel opens. */
    effect(() => {
      const committed = this.committed();
      this.draft.set(committed ?? this.blank());
    });
  }

  private blank(): FilterDescriptor {
    return emptyFilter(this.kind()) as FilterDescriptor;
  }

  protected readonly operators = computed(() => operatorsFor(this.kind()) as readonly string[]);
  protected readonly operatorItems = computed(() =>
    this.operators().map((operator) => ({ label: this.operatorName(operator), value: operator })),
  );
  protected readonly lines = computed<readonly (0 | 1)[]>(() => {
    if (this.kind() === 'set') return [0];
    return isConditionActive(this.kind(), this.conditionAt(0)) ? [0, 1] : [0];
  });
  protected readonly clearable = computed(
    () => isFilterActive(this.draft()) || this.committed() !== null,
  );

  protected conditionAt(index: number): Condition {
    return this.draft().conditions[index] ?? { operator: defaultOperator(this.kind()) as string };
  }
  protected operandsOf(index: number) {
    return operandCount(this.conditionAt(index).operator as FilterOperator);
  }
  protected slotsOf(index: number): readonly (0 | 1)[] {
    const operands = this.operandsOf(index);
    return operands === 0 ? [] : operands === 1 ? [0] : [0, 1];
  }
  protected operandOf(index: number, slot: 0 | 1) {
    const condition = this.conditionAt(index);
    return (slot === 0 ? condition.value : condition.end) ?? null;
  }
  protected operandLabel(index: number, slot: 0 | 1) {
    const t = this.t();
    return this.operandsOf(index) === 2
      ? slot === 0
        ? t('filterFrom')
        : t('filterTo')
      : t('filterValue');
  }
  protected operatorName(operator: string) {
    return this.t()(`filterOperators.${operator as FilterOperator}`);
  }
  protected joinName(join: FilterJoin) {
    return this.t()(`filterJoins.${join}`);
  }
  protected context(index: number, slot: 0 | 1): DataGridFilterOperandContext {
    const value = this.operandOf(index, slot);
    return {
      $implicit: value,
      column: this.column().id,
      operator: this.conditionAt(index).operator,
      value,
      setValue: (next) => this.setOperand(index, slot, next),
      apply: () => this.apply('keyboard'),
      label: this.operandLabel(index, slot),
    };
  }
  protected setJoin(join: string) {
    this.draft.set(withJoin(this.draft(), join as FilterJoin));
  }
  protected setOperator(index: number, operator: string) {
    const condition = this.conditionAt(index);
    const before = operandCount(condition.operator as FilterOperator);
    const after = operandCount(operator as FilterOperator);
    const next: Condition = {
      operator,
      ...(after >= 1 && before >= 1 ? { value: condition.value } : {}),
      ...(after === 2 && before === 2 ? { end: condition.end } : {}),
    };
    this.draft.set(withCondition(this.draft(), index, next as never));
  }
  protected setOperand(index: number, slot: 0 | 1, operand: unknown) {
    const condition = this.conditionAt(index);
    const next: Condition =
      slot === 0 ? { ...condition, value: operand } : { ...condition, end: operand };
    this.draft.set(withCondition(this.draft(), index, next as never));
  }
  protected setOperands(index: number, start: unknown, end: unknown) {
    const next: Condition = { ...this.conditionAt(index), value: start, end };
    this.draft.set(withCondition(this.draft(), index, next as never));
  }
  protected rangeAt(index: number) {
    return isRangeOperand(this.kind(), this.conditionAt(index).operator);
  }
  protected apply(reason: 'pointer' | 'keyboard') {
    const next = normalizeFilter(this.draft());
    const t = this.t();
    const name = this.column().column.label;
    const format = {
      join: (join: FilterJoin) => this.joinName(join),
      operator: (operator: FilterOperator) => this.operatorName(operator),
    };
    const said = next
      ? t('filterApplied', { column: name, filter: describeFilter(next, format) })
      : t('filterCleared', { column: name });
    this.applyRequest.emit({
      filter: sameFilter(next, this.committed()) ? this.committed() : next,
      reason,
      said,
    });
  }
  protected clear() {
    this.draft.set(this.blank());
    const t = this.t();
    this.applyRequest.emit({
      filter: null,
      reason: 'clear',
      said: t('filterCleared', { column: this.column().column.label }),
    });
  }
}

/**
 * The operand of the filter row: the kind's control, `plain`, filling the
 * cell, with the operator as a symbol button at its start. Text and number
 * apply after the debounce and on Enter; the others on change.
 */
@Component({
  selector: 'sl-data-grid-filter-row-operand',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    SlDataGridOperand,
    SlDataGridRangeOperand,
    SlMenu,
    SlMenuItem,
    SlMenuTrigger,
  ],
  template: `
    <div
      data-part="filter-operand"
      data-part-filter-operand=""
      [attr.data-kind]="kind()"
      [attr.data-range]="operands() === 2 && !range() ? '' : null"
    >
      <div data-part="filter-operator" data-part-filter-operator="">
        <button
          type="button"
          tabindex="-1"
          [slMenuTriggerFor]="menu"
          [attr.aria-label]="t()('filterOperatorChosen', { operator: operatorName(operator()) })"
          [attr.title]="operatorName(operator())"
        >
          {{ symbol() }}
        </button>
        <sl-menu #menu size="sm">
          @for (entry of operators(); track entry) {
            <button slMenuItem (select)="chooseOperator(entry)">{{ operatorName(entry) }}</button>
          }
        </sl-menu>
      </div>
      @if (range() && !customTemplate()) {
        <sl-data-grid-range-operand
          [kind]="kind()"
          [start]="draft().value"
          [end]="draft().end"
          [t]="t()"
          [locale]="locale()"
          variant="plain"
          (rangeChange)="writeBoth($event.start, $event.end)"
        />
      } @else {
        @for (slot of slots(); track slot) {
          @if (customTemplate(); as custom) {
            <span>
              <ng-container [ngTemplateOutlet]="custom" [ngTemplateOutletContext]="context(slot)" />
            </span>
          } @else {
            <sl-data-grid-operand
              [kind]="kind()"
              [column]="column().column"
              [value]="slot === 0 ? draft().value : draft().end"
              [label]="operandLabel(slot)"
              [t]="t()"
              [locale]="locale()"
              [counts]="counts()"
              [placeholder]="rowPlaceholder(slot)"
              variant="plain"
              (valueChange)="write(slot, $event)"
              (applyRequest)="applyNow()"
            />
          }
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class SlDataGridFilterRowOperand {
  readonly column = input.required<ResolvedGridColumn<unknown>>();
  readonly kind = input.required<FilterKind>();
  readonly committed = input<FilterDescriptor | null>(null);
  /** The grid's words, in the language in force. */
  readonly t = input.required<FamilyTranslator<DataGridMessages>>();
  readonly locale = input<string | undefined>(undefined);
  readonly counts = input<ReadonlyMap<string, number> | undefined>(undefined);
  readonly debounce = input<number>(300);
  readonly customTemplate = input<TemplateRef<DataGridFilterOperandContext> | null>(null);
  readonly filterChange = output<{
    filter: FilterDescriptor | null;
    reason: 'pointer' | 'keyboard';
  }>();

  readonly operator = signal<string>('contains');
  readonly draft = signal<{ value: unknown; end: unknown }>({ value: null, end: null });
  private timer: ReturnType<typeof setTimeout> | undefined;
  private seen = '';

  constructor() {
    effect(() => {
      const committed = this.committed();
      const text = serializeFilter(committed);
      if (text === this.seen) return;
      this.seen = text;
      const condition = committed?.conditions[0];
      this.operator.set(condition?.operator ?? (defaultOperator(this.kind()) as string));
      this.draft.set({ value: condition?.value ?? null, end: condition?.end ?? null });
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected readonly operators = computed(() => operatorsFor(this.kind()) as readonly string[]);
  protected readonly operands = computed(() => operandCount(this.operator() as FilterOperator));
  protected readonly slots = computed<readonly (0 | 1)[]>(() => {
    const operands = this.operands();
    return operands === 0 ? [] : operands === 1 ? [0] : [0, 1];
  });
  protected readonly symbol = computed(() =>
    this.t()(`filterSymbols.${this.operator() as FilterOperator}`),
  );
  protected readonly range = computed(() => isRangeOperand(this.kind(), this.operator()));

  protected operatorName(operator: string) {
    return this.t()(`filterOperators.${operator as FilterOperator}`);
  }
  /* An amount in a filter is typed, never spun (`stepper="none"` above): the
     steppers took a third of a filter cell and a `between` had room for one
     digit. The two ends of a `between` are named From and To. */
  protected rowPlaceholder(slot: 0 | 1) {
    const t = this.t();
    return this.operands() === 2 ? (slot === 0 ? t('filterFrom') : t('filterTo')) : t('filter');
  }
  protected operandLabel(slot: 0 | 1) {
    const t = this.t();
    const column = this.column().column.label;
    return this.operands() === 2
      ? t('filterRange', { bound: slot === 0 ? 'from' : 'to', column })
      : t('filterColumn', { column });
  }
  protected context(slot: 0 | 1): DataGridFilterOperandContext {
    const value = slot === 0 ? this.draft().value : this.draft().end;
    return {
      $implicit: value,
      column: this.column().id,
      operator: this.operator(),
      value,
      setValue: (next) => this.write(slot, next, true),
      apply: () => this.applyNow(),
      label: this.operandLabel(slot),
    };
  }
  private commit(
    operator: string,
    draft: { value: unknown; end: unknown },
    reason: 'pointer' | 'keyboard',
  ) {
    const descriptor = normalizeFilter({
      kind: this.kind(),
      join: 'and',
      conditions: [{ operator, value: draft.value, end: draft.end }],
    } as FilterDescriptor);
    if (sameFilter(descriptor, this.committed())) return;
    this.seen = serializeFilter(descriptor);
    this.filterChange.emit({ filter: descriptor, reason });
  }
  protected write(slot: 0 | 1, next: unknown, immediate = false) {
    const draft = slot === 0 ? { ...this.draft(), value: next } : { ...this.draft(), end: next };
    this.draft.set(draft);
    clearTimeout(this.timer);
    const run = () => this.commit(this.operator(), draft, 'keyboard');
    const kind = this.kind();
    if (immediate || (kind !== 'text' && kind !== 'number')) run();
    else this.timer = setTimeout(run, this.debounce());
  }
  protected writeBoth(start: unknown, end: unknown) {
    const draft = { value: start, end };
    this.draft.set(draft);
    clearTimeout(this.timer);
    this.commit(this.operator(), draft, 'keyboard');
  }
  protected applyNow() {
    clearTimeout(this.timer);
    this.commit(this.operator(), this.draft(), 'keyboard');
  }
  protected chooseOperator(next: string) {
    this.operator.set(next);
    const after = operandCount(next as FilterOperator);
    const kept = {
      value: after >= 1 ? this.draft().value : null,
      end: after === 2 ? this.draft().end : null,
    };
    this.draft.set(kept);
    this.commit(next, kept, 'pointer');
  }
}

/**
 * The editor a kind implies: the field family of that kind, `plain` and `sm`,
 * filling the cell. The draft is the domain value.
 */
@Component({
  selector: 'sl-data-grid-editor',
  standalone: true,
  imports: [
    SlCheckbox,
    SlDateField,
    SlDateTimeField,
    SlNumberField,
    SlNumberFieldInput,
    SlSelect,
    SlSelectItem,
    SlTextField,
    SlTextFieldInput,
    SlTimeField,
  ],
  template: `
    @switch (kind()) {
      @case ('number') {
        <div slNumberField size="sm" variant="plain">
          <input
            slNumberFieldInput
            autofocus
            [invalid]="invalid() || undefined"
            [value]="numberValue()"
            [locale]="locale()"
            [attr.aria-label]="column().label"
            [attr.title]="message()"
            (valueChange)="draftChange.emit($event.value)"
          />
        </div>
      }
      @case ('boolean') {
        <span
          slCheckbox
          [checked]="draft() === true"
          (checkedChange)="draftChange.emit($event.value)"
        >
          <span
            data-ui="visually-hidden"
            data-ui-visually-hidden=""
            data-part="root"
            data-part-root=""
            >{{ column().label }}</span
          >
        </span>
      }
      @case ('date') {
        <div
          slDateField
          size="sm"
          variant="plain"
          [value]="dateValue()"
          [locale]="locale()"
          [invalid]="invalid() || undefined"
          [attr.aria-label]="column().label"
          (valueChange)="draftChange.emit(isoDay($event.value))"
        ></div>
      }
      @case ('time') {
        <div
          slTimeField
          size="sm"
          variant="plain"
          [value]="timeValue()"
          [locale]="locale()"
          [invalid]="invalid() || undefined"
          [attr.aria-label]="column().label"
          (valueChange)="draftChange.emit(isoTime($event.value))"
        ></div>
      }
      @case ('datetime') {
        <div
          slDateTimeField
          size="sm"
          variant="plain"
          [value]="dateTimeValue()"
          [locale]="locale()"
          [invalid]="invalid() || undefined"
          [attr.aria-label]="column().label"
          (valueChange)="draftChange.emit(isoDateTime($event.value))"
        ></div>
      }
      @case ('set') {
        <sl-select
          size="sm"
          variant="plain"
          [fullWidth]="true"
          [multiple]="multiple()"
          [items]="setItems()"
          [placeholder]="t()('filterAny')"
          [attr.aria-label]="column().label"
          [value]="setValue()"
          (valueChange)="draftChange.emit($event)"
        >
          @for (option of column().options ?? []; track option.value) {
            <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
          }
        </sl-select>
      }
      @default {
        <div slTextField size="sm" variant="plain">
          <input
            slTextFieldInput
            autofocus
            [invalid]="invalid() || undefined"
            [value]="textValue()"
            [attr.aria-label]="column().label"
            [attr.title]="message()"
            (input)="draftChange.emit($any($event.target).value)"
          />
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class SlDataGridEditor {
  readonly column = input.required<GridColumn<unknown>>();
  readonly draft = input<unknown>(null);
  readonly value = input<unknown>(null);
  readonly invalid = input(false);
  readonly message = input<string | null>(null);
  /** The grid's words, in the language in force. */
  readonly t = input.required<FamilyTranslator<DataGridMessages>>();
  readonly locale = input<string | undefined>(undefined);
  readonly draftChange = output<unknown>();

  protected readonly kind = computed(() => this.column().kind ?? 'text');
  protected readonly multiple = computed(() => Array.isArray(this.value()));
  protected readonly numberValue = computed(() =>
    typeof this.draft() === 'number' ? (this.draft() as number) : null,
  );
  protected readonly textValue = computed(() => {
    const draft = this.draft();
    return draft === null || draft === undefined ? '' : String(draft);
  });
  protected readonly dateValue = computed(() => dateOf(this.draft()));
  protected readonly timeValue = computed(() => timeOf(this.draft()));
  protected readonly dateTimeValue = computed(() => dateTimeOf(this.draft()));
  protected readonly setItems = computed(() =>
    (this.column().options ?? []).map((option) => ({ label: option.label, value: option.value })),
  );
  protected readonly setValue = computed(() => {
    const draft = this.draft();
    if (this.multiple()) return (draft as readonly string[] | null) ?? [];
    return draft === null || draft === undefined ? null : String(draft);
  });

  protected isoDay(value: unknown) {
    return isPlainDate(value) ? toISODate(value) : null;
  }
  protected isoTime(value: unknown) {
    return isPlainTime(value) ? toISOTime(value, 'minute') : null;
  }
  protected isoDateTime(value: unknown) {
    return isPlainDateTime(value) ? toISODateTime(value) : null;
  }
}
