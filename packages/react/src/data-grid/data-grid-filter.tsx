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
import type {
  FilterCondition,
  FilterDescriptor,
  FilterJoin,
  FilterKind,
  FilterOperator,
} from '@slotted/core/filter';
import {
  isPlainDate,
  isPlainDateTime,
  isPlainTime,
  toISODate,
  toISODateTime,
  toISOTime,
} from '@slotted/core/date';
import { FILTER_ROW, type ResolvedGridColumn } from '@slotted/core/grid';
import type { DataGridMessages, FamilyTranslator } from '@slotted/core/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Button } from '../button';
import { DatePicker } from '../date-picker';
import { DateRangePicker } from '../date-range-picker';
import { DateTimePicker } from '../datetime-picker';
import { DateTimeRangePicker } from '../datetime-range-picker';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
} from '../multi-select';
import { NumberField } from '../number-field';
import { Popover, PopoverAnchor, PopoverContent, PopoverLayer } from '../popover';
import { Segment, SegmentedControl } from '../segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { TextField } from '../text-field';
import { TimePicker } from '../time-picker';
import { TimeRangePicker } from '../time-range-picker';
import { useDataGridInternal } from './data-grid-context';
import { dateOf, dateTimeOf, timeOf } from './data-grid-editors';
import { cellStyle, columnAttributes } from './data-grid-constants';

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

export function filterKindOf<Row>(column: ResolvedGridColumn<Row>): FilterKind | null {
  return FILTER_KINDS.includes(column.kind) ? (column.kind as FilterKind) : null;
}

function sameFilter(a: FilterDescriptor | null, b: FilterDescriptor | null) {
  return serializeFilter(a) === serializeFilter(b);
}

/* ── One operand control ─────────────────────────────────────────────── */

interface OperandProps<Row> {
  column: ResolvedGridColumn<Row>;
  kind: FilterKind;
  operator: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  label: string;
  variant: 'plain' | 'outline';
  t: FamilyTranslator<DataGridMessages>;
  locale: string | undefined;
  counts?: ReadonlyMap<string, number> | undefined;
  placeholder?: string | undefined;
  autoFocus?: boolean | undefined;
}

/** The kinds whose `between` is one range picker rather than two fields. */
const RANGE_PICKER_KINDS: readonly string[] = ['date', 'time', 'datetime'];

/** Whether the operator's two operands are edited in one control. */
function isRangeOperand(kind: FilterKind, operator: string) {
  return operandCount(operator as FilterOperator) === 2 && RANGE_PICKER_KINDS.includes(kind);
}

interface RangeOperandProps {
  kind: FilterKind;
  start: unknown;
  end: unknown;
  onChange: (start: unknown, end: unknown) => void;
  t: FamilyTranslator<DataGridMessages>;
  locale: string | undefined;
  variant: 'plain' | 'outline';
  autoFocus?: boolean | undefined;
}

/**
 * A `between` on a date, a time or a date-time is one range picker: one
 * frame that says the run while it is drawn, takes the ends in either order
 * and fits a column's width, where two fields side by side broke into two
 * lines at the widths a filter row has. The rule `table` took in its second
 * reopening. The descriptor is unchanged: two ISO operands.
 */
function RangeOperand({
  kind,
  start,
  end,
  onChange,
  t,
  locale,
  variant,
  autoFocus,
}: RangeOperandProps) {
  const shared = {
    size: 'sm' as const,
    variant,
    ...(autoFocus ? { autoFocus: true } : {}),
    ...(locale === undefined ? {} : { locale }),
  };
  const ends = { messages: { end: t('filterTo'), start: t('filterFrom') } };
  if (kind === 'time') {
    return (
      <TimeRangePicker
        {...shared}
        {...ends}
        onValueChange={(next) =>
          onChange(
            isPlainTime(next?.start) ? toISOTime(next.start, 'minute') : null,
            isPlainTime(next?.end) ? toISOTime(next.end, 'minute') : null,
          )
        }
        value={{ start: timeOf(start), end: timeOf(end) }}
      />
    );
  }
  if (kind === 'datetime') {
    return (
      <DateTimeRangePicker
        {...shared}
        {...ends}
        onValueChange={(next) =>
          onChange(
            isPlainDateTime(next?.start) ? toISODateTime(next.start) : null,
            isPlainDateTime(next?.end) ? toISODateTime(next.end) : null,
          )
        }
        value={{ start: dateTimeOf(start), end: dateTimeOf(end) }}
      />
    );
  }
  return (
    <DateRangePicker
      {...shared}
      messages={{ end: t('filterTo'), start: t('filterFrom') }}
      onValueChange={(next) =>
        onChange(
          isPlainDate(next?.start) ? toISODate(next.start) : null,
          isPlainDate(next?.end) ? toISODate(next.end) : null,
        )
      }
      value={{ start: dateOf(start), end: dateOf(end) }}
    />
  );
}

/**
 * The control an operand of a kind is edited in. One family per kind, all
 * at `sm`; `plain` in the filter row and `outline` in the panel. A date, a
 * time and a date-time are pickers — the field with the control that opens
 * the calendar or the list beside it — because a reader who does not type
 * dates still has to filter by one.
 */
function Operand<Row>({
  autoFocus,
  column,
  counts,
  kind,
  label,
  t,
  locale,
  onChange,
  onKeyDown,
  placeholder,
  value,
  variant,
}: OperandProps<Row>) {
  const shared = {
    'aria-label': label,
    size: 'sm' as const,
    variant,
    ...(autoFocus ? { autoFocus: true } : {}),
    ...(onKeyDown ? { onKeyDown } : {}),
    ...(locale === undefined ? {} : { locale }),
  };
  switch (kind) {
    case 'number':
      return (
        <NumberField
          {...shared}
          onValueChange={(next) => onChange(next)}
          placeholder={placeholder ?? label}
          /* An amount in a filter is typed, never spun: the steppers took a
             third of a filter cell and a `between` had room for one digit. */
          stepper="none"
          value={typeof value === 'number' ? value : null}
        />
      );
    case 'date':
      return (
        <DatePicker
          {...shared}
          onValueChange={(next) => onChange(isPlainDate(next) ? toISODate(next) : null)}
          value={dateOf(value)}
        />
      );
    case 'time':
      return (
        <TimePicker
          {...shared}
          onValueChange={(next) => onChange(isPlainTime(next) ? toISOTime(next, 'minute') : null)}
          value={timeOf(value)}
        />
      );
    case 'datetime':
      return (
        <DateTimePicker
          {...shared}
          onValueChange={(next) => onChange(isPlainDateTime(next) ? toISODateTime(next) : null)}
          value={dateTimeOf(value)}
        />
      );
    case 'boolean':
      return (
        <Select
          fullWidth
          width="content"
          items={[
            { label: t('filterYes'), value: 'true' },
            { label: t('filterNo'), value: 'false' },
          ]}
          onValueChange={(next) =>
            onChange(next === 'true' ? true : next === 'false' ? false : null)
          }
          size="sm"
          value={value === true ? 'true' : value === false ? 'false' : null}
          variant={variant}
        >
          <SelectTrigger aria-label={label} {...(autoFocus ? { autoFocus: true } : {})}>
            <SelectValue placeholder={t('filterAny')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t('filterYes')}</SelectItem>
            <SelectItem value="false">{t('filterNo')}</SelectItem>
          </SelectContent>
        </Select>
      );
    case 'set': {
      const known = column.column.options ?? [];
      const seen = new Set(known.map((option) => option.value));
      const extra = counts
        ? [...counts.keys()]
            .filter((key) => !seen.has(key))
            .map((key) => ({ value: key, label: key }))
        : [];
      const options = [...known, ...extra];
      const chosen = Array.isArray(value) ? (value as readonly string[]) : [];
      /* The family made for several chosen values, one line high: what does
         not fit collapses into a counting chip and the whole set stays in the
         popup. A `select` with `multiple` drew its chips over the trigger. */
      return (
        <MultiSelect
          fullWidth
          items={options.map((option) => ({ label: option.label, value: option.value }))}
          onValueChange={(next) => onChange([...next])}
          overflow="collapse"
          size="sm"
          value={chosen}
          variant={variant}
          width="content"
          {...(locale === undefined ? {} : { locale })}
        >
          <MultiSelectControl
            aria-label={label}
            placeholder={t('filterAny')}
            {...(autoFocus ? { autoFocus: true } : {})}
          />
          <MultiSelectContent aria-label={label}>
            {options.map((option) => (
              <MultiSelectItem key={option.value} textValue={option.label} value={option.value}>
                {option.label}
                {counts?.has(option.value) ? ` (${counts.get(option.value)})` : ''}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      );
    }
    default:
      return (
        <TextField
          {...shared}
          onValueChange={(next) => onChange(next)}
          placeholder={placeholder ?? label}
          value={value === null || value === undefined ? '' : String(value)}
        />
      );
  }
}

/* ── The panel ───────────────────────────────────────────────────────── */

interface PanelProps<Row> {
  column: ResolvedGridColumn<Row>;
  children: (anchorRef: (node: HTMLElement | null) => void) => ReactNode;
}

/**
 * The compact panel: one line per condition — `[operator] [operand]` in
 * `sm` — the join as two words in the first column of the second line, and
 * Clear and Apply at the trailing edge. It edits a draft: nothing reaches the
 * query until Apply, and closing restores what the panel opened with.
 */
export function DataGridFilterPanel<Row>({ column, children }: PanelProps<Row>) {
  const grid = useDataGridInternal<Row>();
  const kind = filterKindOf(column);
  const open = grid.filterOpen === column.id && kind !== null;
  const committed = grid.filterOf(column.id);
  const t = grid.t;
  const anchor = useRef<HTMLElement | null>(null);
  const setAnchor = useCallback((node: HTMLElement | null) => {
    anchor.current = node;
  }, []);

  const blank = useCallback(() => (kind ? (emptyFilter(kind) as FilterDescriptor) : null), [kind]);
  const [draft, setDraft] = useState<FilterDescriptor | null>(committed ?? blank());
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) setDraft(committed ?? blank());
    wasOpen.current = open;
  }, [open, committed, blank]);

  if (!kind) return <>{children(setAnchor)}</>;

  const panelKind: FilterKind = kind;
  const name = column.column.label;
  const format = {
    join: (join: FilterJoin) => t(`filterJoins.${join}`),
    operator: (operator: FilterOperator) => t(`filterOperators.${operator}`),
  };
  const operators = operatorsFor(kind) as readonly string[];
  const allowed = kind === 'set' ? 1 : 2;
  const current = draft ?? blank()!;
  const conditionAt = (index: number): Condition =>
    current.conditions[index] ?? { operator: defaultOperator(kind) as string };
  const showsSecond = allowed === 2 && isConditionActive(kind, conditionAt(0));

  function close() {
    grid.setFilterOpen(null);
  }
  function apply(source: unknown, reason: 'pointer' | 'keyboard') {
    const next = normalizeFilter(current);
    if (!sameFilter(next, committed)) grid.setFilter(column.id, next, reason, source);
    grid.announce(
      next
        ? t('filterApplied', { column: name, filter: describeFilter(next, format) })
        : t('filterCleared', { column: name }),
    );
    close();
  }
  function clear(source: unknown) {
    setDraft(blank());
    if (committed) grid.setFilter(column.id, null, 'clear', source);
    grid.announce(t('filterCleared', { column: name }));
    close();
  }
  function setOperator(index: number, operator: string) {
    const condition = conditionAt(index);
    const before = operandCount(condition.operator as FilterOperator);
    const after = operandCount(operator as FilterOperator);
    const next: Condition = {
      operator,
      ...(after >= 1 && before >= 1 ? { value: condition.value } : {}),
      ...(after === 2 && before === 2 ? { end: condition.end } : {}),
    };
    setDraft(withCondition(current, index, next as never));
  }
  function setOperand(index: number, slot: 0 | 1, operand: unknown) {
    const condition = conditionAt(index);
    const next: Condition =
      slot === 0 ? { ...condition, value: operand } : { ...condition, end: operand };
    setDraft(withCondition(current, index, next as never));
  }
  const applyOnEnter = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && !event.defaultPrevented) {
      event.preventDefault();
      apply(event, 'keyboard');
    }
  };

  function renderCondition(index: 0 | 1) {
    const condition = conditionAt(index);
    const operands = operandCount(condition.operator as FilterOperator);
    const custom = grid.renderFilterOperand;
    return (
      <div
        data-operands={operands}
        data-part="filter-condition"
        data-part-filter-condition=""
        key={index}
      >
        {index === 1 ? (
          <div data-part="filter-join" data-part-filter-join="">
            <SegmentedControl
              aria-label={t('filterJoin')}
              onValueChange={(join) => setDraft(withJoin(current, join as FilterJoin))}
              size="sm"
              value={current.join}
            >
              <Segment value="and">{format.join('and')}</Segment>
              <Segment value="or">{format.join('or')}</Segment>
            </SegmentedControl>
          </div>
        ) : null}
        <div data-part="filter-operator" data-part-filter-operator="">
          <Select
            fullWidth
            width="content"
            items={operators.map((operator) => ({
              label: format.operator(operator as FilterOperator),
              value: operator,
            }))}
            onValueChange={(next) => setOperator(index, next as string)}
            size="sm"
            value={condition.operator}
          >
            <SelectTrigger
              aria-label={t('filterOperator')}
              {...(index === 0 ? { autoFocus: true } : {})}
            >
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
        <div
          data-kind={panelKind}
          data-part="filter-operand"
          data-part-filter-operand=""
          {...(operands === 2 && !isRangeOperand(panelKind, condition.operator)
            ? { 'data-range': '' }
            : {})}
        >
          {operands === 0 ? null : !custom && isRangeOperand(panelKind, condition.operator) ? (
            <RangeOperand
              end={condition.end ?? null}
              kind={panelKind}
              t={t}
              locale={grid.locale}
              onChange={(start, end) =>
                setDraft(
                  withCondition(current, index, { ...condition, value: start, end } as never),
                )
              }
              start={condition.value ?? null}
              variant="outline"
            />
          ) : (
            ([0, 1] as const).slice(0, operands).map((slot) => {
              const label =
                operands === 2 ? (slot === 0 ? t('filterFrom') : t('filterTo')) : t('filterValue');
              const value = (slot === 0 ? condition.value : condition.end) ?? null;
              if (custom) {
                return (
                  <span key={slot}>
                    {custom({
                      column: column.id,
                      operator: condition.operator,
                      value,
                      setValue: (next) => setOperand(index, slot, next),
                      apply: () => apply(null, 'keyboard'),
                      label,
                    })}
                  </span>
                );
              }
              return (
                <Operand<Row>
                  column={column}
                  counts={panelKind === 'set' ? grid.countsFor(column.id) : undefined}
                  key={slot}
                  kind={panelKind}
                  label={label}
                  t={t}
                  locale={grid.locale}
                  onChange={(next) => setOperand(index, slot, next)}
                  onKeyDown={applyOnEnter}
                  operator={condition.operator}
                  value={value}
                  variant="outline"
                />
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <Popover
      finalFocus={anchor}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      open={open}
      side="bottom"
      align="start"
      size="sm"
    >
      <PopoverAnchor
        render={({ ref }) => (
          <>
            {children((node) => {
              setAnchor(node);
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as { current: HTMLElement | null }).current = node;
            })}
          </>
        )}
      />
      {open ? (
        <PopoverLayer>
          <PopoverContent aria-label={t('filterColumn', { column: name })}>
            <div
              data-kind={panelKind}
              data-part="filter-panel"
              data-part-filter-panel=""
              data-ui="data-grid"
              data-ui-data-grid=""
            >
              {renderCondition(0)}
              {showsSecond ? renderCondition(1) : null}
              <div data-part="filter-actions" data-part-filter-actions="">
                <Button
                  disabled={!isFilterActive(current) && committed === null}
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
      ) : null}
    </Popover>
  );
}

/* ── The filter row ──────────────────────────────────────────────────── */

/**
 * One cell of the filter row: the operand of the kind, `plain`, filling the
 * cell, with the operator as a symbol button at its start. Text and number
 * apply after the debounce and on Enter; the others on change.
 */
export function DataGridFilterCell<Row>({ column }: { column: ResolvedGridColumn<Row> }) {
  const grid = useDataGridInternal<Row>();
  const kind = filterKindOf(column);
  const index = grid.columnIds.indexOf(column.id) + 1;
  const cell = { row: FILTER_ROW, column: column.id };
  const current =
    grid.current !== null && grid.current.row === FILTER_ROW && grid.current.column === column.id;
  const committed = grid.filterOf(column.id);
  const t = grid.t;
  const condition: Condition | null = committed?.conditions[0] ?? null;
  const [operator, setOperator] = useState<string>(
    condition?.operator ?? (kind ? (defaultOperator(kind) as string) : 'contains'),
  );
  const [draft, setDraftValue] = useState<{ value: unknown; end: unknown }>({
    value: condition?.value ?? null,
    end: condition?.end ?? null,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const committedText = serializeFilter(committed);
  const seen = useRef(committedText);
  useEffect(() => {
    if (seen.current === committedText) return;
    seen.current = committedText;
    const next = committed?.conditions[0];
    if (next) {
      setOperator(next.operator);
      setDraftValue({ value: next.value ?? null, end: next.end ?? null });
    } else setDraftValue({ value: null, end: null });
  }, [committedText, committed]);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!kind || !column.filterable) {
    return (
      <div
        {...columnAttributes(column)}
        aria-colindex={index}
        data-part="filter-cell"
        data-part-filter-cell=""
        role="gridcell"
        style={cellStyle(column, index)}
        tabIndex={current ? 0 : -1}
        onFocus={(event) => {
          if (event.target === event.currentTarget) grid.onCellFocus(cell);
        }}
        onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
        onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
        {...(current ? { 'data-current': '' } : {})}
      />
    );
  }

  const filterKind: FilterKind = kind;
  const operators = operatorsFor(kind) as readonly string[];
  const operands = operandCount(operator as FilterOperator);

  function commit(
    next: { operator: string; value: unknown; end: unknown },
    reason: 'pointer' | 'keyboard',
  ) {
    const descriptor = normalizeFilter({
      kind: filterKind,
      join: 'and',
      conditions: [{ operator: next.operator, value: next.value, end: next.end }],
    } as FilterDescriptor);
    if (!sameFilter(descriptor, committed))
      grid.setFilter(column.id, descriptor, reason, undefined);
  }
  function schedule(next: { value: unknown; end: unknown }, immediate: boolean) {
    setDraftValue(next);
    clearTimeout(timer.current);
    const run = () => commit({ operator, ...next }, 'keyboard');
    if (immediate || (kind !== 'text' && kind !== 'number')) run();
    else timer.current = setTimeout(run, grid.filterDebounce);
  }
  function chooseOperator(next: string) {
    setOperator(next);
    const after = operandCount(next as FilterOperator);
    const kept = { value: after >= 1 ? draft.value : null, end: after === 2 ? draft.end : null };
    setDraftValue(kept);
    commit({ operator: next, ...kept }, 'pointer');
  }
  const applyOnEnter = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && !event.defaultPrevented) {
      event.preventDefault();
      clearTimeout(timer.current);
      commit({ operator, ...draft }, 'keyboard');
    }
  };
  const symbol = t(`filterSymbols.${operator as FilterOperator}`);
  const custom = grid.renderFilterOperand;

  return (
    <div
      {...columnAttributes(column)}
      aria-colindex={index}
      data-part="filter-cell"
      data-part-filter-cell=""
      role="gridcell"
      style={cellStyle(column, index)}
      tabIndex={current ? 0 : -1}
      onFocus={(event) => {
        if (event.target === event.currentTarget) grid.onCellFocus(cell);
      }}
      onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
      onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
      {...(committed ? { 'data-filtered': '' } : {})}
      {...(current ? { 'data-current': '' } : {})}
    >
      <div
        data-kind={kind}
        data-part="filter-operand"
        data-part-filter-operand=""
        {...(operands === 2 && !isRangeOperand(kind, operator) ? { 'data-range': '' } : {})}
      >
        <div data-part="filter-operator" data-part-filter-operator="">
          <Menu size="sm">
            <MenuTrigger
              render={(props) => (
                <button
                  {...props}
                  aria-label={t('filterOperatorChosen', {
                    operator: t(`filterOperators.${operator as FilterOperator}`),
                  })}
                  /* The symbol says the operator to a reader who knows the
                     notation; the title says it in words to one who hovers. */
                  title={t(`filterOperators.${operator as FilterOperator}`)}
                  tabIndex={-1}
                  type="button"
                >
                  {symbol}
                </button>
              )}
            />
            <MenuContent>
              {operators.map((entry) => (
                <MenuItem key={entry} onSelect={() => chooseOperator(entry)}>
                  {t(`filterOperators.${entry as FilterOperator}`)}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        </div>
        {operands === 0 ? null : !custom && isRangeOperand(kind, operator) ? (
          <RangeOperand
            end={draft.end}
            kind={kind}
            t={t}
            locale={grid.locale}
            onChange={(start, end) => schedule({ value: start, end }, true)}
            start={draft.value}
            variant="plain"
          />
        ) : (
          ([0, 1] as const).slice(0, operands).map((slot) => {
            const label =
              operands === 2
                ? t('filterRange', {
                    bound: slot === 0 ? 'from' : 'to',
                    column: column.column.label,
                  })
                : t('filterColumn', { column: column.column.label });
            const value = slot === 0 ? draft.value : draft.end;
            const write = (next: unknown, immediate = false) =>
              schedule(slot === 0 ? { ...draft, value: next } : { ...draft, end: next }, immediate);
            if (custom) {
              return (
                <span key={slot}>
                  {custom({
                    column: column.id,
                    operator,
                    value,
                    setValue: (next) => write(next, true),
                    apply: () => commit({ operator, ...draft }, 'keyboard'),
                    label,
                  })}
                </span>
              );
            }
            return (
              <Operand<Row>
                column={column}
                counts={kind === 'set' ? grid.countsFor(column.id) : undefined}
                key={slot}
                kind={kind}
                label={label}
                t={t}
                locale={grid.locale}
                onChange={(next) => write(next, kind !== 'text' && kind !== 'number')}
                onKeyDown={applyOnEnter}
                operator={operator}
                placeholder={
                  operands === 2 ? (slot === 0 ? t('filterFrom') : t('filterTo')) : t('filter')
                }
                value={value}
                variant="plain"
              />
            );
          })
        )}
      </div>
    </div>
  );
}
