import { withSelectorKey } from '@slotted/core/selector-key';
import {
  defaultOperator as kindDefaultOperator,
  emptyFilter,
  insertNodeAt,
  isFilterGroup,
  operandCount,
  operatorsFor,
  removeNodeAt,
  spokenOperator,
  updateNodeAt,
  withCondition,
  withGroupJoin,
} from '@slotted/core/filter';
import type {
  FilterCondition,
  FilterDescriptor,
  FilterGroup,
  FilterJoin,
  FilterNode,
  FilterOperator,
  FilterPath,
  FilterRule,
} from '@slotted/core/filter';
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
import type { PlainDate } from '@slotted/core/date';
import { filterBarMessages } from '@slotted/core/i18n';
import type { FamilyTranslator, FilterBarMessages } from '@slotted/core/i18n';
import { Fragment, useId } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Button, IconButton } from '../button';
import { DatePicker } from '../date-picker';
import { DateTimePicker } from '../datetime-picker';
import { Glyph, Icon } from '../icon';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
} from '../multi-select';
import { NumberField } from '../number-field';
import { Segment, SegmentedControl } from '../segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { TextField } from '../text-field';
import { TimePicker } from '../time-picker';
import type { FilterBarField, FilterBarOperandProps, FilterBarSize } from './filter-bar.types';

type Condition = FilterCondition<string, unknown>;

/** What every editor in the family shares: the fields, the words, the size, the consumer's operand. */
export interface RuleEnvironment {
  fields: readonly FilterBarField[];
  /** The family's words in the language in force, with the bar's `messages` laid over them. */
  t: FamilyTranslator<FilterBarMessages>;
  size: FilterBarSize;
  renderOperand: ((props: FilterBarOperandProps) => ReactNode) | undefined;
  /** What `Enter` in an operand does in the surface the rule is drawn in. */
  apply: () => void;
  /** The one rule card open in the builder's card form, by its path joined with dots. */
  expanded?: string | null | undefined;
  onExpandedChange?: ((path: string | null) => void) | undefined;
}

export function fieldByKey(fields: readonly FilterBarField[], key: string) {
  return fields.find((field) => field.key === key);
}

/** An operator's name, or the operator itself when the catalog names no such operator. */
export function operatorName(t: FamilyTranslator<FilterBarMessages>, operator: string) {
  return operator in filterBarMessages.base.operators
    ? t(`operators.${operator as FilterOperator}`)
    : operator;
}

/**
 * A message's text on either side of one slot, for a sentence that holds a
 * control: the join chooser stands where `{join}` stands, in the order the
 * language writes it.
 */
export function aroundSlot(written: (mark: string) => string): [string, string] {
  const mark = '\u0000';
  const [before = '', after = ''] = written(mark).split(mark);
  return [before.trim(), after.trim()];
}

/** The rule a field starts with: its default, else one empty condition on its default operator. */
export function blankRule(field: FilterBarField): FilterDescriptor {
  if (field.defaultValue) return field.defaultValue;
  const operator = field.defaultOperator ?? kindDefaultOperator(field.kind);
  return emptyFilter(field.kind, operator as never) as FilterDescriptor;
}

/**
 * A condition in the words a chip and a rule card write it with: the operator
 * as the sentence reads it, and the value — a list of more than two written as
 * its first two and a count, the whole list kept in `full` for the name and the
 * title.
 */
export function ruleWords(
  t: FamilyTranslator<FilterBarMessages>,
  field: FilterBarField | undefined,
  filter: FilterDescriptor | null | undefined,
): { operator: string; value: string; full: string; operands: number } {
  const kind = filter?.kind ?? field?.kind ?? 'text';
  const condition: Condition = (filter?.conditions[0] as Condition | undefined) ?? {
    operator: field ? (field.defaultOperator ?? kindDefaultOperator(field.kind)) : 'contains',
  };
  const operands = operandCount(condition.operator as FilterOperator);
  const operator = operatorName(t, spokenOperator(kind, condition));
  const write = (value: unknown) =>
    field?.options?.find((option) => option.value === value)?.label ?? String(value);
  const present = (value: unknown) =>
    value !== undefined &&
    value !== null &&
    value !== '' &&
    !(Array.isArray(value) && value.length === 0);
  if (operands === 0) return { operator, value: '', full: '', operands };
  if (kind === 'set') {
    const values = ((condition.value as readonly unknown[] | undefined) ?? []).map(write);
    const full = values.join(', ');
    const value =
      values.length > 2
        ? t('moreValues', { values: values.slice(0, 2).join(', '), count: values.length - 2 })
        : full;
    return { operator, value, full, operands };
  }
  if (operands === 2) {
    if (!present(condition.value) || !present(condition.end)) {
      return { operator, value: '', full: '', operands };
    }
    const range = `${write(condition.value)} – ${write(condition.end)}`;
    return { operator, value: range, full: range, operands };
  }
  const value = present(condition.value) ? write(condition.value) : '';
  return { operator, value, full: value, operands };
}

/** A field's glyph: a name from the glyph set, or the consumer's own node. */
export function FieldIcon({ icon }: { icon: FilterBarField['icon'] }) {
  if (icon === undefined || icon === null || icon === false) return null;
  return <Icon>{typeof icon === 'string' ? <Glyph name={icon as never} /> : icon}</Icon>;
}

/** `Enter` applies, and the consumer's own handler ran first. */
export function applyOnEnter(apply: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.defaultPrevented) apply();
  };
}

const day = (value: unknown) => (value ? parseISODate(String(value)) : null);
const time = (value: unknown) => (value ? parseISOTime(String(value)) : null);
const dateTime = (value: unknown) => (value ? parseISODateTime(String(value)) : null);

/**
 * The operand control a kind draws, the same choice `table`'s five typed
 * filters make: a text field, a number field, the whole date picker, a list
 * of the two truths, a multi-select over the field's options. Replaceable by
 * the consumer through `renderOperand`, which is the seam round 12 uses.
 */
export function Operand(
  props: FilterBarOperandProps & { render?: RuleEnvironment['renderOperand'] },
) {
  const { apply, field, label, onValueChange, render, size, value } = props;
  const custom = render?.(props);
  if (custom !== undefined && custom !== null) return <>{custom}</>;

  const bounds = {
    ...(field.min === undefined ? {} : { min: field.min }),
    ...(field.max === undefined ? {} : { max: field.max }),
  };

  switch (field.kind) {
    case 'number':
      return (
        <NumberField
          aria-label={label}
          onKeyDown={applyOnEnter(apply)}
          onValueChange={(next) => onValueChange(next)}
          placeholder={label}
          size={size}
          value={(value as number | null) ?? null}
          {...(typeof field.min === 'number' ? { min: field.min } : {})}
          {...(typeof field.max === 'number' ? { max: field.max } : {})}
          {...(field.step === undefined ? {} : { step: field.step })}
        />
      );
    case 'date':
      return (
        <DatePicker
          aria-label={label}
          onKeyDown={applyOnEnter(apply)}
          onValueChange={(next) => onValueChange(isPlainDate(next) ? toISODate(next) : null)}
          size={size}
          value={day(value)}
          {...(day(bounds.min) ? { min: day(bounds.min) as PlainDate } : {})}
          {...(day(bounds.max) ? { max: day(bounds.max) as PlainDate } : {})}
        />
      );
    case 'time':
      return (
        <TimePicker
          aria-label={label}
          onKeyDown={applyOnEnter(apply)}
          onValueChange={(next) =>
            onValueChange(isPlainTime(next) ? toISOTime(next, 'minute') : null)
          }
          size={size}
          value={time(value)}
        />
      );
    case 'datetime':
      return (
        <DateTimePicker
          aria-label={label}
          onKeyDown={applyOnEnter(apply)}
          onValueChange={(next) =>
            onValueChange(isPlainDateTime(next) ? toISODateTime(next) : null)
          }
          size={size}
          value={dateTime(value)}
        />
      );
    case 'boolean':
      return (
        <Select
          fullWidth
          items={[
            { label: 'true', value: 'true' },
            { label: 'false', value: 'false' },
          ]}
          onValueChange={(next) => onValueChange(next === 'true')}
          size={size}
          value={value === true ? 'true' : value === false ? 'false' : null}
        >
          <SelectTrigger aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      );
    case 'set': {
      const options = field.options ?? [];
      return (
        <MultiSelect
          items={options}
          onValueChange={(next) => onValueChange([...next])}
          size={size}
          value={(value as readonly string[] | null) ?? []}
        >
          <MultiSelectControl aria-label={label} placeholder={label} />
          <MultiSelectContent aria-label={label}>
            {options.map((option) => (
              <MultiSelectItem key={option.value} value={option.value}>
                {option.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      );
    }
    default:
      return (
        <TextField
          aria-label={label}
          onKeyDown={applyOnEnter(apply)}
          onValueChange={(next) => onValueChange(next)}
          placeholder={label}
          size={size}
          value={(value as string | null) ?? ''}
        />
      );
  }
}

export interface ConditionEditorProps {
  environment: RuleEnvironment;
  field: FilterBarField;
  condition: Condition;
  onConditionChange: (condition: Condition) => void;
  /** Draws the operator control. A chip's value popover leaves it to the chip's operator segment. */
  withOperator?: boolean | undefined;
  /** Ids for the two parts, which a rule card's sentence names in `aria-controls`. */
  ids?: { operator: string; operand: string } | undefined;
  /** The rule is invalid: the operator select says so itself, edge and ring. */
  invalid?: boolean | undefined;
}

/**
 * One condition: the operator and its operands. An operand the new operator
 * still takes survives the change, `table`'s rule.
 */
export function ConditionEditor({
  condition,
  environment,
  field,
  ids,
  invalid,
  onConditionChange,
  withOperator = true,
}: ConditionEditorProps) {
  const { apply, renderOperand, size, t } = environment;
  const operators = field.operators ?? (operatorsFor(field.kind) as readonly string[]);
  const operands = operandCount(condition.operator as FilterOperator);

  function setOperator(operator: string) {
    const before = operandCount(condition.operator as FilterOperator);
    const after = operandCount(operator as FilterOperator);
    onConditionChange({
      operator,
      ...(after >= 1 && before >= 1 ? { value: condition.value } : {}),
      ...(after === 2 && before === 2 ? { end: condition.end } : {}),
    });
  }

  const operandProps = (slot: 0 | 1): FilterBarOperandProps => ({
    apply,
    field,
    index: slot,
    label: operands === 2 ? (slot === 0 ? t('from') : t('to')) : t('value'),
    onValueChange: (operand) =>
      onConditionChange(
        slot === 0 ? { ...condition, value: operand } : { ...condition, end: operand },
      ),
    operator: condition.operator as FilterOperator,
    size,
    value: (slot === 0 ? condition.value : condition.end) ?? null,
  });

  return (
    <>
      {withOperator ? (
        <div data-part="operator" data-part-operator="" id={ids?.operator}>
          <Select
            fullWidth
            {...(invalid ? { invalid: true } : {})}
            items={operators.map((operator) => ({
              label: operatorName(t, operator),
              value: operator,
            }))}
            onValueChange={(next) => setOperator(next as string)}
            size={size}
            value={condition.operator}
          >
            <SelectTrigger aria-label={t('operator')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((operator) => (
                <SelectItem key={operator} value={operator}>
                  {operatorName(t, operator)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div data-part="operand" data-part-operand="" id={ids?.operand}>
        {Array.from({ length: operands }, (_, slot) => (
          <Operand key={slot} render={renderOperand} {...operandProps(slot as 0 | 1)} />
        ))}
      </div>
    </>
  );
}

export interface RuleEditorProps {
  environment: RuleEnvironment;
  rule: FilterRule;
  /** The rule's path inside the root, which names its card. */
  path: FilterPath;
  /** Which fields the field chooser lists. Defaults to every field. */
  choices?: readonly FilterBarField[] | undefined;
  onRuleChange: (rule: FilterRule) => void;
  onRemove?: (() => void) | undefined;
  invalid?: boolean | undefined;
}

/** One rule row in the builder: field, operator, operand, remove. */
export function RuleEditor({
  choices,
  environment,
  invalid,
  onRemove,
  onRuleChange,
  path,
  rule,
}: RuleEditorProps) {
  const { fields, size, t } = environment;
  const id = useId();
  const key = path.join('.');
  const expanded = environment.expanded === key;
  const field = fieldByKey(fields, rule.field);
  const condition: Condition = rule.filter.conditions[0] ?? {
    operator: field ? (field.defaultOperator ?? kindDefaultOperator(field.kind)) : 'contains',
  };
  const operands = field ? operandCount(condition.operator as FilterOperator) : 0;
  const list = choices ?? fields;

  function changeField(key: string) {
    const next = fieldByKey(fields, key);
    if (!next) return;
    onRuleChange({ field: key, filter: blankRule(next) });
  }

  const words = ruleWords(t, field, rule.filter);
  const label = field?.label ?? t('unknownField', { field: rule.field });

  return (
    <div
      data-kind={field?.kind}
      data-operands={operands}
      data-part="rule"
      data-part-rule=""
      {...(invalid || !field ? { 'data-invalid': '' } : {})}
      {...(expanded ? { 'data-expanded': '' } : {})}
    >
      {/* The card form's header: drawn by the stylesheet only while the builder is narrow. */}
      <button
        aria-controls={`${id}field ${id}operator ${id}operand`}
        aria-expanded={expanded}
        data-part="rule-summary"
        data-part-rule-summary=""
        onClick={() => environment.onExpandedChange?.(expanded ? null : key)}
        type="button"
      >
        <span data-sentence="">
          <span data-field="">{label}</span> <span data-operator="">{words.operator}</span>
          {words.operands > 0 ? (
            <>
              {' '}
              <span data-value="">{words.value || t('noValue')}</span>
            </>
          ) : null}
        </span>
        <Icon>
          <Glyph name="chevron-down" />
        </Icon>
      </button>
      <div data-part="field" data-part-field="" id={`${id}field`}>
        <Select
          fullWidth
          {...(invalid || !field ? { invalid: true } : {})}
          items={list.map((entry) => ({ label: entry.label, value: entry.key }))}
          onValueChange={(next) => changeField(next as string)}
          size={size}
          value={rule.field}
        >
          <SelectTrigger aria-label={t('field')}>
            <SelectValue
              placeholder={field ? undefined : t('unknownField', { field: rule.field })}
            />
          </SelectTrigger>
          <SelectContent>
            {list.map((entry) => (
              <SelectItem key={entry.key} value={entry.key}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {field ? (
        <ConditionEditor
          condition={condition}
          environment={environment}
          field={field}
          ids={{ operand: `${id}operand`, operator: `${id}operator` }}
          invalid={invalid}
          onConditionChange={(next) =>
            onRuleChange({
              field: rule.field,
              filter: withCondition(rule.filter, 0, next as never),
            })
          }
        />
      ) : (
        <>
          <div data-part="operator" data-part-operator="" id={`${id}operator`} />
          <div data-part="operand" data-part-operand="" id={`${id}operand`} />
        </>
      )}
      {onRemove ? (
        <button
          aria-label={t('removeRule')}
          data-part="remove"
          data-part-remove=""
          onClick={onRemove}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

export interface GroupEditorProps {
  environment: RuleEnvironment;
  group: FilterGroup;
  /** The path of this group inside the root, `[]` for the root. */
  path: FilterPath;
  root: FilterGroup;
  onRootChange: (root: FilterGroup) => void;
  /** The field a new rule starts with. */
  firstField: FilterBarField | undefined;
  extra?: ReactNode;
}

/**
 * A group: its join, its rules and groups in order, and the controls that grow
 * it. Recursive, so a group holds a group; the depth is on the element for the
 * rail the stylesheet draws.
 */
export function GroupEditor({
  environment,
  extra,
  firstField,
  group,
  onRootChange,
  path,
  root,
}: GroupEditorProps) {
  const { size, t } = environment;
  const depth = path.length;

  const joinControl = (
    <SegmentedControl
      aria-label={t('match')}
      onValueChange={(join) => onRootChange(withGroupJoin(root, path, join as FilterJoin))}
      size="sm"
      value={group.join}
    >
      <Segment value="and">{t('matchAll')}</Segment>
      <Segment value="or">{t('matchAny')}</Segment>
    </SegmentedControl>
  );
  const [before, after] = aroundSlot((join) => t('matches', { join }));
  const joinWord = group.join === 'and' ? t('matchAll') : t('matchAny');
  const removeGroup =
    depth > 0 ? (
      <IconButton
        aria-label={t('removeGroup')}
        onClick={() => onRootChange(removeNodeAt(root, path))}
        render={(props) => <button {...withSelectorKey(props, 'part', 'remove-group')} />}
        size={size === 'lg' ? 'md' : 'sm'}
        title={t('removeGroup')}
        tone="secondary"
        variant="ghost"
      >
        <Icon>
          <Glyph name="trash" />
        </Icon>
      </IconButton>
    ) : null;

  /* A rule just added opens as an expanded card, where its three controls are. */
  function addRule() {
    if (!firstField) return;
    onRootChange(
      insertNodeAt(root, path, { field: firstField.key, filter: blankRule(firstField) }),
    );
    environment.onExpandedChange?.([...path, group.rules.length].join('.'));
  }
  function addGroup() {
    if (!firstField) return;
    onRootChange(
      insertNodeAt(root, path, {
        join: group.join === 'and' ? 'or' : 'and',
        rules: [{ field: firstField.key, filter: blankRule(firstField) }],
      }),
    );
    environment.onExpandedChange?.([...path, group.rules.length, 0].join('.'));
  }

  return (
    <fieldset data-depth={depth} data-part="group" data-part-group="">
      <legend>{t('matches', { join: joinWord })}</legend>
      <div data-part="join" data-part-join="">
        {before ? <span>{before}</span> : null}
        {joinControl}
        {after ? <span>{after}</span> : null}
        {removeGroup}
      </div>
      <div data-part="rules" data-part-rules="">
        {group.rules.map((node: FilterNode, index) => {
          const childPath = [...path, index];
          /* The word that joins this row to the one above: "Where" on the first. */
          const conjunction = (
            <span data-part="conjunction" data-part-conjunction="">
              {index === 0 ? t('where') : t(`joins.${group.join}`)}
            </span>
          );
          if (isFilterGroup(node)) {
            return (
              <Fragment key={index}>
                {conjunction}
                <GroupEditor
                  environment={environment}
                  firstField={firstField}
                  group={node}
                  onRootChange={onRootChange}
                  path={childPath}
                  root={root}
                />
              </Fragment>
            );
          }
          const field = fieldByKey(environment.fields, node.field);
          return (
            <Fragment key={index}>
              {conjunction}
              <RuleEditor
                environment={environment}
                path={childPath}
                onRemove={
                  field?.required ? undefined : () => onRootChange(removeNodeAt(root, childPath))
                }
                onRuleChange={(rule) => onRootChange(updateNodeAt(root, childPath, rule))}
                rule={node}
              />
            </Fragment>
          );
        })}
      </div>
      <div data-part="actions" data-part-actions="">
        <Button
          disabled={!firstField}
          onClick={addRule}
          render={(props) => <button {...withSelectorKey(props, 'part', 'add-rule')} />}
          size={size === 'lg' ? 'md' : 'sm'}
          start={
            <Icon>
              <Glyph name="plus" />
            </Icon>
          }
          tone="secondary"
          variant={depth === 0 ? 'outline' : 'ghost'}
        >
          {t('addRule')}
        </Button>
        <Button
          disabled={!firstField}
          onClick={addGroup}
          render={(props) => <button {...withSelectorKey(props, 'part', 'add-group')} />}
          size={size === 'lg' ? 'md' : 'sm'}
          start={
            <Icon>
              <Glyph name="plus" />
            </Icon>
          }
          tone="secondary"
          variant={depth === 0 ? 'outline' : 'ghost'}
        >
          {t('addGroup')}
        </Button>
        {depth === 0 ? extra : null}
      </div>
    </fieldset>
  );
}
