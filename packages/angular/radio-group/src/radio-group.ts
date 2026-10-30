import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { injectFieldDefaults, SlField, SlFieldDefaultsSource } from '@slotted/angular/field';
import { SlFieldGroup } from '@slotted/angular/field-group';

import { injectRadioGroupDefaults, SlRadioGroupIdFactory } from './radio-group-defaults';
import type {
  RadioGroupLabelPlacement,
  RadioGroupVariant,
  RadioGroupOrientation,
  RadioGroupSize,
} from './radio-group-defaults';

export type {
  RadioGroupDefaults,
  RadioGroupLabelPlacement,
  RadioGroupVariant,
  RadioGroupOrientation,
  RadioGroupSize,
} from './radio-group-defaults';

/** Why the value moved. A radio group can produce exactly these two. */
export type RadioGroupSelectionReason = 'pointer' | 'keyboard';

/**
 * What the group needs from each item, and nothing more.
 *
 * A structural type rather than the item's class, so the group does not import
 * the component that injects it — the cycle `text-field` breaks with an
 * abstract class, broken here with the smaller thing that works.
 */
export interface SlRadioGroupItem {
  /** Writes this item's element from the group's value. */
  syncElement(): void;
}

/**
 * One choice out of a set.
 *
 * **The keyboard is the platform's, and that is why the items share a `name`.**
 * Native radios in one form owner with one name already implement the APG's
 * whole table: Tab lands on the checked item or on the first, `Space` checks,
 * both arrow axes move focus and selection together, the set wraps, and
 * disabled items are skipped — in a right-to-left document too. A roving
 * `tabindex` written once per binding would reimplement all of it twice.
 *
 * **The role is conditional, and the condition is the field group.** A
 * `field-group` is a `fieldset` with a `legend`, which is already a named group;
 * a `radiogroup` inside it, named by the same legend, is the same set announced
 * twice. A `role` the consumer wrote wins over both.
 *
 * **`readOnly` is enforced, because the platform has none.** A radio ignores
 * `readonly`, so the group refuses the change on the item's own `click` — the
 * one event a pointer and `Space` share — and announces `aria-readonly`.
 */
@Component({
  selector: '[slRadioGroup]',
  standalone: true,
  exportAs: 'slRadioGroup',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/radio-group/radio-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlRadioGroup), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlRadioGroup), multi: true },
  ],
  host: {
    'data-ui': 'radio-group',
    'data-ui-radio-group': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'resolvedRole()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-label-placement]': 'resolvedLabelPlacement()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-readonly]': 'ariaReadOnly()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-orientation]': 'ariaOrientation()',
  },
})
export class SlRadioGroup implements ControlValueAccessor, OnInit, Validator {
  /** Present means the consumer owns the choice. */
  readonly value = input<string | undefined>(undefined);
  /** The value an uncontrolled group starts from, read once. */
  readonly defaultValue = input<string | undefined>(undefined);
  /**
   * The submission name the set shares, and the reason the platform treats it
   * as one group. Generated when it is not written, because grouping is by name
   * within the form owner and an unnamed set is not a set.
   */
  readonly name = input<string | undefined>(undefined);
  readonly size = input<RadioGroupSize | undefined>(undefined);
  readonly orientation = input<RadioGroupOrientation | undefined>(undefined);
  readonly labelPlacement = input<RadioGroupLabelPlacement | undefined>(undefined);
  readonly variant = input<RadioGroupVariant | undefined>(undefined);
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

  /**
   * One output for one transition. Its `previous` is `undefined` while nothing
   * has been chosen, which is the state the APG asks a group to start in and
   * which a request typed over `string` alone could not say.
   */
  readonly valueChange = output<ChangeRequest<string | undefined>>();

  private readonly field = inject(SlField, { optional: true });
  private readonly fieldGroup = inject(SlFieldGroup, { optional: true });
  private readonly defaults = injectRadioGroupDefaults();
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
  private readonly generatedName = inject(SlRadioGroupIdFactory).next();
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });

  private readonly items = new Set<SlRadioGroupItem>();
  private readonly own = signal<string | undefined>(undefined);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (value: string) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  readonly selection = computed(() => this.value() ?? this.own());
  readonly resolvedName = computed(() => this.name() ?? this.generatedName);

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
    () => this.writtenRole ?? (this.fieldGroup === null ? 'radiogroup' : null),
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
  protected readonly ariaReadOnly = computed(() =>
    this.resolvedReadOnly() === true ? 'true' : null,
  );
  protected readonly ariaRequired = computed(() =>
    this.resolvedRequired() === true ? 'true' : null,
  );
  /**
   * Only where the root owns the role, and only when the group flows the other
   * way: on an element with no role the attribute describes nothing, and
   * `radiogroup` already implies `vertical`.
   */
  protected readonly ariaOrientation = computed(() =>
    this.resolvedRole() === 'radiogroup' && this.resolvedOrientation() === 'horizontal'
      ? 'horizontal'
      : null,
  );

  ngOnInit() {
    if (this.value() === undefined) this.own.set(this.defaultValue());
  }

  /** An item joins the set, so the group can put every element back at once. */
  register(item: SlRadioGroupItem) {
    this.items.add(item);
  }

  /** An item leaves the set. */
  unregister(item: SlRadioGroupItem) {
    this.items.delete(item);
  }

  /**
   * Writes every item's element from the value.
   *
   * The HTML standard's canceled activation behaviour for a radio restores the
   * *clicked* element and nothing else, so the option that was chosen before
   * the refused click stays unchecked: checking one radio unchecks its
   * neighbours, and undoing the first half of that is all the platform offers.
   * Angular writes a property binding only when its value changes, and the
   * neighbour's did not, so the correction is made here — measured, in the
   * first run of this family's Angular spec, as a controlled group that lost
   * its choice after its consumer had said no.
   */
  restoreElements() {
    for (const item of this.items) item.syncElement();
  }

  /** Whether one value is the chosen one. Read by every item in the set. */
  holds(value: string): boolean {
    return this.selection() === value;
  }

  /**
   * Asks the group to move to one value. Returns whether the value actually
   * moved — false while a consumer owns it, which is what tells the item to
   * refuse the activation and let the platform put the element back.
   */
  select(value: string, reason: RadioGroupSelectionReason, source: Event): boolean {
    if (this.resolvedReadOnly() === true) return false;

    let cancelled = false;
    const state = createControllable<string | undefined>({
      controlled: this.value(),
      initial: this.selection(),
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(value, reason, source);
    if (cancelled || !moved) return false;
    this.own.set(value);
    this.onChangeFn(value);
    return true;
  }

  writeValue(value: string | null | undefined) {
    this.own.set(value ?? undefined);
  }

  registerOnChange(fn: (value: string) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  /** Marks the set touched, which an item calls when it loses focus. */
  markTouched() {
    this.onTouchedFn();
  }

  /**
   * The group owns validity over the set, which no single item can see:
   * "choose one" is a fact about the group and not about any one option.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.resolvedRequired() !== true) return null;
    const value = control.value as string | null | undefined;
    return value === null || value === undefined || value === '' ? { required: true } : null;
  }
}
