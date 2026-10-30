import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { injectFieldDefaults, SlField, SlFieldDefaultsSource } from '@slotted/angular/field';
import { SlFieldGroup } from '@slotted/angular/field-group';

import { injectCheckboxGroupDefaults } from './checkbox-group-defaults';
import type {
  CheckboxGroupLabelPlacement,
  CheckboxGroupVariant,
  CheckboxGroupOrientation,
  CheckboxGroupSize,
} from './checkbox-group-defaults';

export type {
  CheckboxGroupDefaults,
  CheckboxGroupLabelPlacement,
  CheckboxGroupVariant,
  CheckboxGroupOrientation,
  CheckboxGroupSize,
} from './checkbox-group-defaults';

/** Why the selection moved. A set of boxes can produce exactly these two. */
export type CheckboxGroupSelectionReason = 'pointer' | 'keyboard';

/** Whether two selections hold the same values in the same order. */
function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * A set of choices, and the array behind it.
 *
 * **The group holds the value; the boxes draw themselves.** `checkbox` is the
 * entry point beside this one rather than a part of it, so a box works alone
 * and this stylesheet never selects into that one.
 *
 * **The role is conditional, and the condition is the field group.** A
 * `field-group` is a `fieldset` with a `legend`, which is already a named group;
 * a `role="group"` inside it, named by the same legend, is the same set
 * announced twice. A `role` the consumer wrote wins over both.
 *
 * **Order comes from `allValues` when there is one.** A selection that grew in
 * click order would submit in click order, so two readers who chose the same
 * three options would send two different arrays.
 */
@Component({
  selector: '[slCheckboxGroup]',
  standalone: true,
  exportAs: 'slCheckboxGroup',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/checkbox-group/checkbox-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlCheckboxGroup), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlCheckboxGroup), multi: true },
  ],
  host: {
    'data-ui': 'checkbox-group',
    'data-ui-checkbox-group': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'resolvedRole()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
  },
})
export class SlCheckboxGroup implements ControlValueAccessor, OnInit, Validator {
  /** Present means the consumer owns the selection. */
  readonly value = input<readonly string[] | undefined>(undefined);
  /** The selection an uncontrolled group starts from, read once. */
  readonly defaultValue = input<readonly string[] | undefined>(undefined);
  /**
   * Every value the group commands. It is what makes a parent box possible, and
   * what keeps the selection in the set's order rather than in click order.
   */
  readonly allValues = input<readonly string[] | undefined>(undefined);
  /** The submission name every box shares when it states none of its own. */
  readonly name = input<string | undefined>(undefined);
  readonly size = input<CheckboxGroupSize | undefined>(undefined);
  readonly orientation = input<CheckboxGroupOrientation | undefined>(undefined);
  readonly labelPlacement = input<CheckboxGroupLabelPlacement | undefined>(undefined);
  readonly variant = input<CheckboxGroupVariant | undefined>(undefined);
  /** Unstated rather than `false`, so the group defers to the field around it. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly required = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Publishes how many of `allValues` are selected to the field around the group. */
  readonly showCount = input(false, { transform: booleanAttribute });

  /**
   * One output for one transition, carrying the new array, the array it
   * replaces, the reason, the originating event and `cancel()`. There is no
   * `[(value)]`, because a two-way binding has one slot and can carry none of
   * those; a form gets the same movement through `ControlValueAccessor`.
   */
  readonly valueChange = output<ChangeRequest<readonly string[]>>();

  private readonly field = inject(SlField, { optional: true });
  private readonly fieldGroup = inject(SlFieldGroup, { optional: true });
  private readonly defaults = injectCheckboxGroupDefaults();
  /**
   * The field defaults in force: a field group's, or the application's own.
   * A group outside a field reads disabled and read-only from them, as React's
   * reads them from FieldDefaultsProvider.
   */
  private readonly fieldDefaultsSource = inject(SlFieldDefaultsSource, { optional: true });
  private readonly fieldDefaultsToken = injectFieldDefaults();
  private readonly fieldDefaults = computed(
    () => this.fieldDefaultsSource?.fieldDefaults() ?? this.fieldDefaultsToken,
  );
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });

  private readonly own = signal<readonly string[]>([]);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (value: readonly string[]) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  readonly selection = computed(() => this.value() ?? this.own());

  readonly resolvedSize = computed(
    () =>
      this.size() ??
      this.field?.resolvedSize() ??
      this.fieldGroup?.resolvedSize() ??
      this.defaults.size,
  );
  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);
  readonly resolvedLabelPlacement = computed(
    () => this.labelPlacement() ?? this.defaults.labelPlacement,
  );
  /** Handed to every choice in the set: one plain box among four tiles is a
      set nobody meant to write. */
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedDisabled = computed(
    () =>
      this.disabled() ??
      this.formDisabled() ??
      this.field?.resolvedDisabled() ??
      this.fieldDefaults().disabled,
  );
  readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.field?.resolvedReadOnly() ?? this.fieldDefaults().readOnly,
  );
  readonly resolvedInvalid = computed(
    () => this.invalid() ?? this.field?.invalid() ?? this.fieldGroup?.invalid(),
  );
  readonly resolvedRequired = computed(
    () => this.required() ?? this.field?.required() ?? this.fieldGroup?.required(),
  );
  protected readonly resolvedRole = computed(
    () => this.writtenRole ?? (this.fieldGroup === null ? 'group' : null),
  );
  /* A group has no element a label's for can reach, so inside a field the
     field's label names it, unless the consumer named it themselves. */
  protected readonly labelledBy = computed(
    () =>
      this.writtenLabelledBy ??
      (this.writtenLabel === null ? (this.field?.ids().label ?? null) : null),
  );
  protected readonly describedBy = computed(() => {
    const merged = [this.writtenDescribedBy, this.field?.describedBy()].filter(Boolean);
    return merged.length === 0 ? null : merged.join(' ');
  });
  protected readonly ariaInvalid = computed(() =>
    this.resolvedInvalid() === true ? 'true' : null,
  );
  protected readonly ariaRequired = computed(() =>
    this.resolvedRequired() === true ? 'true' : null,
  );

  constructor() {
    /* The count is the group's and the place is the field's, exactly as a text
       field publishes characters to the same channel. */
    effect(() => {
      const field = this.field;
      if (field === null) return;
      if (!this.showCount()) {
        field.setCount(undefined);
        return;
      }
      field.setCount({ length: this.selection().length, max: this.allValues()?.length });
    });
  }

  /**
   * Angular creates every directive in a template before it binds any input, so
   * the starting selection is read here rather than in the constructor: read
   * there, `defaultValue` is always `undefined` and the group starts empty.
   */
  ngOnInit() {
    if (this.value() === undefined) this.own.set(this.defaultValue() ?? []);
  }

  /** Whether one value is in the selection. Read by every box in the set. */
  holds(value: string): boolean {
    return this.selection().includes(value);
  }

  /**
   * Asks the group to add or remove one value. Returns whether the selection
   * actually moved — false while a consumer owns it, which is what tells the
   * box to refuse the activation and let the platform put the element back.
   */
  toggle(value: string, reason: CheckboxGroupSelectionReason, source: Event): boolean {
    const current = this.selection();
    const all = this.allValues();
    const next = current.includes(value)
      ? current.filter((candidate) => candidate !== value)
      : all === undefined
        ? [...current, value]
        : all.filter((candidate) => candidate === value || current.includes(candidate));
    return this.request(next, reason, source);
  }

  /** Asks the group to replace its whole selection. Used by the parent box. */
  requestAll(checked: boolean, reason: CheckboxGroupSelectionReason, source: Event): boolean {
    return this.request(checked ? [...(this.allValues() ?? [])] : [], reason, source);
  }

  writeValue(value: readonly string[] | null | undefined) {
    this.own.set(value ?? []);
  }

  registerOnChange(fn: (value: readonly string[]) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  /** Marks the set touched, which a box calls when it loses focus. */
  markTouched() {
    this.onTouchedFn();
  }

  /**
   * The group owns validity over the set, which no single box can see: "choose
   * at least one" is a fact about the array and not about any one value.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.resolvedRequired() !== true) return null;
    const value = control.value as readonly string[] | null | undefined;
    return value === null || value === undefined || value.length === 0 ? { required: true } : null;
  }

  private request(
    next: readonly string[],
    reason: CheckboxGroupSelectionReason,
    source: Event,
  ): boolean {
    if (this.resolvedReadOnly() === true) return false;

    let cancelled = false;
    const state = createControllable<readonly string[]>({
      controlled: this.value(),
      equals: sameSelection,
      initial: this.selection(),
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled || !moved) return false;
    this.own.set(next);
    this.onChangeFn(next);
    return true;
  }
}
