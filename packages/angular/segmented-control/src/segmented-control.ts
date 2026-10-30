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
import { SlField } from '@slotted/angular/field';
import { SlFieldGroup } from '@slotted/angular/field-group';

import {
  injectSegmentedControlDefaults,
  SlSegmentedControlIdFactory,
} from './segmented-control-defaults';
import type {
  SegmentedControlCondense,
  SegmentedControlOrientation,
  SegmentedControlSize,
  SegmentedControlVariant,
} from './segmented-control-defaults';

export type {
  SegmentedControlCondense,
  SegmentedControlDefaults,
  SegmentedControlOrientation,
  SegmentedControlSize,
  SegmentedControlVariant,
} from './segmented-control-defaults';

/** Why the value moved. A segmented control can produce exactly these two. */
export type SegmentedControlSelectionReason = 'pointer' | 'keyboard';

/**
 * What the control needs from each segment, and nothing more.
 *
 * A structural type rather than the segment's class, so the control does not
 * import the component that injects it — the cycle `text-field` breaks with an
 * abstract class, broken here with the smaller thing that works.
 */
export interface SlSegmentedControlSegment {
  /** What this segment selects. */
  value: () => string;
  /** Writes this segment's element from the control's value. */
  syncElement(): void;
}

/**
 * One choice out of a few, applied at once, on a track.
 *
 * **The keyboard is the platform's, and that is why the segments share a
 * `name`.** Native radios in one form owner with one name already implement
 * the APG's Radio Group table: Tab lands on the checked segment or on the
 * first, `Space` checks, both arrow axes move focus and the selection
 * together, the set wraps, and disabled segments are skipped — in a
 * right-to-left document too.
 *
 * **The role is conditional, and the condition is the field group.** A
 * `field-group` is a `fieldset` with a `legend`, which is already a named
 * group; a `radiogroup` inside it is the same set announced twice. A `role`
 * the consumer wrote wins over both.
 *
 * **`readOnly` is enforced, because the platform has none.** A radio ignores
 * `readonly`, so the control refuses the change on the segment's own `click` —
 * the one event a pointer and `Space` share — and announces `aria-readonly`.
 *
 * **The thumb's place is the checked index, and the count is how many
 * segments registered.** Both are written as custom properties on the host, so
 * the stylesheet needs no measurement: the thumb is one column wide and moves
 * by its own width times the index.
 */
@Component({
  selector: '[slSegmentedControl]',
  standalone: true,
  exportAs: 'slSegmentedControl',
  template: `@if (checkedIndex() >= 0) {
      <span data-part="indicator" data-part-indicator="" aria-hidden="true"></span>
    }
    <ng-content />`,
  styleUrl: '../../../styles/src/segmented-control/segmented-control.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlSegmentedControl), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlSegmentedControl), multi: true },
  ],
  host: {
    'data-ui': 'segmented-control',
    'data-ui-segmented-control': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'resolvedRole()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-condense]': 'resolvedCondense()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.data-full-width]': "resolvedFullWidth() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-readonly]': 'ariaReadOnly()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-orientation]': 'ariaOrientation()',
    '[style.--slotted-segmented-control-count]': 'count()',
    '[style.--slotted-segmented-control-index]': 'indexProperty()',
  },
})
export class SlSegmentedControl implements ControlValueAccessor, OnInit, Validator {
  /** Present means the consumer owns the choice. */
  readonly value = input<string | undefined>(undefined);
  /** The value an uncontrolled control starts from, read once. */
  readonly defaultValue = input<string | undefined>(undefined);
  /**
   * The submission name the segments share, and the reason the platform
   * treats them as one radio group. Generated when it is not written, because
   * grouping is by name within the form owner and an unnamed set is not a set.
   */
  readonly name = input<string | undefined>(undefined);
  readonly size = input<SegmentedControlSize | undefined>(undefined);
  readonly orientation = input<SegmentedControlOrientation | undefined>(undefined);
  readonly condense = input<SegmentedControlCondense | undefined>(undefined);
  /** Defaults to the provider, then to `track`. */
  readonly variant = input<SegmentedControlVariant | undefined>(undefined);
  readonly fullWidth = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Unstated rather than `false`, so the control defers to the field around it. */
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
   * has been chosen, which a request typed over `string` alone could not say.
   */
  readonly valueChange = output<ChangeRequest<string | undefined>>();

  private readonly field = inject(SlField, { optional: true });
  private readonly fieldGroup = inject(SlFieldGroup, { optional: true });
  private readonly defaults = injectSegmentedControlDefaults();
  private readonly generatedName = inject(SlSegmentedControlIdFactory).next();
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  /* A group has no element a label's for can reach, so inside a field the
     field's label names it where the root owns the role, unless the consumer
     named it themselves. */
  protected readonly labelledBy = computed(
    () =>
      this.writtenLabelledBy ??
      (this.writtenLabel === null && this.resolvedRole() !== null
        ? (this.field?.ids().label ?? null)
        : null),
  );
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });

  private readonly segments = signal<readonly SlSegmentedControlSegment[]>([]);
  private readonly own = signal<string | undefined>(undefined);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (value: string) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  readonly selection = computed(() => this.value() ?? this.own());
  readonly resolvedName = computed(() => this.name() ?? this.generatedName);

  /** How many segments the track holds, and which of them is checked. */
  readonly count = computed(() => this.segments().length);
  readonly checkedIndex = computed(() => {
    const current = this.selection();
    if (current === undefined) return -1;
    return this.segments().findIndex((segment) => segment.value() === current);
  });
  protected readonly indexProperty = computed(() => {
    const index = this.checkedIndex();
    return index < 0 ? null : index;
  });

  readonly resolvedSize = computed(
    () =>
      this.size() ??
      this.field?.resolvedSize() ??
      this.fieldGroup?.resolvedSize() ??
      this.defaults.size,
  );
  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);
  readonly resolvedCondense = computed(() => this.condense() ?? this.defaults.condense);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedFullWidth = computed(() => this.fullWidth() ?? this.defaults.fullWidth);
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(() => this.readOnly() ?? this.field?.resolvedReadOnly());
  readonly resolvedInvalid = computed(() => this.invalid() ?? this.field?.invalid());
  readonly resolvedRequired = computed(
    () => this.required() ?? this.field?.required() ?? this.fieldGroup?.required(),
  );

  protected readonly resolvedRole = computed(
    () => this.writtenRole ?? (this.fieldGroup === null ? 'radiogroup' : null),
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
   * Only where the root owns the role, and only when the set flows the way
   * `radiogroup` does not already imply.
   */
  protected readonly ariaOrientation = computed(() =>
    this.resolvedRole() === 'radiogroup' && this.resolvedOrientation() === 'horizontal'
      ? 'horizontal'
      : null,
  );

  ngOnInit() {
    if (this.value() === undefined) this.own.set(this.defaultValue());
  }

  /** A segment joins the set, in the order the template holds it. */
  register(segment: SlSegmentedControlSegment) {
    this.segments.update((current) => [...current, segment]);
  }

  /** A segment leaves the set. */
  unregister(segment: SlSegmentedControlSegment) {
    this.segments.update((current) => current.filter((entry) => entry !== segment));
  }

  /**
   * Writes every segment's element from the value.
   *
   * The HTML standard's canceled activation behaviour for a radio restores the
   * *clicked* element and nothing else, so the option that was chosen before
   * the refused click stays unchecked. Angular writes a property binding only
   * when its value changes, and the neighbour's did not — the correction is
   * made here, which is the defect `radio-group` measured first.
   */
  restoreElements() {
    for (const segment of this.segments()) segment.syncElement();
  }

  /** Whether one value is the chosen one. Read by every segment in the set. */
  holds(value: string): boolean {
    return this.selection() === value;
  }

  /**
   * Asks the control to move to one value. Returns whether the value actually
   * moved — false while a consumer owns it, which is what tells the segment to
   * refuse the activation and let the platform put the element back.
   */
  select(value: string, reason: SegmentedControlSelectionReason, source: Event): boolean {
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

  /** Marks the set touched, which a segment calls when it loses focus. */
  markTouched() {
    this.onTouchedFn();
  }

  /**
   * The control owns validity over the set, which no single segment can see:
   * "choose one" is a fact about the set and not about any one option.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.resolvedRequired() !== true) return null;
    const value = control.value as string | null | undefined;
    return value === null || value === undefined || value === '' ? { required: true } : null;
  }
}
