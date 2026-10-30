import { writeSelectorKey } from '@slotted/core/selector-key';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
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
import {
  defaultOperator as kindDefaultOperator,
  describeFilter,
  describeFilterGroup,
  emptyFilter,
  emptyFilterGroup,
  firstLevelRules,
  insertNodeAt,
  isFilterActive,
  isFilterGroup,
  normalizeFilterGroup,
  operandCount,
  operatorsFor,
  removeNodeAt,
  ruleFor,
  serializeFilterGroup,
  spokenOperator,
  updateNodeAt,
  withCondition,
  withGroupJoin,
  withoutRuleFor,
  withRuleFor,
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
import { createRemovalFocus, createRovingTabindex } from '@slotted/core/focus';
import { filterBarMessages } from '@slotted/core/i18n';
import type {
  FamilyTranslator,
  FilterBarMessages,
  MessageSlots,
  PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { SlButton, SlButtonStart, SlIconButton } from '@slotted/angular/button';
import { injectMessages } from '@slotted/angular/i18n';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerTitle,
} from '@slotted/angular/drawer';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlKbd } from '@slotted/angular/kbd';
import {
  SlMenu,
  SlMenuGroup,
  SlMenuItem,
  SlMenuItemIcon,
  SlMenuRadioGroup,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import { SlMultiSelect, SlMultiSelectItem } from '@slotted/angular/multi-select';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import {
  SlPopover,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import {
  SlTextField,
  SlTextFieldEnd,
  SlTextFieldInput,
  SlTextFieldStart,
} from '@slotted/angular/text-field';
import { SlTimePicker } from '@slotted/angular/time-picker';

import {
  FILTER_BAR_DEFAULT_APPLY,
  FILTER_BAR_DEFAULT_CHIP_LIMIT,
  FILTER_BAR_DEFAULT_QUERY_DELAY,
  FILTER_BAR_DEFAULT_SIZE,
  injectFilterBarDefaults,
  type FilterBarApply,
  type FilterBarField,
  type FilterBarOpenReason,
  type FilterBarPreset,
  type FilterBarPresetReason,
  type FilterBarQueryReason,
  type FilterBarRevealedReason,
  type FilterBarSize,
  type FilterBarValueReason,
} from './filter-bar.constants';

type Condition = FilterCondition<string, unknown>;

/**
 * Every stop of the one toolbar, in DOM order: the arrows walk the pills, each
 * segment of each chip, more, add, clear and the actions, line after line. A
 * stop the stylesheet hides at this width is skipped by its visibility.
 */
const BAR_ITEMS = [
  'summary',
  'pill',
  'chip-operator',
  'chip-value',
  'chip-remove',
  'more',
  'add',
  'clear',
  'reset',
  'apply',
]
  .map((part) => `[data-part='${part}']`)
  .join(', ');

const SEGMENTS = "[data-part='chip-operator'], [data-part='chip-value'], [data-part='chip-remove']";

/** The bar's narrow breakpoint and the builder's sheet breakpoint, in rems — the stylesheet's. */
const NARROW_REM = 36;

const STICKY_TOP = '--slotted-page-sticky-top';

let counter = 0;

function remToPx(element: Element, rem: number) {
  const size = parseFloat(
    element.ownerDocument.defaultView?.getComputedStyle(element.ownerDocument.documentElement)
      .fontSize ?? '16',
  );
  return rem * (Number.isFinite(size) ? size : 16);
}

function sameGroup(a: FilterGroup | null, b: FilterGroup | null) {
  return serializeFilterGroup(a) === serializeFilterGroup(b);
}

function fieldByKey(fields: readonly FilterBarField[], key: string) {
  return fields.find((field) => field.key === key);
}

/** The family's words in the language in force, with the bar's `messages` laid over them. */
export type FilterBarTranslator = FamilyTranslator<FilterBarMessages>;

/**
 * A translator that calls the one an input holds at the moment it is read, so
 * an editor's template writes `t('key')` and follows both the input and a
 * change of language.
 */
function follow(source: () => FilterBarTranslator): FilterBarTranslator {
  return ((key: string, slots?: MessageSlots) =>
    (source() as (key: string, slots?: MessageSlots) => string)(key, slots)) as FilterBarTranslator;
}

/** An operator's name, or the operator itself when the catalog names no such operator. */
function operatorName(t: FilterBarTranslator, operator: string) {
  return operator in filterBarMessages.base.operators
    ? t(`operators.${operator as FilterOperator}`)
    : operator;
}

/**
 * A message's text on either side of one slot, for a sentence that holds a
 * control: the join chooser stands where `{join}` stands, in the order the
 * language writes it.
 */
function aroundSlot(written: (mark: string) => string): [string, string] {
  const mark = '\u0000';
  const [before = '', after = ''] = written(mark).split(mark);
  return [before.trim(), after.trim()];
}

/** The rule a field starts with: its default, else one empty condition on its default operator. */
function blankRule(field: FilterBarField): FilterDescriptor {
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
function ruleWords(
  t: FilterBarTranslator,
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

function countActive(group: FilterGroup | null): number {
  const active = normalizeFilterGroup(group);
  if (!active) return 0;
  let count = 0;
  const walk = (node: FilterNode) => {
    if (isFilterGroup(node)) node.rules.forEach(walk);
    else count += 1;
  };
  walk(active);
  return count;
}

function isEditable(element: Element | null) {
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (element as HTMLElement).isContentEditable
  );
}

/** What a `slFilterBarOperand` template is handed for one operand. */
export interface FilterBarOperandContext {
  $implicit: FilterBarField;
  field: FilterBarField;
  operator: FilterOperator;
  index: 0 | 1;
  value: unknown;
  set: (value: unknown) => void;
  apply: () => void;
  label: string;
  size: FilterBarSize;
}

/**
 * Replaces the operand control of a field's rules. `slFilterBarOperand` names
 * the field, or `*` for every field. The template is rendered per rule and
 * never built for a closed surface.
 */
@Directive({ selector: 'ng-template[slFilterBarOperand]', standalone: true })
export class SlFilterBarOperand {
  readonly field = input.required<string>({ alias: 'slFilterBarOperand' });
  readonly template = inject<TemplateRef<FilterBarOperandContext>>(TemplateRef);
}

/**
 * Writes this family's part name on a control another family's directive
 * owns. `slButton`, `slIconButton` and `slMenuTriggerFor` each write
 * `data-part` from their host metadata, which erases the one the template
 * wrote — the rule the briefing records for `toolbar`'s overflow control — so
 * the part is written back after the first render, where nothing writes over
 * it again.
 */
@Directive({ selector: '[slFilterBarPart]', standalone: true })
export class SlFilterBarPart {
  readonly part = input.required<string>({ alias: 'slFilterBarPart' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => writeSelectorKey(this.host.nativeElement, 'part', this.part()));
  }
}

/** The consumer's own controls, drawn in the `end` slot. */
@Directive({ selector: '[slFilterBarEnd]', standalone: true })
export class SlFilterBarEnd {}

/** What every editor in the family reads from the bar. */
export interface FilterBarEnvironment {
  fields: () => readonly FilterBarField[];
  t: FilterBarTranslator;
  size: () => FilterBarSize;
  operandTemplates: () => readonly SlFilterBarOperand[];
}

/**
 * One condition — the operator and its operands — with the operand control the
 * kind draws, the same choice `table`'s typed filters make, or the consumer's
 * own template.
 */
@Component({
  selector: '[slFilterBarCondition]',
  standalone: true,
  imports: [
    NgTemplateOutlet,
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
    @if (withOperator()) {
      <div data-part="operator" data-part-operator="" [attr.id]="ids()?.operator ?? null">
        <sl-select
          [size]="size()"
          [fullWidth]="true"
          [invalid]="invalid() ? true : undefined"
          [items]="operatorItems()"
          [attr.aria-label]="t('operator')"
          [value]="condition().operator"
          (valueChange)="setOperator($any($event))"
        >
          @for (operator of operators(); track operator) {
            <sl-select-item [value]="operator">{{ operatorName(operator) }}</sl-select-item>
          }
        </sl-select>
      </div>
    }
    <div data-part="operand" data-part-operand="" [attr.id]="ids()?.operand ?? null">
      @for (slot of slots(); track slot) {
        @if (customTemplate(); as custom) {
          <ng-container
            [ngTemplateOutlet]="custom.template"
            [ngTemplateOutletContext]="context(slot)"
          />
        } @else {
          @switch (field().kind) {
            @case ('number') {
              <div slNumberField [size]="size()">
                <input
                  slNumberFieldInput
                  [value]="$any(operand(slot)) ?? null"
                  [attr.aria-label]="operandLabel(slot)"
                  [attr.placeholder]="operandLabel(slot)"
                  [attr.min]="numberBound(field().min)"
                  [attr.max]="numberBound(field().max)"
                  [attr.step]="field().step ?? null"
                  (valueChange)="setOperand(slot, $event.value)"
                  (keydown.enter)="apply()"
                />
              </div>
            }
            @case ('date') {
              <div
                slDatePicker
                [size]="size()"
                [value]="day(operand(slot))"
                [min]="day(field().min) ?? undefined"
                [max]="day(field().max) ?? undefined"
                [attr.aria-label]="operandLabel(slot)"
                (valueChange)="setOperand(slot, isoDay($event.value))"
                (keydown.enter)="apply()"
              ></div>
            }
            @case ('time') {
              <div
                slTimePicker
                [size]="size()"
                [value]="time(operand(slot))"
                [attr.aria-label]="operandLabel(slot)"
                (valueChange)="setOperand(slot, isoTime($event.value))"
                (keydown.enter)="apply()"
              ></div>
            }
            @case ('datetime') {
              <div
                slDateTimePicker
                [size]="size()"
                [value]="dateTime(operand(slot))"
                [attr.aria-label]="operandLabel(slot)"
                (valueChange)="setOperand(slot, isoDateTime($event.value))"
                (keydown.enter)="apply()"
              ></div>
            }
            @case ('boolean') {
              <sl-select
                [size]="size()"
                [fullWidth]="true"
                [items]="truths"
                [attr.aria-label]="operandLabel(slot)"
                [value]="operand(slot) === true ? 'true' : operand(slot) === false ? 'false' : null"
                (valueChange)="setOperand(slot, $event === 'true')"
              >
                <sl-select-item value="true">true</sl-select-item>
                <sl-select-item value="false">false</sl-select-item>
              </sl-select>
            }
            @case ('set') {
              <sl-multi-select
                [size]="size()"
                [items]="field().options ?? []"
                [placeholder]="operandLabel(slot)"
                [attr.aria-label]="operandLabel(slot)"
                [value]="$any(operand(slot)) ?? []"
                (valueChange)="setOperand(slot, [...$event])"
              >
                @for (option of field().options ?? []; track option.value) {
                  <sl-multi-select-item [value]="option.value" [label]="option.label" />
                }
              </sl-multi-select>
            }
            @default {
              <div slTextField [size]="size()">
                <input
                  slTextFieldInput
                  [value]="$any(operand(slot)) ?? ''"
                  [attr.aria-label]="operandLabel(slot)"
                  [attr.placeholder]="operandLabel(slot)"
                  (valueChange)="setOperand(slot, $event.value)"
                  (keydown.enter)="apply()"
                />
              </div>
            }
          }
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class SlFilterBarCondition {
  readonly field = input.required<FilterBarField>();
  readonly condition = input.required<Condition>();
  /** The bar's words, which the condition speaks in. */
  readonly translator = input.required<FilterBarTranslator>();
  readonly size = input.required<FilterBarSize>();
  readonly operandTemplates = input<readonly SlFilterBarOperand[]>([]);
  /** Draws the operator control. A chip's value popover leaves it to the chip's operator segment. */
  readonly withOperator = input(true, { transform: booleanAttribute });
  /** The rule is invalid: the operator select says so itself, edge and ring. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Ids for the two parts, which a rule card's sentence names in `aria-controls`. */
  readonly ids = input<{ operator: string; operand: string } | undefined>(undefined);
  readonly applyRequest = output<void>();
  readonly conditionChange = output<Condition>();

  protected readonly truths = [
    { label: 'true', value: 'true' },
    { label: 'false', value: 'false' },
  ];

  protected readonly operators = computed(
    () => this.field().operators ?? (operatorsFor(this.field().kind) as readonly string[]),
  );
  protected readonly operatorItems = computed(() =>
    this.operators().map((operator) => ({ label: this.operatorName(operator), value: operator })),
  );
  protected readonly slots = computed<readonly (0 | 1)[]>(() => {
    const operands = operandCount(this.condition().operator as FilterOperator);
    return operands === 0 ? [] : operands === 1 ? [0] : [0, 1];
  });
  protected readonly customTemplate = computed(() => {
    const key = this.field().key;
    const templates = this.operandTemplates();
    return (
      templates.find((entry) => entry.field() === key) ??
      templates.find((entry) => entry.field() === '*')
    );
  });

  protected readonly t = follow(this.translator);

  operatorName(operator: string) {
    return operatorName(this.t, operator);
  }

  protected operandLabel(slot: 0 | 1) {
    if (this.slots().length < 2) return this.t('value');
    return slot === 0 ? this.t('from') : this.t('to');
  }

  protected operand(slot: 0 | 1): unknown {
    const condition = this.condition();
    return (slot === 0 ? condition.value : condition.end) ?? null;
  }

  protected numberBound(value: number | string | undefined) {
    return typeof value === 'number' ? value : null;
  }

  protected day = (value: unknown) => (value ? parseISODate(String(value)) : null);
  protected time = (value: unknown) => (value ? parseISOTime(String(value)) : null);
  protected dateTime = (value: unknown) => (value ? parseISODateTime(String(value)) : null);
  protected isoDay = (value: unknown) => (isPlainDate(value) ? toISODate(value) : null);
  protected isoTime = (value: unknown) => (isPlainTime(value) ? toISOTime(value, 'minute') : null);
  protected isoDateTime = (value: unknown) =>
    isPlainDateTime(value) ? toISODateTime(value) : null;

  protected setOperator(operator: string) {
    const condition = this.condition();
    const before = operandCount(condition.operator as FilterOperator);
    const after = operandCount(operator as FilterOperator);
    /* An operand the new operator still takes survives the change. */
    this.conditionChange.emit({
      operator,
      ...(after >= 1 && before >= 1 ? { value: condition.value } : {}),
      ...(after === 2 && before === 2 ? { end: condition.end } : {}),
    });
  }

  protected setOperand(slot: 0 | 1, value: unknown) {
    const condition = this.condition();
    this.conditionChange.emit(slot === 0 ? { ...condition, value } : { ...condition, end: value });
  }

  protected apply() {
    this.applyRequest.emit();
  }

  protected context(slot: 0 | 1): FilterBarOperandContext {
    const field = this.field();
    return {
      $implicit: field,
      apply: () => this.apply(),
      field,
      index: slot,
      label: this.operandLabel(slot),
      operator: this.condition().operator as FilterOperator,
      set: (value) => this.setOperand(slot, value),
      size: this.size(),
      value: this.operand(slot),
    };
  }
}

/**
 * One rule row in the builder: its sentence, field, operator, operand, remove.
 * The sentence heads the card the stylesheet draws while the builder is
 * narrow, and pressing it expands the card.
 */
@Component({
  selector: '[slFilterBarRule]',
  standalone: true,
  imports: [SlFilterBarCondition, SlGlyph, SlIcon, SlSelect, SlSelectItem],
  template: `
    <button
      data-part="rule-summary"
      data-part-rule-summary=""
      type="button"
      [attr.aria-expanded]="isExpanded()"
      [attr.aria-controls]="id + '-field ' + id + '-operator ' + id + '-operand'"
      (click)="expandedChange.emit(isExpanded() ? null : key())"
    >
      <span data-sentence
        ><span data-field>{{ label() }}</span
        >&ngsp;<span data-operator>{{ words().operator }}</span>
        @if (words().operands > 0) {
          &ngsp;<span data-value>{{ words().value || t('noValue') }}</span>
        }
      </span>
      <span slIcon><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <div data-part="field" data-part-field="" [id]="id + '-field'">
      <sl-select
        [size]="size()"
        [fullWidth]="true"
        [invalid]="invalid() || !field() ? true : undefined"
        [items]="fieldItems()"
        [attr.aria-label]="t('field')"
        [value]="rule().field"
        (valueChange)="changeField($any($event))"
      >
        @for (entry of fields(); track entry.key) {
          <sl-select-item [value]="entry.key">{{ entry.label }}</sl-select-item>
        }
      </sl-select>
    </div>
    @if (field(); as known) {
      <div
        slFilterBarCondition
        [field]="known"
        [condition]="condition()"
        [translator]="translator()"
        [size]="size()"
        [operandTemplates]="operandTemplates()"
        [ids]="{ operator: id + '-operator', operand: id + '-operand' }"
        [invalid]="invalid()"
        (conditionChange)="changeCondition($event)"
        (applyRequest)="applyRequest.emit()"
      ></div>
    } @else {
      <div data-part="operator" data-part-operator="" [id]="id + '-operator'"></div>
      <div data-part="operand" data-part-operand="" [id]="id + '-operand'"></div>
    }
    @if (removable()) {
      <button
        data-part="remove"
        data-part-remove=""
        type="button"
        [attr.aria-label]="t('removeRule')"
        (click)="removeRequest.emit()"
      >
        <span slIcon><svg slGlyph name="x"></svg></span>
      </button>
    } @else {
      <span></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'rule',
    'data-part-rule': '',
    '[attr.data-kind]': 'field()?.kind ?? null',
    '[attr.data-operands]': 'operands()',
    '[attr.data-invalid]': 'invalid() || !field() ? "" : null',
    '[attr.data-expanded]': 'isExpanded() ? "" : null',
  },
})
export class SlFilterBarRule {
  readonly rule = input.required<FilterRule>();
  readonly fields = input.required<readonly FilterBarField[]>();
  /** The bar's words, which the rule speaks in. */
  readonly translator = input.required<FilterBarTranslator>();
  readonly size = input.required<FilterBarSize>();
  readonly operandTemplates = input<readonly SlFilterBarOperand[]>([]);
  readonly removable = input(true, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** The rule's path inside the root, which names its card. */
  readonly path = input<FilterPath>([]);
  /** The one card open in the builder, by its path joined with dots. */
  readonly expanded = input<string | null>(null);
  readonly ruleChange = output<FilterRule>();
  readonly removeRequest = output<void>();
  readonly applyRequest = output<void>();
  readonly expandedChange = output<string | null>();

  protected readonly id = `slotted-filter-bar-rule-${(counter += 1)}`;
  protected readonly t = follow(this.translator);
  protected readonly key = computed(() => this.path().join('.'));
  protected readonly isExpanded = computed(() => this.expanded() === this.key());
  protected readonly field = computed(() => fieldByKey(this.fields(), this.rule().field));
  protected readonly condition = computed<Condition>(() => {
    const field = this.field();
    return (
      this.rule().filter.conditions[0] ?? {
        operator: field ? (field.defaultOperator ?? kindDefaultOperator(field.kind)) : 'contains',
      }
    );
  });
  protected readonly operands = computed(() =>
    this.field() ? operandCount(this.condition().operator as FilterOperator) : 0,
  );
  protected readonly fieldItems = computed(() =>
    this.fields().map((entry) => ({ label: entry.label, value: entry.key })),
  );
  protected readonly words = computed(() => ruleWords(this.t, this.field(), this.rule().filter));
  protected readonly label = computed(
    () => this.field()?.label ?? this.t('unknownField', { field: this.rule().field }),
  );

  protected changeField(key: string) {
    const next = fieldByKey(this.fields(), key);
    if (!next) return;
    this.ruleChange.emit({ field: key, filter: blankRule(next) });
  }

  protected changeCondition(condition: Condition) {
    const rule = this.rule();
    this.ruleChange.emit({
      field: rule.field,
      filter: withCondition(rule.filter, 0, condition as never),
    });
  }
}

/**
 * A group: its join, its rules and groups in order, and the controls that grow
 * it. Recursive, so a group holds a group; the depth is on the element for the
 * rail the stylesheet draws.
 */
@Component({
  selector: 'fieldset[slFilterBarGroup]',
  standalone: true,
  imports: [
    forwardRef(() => SlFilterBarGroup),
    SlButton,
    SlButtonStart,
    SlFilterBarPart,
    SlFilterBarRule,
    SlGlyph,
    SlIcon,
    SlIconButton,
    SlSegment,
    SlSegmentedControl,
  ],
  template: `
    <legend>{{ t('matches', { join: joinWord() }) }}</legend>
    <div data-part="join" data-part-join="">
      @if (aroundJoin()[0]) {
        <span>{{ aroundJoin()[0] }}</span>
      }
      <div
        slSegmentedControl
        size="sm"
        [attr.aria-label]="t('match')"
        [value]="group().join"
        (valueChange)="setJoin($event.value ?? 'and')"
      >
        <label slSegment value="and">{{ t('matchAll') }}</label>
        <label slSegment value="or">{{ t('matchAny') }}</label>
      </div>
      @if (aroundJoin()[1]) {
        <span>{{ aroundJoin()[1] }}</span>
      }
      @if (path().length > 0) {
        <button
          slIconButton
          slFilterBarPart="remove-group"
          type="button"
          tone="secondary"
          variant="ghost"
          [size]="buttonSize()"
          [attr.aria-label]="t('removeGroup')"
          [attr.title]="t('removeGroup')"
          (click)="rootChange.emit(removeNodeAt(root(), path()))"
        >
          <span slIcon><svg slGlyph name="trash"></svg></span>
        </button>
      }
    </div>
    <div data-part="rules" data-part-rules="">
      @for (node of group().rules; track $index) {
        <span data-part="conjunction" data-part-conjunction="">{{
          $index === 0 ? t('where') : t(group().join === 'and' ? 'joins.and' : 'joins.or')
        }}</span>
        @if (isGroup(node)) {
          <fieldset
            slFilterBarGroup
            [group]="$any(node)"
            [path]="childPath($index)"
            [root]="root()"
            [fields]="fields()"
            [translator]="translator()"
            [size]="size()"
            [operandTemplates]="operandTemplates()"
            [expanded]="expanded()"
            (expandedChange)="expandedChange.emit($event)"
            (rootChange)="rootChange.emit($event)"
            (applyRequest)="applyRequest.emit()"
          ></fieldset>
        } @else {
          <div
            slFilterBarRule
            [rule]="$any(node)"
            [path]="childPath($index)"
            [fields]="fields()"
            [translator]="translator()"
            [size]="size()"
            [operandTemplates]="operandTemplates()"
            [removable]="!isRequired($any(node))"
            [expanded]="expanded()"
            (expandedChange)="expandedChange.emit($event)"
            (ruleChange)="replace($index, $event)"
            (removeRequest)="remove($index)"
            (applyRequest)="applyRequest.emit()"
          ></div>
        }
      }
    </div>
    <div data-part="actions" data-part-actions="">
      <button
        slButton
        slFilterBarPart="add-rule"
        type="button"
        tone="secondary"
        [variant]="path().length === 0 ? 'outline' : 'ghost'"
        [size]="buttonSize()"
        [disabled]="!firstField()"
        (click)="addRule()"
      >
        <span slButtonStart
          ><span slIcon><svg slGlyph name="plus"></svg></span
        ></span>
        {{ t('addRule') }}
      </button>
      <button
        slButton
        slFilterBarPart="add-group"
        type="button"
        tone="secondary"
        [variant]="path().length === 0 ? 'outline' : 'ghost'"
        [size]="buttonSize()"
        [disabled]="!firstField()"
        (click)="addGroup()"
      >
        <span slButtonStart
          ><span slIcon><svg slGlyph name="plus"></svg></span
        ></span>
        {{ t('addGroup') }}
      </button>
      @if (path().length === 0) {
        <ng-content></ng-content>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'group',
    'data-part-group': '',
    '[attr.data-depth]': 'path().length',
  },
})
export class SlFilterBarGroup {
  readonly group = input.required<FilterGroup>();
  readonly path = input<FilterPath>([]);
  readonly root = input.required<FilterGroup>();
  readonly fields = input.required<readonly FilterBarField[]>();
  /** The bar's words, which the group speaks in. */
  readonly translator = input.required<FilterBarTranslator>();
  readonly size = input.required<FilterBarSize>();
  readonly operandTemplates = input<readonly SlFilterBarOperand[]>([]);
  /** The one rule card open in the builder, by its path joined with dots. */
  readonly expanded = input<string | null>(null);
  readonly rootChange = output<FilterGroup>();
  readonly applyRequest = output<void>();
  readonly expandedChange = output<string | null>();

  protected readonly t = follow(this.translator);
  protected readonly joinWord = computed(() =>
    this.group().join === 'and' ? this.t('matchAll') : this.t('matchAny'),
  );
  /** The words of `matches` before and after the join chooser, which stands in its `{join}`. */
  protected readonly aroundJoin = computed(() => aroundSlot((join) => this.t('matches', { join })));
  protected readonly removeNodeAt = removeNodeAt;
  protected readonly firstField = computed(() => this.fields()[0]);
  protected readonly buttonSize = computed(() => (this.size() === 'lg' ? 'md' : 'sm'));

  protected isGroup(node: FilterNode) {
    return isFilterGroup(node);
  }
  protected isRequired(rule: FilterRule) {
    return fieldByKey(this.fields(), rule.field)?.required === true;
  }
  protected childPath(index: number): FilterPath {
    return [...this.path(), index];
  }
  protected setJoin(join: string) {
    this.rootChange.emit(withGroupJoin(this.root(), this.path(), join as FilterJoin));
  }
  protected replace(index: number, rule: FilterRule) {
    this.rootChange.emit(updateNodeAt(this.root(), this.childPath(index), rule));
  }
  protected remove(index: number) {
    this.rootChange.emit(removeNodeAt(this.root(), this.childPath(index)));
  }
  /* A rule just added opens as an expanded card, where its three controls are. */
  protected addRule() {
    const field = this.firstField();
    if (!field) return;
    const at = this.group().rules.length;
    this.rootChange.emit(
      insertNodeAt(this.root(), this.path(), { field: field.key, filter: blankRule(field) }),
    );
    this.expandedChange.emit([...this.path(), at].join('.'));
  }
  protected addGroup() {
    const field = this.firstField();
    if (!field) return;
    const at = this.group().rules.length;
    this.rootChange.emit(
      insertNodeAt(this.root(), this.path(), {
        join: this.group().join === 'and' ? 'or' : 'and',
        rules: [{ field: field.key, filter: blankRule(field) }],
      }),
    );
    this.expandedChange.emit([...this.path(), at, 0].join('.'));
  }
}

/**
 * One rule in a popover. Under `live` every change is requested at once — a
 * text or number operand after `queryDelay`, so a query does not fire per
 * keystroke — and Done closes; under `manual` the change goes to the draft the
 * same way. Clear removes the rule, which a required field refuses.
 */
@Component({
  selector: '[slFilterBarRuleEditor]',
  standalone: true,
  imports: [SlButton, SlFilterBarCondition],
  template: `
    <div
      slFilterBarCondition
      [field]="field()"
      [condition]="condition()"
      [translator]="translator()"
      [size]="size()"
      [operandTemplates]="operandTemplates()"
      [withOperator]="withOperator()"
      [invalid]="invalid()"
      (conditionChange)="change($event)"
      (applyRequest)="done()"
    ></div>
    <div data-part="actions" data-part-actions="">
      <button
        slButton
        type="button"
        size="sm"
        tone="secondary"
        variant="ghost"
        [disabled]="field().required === true"
        (click)="clear()"
      >
        {{ t('clearRule') }}
      </button>
      <button slButton type="button" size="sm" (click)="done()">{{ t('done') }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'filter-bar',
    'data-ui-filter-bar': '',
    'data-part': 'rule',
    'data-part-rule': '',
    '[attr.data-kind]': 'field().kind',
    '[attr.data-invalid]': 'invalid() ? "" : null',
  },
})
export class SlFilterBarRuleEditor {
  readonly field = input.required<FilterBarField>();
  readonly current = input<FilterDescriptor | undefined>(undefined);
  /** The bar's words, which the editor speaks in. */
  readonly translator = input.required<FilterBarTranslator>();
  readonly size = input.required<FilterBarSize>();
  readonly operandTemplates = input<readonly SlFilterBarOperand[]>([]);
  readonly queryDelay = input(0);
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Draws the operator control: a chip's value popover leaves it to the chip. */
  readonly withOperator = input(true, { transform: booleanAttribute });
  readonly ruleChange = output<FilterDescriptor | null>();
  readonly doneRequest = output<void>();

  protected readonly t = follow(this.translator);
  private readonly destroyRef = inject(DestroyRef);
  private readonly local = signal<FilterDescriptor | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly draft = computed(
    () => this.local() ?? this.current() ?? blankRule(this.field()),
  );
  protected readonly condition = computed<Condition>(
    () =>
      this.draft().conditions[0] ?? {
        operator: this.field().defaultOperator ?? kindDefaultOperator(this.field().kind),
      },
  );

  constructor() {
    /* A change made elsewhere — the chip's operator segment — reaches the
       editor unless a keystroke is still waiting. */
    effect(() => {
      this.current();
      untracked(() => {
        if (this.timer === undefined) this.local.set(null);
      });
    });
    this.destroyRef.onDestroy(() => clearTimeout(this.timer));
  }

  protected change(condition: Condition) {
    const next = { ...this.draft(), conditions: [condition] } as FilterDescriptor;
    this.local.set(next);
    clearTimeout(this.timer);
    this.timer = undefined;
    const kind = this.field().kind;
    const debounced = (kind === 'text' || kind === 'number') && this.queryDelay() > 0;
    if (!debounced) {
      this.ruleChange.emit(next);
      return;
    }
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.ruleChange.emit(next);
    }, this.queryDelay());
  }

  protected done() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
      this.ruleChange.emit(this.draft());
    }
    this.doneRequest.emit();
  }

  protected clear() {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.local.set(null);
    this.ruleChange.emit(null);
    this.doneRequest.emit();
  }
}

/** One field's condition in the bar, as its chip draws it. */
interface BarChip {
  readonly kind: 'chip';
  readonly id: string;
  readonly key: string;
  readonly field: FilterBarField | undefined;
  readonly filter: FilterDescriptor;
  readonly label: string;
  /** The group's name: the field and its sentence, and whether it is incomplete. */
  readonly name: string;
  /** The operator as the sentence reads it. */
  readonly operator: string;
  /** The condition's own operator, which the operator menu checks. */
  readonly condition: string;
  readonly operators: readonly string[];
  readonly operands: number;
  readonly value: string;
  readonly valueName: string;
  readonly valueTitle: string | null;
  readonly hasValue: boolean;
  readonly pinned: boolean;
  readonly incomplete: boolean;
  readonly folded: boolean;
  readonly unknown: boolean;
  readonly removable: boolean;
}

/** A pinned field without a condition. */
interface BarPill {
  readonly kind: 'pill';
  readonly id: string;
  readonly field: FilterBarField;
}

/** A group at the first level, written as one sentence that opens the builder. */
interface BarGroup {
  readonly kind: 'group';
  readonly id: string;
  readonly path: FilterPath;
  readonly words: string;
  readonly folded: boolean;
}

type BarMember = BarChip | BarPill | BarGroup;

/**
 * A condition the reader started — from `add` or from a pinned field's pill —
 * and whose operand is not there yet. It is the bar's own and not the value's:
 * the engine would drop it as inactive anyway, so it is drawn as an incomplete
 * chip and enters the value the moment it is complete.
 */
interface PendingRule {
  key: string;
  filter: FilterDescriptor;
  /** Where an applied rule stood before it lost its operand, so its chip keeps its place. */
  at?: number;
}

/**
 * A bar above a listing that edits one value: a tree of conditions over the
 * listing's fields, whose leaves are the descriptor `table` edits in a column
 * header. The bar draws the first level — a search field, a pill per pinned
 * field without a condition, a chip of segments per condition — and opens a
 * drawer on the whole tree.
 *
 * The family applies nothing. It reports the tree and the query, and
 * `createFilterGroupPredicate` and `createSearchPredicate` in
 * `@slotted/core/filter` are what a consumer applies to its own rows.
 */
@Component({
  selector: '[slFilterBar]',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlButtonStart,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerFooter,
    SlDrawerHeader,
    SlDrawerTitle,
    SlFilterBarGroup,
    SlFilterBarPart,
    SlFilterBarRuleEditor,
    SlGlyph,
    SlIcon,
    SlIconButton,
    SlKbd,
    SlMenu,
    SlMenuGroup,
    SlMenuItem,
    SlMenuItemIcon,
    SlMenuRadioGroup,
    SlMenuTrigger,
    SlPopover,
    SlPopoverContent,
    SlPopoverBody,
    SlPopoverLayer,
    SlPopoverTrigger,
    SlSelect,
    SlSelectItem,
    SlTextField,
    SlTextFieldEnd,
    SlTextFieldStart,
    SlTextFieldInput,
  ],
  template: `
    <ng-template #fieldIcon let-icon>
      @if (isTemplate(icon)) {
        <span slIcon><ng-container [ngTemplateOutlet]="icon" /></span>
      } @else if (icon) {
        <span slIcon><svg slGlyph [name]="icon"></svg></span>
      }
    </ng-template>

    <div data-part="frame" data-part-frame="">
      <div data-part="search" data-part-search="">
        <div slTextField [size]="sizeValue()" [clearable]="true">
          <span slTextFieldStart
            ><span slIcon><svg slGlyph name="search"></svg></span
          ></span>
          <input
            #search
            slTextFieldInput
            type="search"
            [value]="shownQuery()"
            [attr.aria-label]="t('search')"
            [attr.placeholder]="t('search')"
            [disabled]="disabled()"
            (valueChange)="typeQuery($event)"
            (keydown)="onSearchKeyDown($event)"
          />
          @if (shortcutValue(); as key) {
            <span slTextFieldEnd
              ><kbd slKbd size="sm">{{ key }}</kbd></span
            >
          }
        </div>
      </div>

      <div
        #barRow
        data-part="bar"
        data-part-bar=""
        role="toolbar"
        [attr.aria-label]="t('filters')"
        [attr.aria-description]="readOnly() ? t('readOnly') : null"
        [attr.data-revealed]="isRevealed() ? '' : null"
      >
        <button
          slButton
          slFilterBarPart="summary"
          type="button"
          tone="secondary"
          variant="outline"
          aria-haspopup="dialog"
          [size]="sizeValue()"
          [disabled]="disabled()"
          (click)="openBuilderAt('pointer', $event)"
        >
          <span slButtonStart
            ><span slIcon><svg slGlyph name="funnel"></svg></span
          ></span>
          <span>{{ t('summary', { count: activeCount() }) }}</span>
        </button>

        @for (member of members(); track member.id) {
          @if (pillOf(member); as pill) {
            <button
              data-part="pill"
              data-part-pill=""
              type="button"
              aria-haspopup="dialog"
              [attr.data-field]="pill.field.key"
              [attr.data-invalid]="invalid() === pill.field.key ? '' : null"
              [attr.aria-invalid]="invalid() === pill.field.key ? 'true' : null"
              [disabled]="disabled()"
              (click)="start(pill.field.key, $event)"
            >
              <span slIcon><svg slGlyph name="plus"></svg></span><span>{{ pill.field.label }}</span>
            </button>
          }
          @if (chipOf(member); as chip) {
            <div
              data-part="chip"
              data-part-chip=""
              role="group"
              [attr.aria-label]="chip.name"
              [attr.data-field]="chip.key"
              [attr.data-operands]="chip.operands"
              [attr.data-pinned]="chip.pinned ? '' : null"
              [attr.data-incomplete]="chip.incomplete ? '' : null"
              [attr.data-folded]="chip.folded ? '' : null"
              [attr.data-invalid]="chip.unknown || invalid() === chip.key ? '' : null"
              (keydown)="onChipKeyDown($event, chip.key)"
            >
              <span data-part="chip-field" data-part-chip-field=""
                ><ng-container
                  [ngTemplateOutlet]="fieldIcon"
                  [ngTemplateOutletContext]="{ $implicit: chip.field?.icon }"
                /><span>{{ chip.label }}</span></span
              >
              @if (readOnly() || chip.unknown) {
                <button
                  data-part="chip-operator"
                  data-part-chip-operator=""
                  type="button"
                  aria-disabled="true"
                  [disabled]="disabled()"
                >
                  {{ chip.operator }}
                </button>
              } @else {
                <button
                  data-part="chip-operator"
                  data-part-chip-operator=""
                  slFilterBarPart="chip-operator"
                  type="button"
                  [disabled]="disabled()"
                  [slMenuTriggerFor]="operatorMenu"
                >
                  {{ chip.operator }}
                </button>
                <sl-menu #operatorMenu [aria-label]="t('operator')">
                  <sl-menu-radio-group
                    [value]="chip.condition"
                    (valueChangeRequest)="setOperator(chip.key, chip.filter, $event.value)"
                  >
                    @for (operator of chip.operators; track operator) {
                      <button slMenuRadioItem [value]="operator" [closeOnSelect]="true">
                        {{ operatorWords(operator) }}
                      </button>
                    }
                  </sl-menu-radio-group>
                </sl-menu>
              }
              @if (chip.hasValue) {
                @if (readOnly() || chip.unknown || narrow()) {
                  <button
                    data-part="chip-value"
                    data-part-chip-value=""
                    type="button"
                    [attr.aria-haspopup]="readOnly() || chip.unknown ? null : 'dialog'"
                    [attr.aria-disabled]="readOnly() || chip.unknown ? 'true' : null"
                    [attr.aria-label]="chip.valueName"
                    [attr.title]="chip.valueTitle"
                    [disabled]="disabled()"
                    (click)="onValueSegment(chip, $event)"
                  >
                    <span data-operator>{{ chip.operator }}</span
                    ><span data-value>{{ chip.value }}</span>
                  </button>
                } @else if (chip.field; as field) {
                  <ng-container
                    slPopover
                    [open]="valueOpen() === chip.key"
                    (openChange)="toggleValue(chip.key, $event)"
                  >
                    <button
                      slPopoverTrigger
                      data-part="chip-value"
                      data-part-chip-value=""
                      type="button"
                      aria-haspopup="dialog"
                      [attr.aria-label]="chip.valueName"
                      [attr.title]="chip.valueTitle"
                      [disabled]="disabled()"
                    >
                      <span data-operator>{{ chip.operator }}</span
                      ><span data-value>{{ chip.value }}</span>
                    </button>
                    <ng-template slPopoverLayer>
                      <div slPopoverContent [attr.aria-label]="chip.label">
                        <div slPopoverBody>
                          <div
                            slFilterBarRuleEditor
                            [field]="field"
                            [current]="chip.filter"
                            [translator]="t"
                            [size]="sizeValue()"
                            [operandTemplates]="operandTemplates()"
                            [queryDelay]="applyValue() === 'live' ? queryDelayValue() : 0"
                            [invalid]="invalid() === chip.key"
                            [withOperator]="false"
                            (ruleChange)="changeRule(chip.key, $event, 'keyboard')"
                            (doneRequest)="finishValue(chip.key)"
                          ></div>
                        </div>
                      </div>
                    </ng-template>
                  </ng-container>
                }
              }
              @if (chip.removable) {
                <button
                  data-part="chip-remove"
                  data-part-chip-remove=""
                  type="button"
                  [attr.aria-label]="t('remove', { name: chip.label })"
                  [disabled]="disabled()"
                  (click)="removeField(chip.key, $event)"
                >
                  <span slIcon><svg slGlyph name="x"></svg></span>
                </button>
              }
            </div>
          }
          @if (groupOf(member); as group) {
            <div
              data-part="chip"
              data-part-chip=""
              role="group"
              data-operands="1"
              [attr.aria-label]="group.words"
              [attr.data-folded]="group.folded ? '' : null"
              (keydown)="onGroupKeyDown($event, group.path)"
            >
              <button
                data-part="chip-value"
                data-part-chip-value=""
                type="button"
                aria-haspopup="dialog"
                [attr.aria-disabled]="readOnly() ? 'true' : null"
                [attr.title]="group.words"
                [disabled]="disabled()"
                (click)="readOnly() ? null : openBuilderAt('pointer', $event, { path: group.path })"
              >
                <span data-value>{{ group.words }}</span>
              </button>
              @if (!readOnly()) {
                <button
                  data-part="chip-remove"
                  data-part-chip-remove=""
                  type="button"
                  [attr.aria-label]="t('remove', { name: group.words })"
                  [disabled]="disabled()"
                  (click)="removeNode(group.path, $event)"
                >
                  <span slIcon><svg slGlyph name="x"></svg></span>
                </button>
              }
            </div>
          }
        }

        @if (folded() > 0) {
          <button
            data-part="more"
            data-part-more=""
            type="button"
            [attr.aria-expanded]="isRevealed()"
            [disabled]="disabled()"
            (click)="requestRevealed(!isRevealed(), 'pointer', $event)"
          >
            {{ isRevealed() ? t('less') : t('more', { count: folded() }) }}
          </button>
        }

        @if (!readOnly()) {
          @if (chipCount() > 0) {
            <!-- With a chip in the bar, add is its glyph alone, in the chips' shape; the label stays its name. -->
            <button
              slIconButton
              slFilterBarPart="add"
              data-compact
              type="button"
              shape="circle"
              tone="secondary"
              variant="outline"
              [size]="sizeValue()"
              [attr.aria-label]="t('add')"
              [attr.title]="t('add')"
              [disabled]="disabled() || unfiltered().length === 0"
              [slMenuTriggerFor]="addMenu"
            >
              <span slIcon><svg slGlyph name="plus"></svg></span>
            </button>
          } @else {
            <button
              slButton
              slFilterBarPart="add"
              type="button"
              tone="secondary"
              variant="ghost"
              [size]="sizeValue()"
              [disabled]="disabled() || unfiltered().length === 0"
              [slMenuTriggerFor]="addMenu"
            >
              <!-- The glyph stands in the button's own box; bare in the label it has no size. -->
              <span slButtonStart
                ><span slIcon><svg slGlyph name="plus"></svg></span
              ></span>
              {{ t('add') }}
            </button>
          }
          <sl-menu #addMenu [aria-label]="t('add')">
            @for (section of sections(); track section.name ?? '') {
              @if (section.name === undefined) {
                @for (field of section.fields; track field.key) {
                  <button slMenuItem (select)="start(field.key, $event.source)">
                    @if (field.icon) {
                      <span slMenuItemIcon
                        ><ng-container
                          [ngTemplateOutlet]="fieldIcon"
                          [ngTemplateOutletContext]="{ $implicit: field.icon }"
                      /></span>
                    }
                    {{ field.label }}
                  </button>
                }
              } @else {
                <sl-menu-group [label]="section.name">
                  @for (field of section.fields; track field.key) {
                    <button slMenuItem (select)="start(field.key, $event.source)">
                      @if (field.icon) {
                        <span slMenuItemIcon
                          ><ng-container
                            [ngTemplateOutlet]="fieldIcon"
                            [ngTemplateOutletContext]="{ $implicit: field.icon }"
                        /></span>
                      }
                      {{ field.label }}
                    </button>
                  }
                </sl-menu-group>
              }
            }
          </sl-menu>
        }

        @if (!readOnly() && (activeCount() > 0 || shownQuery() !== '' || pending())) {
          <button
            slButton
            slFilterBarPart="clear"
            type="button"
            tone="secondary"
            variant="ghost"
            [size]="sizeValue()"
            [disabled]="disabled()"
            (click)="clearAll($event)"
          >
            {{ t('clear') }}
          </button>
        }

        @if (applyValue() === 'manual' && !readOnly()) {
          <div data-part="actions" data-part-actions="">
            <button
              slButton
              slFilterBarPart="reset"
              type="button"
              tone="secondary"
              variant="ghost"
              [size]="sizeValue()"
              [disabled]="disabled() || !dirty()"
              (click)="reset()"
            >
              {{ t('reset') }}
            </button>
            <button
              slButton
              slFilterBarPart="apply"
              type="button"
              [size]="sizeValue()"
              [disabled]="disabled() || loading() || !dirty()"
              (click)="submit($event)"
            >
              {{ t('apply') }}
            </button>
          </div>
        }
      </div>

      <div data-part="end" data-part-end="">
        @if (presets(); as views) {
          @if (views.length > 0) {
            <!-- Clearable: leaving a preset is the control's own clear, and
                 without it the one way out of a saved view is deleting it. -->
            <div data-part="preset" data-part-preset="">
              <sl-select
                clearable
                [size]="sizeValue()"
                [disabled]="disabled() || readOnly()"
                [items]="presetItems()"
                [attr.aria-label]="t('preset')"
                [placeholder]="t('presetNone')"
                [value]="currentPreset()"
                (valueChange)="choosePreset($any($event))"
              >
                @for (view of views; track view.key) {
                  <sl-select-item [value]="view.key">{{ view.label }}</sl-select-item>
                }
              </sl-select>
            </div>
          }
        }
        <ng-content select="[slFilterBarEnd]"></ng-content>
      </div>

      @if (countText() !== null || loading()) {
        <p
          data-part="count"
          data-part-count=""
          aria-live="polite"
          [attr.aria-busy]="loading() ? 'true' : null"
        >
          @if (loading()) {
            <span
              data-ui="spinner"
              data-ui-spinner=""
              data-part="root"
              data-part-root=""
              data-size="sm"
              role="progressbar"
              [attr.aria-label]="t('filters')"
              ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="8.875" />
                <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
            ></span>
          }
          {{ countText() }}
        </p>
      }
    </div>

    <sl-drawer
      [side]="sheet() ? 'bottom' : 'end'"
      [size]="sheet() ? 'content' : 'xl'"
      [container]="container()"
      [open]="isOpen()"
      (openChangeRequest)="onDrawerRequest($event)"
    >
      <header slDrawerHeader>
        <h2 slDrawerTitle>{{ t('builder') }}</h2>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div
          data-part="builder"
          data-part-builder=""
          data-ui="filter-bar"
          data-ui-filter-bar=""
          [id]="id + '-builder'"
        >
          <fieldset
            slFilterBarGroup
            [group]="drawerDraft() ?? empty"
            [root]="drawerDraft() ?? empty"
            [fields]="fields()"
            [translator]="t"
            [size]="sizeValue()"
            [operandTemplates]="operandTemplates()"
            [expanded]="expanded()"
            (expandedChange)="expanded.set($event)"
            (rootChange)="drawerDraft.set($event)"
            (applyRequest)="commitDrawer()"
          >
            @if (draftActive() > 0) {
              <button
                slButton
                slFilterBarPart="clear"
                type="button"
                size="sm"
                tone="secondary"
                variant="ghost"
                (click)="drawerDraft.set(baseline())"
              >
                {{ t('clear') }}
              </button>
            }
            @if (savePresetEnabled()) {
              <button
                slButton
                slFilterBarPart="save-preset"
                type="button"
                size="sm"
                tone="secondary"
                variant="ghost"
                (click)="savePreset.emit(normalized(drawerDraft()))"
              >
                {{ t('savePreset') }}
              </button>
            }
          </fieldset>
        </div>
      </div>
      <footer slDrawerFooter>
        <button
          slButton
          type="button"
          size="sm"
          tone="secondary"
          variant="ghost"
          (click)="requestOpen(false, 'dismiss', $event)"
        >
          {{ t('cancel') }}
        </button>
        <button slButton type="button" size="sm" (click)="commitDrawer()">
          {{ t('apply') }}
        </button>
      </footer>
    </sl-drawer>
  `,
  styleUrl: '../../../styles/src/filter-bar/filter-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slFilterBar',
  host: {
    'data-ui': 'filter-bar',
    'data-ui-filter-bar': '',
    'data-part': 'root',
    'data-part-root': '',
    role: 'search',
    '[attr.aria-label]': "ariaLabel ?? t('bar')",
    '[attr.data-apply]': 'applyValue()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.data-dirty]': 'dirty() || presetDirty() ? "" : null',
    '[attr.data-open]': 'isOpen() ? "" : null',
    '[attr.data-sticky]': 'sticky() ? "" : null',
  },
})
export class SlFilterBar {
  /** The fields the listing can be filtered by, in the order the add menu lists them. */
  readonly fields = input.required<readonly FilterBarField[]>();
  /** The tree. Present is controlled, for the life of the bar. */
  readonly value = model<FilterGroup | null | undefined>(undefined);
  /** Where an uncontrolled tree starts, read once. */
  readonly defaultValue = input<FilterGroup | null>(null);
  /** The global query. */
  readonly query = model<string | undefined>(undefined);
  readonly defaultQuery = input('');
  readonly presets = input<readonly FilterBarPreset[] | undefined>(undefined);
  readonly preset = model<string | null | undefined>(undefined);
  readonly defaultPreset = input<string | null>(null);
  /** Whether the builder is open. */
  readonly open = model<boolean | undefined>(undefined);
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Whether the chips past `chipLimit` are shown. */
  readonly revealed = model<boolean | undefined>(undefined);
  readonly defaultRevealed = input(false, { transform: booleanAttribute });

  /** The five effective values: the model when it is set, the default otherwise. */
  readonly currentValue = computed(() => this.value() ?? this.defaultValue());
  readonly currentQuery = computed(() => this.query() ?? this.defaultQuery());
  readonly currentPreset = computed(() => this.preset() ?? this.defaultPreset());
  readonly isOpen = computed(() => this.open() ?? this.defaultOpen());
  readonly isRevealed = computed(() => this.revealed() ?? this.defaultRevealed());
  readonly apply = input<FilterBarApply | undefined>(undefined);
  readonly sticky = input(false, { transform: booleanAttribute });
  /** A parent for the builder's drawer alone, instead of the shared portal root. */
  readonly container = input<Element | null | undefined>(undefined);
  readonly size = input<FilterBarSize | undefined>(undefined);
  readonly queryDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  readonly chipLimit = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  readonly shortcut = input<string | null | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The conditions can be read and reached, and nothing changes them. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * The number of rows the filter kept, and the number there are. Written by
   * the `count` message, or `countOnly` without a total, in the digits of the
   * language in force.
   */
  readonly count = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  readonly total = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * landmark's name (`bar`), the controls, the chips' names, the count and the
   * announcements.
   */
  readonly messages = input<PartialMessages<FilterBarMessages> | undefined>(undefined);

  /** The requests behind every committed change, each with the reason it carries. */
  readonly valueChangeRequest = output<ChangeRequest<FilterGroup | null>>();
  readonly queryChangeRequest = output<ChangeRequest<string>>();
  readonly presetChangeRequest = output<ChangeRequest<string | null>>();
  readonly openChangeRequest = output<ChangeRequest<boolean>>();
  readonly revealedChangeRequest = output<ChangeRequest<boolean>>();
  /** Draws the save-as-view control in the builder. */
  readonly savePresetEnabled = input(false, { transform: booleanAttribute });
  /** Asks the application to save the tree as a view. */
  readonly savePreset = output<FilterGroup | null>();

  private readonly defaults = injectFilterBarDefaults();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ariaLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('search');
  private readonly barElement = viewChild.required<ElementRef<HTMLDivElement>>('barRow');
  protected readonly operandTemplates = contentChildren(SlFilterBarOperand);
  protected readonly endSlot = contentChild(SlFilterBarEnd);

  readonly id = `slotted-filter-bar-${(counter += 1)}`;
  protected readonly empty = emptyFilterGroup();

  /** The family's words in the language in force, with this bar's `messages` laid over them. */
  readonly t: FilterBarTranslator = injectMessages(filterBarMessages, this.messages);
  protected readonly applyValue = computed(
    () => this.apply() ?? this.defaults.apply ?? FILTER_BAR_DEFAULT_APPLY,
  );
  protected readonly sizeValue = computed(
    () => this.size() ?? this.defaults.size ?? FILTER_BAR_DEFAULT_SIZE,
  );
  protected readonly queryDelayValue = computed(
    () => this.queryDelay() ?? this.defaults.queryDelay ?? FILTER_BAR_DEFAULT_QUERY_DELAY,
  );
  protected readonly chipLimitValue = computed(
    () => this.chipLimit() ?? this.defaults.chipLimit ?? FILTER_BAR_DEFAULT_CHIP_LIMIT,
  );
  protected readonly shortcutValue = computed(() => {
    const own = this.shortcut();
    return own === undefined ? (this.defaults.shortcut ?? null) : own;
  });
  private readonly locked = computed(() => this.disabled() || this.readOnly());

  /* ── State the bar owns ────────────────────────────────────────────── */

  private readonly draft = signal<{ value: FilterGroup | null; query: string } | null>(null);
  protected readonly invalid = signal<string | null>(null);
  protected readonly pending = signal<PendingRule | null>(null);
  /** Which chip's value popover is open, by its field key. */
  protected readonly valueOpen = signal<string | null>(null);
  /** The one rule card open in the builder's card form, by its path. */
  protected readonly expanded = signal<string | null>(null);
  protected readonly drawerDraft = signal<FilterGroup | null>(null);
  /** Whether the bar is under its narrow breakpoint: an edit then goes to the builder. */
  protected readonly narrow = signal(false);
  /** Whether the viewport is under the sheet breakpoint: the builder then comes up from the bottom. */
  protected readonly sheet = signal(false);
  private readonly typed = signal<string | null>(null);
  /** A tree the builder opens on instead of the shown one: a rule the reader just started. */
  private seed: FilterGroup | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly shown = computed(() => {
    const draft = this.draft();
    return this.applyValue() === 'manual' && draft ? draft.value : this.currentValue();
  });
  protected readonly shownQuery = computed(() => {
    const typed = this.typed();
    if (typed !== null) return typed;
    const draft = this.draft();
    return this.applyValue() === 'manual' && draft ? draft.query : this.currentQuery();
  });
  protected readonly dirty = computed(() => {
    const draft = this.draft();
    return (
      this.applyValue() === 'manual' &&
      draft !== null &&
      (!sameGroup(draft.value, this.currentValue()) || draft.query !== this.currentQuery())
    );
  });
  protected readonly presetDirty = computed(() => {
    const chosen = this.presets()?.find((entry) => entry.key === this.currentPreset());
    return (
      chosen !== undefined && !sameGroup(normalizeFilterGroup(chosen.value), this.currentValue())
    );
  });

  private readonly format = computed(() => {
    const fields = this.fields();
    return {
      field: (key: string) => fieldByKey(fields, key)?.label ?? key,
      join: (join: FilterJoin) => this.t(join === 'and' ? 'joins.and' : 'joins.or'),
      operator: (operator: string) => operatorName(this.t, operator),
    };
  });

  protected readonly required = computed(() => this.fields().filter((field) => field.required));
  protected readonly pinned = computed(() =>
    this.fields().filter((field) => field.pinned || field.required),
  );
  private readonly pinnedKeys = computed(() => new Set(this.pinned().map((field) => field.key)));
  protected readonly activeCount = computed(() => countActive(this.shown()));
  protected readonly draftActive = computed(() => countActive(this.drawerDraft()));
  protected readonly unfiltered = computed(() => {
    const pending = this.pending()?.key;
    return this.fields().filter(
      (field) =>
        !this.pinnedKeys().has(field.key) &&
        ruleFor(this.shown(), field.key) === undefined &&
        field.key !== pending,
    );
  });
  protected readonly sections = computed(() => {
    const map = new Map<string | undefined, FilterBarField[]>();
    for (const field of this.unfiltered()) {
      const list = map.get(field.section) ?? [];
      list.push(field);
      map.set(field.section, list);
    }
    return [...map.entries()].map(([name, fields]) => ({ fields, name }));
  });
  protected readonly presetItems = computed(
    () => this.presets()?.map((entry) => ({ label: entry.label, value: entry.key })) ?? [],
  );

  /**
   * The bar's members in order: pinned fields as declared — a chip, or a pill
   * while they hold no condition — then the other first-level conditions, then
   * the one pending, which keeps the place an applied rule had when it lost its
   * operand.
   */
  protected readonly members = computed<readonly BarMember[]>(() => {
    const shown = this.shown();
    const pending = this.pending();
    const pinnedKeys = this.pinnedKeys();
    const limit = this.chipLimitValue();
    const readOnly = this.readOnly();
    const format = this.format();
    const members: BarMember[] = [];
    let index = 0;
    const nextFolded = () => index++ >= limit;
    for (const field of this.pinned()) {
      const rule = ruleFor(shown, field.key);
      if (rule !== undefined) {
        members.push(this.describeChip(field.key, rule, { folded: nextFolded(), pinned: true }));
      } else if (pending?.key === field.key) {
        members.push(
          this.describeChip(field.key, pending.filter, {
            folded: nextFolded(),
            incomplete: true,
            pinned: true,
          }),
        );
      } else if (!readOnly) {
        members.push({ field, id: `pill:${field.key}`, kind: 'pill' });
      }
    }
    const floating =
      pending && !pinnedKeys.has(pending.key) && ruleFor(shown, pending.key) === undefined
        ? pending
        : null;
    const pendingChip = (rule: PendingRule) =>
      this.describeChip(rule.key, rule.filter, { folded: nextFolded(), incomplete: true });
    let placed = false;
    (shown?.rules ?? []).forEach((node, at) => {
      if (floating && floating.at === at) {
        members.push(pendingChip(floating));
        placed = true;
      }
      if (isFilterGroup(node)) {
        members.push({
          folded: nextFolded(),
          id: `group:${at}`,
          kind: 'group',
          path: [at],
          words: `(${describeFilterGroup(node, format)})`,
        });
      } else if (!pinnedKeys.has(node.field)) {
        members.push(this.describeChip(node.field, node.filter, { folded: nextFolded() }));
      }
    });
    if (floating && !placed) members.push(pendingChip(floating));
    return members;
  });
  protected readonly chipCount = computed(
    () => this.members().filter((member) => member.kind !== 'pill').length,
  );
  protected readonly folded = computed(() => Math.max(0, this.chipCount() - this.chipLimitValue()));
  protected readonly countText = computed(() => {
    const count = this.count();
    if (count === undefined) return null;
    const total = this.total();
    return total === undefined ? this.t('countOnly', { count }) : this.t('count', { count, total });
  });

  constructor() {
    /* A controlled value that changes from outside replaces the draft: the application's value wins. */
    let last = untracked(this.currentValue);
    effect(() => {
      const value = this.currentValue();
      if (!sameGroup(last, value)) {
        last = value;
        untracked(() => this.draft.set(null));
      }
    });

    /* The draft the drawer edits, taken each time it opens from the tree — or
       from the seed a chip left, when the reader started a rule on a phone and
       the builder is where it is finished. */
    let wasOpen = false;
    effect(() => {
      const open = this.isOpen();
      if (open && !wasOpen) {
        untracked(() => {
          this.drawerDraft.set(this.seed ?? this.shown());
          this.seed = null;
        });
      }
      wasOpen = open;
    });

    /* The ring: one tab stop for the bar, arrows over every control and every
       chip segment. After render, because the items are the template's. */
    afterRenderEffect((onCleanup) => {
      const bar = this.barElement().nativeElement;
      const ring = createRovingTabindex(bar, {
        includeAriaDisabled: true,
        itemSelector: BAR_ITEMS,
      });
      /* A chip removed by the pointer: focus goes to the stop that took its place. */
      const removal = createRemovalFocus(bar, {
        fallback: () => bar.querySelector<HTMLElement>("[data-part='add']") ?? null,
        itemSelector: BAR_ITEMS,
      });
      /* Read the DOM again after a chip, a pill or a control came or went. */
      const observer = new MutationObserver(() => ring.refresh());
      observer.observe(bar, { childList: true, subtree: true });
      onCleanup(() => {
        observer.disconnect();
        ring.destroy();
        removal.destroy();
      });
    });

    /* The narrow breakpoint, read from the root's own width, and the sheet
       breakpoint, read from the viewport — the side a drawer opens from is the
       viewport's question. A root with no box is not measured. */
    afterNextRender(() => {
      const element = this.host.nativeElement;
      const view = element.ownerDocument.defaultView;
      /* Read only in the observer's reports, the first of which arrives
         after layout: a read here forced a layout of the page just rendered. */
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          const width = element.getBoundingClientRect().width;
          this.narrow.set(width > 0 && width < remToPx(element, NARROW_REM));
        });
        observer.observe(element);
        this.destroyRef.onDestroy(() => observer.disconnect());
      }
      if (view?.matchMedia) {
        const query = view.matchMedia(`(max-width: ${NARROW_REM}rem)`);
        const read = () => this.sheet.set(query.matches);
        read();
        query.addEventListener?.('change', read);
        this.destroyRef.onDestroy(() => query.removeEventListener?.('change', read));
      }
    });

    /* The document key that reaches the search, unless the reader is typing. */
    effect((onCleanup) => {
      const key = this.shortcutValue();
      if (!key || this.disabled()) return;
      const doc = this.host.nativeElement.ownerDocument;
      const listener = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
        if (event.key !== key || isEditable(doc.activeElement)) return;
        event.preventDefault();
        this.focusSearch();
      };
      doc.addEventListener('keydown', listener);
      onCleanup(() => doc.removeEventListener('keydown', listener));
    });

    /* Sticky: the bar reads the page property and adds its own height for what follows. */
    effect((onCleanup) => {
      if (!this.sticky() || typeof ResizeObserver === 'undefined') return;
      const element = this.host.nativeElement;
      const parent = element.parentElement;
      const view = element.ownerDocument.defaultView;
      if (!parent || !view) return;
      /* What the parent declared inline before this bar added itself: put back
         before every read, so a second measure never sums the bar twice. */
      const declared = parent.style.getPropertyValue(STICKY_TOP);
      const restore = () =>
        declared
          ? parent.style.setProperty(STICKY_TOP, declared)
          : parent.style.removeProperty(STICKY_TOP);
      const publish = () => {
        restore();
        const above = view.getComputedStyle(parent).getPropertyValue(STICKY_TOP).trim() || '0px';
        const height = element.getBoundingClientRect().height;
        element.style.setProperty(STICKY_TOP, above);
        parent.style.setProperty(STICKY_TOP, `calc(${above} + ${height}px)`);
      };
      /* Its first report, after layout, is the first measurement. */
      const observer = new ResizeObserver(publish);
      observer.observe(element);
      onCleanup(() => {
        observer.disconnect();
        element.style.removeProperty(STICKY_TOP);
        restore();
      });
    });

    this.destroyRef.onDestroy(() => clearTimeout(this.timer));
  }

  /* ── Helpers the template reads ─────────────────────────────────────── */

  protected pillOf(member: BarMember) {
    return member.kind === 'pill' ? member : null;
  }

  protected chipOf(member: BarMember) {
    return member.kind === 'chip' ? member : null;
  }

  protected groupOf(member: BarMember) {
    return member.kind === 'group' ? member : null;
  }

  protected isTemplate(icon: unknown): icon is TemplateRef<unknown> {
    return icon instanceof TemplateRef;
  }

  protected operatorWords(operator: string) {
    return operatorName(this.t, operator);
  }

  protected normalized(group: FilterGroup | null) {
    return normalizeFilterGroup(group);
  }

  /** One field's condition as its chip draws it. */
  private describeChip(
    key: string,
    filter: FilterDescriptor,
    flags: { pinned?: boolean; incomplete?: boolean; folded: boolean },
  ): BarChip {
    const field = fieldByKey(this.fields(), key);
    const unknown = field === undefined;
    const label = field?.label ?? key;
    const words = ruleWords(this.t, field, filter);
    const incomplete = flags.incomplete === true || !isFilterActive(filter);
    const value = words.value || this.t('noValue');
    const rule = this.t('rule', {
      condition:
        words.operands > 0
          ? this.t('condition', { operator: words.operator, value })
          : words.operator,
      field: unknown ? this.t('unknownField', { field: key }) : label,
    });
    return {
      condition: filter.conditions[0]?.operator ?? '',
      field,
      filter,
      folded: flags.folded,
      hasValue: words.operands > 0 || incomplete,
      id: `chip:${key}`,
      incomplete,
      key,
      kind: 'chip',
      label,
      name: incomplete ? this.t('incomplete', { rule }) : rule,
      operands: words.operands,
      operator: words.operator,
      operators: field?.operators ?? (field ? (operatorsFor(field.kind) as readonly string[]) : []),
      pinned: flags.pinned === true,
      removable: field?.required !== true && !this.readOnly(),
      unknown,
      value,
      valueName: this.t('condition', { operator: words.operator, value: words.full || value }),
      valueTitle: words.full && words.full !== words.value ? words.full : null,
    };
  }

  private sentenceOf(
    field: FilterBarField | undefined,
    filter: FilterDescriptor | null | undefined,
  ) {
    return describeFilter(filter, {
      ...this.format(),
      value: (value) =>
        field?.options?.find((option) => option.value === value)?.label ?? String(value),
    });
  }

  private announce(message: string) {
    getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(message);
  }

  /* ── The five requests ─────────────────────────────────────────────── */

  requestValue(next: FilterGroup | null, reason: FilterBarValueReason, source?: unknown) {
    const normalized = normalizeFilterGroup(next);
    const state = createControllable<FilterGroup | null>({
      equals: sameGroup,
      initial: this.currentValue(),
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (state.request(normalized, reason, source)) this.value.set(normalized);
  }

  requestQuery(next: string, reason: FilterBarQueryReason, source?: unknown) {
    const state = createControllable<string>({
      initial: this.currentQuery(),
      onRequest: (request) => this.queryChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.query.set(next);
  }

  requestPreset(next: string | null, reason: FilterBarPresetReason, source?: unknown) {
    const state = createControllable<string | null>({
      initial: this.currentPreset(),
      onRequest: (request) => this.presetChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.preset.set(next);
  }

  requestOpen(next: boolean, reason: FilterBarOpenReason, source?: unknown) {
    const state = createControllable<boolean>({
      initial: this.isOpen(),
      onRequest: (request) => this.openChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.open.set(next);
  }

  requestRevealed(next: boolean, reason: FilterBarRevealedReason, source?: unknown) {
    const state = createControllable<boolean>({
      initial: this.isRevealed(),
      onRequest: (request) => this.revealedChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.revealed.set(next);
  }

  /* ── Edits ─────────────────────────────────────────────────────────── */

  /**
   * Every edit of the tree goes through here: under `live` it is requested at
   * once, under `manual` it goes to the draft and Apply requests it.
   */
  private edit(next: FilterGroup | null, reason: FilterBarValueReason, source?: unknown) {
    if (this.applyValue() === 'manual') {
      this.draft.set({ query: this.shownQuery(), value: next });
      return;
    }
    this.requestValue(next, reason, source);
  }

  /** The tree with every required field at its default, which is what Clear returns to. */
  protected baseline(): FilterGroup | null {
    let next: FilterGroup | null = null;
    for (const field of this.required()) {
      if (field.defaultValue) next = withRuleFor(next, field.key, field.defaultValue);
    }
    return normalizeFilterGroup(next);
  }

  private missing(tree: FilterGroup | null) {
    return this.required().filter((field) => !isFilterActive(ruleFor(tree, field.key) ?? null));
  }

  /** A required field refuses: data-invalid on its chip or pill, its message said, and focus on it when asked. */
  private refuse(field: FilterBarField, focus: boolean) {
    this.invalid.set(field.key);
    this.announce(this.t('required', { field: field.label }));
    if (!focus) return;
    const member = this.barElement().nativeElement.querySelector<HTMLElement>(
      `[data-field='${CSS.escape(field.key)}']`,
    );
    (member?.matches('button') ? member : member?.querySelector<HTMLElement>(SEGMENTS))?.focus();
  }

  /** A field chosen from `add` or pressed as a pill: its chip, incomplete, with the value popover open. */
  protected start(key: string, source?: unknown) {
    const field = fieldByKey(this.fields(), key);
    if (!field || this.locked()) return;
    if (this.narrow()) {
      this.openBuilderOn(key, source);
      return;
    }
    const filter = blankRule(field);
    if (isFilterActive(filter)) {
      this.edit(withRuleFor(this.shown(), key, filter), 'pointer', source);
    } else {
      this.pending.set({ filter, key });
    }
    this.valueOpen.set(key);
  }

  /** Every change to one field's rule from a chip: pending until active, then the value's. */
  protected changeRule(key: string, next: FilterDescriptor | null, reason: FilterBarValueReason) {
    const field = fieldByKey(this.fields(), key);
    const shown = this.shown();
    if (next === null) {
      if (field?.required) {
        this.refuse(field, false);
        return;
      }
      if (this.pending()?.key === key) this.pending.set(null);
      this.edit(withoutRuleFor(shown, key), 'clear');
      return;
    }
    this.invalid.set(null);
    if (!isFilterActive(next)) {
      /* A draft holds an unfinished rule as it stands; the value never does. */
      if (this.applyValue() === 'manual') {
        this.edit(withRuleFor(shown, key, next), reason);
        return;
      }
      const at = shown
        ? shown.rules.findIndex((node) => !isFilterGroup(node) && node.field === key)
        : -1;
      this.pending.set({ filter: next, key, ...(at === -1 ? {} : { at }) });
      if (at !== -1) this.edit(withoutRuleFor(shown, key), reason);
      return;
    }
    if (this.pending()?.key === key) this.pending.set(null);
    this.edit(withRuleFor(shown, key, next), reason);
  }

  protected setOperator(key: string, filter: FilterDescriptor, operator: string) {
    const condition = (filter.conditions[0] ?? { operator }) as Condition;
    const before = operandCount(condition.operator as FilterOperator);
    const after = operandCount(operator as FilterOperator);
    const next = withCondition(filter, 0, {
      operator,
      ...(after >= 1 && before >= 1 ? { value: condition.value } : {}),
      ...(after === 2 && before === 2 ? { end: condition.end } : {}),
    } as never);
    this.changeRule(key, next, 'pointer');
    /* An operator that wants an operand the rule lacks moves on to the value. */
    if (after > 0 && !isFilterActive(next)) this.valueOpen.set(key);
  }

  protected toggleValue(key: string, open: boolean) {
    const current = this.valueOpen();
    this.valueOpen.set(open ? key : current === key ? null : current);
  }

  /** Done in a chip's value popover: the condition is said, and the popover closes. */
  protected finishValue(key: string) {
    const field = fieldByKey(this.fields(), key);
    const rule = ruleFor(this.shown(), key);
    if (rule && isFilterActive(rule)) {
      this.announce(
        this.t('rule', { condition: this.sentenceOf(field, rule), field: field?.label ?? key }),
      );
    }
    if (this.valueOpen() === key) this.valueOpen.set(null);
  }

  /** The value segment drawn without its popover: under the narrow breakpoint it opens the builder. */
  protected onValueSegment(chip: BarChip, event: Event) {
    if (this.readOnly() || chip.unknown || !this.narrow()) return;
    this.openBuilderOn(chip.key, event);
  }

  protected removeField(key: string, source?: unknown) {
    const field = fieldByKey(this.fields(), key);
    if (field?.required) {
      this.refuse(field, false);
      return;
    }
    const pending = this.pending();
    if (pending?.key === key) {
      this.pending.set(null);
      if (ruleFor(this.shown(), key) === undefined) return;
    }
    this.edit(withoutRuleFor(this.shown(), key), 'remove', source);
    this.announce(this.t('removed', { field: field?.label ?? key }));
  }

  protected removeNode(path: FilterPath, source?: unknown) {
    const shown = this.shown();
    if (!shown) return;
    this.edit(removeNodeAt(shown, path), 'remove', source);
  }

  /**
   * `Delete` and `Backspace` on a segment remove the condition. The keyboard
   * goes to the segment of the same role on the chip that followed, else on
   * the one before, else to `add` — chosen before the removal, while both
   * neighbours are still in the DOM, and focused after the render.
   */
  protected onChipKeyDown(event: KeyboardEvent, key: string) {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    const segment = (event.target as HTMLElement).closest<HTMLElement>(SEGMENTS);
    if (!segment || this.locked() || event.defaultPrevented) return;
    event.preventDefault();
    if (fieldByKey(this.fields(), key)?.required) {
      this.removeField(key, event);
      return;
    }
    const bar = this.barElement().nativeElement;
    const chips = [...bar.querySelectorAll<HTMLElement>("[data-part='chip']")].filter(
      (chip) => chip.checkVisibility?.() ?? true,
    );
    const here = segment.closest<HTMLElement>("[data-part='chip']");
    const index = here ? chips.indexOf(here) : -1;
    const role = segment.getAttribute('data-part');
    const neighbour = chips[index + 1] ?? chips[index - 1];
    const target =
      neighbour?.querySelector<HTMLElement>(`[data-part='${role}']`) ??
      neighbour?.querySelector<HTMLElement>('button') ??
      null;
    this.focusAfterRender(target);
    this.removeField(key, event);
  }

  protected onGroupKeyDown(event: KeyboardEvent, path: FilterPath) {
    if ((event.key !== 'Delete' && event.key !== 'Backspace') || this.locked()) return;
    event.preventDefault();
    this.removeNode(path, event);
  }

  private focusAfterRender(target: HTMLElement | null) {
    afterNextRender(
      {
        write: () => {
          const bar = this.barElement().nativeElement;
          (target?.isConnected
            ? target
            : bar.querySelector<HTMLElement>("[data-part='add']")
          )?.focus();
        },
      },
      { injector: this.injector },
    );
  }

  protected clearAll(source?: unknown) {
    const next = this.baseline();
    this.invalid.set(null);
    this.pending.set(null);
    if (this.applyValue() === 'manual') {
      this.draft.set({ query: '', value: next });
    } else {
      this.requestValue(next, 'clear', source);
      if (this.currentQuery() !== '') this.requestQuery('', 'clear', source);
    }
    this.announce(
      next
        ? this.t('clearedTo', { filters: describeFilterGroup(next, this.format()) })
        : this.t('cleared'),
    );
  }

  protected submit(source?: unknown) {
    const draft = this.draft();
    if (!draft) return;
    const lacking = this.missing(draft.value);
    if (lacking[0]) {
      this.refuse(lacking[0], true);
      return;
    }
    this.invalid.set(null);
    this.requestValue(draft.value, 'submit', source);
    if (draft.query !== this.currentQuery()) this.requestQuery(draft.query, 'submit', source);
    this.draft.set(null);
    const applied = normalizeFilterGroup(draft.value);
    this.announce(
      applied
        ? this.t('appliedCount', {
            count: firstLevelRules(applied).length,
            filters: describeFilterGroup(applied, this.format()),
          })
        : this.t('cleared'),
    );
  }

  protected reset() {
    this.draft.set(null);
    this.invalid.set(null);
  }

  protected choosePreset(key: string | null, source?: unknown) {
    this.requestPreset(key, key === null ? 'clear' : 'select', source);
    const chosen = this.presets()?.find((entry) => entry.key === key);
    if (chosen) {
      this.draft.set(null);
      this.requestValue(chosen.value, 'select', source);
      this.announce(chosen.label);
    }
  }

  /* ── The builder ───────────────────────────────────────────────────── */

  /** Opens the builder, with the card at `at.path` expanded, on `at.tree` when given. */
  protected openBuilderAt(
    reason: FilterBarOpenReason,
    source?: unknown,
    at?: { tree?: FilterGroup | null; path: FilterPath },
  ) {
    if (at?.tree !== undefined) this.seed = at.tree;
    this.expanded.set(at ? at.path.join('.') : null);
    this.requestOpen(true, reason, source);
  }

  /** The builder open on one field's rule: the applied one, the pending one, or a fresh one. */
  private openBuilderOn(key: string, source?: unknown) {
    const field = fieldByKey(this.fields(), key);
    const shown = this.shown();
    const pending = this.pending();
    const applied = shown
      ? shown.rules.findIndex((node) => !isFilterGroup(node) && node.field === key)
      : -1;
    if (applied !== -1 && pending?.key !== key) {
      this.openBuilderAt('pointer', source, { path: [applied] });
      return;
    }
    const filter = pending?.key === key ? pending.filter : field ? blankRule(field) : null;
    if (!filter) return;
    const tree = withRuleFor(shown, key, filter);
    this.pending.set(null);
    this.openBuilderAt('pointer', source, {
      path: [tree.rules.findIndex((node) => !isFilterGroup(node) && node.field === key)],
      tree,
    });
  }

  protected commitDrawer() {
    const next = this.drawerDraft();
    const lacking = this.missing(next);
    if (lacking[0]) {
      this.refuse(lacking[0], false);
      return;
    }
    this.invalid.set(null);
    this.edit(next, 'submit');
    const applied = normalizeFilterGroup(next);
    this.announce(
      applied
        ? this.t('appliedCount', {
            count: countActive(applied),
            filters: describeFilterGroup(applied, this.format()),
          })
        : this.t('cleared'),
    );
    this.requestOpen(false, 'submit');
  }

  protected onDrawerRequest(request: ChangeRequest<boolean>) {
    this.requestOpen(request.value, request.reason as FilterBarOpenReason, request.source);
  }

  /* ── The query ─────────────────────────────────────────────────────── */

  protected typeQuery(request: ChangeRequest<string>) {
    const next = request.value;
    const reason: FilterBarQueryReason = request.reason === 'clear' ? 'clear' : 'keyboard';
    if (this.applyValue() === 'manual') {
      this.draft.set({ query: next, value: this.shown() });
      return;
    }
    this.typed.set(next);
    clearTimeout(this.timer);
    if (reason === 'clear' || this.queryDelayValue() === 0) {
      this.typed.set(null);
      this.requestQuery(next, reason, request.source);
      return;
    }
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.typed.set(null);
      this.requestQuery(next, reason, request.source);
    }, this.queryDelayValue());
  }

  protected onSearchKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape' && this.shownQuery() !== '') {
      event.preventDefault();
      this.typeQuery({
        cancel: () => {},
        cancelled: false,
        previous: this.shownQuery(),
        reason: 'clear',
        source: event,
        value: '',
      });
    }
    if (event.key === 'Enter' && this.applyValue() === 'manual') this.submit(event);
  }

  /* ── Imperative ────────────────────────────────────────────────────── */

  /** Puts focus in the search field. */
  focusSearch() {
    this.searchInput().nativeElement.focus();
  }

  /**
   * Opens the builder. With a path, the rule at that path opens as the
   * expanded card. `open` is the model's name here, so the handle's `open(path)`
   * is `openBuilder(path)`.
   */
  openBuilder(path?: FilterPath) {
    this.openBuilderAt('programmatic', undefined, path ? { path } : undefined);
  }
}
