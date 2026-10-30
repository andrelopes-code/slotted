import { withSelectorKey } from '@slotted/core/selector-key';
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
  FilterCondition,
  FilterDescriptor,
  FilterJoin,
  FilterKind,
  FilterOperator,
} from '@slotted/core/filter';
import { createFilter } from '@slotted/core/collection';
import type { FamilyTranslator, TableMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
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
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { createControllable } from '@slotted/core/state';
import { useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { DatePicker } from '../date-picker';
import { DateRangePicker } from '../date-range-picker';
import { DateTimePicker } from '../datetime-picker';
import { DateTimeRangePicker } from '../datetime-range-picker';
import { NumberField } from '../number-field';
import { Popover, PopoverContent, PopoverLayer, PopoverTrigger } from '../popover';
import { Radio, RadioGroup } from '../radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { TagsInput } from '../tags-input';
import { TextField } from '../text-field';
import { TimePicker } from '../time-picker';
import { TimeRangePicker } from '../time-range-picker';
import { useTable } from './table';
import { useTableColumn } from './table-parts';
import type {
  TableBooleanFilterProps,
  TableConditionFilterProps,
  TableDateFilterProps,
  TableDateTimeFilterProps,
  TableFilterOperandProps,
  TableFilterOption,
  TableFilterReason,
  TableNumberFilterProps,
  TableSetFilterProps,
  TableTextFilterProps,
  TableTimeFilterProps,
} from './table.types';

/**
 * The mark the trigger carries. It is authored here rather than taken from an
 * icon family, for the reason the expander's chevron is: the family draws the
 * one glyph that is part of its own control, and a consumer replacing it
 * replaces the control.
 */
function Funnel() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );
}

type Condition = FilterCondition<string, unknown>;

/** What the kind's own operand body is handed. */
interface BodyProps {
  announce: (message: string) => void;
  apply: () => void;
  condition: Condition;
  /** The table's words, for the names of the operand fields. */
  t: FamilyTranslator<TableMessages>;
  /** Writes one operand back into the draft. `slot` is `value` or `end`. */
  setOperand: (slot: 0 | 1, value: unknown) => void;
  /**
   * Writes both operands of a range at once, for a control that holds both.
   * Two calls to `setOperand` from one event would each read the draft the
   * other did not write.
   */
  setOperands: (value: unknown, end: unknown) => void;
}

interface ShellProps {
  body: (props: BodyProps) => ReactNode;
  conditions?: 1 | 2 | undefined;
  kind: FilterKind;
  operators: readonly string[];
  props: TableConditionFilterProps<FilterDescriptor, string, unknown>;
  /** The set filter offers one condition and draws no join — see the design, §3.2. */
  singleCondition?: boolean;
  /**
   * Whether the body draws one control for both operands of a range. Written
   * as `data-range` on `filter-operand`, so the two-column operand grid
   * collapses to one; a consumer's own `renderOperand` is still one per slot.
   */
  rangeOperand?: boolean;
  /** Which of a kind's operands the body draws, written as `data-operand`. */
  operandName?: string;
}

/** Two descriptors are the same filter when they serialise the same. */
function sameFilter(a: FilterDescriptor | null, b: FilterDescriptor | null) {
  return serializeFilter(a) === serializeFilter(b);
}

/**
 * The panel every kind shares: the trigger, the draft, the conditions, the join
 * between them, the announcements and the two actions. What changes per kind is
 * the operator list and the control inside `filter-operand`.
 *
 * The panel edits a **draft**. Nothing reaches the consumer until Apply, and
 * Escape or a press outside restores the descriptor the panel opened with. A
 * reader composing two conditions fires one query, not four; Ant, AG Grid and
 * Excel each work this way.
 *
 * The family applies nothing. It reports the descriptor, and
 * `createFilterPredicate` in `@slotted/core/filter` is what a consumer applies
 * to its own rows — the same division `sort` records.
 */
function TableFilterShell({
  body,
  kind,
  operandName,
  operators,
  props,
  rangeOperand,
  singleCondition,
}: ShellProps) {
  const {
    align,
    collisionPadding,
    columnLabel,
    conditions: maxConditions = 2,
    defaultOpen,
    defaultOperator,
    defaultValue,
    label,
    mount,
    onOpenChange,
    onValueChange,
    open: openProp,
    portal,
    renderOperand,
    side,
    sideOffset,
    value,
  } = props;

  const table = useTable();
  const column = useTableColumn();
  const base = useId();

  const [own, setOwn] = useState<FilterDescriptor | null>(defaultValue ?? null);
  const committed = value === undefined ? own : value;

  const start = defaultOperator ?? kindDefaultOperator(kind);
  const blank = () => emptyFilter(kind, start as never) as FilterDescriptor;

  const [draft, setDraft] = useState<FilterDescriptor>(committed ?? blank());
  const [ownOpen, setOwnOpen] = useState(false);
  const open = openProp ?? ownOpen;
  const panel = useRef<HTMLDivElement | null>(null);

  const t = table.t;
  const name = columnLabel ?? column ?? '';
  const filtered = isFilterActive(committed);
  const allowed = singleCondition ? 1 : maxConditions;

  function announce(message: string) {
    getLiveAnnouncer(panel.current?.ownerDocument).announce(message);
  }

  const format = {
    join: (join: FilterJoin) => t(`filterJoins.${join}`),
    operator: (operator: FilterOperator) => t(`filterOperators.${operator}`),
  };

  function request(next: FilterDescriptor | null, reason: TableFilterReason, source: unknown) {
    const state = createControllable<FilterDescriptor | null>({
      controlled: value,
      initial: committed,
      equals: sameFilter,
      onRequest: (change) => onValueChange?.(change.value, change),
    });
    if (state.request(next, reason, source)) setOwn(next);
  }

  function toggle(next: boolean, source?: unknown) {
    if (openProp === undefined) setOwnOpen(next);
    onOpenChange?.(next, source as never);
    /* The draft starts from what is committed, every time: a panel that kept
       the last draft would show a reader a set they cancelled. Closing is
       cancelling — Apply closes the panel itself, after committing. */
    setDraft(committed ?? blank());
  }

  const conditionAt = (index: number): Condition =>
    draft.conditions[index] ?? { operator: start as FilterOperator };

  const first = conditionAt(0);
  /* AG Grid's own reveal: the second condition appears once the first is
     complete. A button would be one more word to translate before the common
     case, and an empty second row is noise in every panel that never needs it. */
  const showsSecond = allowed === 2 && isConditionActive(kind, first);

  function setOperator(index: number, operator: string) {
    const condition = conditionAt(index);
    const before = operandCount(condition.operator as FilterOperator);
    const after = operandCount(operator as FilterOperator);

    /* An operand the new operator still takes survives the change: a reader who
       typed a value and then chose a different comparison meant to keep it. */
    const next: Condition = {
      operator,
      ...(after >= 1 && before >= 1 ? { value: condition.value } : {}),
      ...(after === 2 && before === 2 ? { end: condition.end } : {}),
    };

    setDraft(withCondition(draft, index, next as never));
    /* The panel grows a field or loses two. Announced, because a form that
       changes shape under a reader who cannot see it says nothing otherwise. */
    if (after !== before)
      announce(
        t('filterOperands', {
          operator: format.operator(operator as FilterOperator),
          count: after,
        }),
      );
  }

  function setOperand(index: number, slot: 0 | 1, operand: unknown) {
    const condition = conditionAt(index);
    const wasActive = isConditionActive(kind, condition);
    const next: Condition =
      slot === 0 ? { ...condition, value: operand } : { ...condition, end: operand };

    setDraft(withCondition(draft, index, next as never));
    if (index === 0 && allowed === 2 && !wasActive && isConditionActive(kind, next)) {
      announce(t('filterConditionAdded'));
    }
  }

  function setOperands(index: number, value: unknown, end: unknown) {
    const condition = conditionAt(index);
    const wasActive = isConditionActive(kind, condition);
    const next: Condition = { ...condition, value, end };

    setDraft(withCondition(draft, index, next as never));
    if (index === 0 && allowed === 2 && !wasActive && isConditionActive(kind, next)) {
      announce(t('filterConditionAdded'));
    }
  }

  function apply(source: unknown, reason: TableFilterReason) {
    const next = normalizeFilter(draft);
    request(next, reason, source);
    announce(
      next
        ? t('filterApplied', { column: name, filter: describeFilter(next, format) })
        : t('filterCleared', { column: name }),
    );
    if (openProp === undefined) setOwnOpen(false);
    onOpenChange?.(false, source as never);
  }

  function clear(source: unknown) {
    setDraft(blank());
    announce(t('filterCleared', { column: name }));
    request(null, 'clear', source);
    if (openProp === undefined) setOwnOpen(false);
    onOpenChange?.(false, source as never);
  }

  const triggerName =
    label ??
    (filtered
      ? t('filterApplied', { column: name, filter: describeFilter(committed, format) })
      : t('filterColumn', { column: name }).trim());

  function renderCondition(index: 0 | 1) {
    const condition = conditionAt(index);
    const operands = operandCount(condition.operator as FilterOperator);

    const operandProps = (slot: 0 | 1): TableFilterOperandProps<unknown> => ({
      apply: () => apply(null, 'keyboard'),
      index: slot,
      label: operands === 2 ? (slot === 0 ? t('filterFrom') : t('filterTo')) : t('filterValue'),
      onValueChange: (operand) => setOperand(index, slot, operand),
      operator: condition.operator as FilterOperator,
      value: (slot === 0 ? condition.value : condition.end) ?? null,
    });

    return (
      <div
        data-operands={operands}
        data-part="filter-condition"
        data-part-filter-condition=""
        key={index}
      >
        <div data-part="filter-operator" data-part-filter-operator="">
          {/* `items` names every operator for the closed control. Without it the
              trigger falls back to the value itself and a reader sees the raw
              `between` and `empty` the engine speaks, which is what the
              rendered page showed. */}
          <Select
            fullWidth
            items={operators.map((operator) => ({
              label: format.operator(operator as FilterOperator),
              value: operator,
            }))}
            onValueChange={(next) => setOperator(index, next as string)}
            size="sm"
            value={condition.operator}
          >
            <SelectTrigger aria-label={t('filterOperator')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((operator) => (
                <SelectItem key={operator} value={operator}>
                  {format.operator(operator as FilterOperator)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {operands === 0 ? null : (
          <div
            data-kind={kind}
            data-part="filter-operand"
            data-part-filter-operand=""
            {...(operandName === undefined || renderOperand ? {} : { 'data-operand': operandName })}
            {...(rangeOperand && operands === 2 && !renderOperand ? { 'data-range': '' } : {})}
          >
            {renderOperand
              ? Array.from({ length: operands }, (_, slot) =>
                  renderOperand(operandProps(slot as 0 | 1)),
                )
              : body({
                  announce,
                  apply: () => apply(null, 'keyboard'),
                  condition,
                  setOperand: (slot, operand) => setOperand(index, slot, operand),
                  setOperands: (value, end) => setOperands(index, value, end),
                  t,
                })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Popover
      onOpenChange={(next, source) => toggle(next, source)}
      open={open}
      {...(align === undefined ? {} : { align })}
      {...(collisionPadding === undefined ? {} : { collisionPadding })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      {...(mount === undefined ? {} : { mount })}
      {...(portal === undefined ? {} : { portal })}
      {...(side === undefined ? {} : { side })}
      {...(sideOffset === undefined ? {} : { sideOffset })}
    >
      <PopoverTrigger
        render={(triggerProps) => (
          <button
            {...withSelectorKey(triggerProps, 'part', 'filter')}
            aria-label={triggerName}

            {...(filtered ? { 'data-filtered': '' } : {})}
            type="button"
          >
            <Funnel />
          </button>
        )}
      />
      <PopoverLayer>
        <PopoverContent aria-label={triggerName}>
          {/* The parts are on this family's own element rather than on the
              popover's: `PopoverContent` names its own part, and a second
              `data-part` on the same element is one of them lost. */}
          <div
            data-kind={kind}
            data-part="filter-panel"
            data-part-filter-panel=""
            data-ui="table"
            data-ui-table=""
            id={base}
            ref={panel}
          >
            {renderCondition(0)}

            {showsSecond ? (
              <>
                <div data-part="filter-join" data-part-filter-join="">
                  <span data-label="">{t('filterJoin')}</span>
                  <RadioGroup
                    aria-label={t('filterJoin')}
                    onValueChange={(join) => setDraft(withJoin(draft, join as FilterJoin))}
                    orientation="horizontal"
                    size="sm"
                    value={draft.join}
                  >
                    <Radio value="and">{format.join('and')}</Radio>
                    <Radio value="or">{format.join('or')}</Radio>
                  </RadioGroup>
                </div>
                {renderCondition(1)}
              </>
            ) : null}

            <div data-part="filter-actions" data-part-filter-actions="">
              <Button
                disabled={!isFilterActive(draft)}
                onClick={(event) => clear(event)}
                size="sm"
                tone="secondary"
                variant="ghost"
              >
                {t('filterClear')}
              </Button>
              <Button onClick={(event) => apply(event, 'pointer')} size="sm">
                {t('filterApply')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </PopoverLayer>
    </Popover>
  );
}

/** `Enter` in an operand applies, which is what AG Grid does and what a reader
    who has just typed a value expects. The consumer's own handler runs first. */
function applyOnEnter(apply: () => void) {
  return (event: { defaultPrevented: boolean; key: string }) => {
    if (event.key === 'Enter' && !event.defaultPrevented) apply();
  };
}

function narrowed<Operator extends string>(
  kind: FilterKind,
  operators: readonly Operator[] | undefined,
): readonly string[] {
  return operators ?? (operatorsFor(kind) as readonly string[]);
}

/** A column of words. Its comparisons are the collator's, never a fold. */
export function TableTextFilter(props: TableTextFilterProps) {
  return (
    <TableFilterShell
      body={({ apply, condition, setOperand, t }) => (
        <TextField
          aria-label={t('filterValue')}
          onChange={(event) => setOperand(0, event.target.value)}
          onKeyDown={applyOnEnter(apply)}
          placeholder={t('filterValue')}
          size="sm"
          value={(condition.value as string | null) ?? ''}
        />
      )}
      kind="text"
      operators={narrowed('text', props.operators)}
      props={props as never}
      {...(props.conditions === undefined ? {} : { conditions: props.conditions })}
    />
  );
}

/** A column of quantities. The operand parses in the reader's own locale. */
export function TableNumberFilter(props: TableNumberFilterProps) {
  const { format, locale, step } = props;

  return (
    <TableFilterShell
      body={({ apply, condition, setOperand, t }) => (
        <>
          {([0, 1] as const)
            .slice(0, operandCount(condition.operator as FilterOperator))
            .map((slot) => (
              <NumberField
                aria-label={
                  operandCount(condition.operator as FilterOperator) === 2
                    ? slot === 0
                      ? t('filterFrom')
                      : t('filterTo')
                    : t('filterValue')
                }
                key={slot}
                onKeyDown={applyOnEnter(apply)}
                onValueChange={(next) => setOperand(slot, next)}
                placeholder={
                  operandCount(condition.operator as FilterOperator) === 2
                    ? slot === 0
                      ? t('filterFrom')
                      : t('filterTo')
                    : t('filterValue')
                }
                size="sm"
                value={((slot === 0 ? condition.value : condition.end) as number | null) ?? null}
                {...(format === undefined ? {} : { format })}
                {...(locale === undefined ? {} : { locale })}
                {...(step === undefined ? {} : { step })}
              />
            ))}
        </>
      )}
      kind="number"
      operators={narrowed('number', props.operators)}
      props={props as never}
      {...(props.conditions === undefined ? {} : { conditions: props.conditions })}
    />
  );
}

/**
 * A column of days. The operand is the whole `date-picker` — the segmented field
 * and the calendar behind it — rather than the field alone: every surveyed
 * implementation that filters a date column offers a grid to point at, and a
 * reader who has to type a date they could have pointed at is the one thing a
 * date filter exists to spare them. The calendar opens a layer inside the
 * panel's layer, which `dismissable-layer` already stacks for the operator
 * chooser beside it.
 *
 * The descriptor holds the ISO day the picker produces, never a `Date`.
 */
export function TableDateFilter(props: TableDateFilterProps) {
  const { locale, max, min, presets } = props;
  const day = (value: unknown) => (value ? parseISODate(String(value)) : null);
  const iso = (value: unknown) => (isPlainDate(value) ? toISODate(value) : null);

  return (
    <TableFilterShell
      body={({ apply, condition, setOperand, setOperands, t }) =>
        operandCount(condition.operator as FilterOperator) === 2 ? (
          /* One control for both ends rather than two pickers: it says the
             run's length while it is drawn, takes the ends in either order and
             carries the application's presets. The descriptor is unchanged. */
          <DateRangePicker
            messages={{ end: t('filterTo'), start: t('filterFrom') }}
            onKeyDown={applyOnEnter(apply)}
            onValueChange={(next) => setOperands(iso(next?.start), iso(next?.end))}
            size="sm"
            value={{ start: day(condition.value), end: day(condition.end) }}
            {...(locale === undefined ? {} : { locale })}
            {...(day(min) ? { min: day(min) as PlainDate } : {})}
            {...(day(max) ? { max: day(max) as PlainDate } : {})}
            {...(presets === undefined ? {} : { presets })}
          />
        ) : (
          <DatePicker
            aria-label={t('filterValue')}
            onKeyDown={applyOnEnter(apply)}
            onValueChange={(next) => setOperand(0, iso(next))}
            size="sm"
            value={day(condition.value)}
            {...(locale === undefined ? {} : { locale })}
            {...(day(min) ? { min: day(min) as PlainDate } : {})}
            {...(day(max) ? { max: day(max) as PlainDate } : {})}
          />
        )
      }
      kind="date"
      operators={narrowed('date', props.operators)}
      props={props as never}
      rangeOperand
      {...(props.conditions === undefined ? {} : { conditions: props.conditions })}
    />
  );
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
 * and the list behind it — at the column's own granularity, which is what
 * decides the precision the descriptor is written at and the engine compares
 * at: a picker writing minutes produces `09:14`, and `is 09:14` then matches
 * every second of that minute.
 */
export function TableTimeFilter(props: TableTimeFilterProps) {
  const { granularity, hourCycle, locale, max, min, options, presets, step } = props;
  const iso = (value: unknown) =>
    isPlainTime(value) ? toISOTime(value, granularity ?? 'minute') : null;
  const bounds = {
    ...(granularity === undefined ? {} : { granularity }),
    ...(hourCycle === undefined ? {} : { hourCycle }),
    ...(locale === undefined ? {} : { locale }),
    ...(options === undefined ? {} : { options }),
    ...(step === undefined ? {} : { step }),
    ...(timeOf(min) ? { min: timeOf(min) as PlainTime } : {}),
    ...(timeOf(max) ? { max: timeOf(max) as PlainTime } : {}),
  };

  return (
    <TableFilterShell
      body={({ apply, condition, setOperand, setOperands, t }) =>
        operandCount(condition.operator as FilterOperator) === 2 ? (
          /* `between` is one `time-range-picker`: it says the run's length
             while it is drawn, its end list refuses the times before the
             start, and it carries the application's presets. The descriptor
             is unchanged. A pair whose start is later than its end is the
             overnight window to the engine and `order` to the picker; the
             pair reaches the descriptor either way, and the picker's `wrap`,
             pending in `docs/process/build-order.md`, is what lifts the mark. No
             `applyOnEnter`: the frame is a button, and `Enter` on it opens
             the picker. */
          <TimeRangePicker
            messages={{ start: t('filterFrom'), end: t('filterTo') }}
            onValueChange={(next) => setOperands(iso(next?.start), iso(next?.end))}
            size="sm"
            value={{ start: timeOf(condition.value), end: timeOf(condition.end) }}
            {...bounds}
            {...(presets === undefined ? {} : { presets })}
          />
        ) : (
          <TimePicker
            aria-label={t('filterValue')}
            onKeyDown={applyOnEnter(apply)}
            onValueChange={(next) => setOperand(0, iso(next))}
            size="sm"
            value={timeOf(condition.value)}
            {...bounds}
          />
        )
      }
      kind="time"
      operators={narrowed('time', props.operators)}
      props={props as never}
      rangeOperand
      {...(props.conditions === undefined ? {} : { conditions: props.conditions })}
    />
  );
}

/**
 * A column of dates with times. The operand is `datetime-picker`, the
 * seven-segment field and the two surfaces behind it. A value with one half
 * missing reaches the draft as no operand at all, so the condition stays
 * inactive until both halves exist — the engine's one rule for a missing
 * operand, and the reason Apply reports nothing for a date without a time.
 */
export function TableDateTimeFilter(props: TableDateTimeFilterProps) {
  const { granularity, hourCycle, locale, max, min, presets, step, timeZone } = props;
  const iso = (value: unknown) =>
    isPlainDateTime(value)
      ? `${toISODate(value.date)}T${toISOTime(value.time, granularity ?? 'minute')}`
      : null;
  const bounds = {
    ...(granularity === undefined ? {} : { granularity }),
    ...(hourCycle === undefined ? {} : { hourCycle }),
    ...(locale === undefined ? {} : { locale }),
    ...(step === undefined ? {} : { step }),
    ...(timeZone === undefined ? {} : { timeZone }),
    ...(dateTimeOf(min) ? { min: dateTimeOf(min) as PlainDateTime } : {}),
    ...(dateTimeOf(max) ? { max: dateTimeOf(max) as PlainDateTime } : {}),
  };

  return (
    <TableFilterShell
      body={({ apply, condition, setOperand, setOperands, t }) =>
        operandCount(condition.operator as FilterOperator) === 2 ? (
          /* `between` is one `datetime-range-picker`: the run's length said
             while it is drawn, the dates ordered with each time kept on its
             end, and the application's presets. An end still open reaches the
             draft as no operand, so the condition stays inactive until both
             exist. No `applyOnEnter`: the frame is a button. */
          <DateTimeRangePicker
            messages={{ start: t('filterFrom'), end: t('filterTo') }}
            onValueChange={(next) => setOperands(iso(next?.start), iso(next?.end))}
            size="sm"
            value={{ start: dateTimeOf(condition.value), end: dateTimeOf(condition.end) }}
            {...bounds}
            {...(presets === undefined ? {} : { presets })}
          />
        ) : (
          <DateTimePicker
            aria-label={t('filterValue')}
            onKeyDown={applyOnEnter(apply)}
            onValueChange={(next) => setOperand(0, iso(next))}
            size="sm"
            value={dateTimeOf(condition.value)}
            {...bounds}
          />
        )
      }
      kind="datetime"
      operators={narrowed('datetime', props.operators)}
      props={props as never}
      rangeOperand
      {...(props.conditions === undefined ? {} : { conditions: props.conditions })}
    />
  );
}

/**
 * A column of yes and no. Three answers rather than two: the third is not being
 * filtered at all, which is what Clear leaves and what an empty draft is.
 */
export function TableBooleanFilter(props: TableBooleanFilterProps) {
  return (
    <TableFilterShell
      body={({ condition, setOperand, t }) => (
        <RadioGroup
          aria-label={t('filterValue')}
          onValueChange={(next) => setOperand(0, next === 'true')}
          orientation="horizontal"
          size="sm"
          value={
            condition.value === undefined || condition.value === null ? '' : String(condition.value)
          }
        >
          <Radio value="true">{t('true')}</Radio>
          <Radio value="false">{t('false')}</Radio>
        </RadioGroup>
      )}
      kind="boolean"
      operators={narrowed('boolean', props.operators)}
      props={props as never}
      {...(props.conditions === undefined ? {} : { conditions: props.conditions })}
    />
  );
}

/**
 * A column filtered to values the consumer named: the list, its search and the
 * checkbox that covers what the search left.
 *
 * One condition, and the design says why: `anyOf A and anyOf B` is
 * `anyOf (A ∩ B)`, so every pair of set conditions collapses to a single list.
 */
export function TableSetFilter(props: TableSetFilterProps) {
  const { operand = 'list', options = [], searchThreshold = 8, searchable } = props;

  return (
    <TableFilterShell
      body={({ announce, apply, condition, setOperand, t }) =>
        operand === 'tags' ? (
          <TagsOperand
            apply={apply}
            chosen={(condition.value as readonly string[] | null) ?? []}
            onChange={(next) => setOperand(0, next)}
            options={options}
            t={t}
          />
        ) : (
          <SetOperand
            announce={announce}
            chosen={(condition.value as readonly string[] | null) ?? []}
            onChange={(next) => setOperand(0, next)}
            options={options}
            searchThreshold={searchThreshold}
            t={t}
            {...(searchable === undefined ? {} : { searchable })}
          />
        )
      }
      kind="set"
      operandName={operand}
      operators={narrowed('set', props.operators)}
      props={props as never}
      singleCondition
    />
  );
}

interface TagsOperandProps {
  apply: () => void;
  chosen: readonly string[];
  onChange: (values: readonly string[]) => void;
  options: readonly TableFilterOption[];
  t: FamilyTranslator<TableMessages>;
}

/**
 * The chosen values as chips, for a list too long to tick. With `options`, a
 * typed value outside them is refused — and announced — by `tags-input`'s own
 * validation, and the options are a `datalist`: native completion in every
 * engine, with no second listbox inside the panel. Without `options` any
 * value is admitted, because a list too long to tick is often a list the page
 * does not hold in full.
 *
 * `Enter` with pending text commits a chip, which is `tags-input`'s own key;
 * `Enter` on an empty field applies, which is the panel's.
 */
function TagsOperand({ apply, chosen, onChange, options, t }: TagsOperandProps) {
  const base = useId();
  const known = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);
  const constrained = options.length > 0;

  return (
    <>
      <TagsInput
        aria-label={t('filterValue')}
        formatLabel={(value) => known.get(value)?.label ?? value}
        fullWidth
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.defaultPrevented && event.currentTarget.value === '')
            apply();
        }}
        onValueChange={(next) => onChange(next)}
        size="sm"
        value={chosen}
        {...(constrained
          ? {
              invalidValues: 'refuse' as const,
              list: `${base}-options`,
              validate: (text: string) => known.has(text),
            }
          : {})}
      />
      {constrained ? (
        <datalist id={`${base}-options`}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label ?? option.value}
            </option>
          ))}
        </datalist>
      ) : null}
    </>
  );
}

interface SetOperandProps {
  announce: (message: string) => void;
  chosen: readonly string[];
  onChange: (values: readonly string[]) => void;
  options: readonly TableFilterOption[];
  searchThreshold: number;
  searchable?: boolean | undefined;
  t: FamilyTranslator<TableMessages>;
}

function SetOperand({
  announce,
  chosen,
  onChange,
  options,
  searchThreshold,
  searchable,
  t,
}: SetOperandProps) {
  const base = useId();
  const [query, setQuery] = useState('');

  /**
   * The collator `combobox` filters its own options with, rather than a fold
   * that strips combining marks: `normalize('NFD')` is an English answer
   * wearing a Unicode one — it turns `ø` into `ø` and leaves `ß` alone.
   */
  const compare = useMemo(() => createFilter({ sensitivity: 'base' }), []);
  /** The options a query leaves. One rule, so the list and the count agree. */
  const matching = (text: string) =>
    text === ''
      ? options
      : options.filter((option) => compare.contains(option.label ?? option.value, text));

  const shown = matching(query);
  const covered = shown.filter((option) => chosen.includes(option.value));
  const searching = searchable ?? options.length >= searchThreshold;

  return (
    <>
      {searching ? (
        <div data-part="filter-search" data-part-filter-search="">
          <TextField
            aria-controls={`${base}-list`}
            aria-label={t('filterSearch')}
            clearable
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              /* A list that shortens under a reader who cannot see it says
                 nothing otherwise. */
              announce(t('filterMatches', { count: matching(next).length }));
            }}
            placeholder={t('filterSearch')}
            size="sm"
            value={query}
          />
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p data-part="filter-empty" data-part-filter-empty="">
          {t('filterEmpty')}
        </p>
      ) : (
        <div data-part="filter-list" data-part-filter-list="" id={`${base}-list`}>
          <div data-covering="" data-part="filter-option" data-part-filter-option="">
            <Checkbox
              checked={covered.length > 0 && covered.length === shown.length}
              indeterminate={covered.length > 0 && covered.length < shown.length}
              onCheckedChange={(checked) => {
                const visible = shown.map((option) => option.value);
                onChange(
                  checked
                    ? [...new Set([...chosen, ...visible])]
                    : chosen.filter((held) => !visible.includes(held)),
                );
              }}
            >
              {t('filterSelectAll')}
            </Checkbox>
            <span data-count="">{shown.length}</span>
          </div>

          {shown.map((option) => (
            <div data-part="filter-option" data-part-filter-option="" key={option.value}>
              <Checkbox
                checked={chosen.includes(option.value)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...chosen, option.value]
                      : chosen.filter((held) => held !== option.value),
                  )
                }
              >
                {option.label ?? option.value}
              </Checkbox>
              {option.count === undefined ? null : <span data-count="">{option.count}</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
