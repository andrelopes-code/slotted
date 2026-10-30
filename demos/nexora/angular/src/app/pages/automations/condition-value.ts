import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SlCurrencyField, SlCurrencyFieldInput } from '@slotted/angular/currency-field';
import { SlMultiSelect, SlMultiSelectItem } from '@slotted/angular/multi-select';
import { SlNumberField, SlNumberFieldEnd, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import {
  LIST_OPERATORS,
  VALUELESS_OPERATORS,
  type ConditionOperator,
  type WorkflowField,
} from '@slotted/demo-nexora-backend';

/**
 * A condition's operand, in the unit a reader reads it in and the backend
 * stores it in: money is typed in US dollars and stored in cents, basis
 * points are typed as a percentage, a list operator takes a choice of the
 * field's own values, and an emptiness operator takes nothing (§69.2).
 */
@Component({
  selector: 'app-condition-value',
  imports: [
    SlCurrencyField,
    SlCurrencyFieldInput,
    SlMultiSelect,
    SlMultiSelectItem,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlSelect,
    SlSelectItem,
    SlTextField,
    SlTextFieldInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-kind]': 'kind()' },
  template: `
    @switch (kind()) {
      @case ('list') {
        <sl-multi-select
          [attr.aria-label]="label()"
          placeholder="Choose values"
          [invalid]="invalid()"
          [value]="list()"
          (valueChangeRequest)="valueChange.emit([...$event.value])"
        >
          @for (option of field()?.options ?? []; track option.value) {
            <sl-multi-select-item [value]="option.value" [label]="option.label" />
          }
        </sl-multi-select>
      }
      @case ('choice') {
        <sl-select
          [attr.aria-label]="label()"
          placeholder="Choose a value"
          [invalid]="invalid()"
          [value]="text()"
          (valueChangeRequest)="valueChange.emit($any($event.value))"
        >
          @for (option of field()?.options ?? []; track option.value) {
            <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
          }
        </sl-select>
      }
      @case ('boolean') {
        <sl-select
          [attr.aria-label]="label()"
          [invalid]="invalid()"
          [value]="value() === false ? 'no' : 'yes'"
          (valueChangeRequest)="valueChange.emit($event.value === 'yes')"
        >
          <sl-select-item value="yes">Yes</sl-select-item>
          <sl-select-item value="no">No</sl-select-item>
        </sl-select>
      }
      @case ('money') {
        <div slCurrencyField>
          <input
            slCurrencyFieldInput
            currency="USD"
            entry="natural"
            min="0"
            [allowEmpty]="true"
            [attr.aria-label]="label()"
            [invalid]="invalid()"
            [value]="major()"
            (valueChange)="valueChange.emit($event.value === null ? null : $event.minorUnits)"
          />
        </div>
      }
      @case ('number') {
        <div slNumberField stepper="none">
          <input
            slNumberFieldInput
            [attr.aria-label]="label()"
            [invalid]="invalid()"
            [value]="shown()"
            (valueChange)="setNumber($event.value)"
          />
          @if (field()?.type === 'bps') {
            <span slNumberFieldEnd>%</span>
          }
        </div>
      }
      @case ('text') {
        <div slTextField>
          <input
            slTextFieldInput
            [attr.aria-label]="label()"
            [placeholder]="field()?.type === 'tags' ? 'A tag' : 'Text'"
            [invalid]="invalid()"
            [value]="text() ?? ''"
            (valueChange)="valueChange.emit($event.value)"
          />
        </div>
      }
    }
  `,
})
export class ConditionValue {
  readonly field = input<WorkflowField | undefined>(undefined);
  readonly operator = input.required<ConditionOperator>();
  readonly value = input<unknown>(null);
  readonly invalid = input(false);
  /** The control's accessible name: which condition's value it is. */
  readonly label = input.required<string>();
  readonly valueChange = output<unknown>();

  readonly kind = computed<'none' | 'list' | 'choice' | 'boolean' | 'money' | 'number' | 'text'>(() => {
    const field = this.field();
    const operator = this.operator();
    if (VALUELESS_OPERATORS.includes(operator)) return 'none';
    if (LIST_OPERATORS.includes(operator)) return 'list';
    if (!field) return 'text';
    switch (field.type) {
      case 'money':
        return 'money';
      case 'bps':
      case 'number':
      case 'quantity':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'enum':
        return 'choice';
      case 'tags':
        return field.options && field.options.length > 0 ? 'choice' : 'text';
      default:
        return 'text';
    }
  });

  readonly list = computed(() => (Array.isArray(this.value()) ? (this.value() as string[]) : []));
  readonly text = computed(() => (typeof this.value() === 'string' ? (this.value() as string) : null));
  readonly major = computed(() => (typeof this.value() === 'number' ? (this.value() as number) / 100 : null));
  /** Basis points read as a percentage; every other number as it is stored. */
  readonly shown = computed(() => {
    const value = this.value();
    if (typeof value !== 'number') return null;
    return this.field()?.type === 'bps' ? value / 100 : value;
  });

  setNumber(value: number | null): void {
    if (value === null) {
      this.valueChange.emit(null);
      return;
    }
    this.valueChange.emit(this.field()?.type === 'bps' ? Math.round(value * 100) : value);
  }
}
