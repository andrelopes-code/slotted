import { switchMessages, type PartialMessages, type SwitchMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlField } from '@slotted/angular/field';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

import {
  injectSwitchDefaults,
  SlSwitchIdFactory,
  SWITCH_LOADING_ANNOUNCE_DELAY,
} from './switch-defaults';
import type { SwitchIndicator, SwitchLabelPlacement, SwitchSize } from './switch-defaults';
import { SlSwitchDescription } from './switch-parts';

export type { SwitchIndicator, SwitchLabelPlacement, SwitchSize } from './switch-defaults';

/**
 * Why the switch moved, read from the event rather than guessed. A pointer
 * press reports a click count; Space on a checkbox reports none but is
 * trusted; `element.click()` reports neither, and calling that `keyboard`
 * would tell a consumer a person pressed a key nobody pressed.
 */
export function activationReason(activation: { detail: number; isTrusted: boolean }): ChangeReason {
  if (activation.detail > 0) return 'pointer';
  return activation.isTrusted ? 'keyboard' : 'programmatic';
}

/**
 * A binary setting that takes effect immediately.
 *
 * **The control is a checkbox with the switch role.** Space toggles it, the
 * label names it and doubles the target, `name` and `value` are submitted,
 * `form.reset()` restores it, and a disabled `fieldset` disables it — none of
 * which the `button` this family shipped on before gave. ARIA 1.2 declares the
 * `switch` role Children Presentational, so the role goes on the void `input`
 * and never on the host: a host carrying it would fold the label and the
 * description beside it into the control's own accessible name.
 *
 * **Angular pays one element and renders the control itself**, which is the
 * shape `checkbox` settled one item earlier in this wave. `formControlName`,
 * `ngModel`, `id` and `aria-*` sit on the host, and the label is the
 * consumer's own content projected into a `label` that points at the control.
 *
 * **The click is the request.** It is the one event that fires for a pointer,
 * for Space and for `click()`, and the one that can be refused before the
 * element moves.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default
 * to `undefined` rather than `false`, which is what makes "not disabled" and
 * "said nothing" different answers.
 */
@Component({
  selector: '[slSwitch]',
  standalone: true,
  exportAs: 'slSwitch',
  imports: [SlGlyph, SlIcon, SlVisuallyHidden],
  template: `<input
      #control
      data-part="control"
      data-part-control=""
      type="checkbox"
      role="switch"
      [attr.id]="controlId"
      [attr.name]="name()"
      [attr.value]="value()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="ariaInvalid()"
      [attr.aria-readonly]="ariaReadOnly()"
      [attr.aria-required]="ariaRequired()"
      [attr.aria-busy]="ariaBusy()"
      [attr.aria-label]="writtenAriaLabel"
      [attr.disabled]="disabledAttribute()"
      [attr.required]="requiredAttribute()"
      [checked]="checked()"
      (click)="onClick($event)"
      (blur)="onBlur()"
    />
    <span data-part="track" data-part-track=""
      ><span data-part="thumb" data-part-thumb="">
        @if (resolvedIndicator() === 'mark') {
          <span slIcon><svg slGlyph name="check"></svg></span>
        }</span
    ></span>
    <label data-part="label" data-part-label="" [attr.for]="controlId"><ng-content /></label>
    <ng-content select="[slSwitchDescription]" />
    <span slVisuallyHidden role="status" [attr.id]="pendingId">{{ announcement() }}</span>`,
  styleUrl: '../../../styles/src/switch/switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlSwitch), multi: true }],
  host: {
    'data-ui': 'switch',
    'data-ui-switch': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-indicator]': 'resolvedIndicator()',
    '[attr.data-label-placement]': 'resolvedLabelPlacement()',
    '[attr.data-checked]': "checked() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
  },
})
export class SlSwitch implements ControlValueAccessor, OnInit {
  /** Present means the consumer owns the state, for the life of the component. */
  readonly checkedValue = input<boolean | undefined, boolean | string | undefined>(undefined, {
    alias: 'checked',
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** What an uncontrolled switch starts from, read once. A form reset restores it. */
  readonly defaultChecked = input(false, { transform: booleanAttribute });
  /** What this switch submits when it is on. Nothing is submitted when it is off. */
  readonly value = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  readonly size = input<SwitchSize | undefined>(undefined);
  readonly indicator = input<SwitchIndicator | undefined>(undefined);
  readonly labelPlacement = input<SwitchLabelPlacement | undefined>(undefined);
  /**
   * The value is not settled yet. Activation is refused, the geometry does not
   * change, and the pending label is announced politely once the wait is worth
   * announcing.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key:
   * `loading` is what a reader hears while the switch is pending.
   */
  readonly messages = input<PartialMessages<SwitchMessages> | undefined>(undefined);
  /** Unstated rather than `false`, so the switch defers to its field. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Unstated rather than `false`. The native `readonly` attribute does nothing
   * on a checkbox, so this is `aria-readonly` plus a refused activation.
   */
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /**
   * One output for one transition, carrying the new state, the state it
   * replaces, the reason, the originating event and `cancel()`. There is no
   * `[(checked)]`, because a two-way binding has one slot and can carry none of
   * those; a form gets the same movement through `ControlValueAccessor`.
   */
  readonly checkedChange = output<ChangeRequest<boolean>>();

  private readonly field = inject(SlField, { optional: true });
  private readonly defaults = injectSwitchDefaults();
  private readonly destroyRef = inject(DestroyRef);
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly writtenRequired = inject(new HostAttributeToken('required'), { optional: true });
  /** Read here so a consumer's own name survives the host binding. */
  protected readonly writtenAriaLabel = inject(new HostAttributeToken('aria-label'), {
    optional: true,
  });

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly description = contentChild(SlSwitchDescription, { descendants: true });

  private readonly own = signal(false);
  private readonly announced = signal(false);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (checked: boolean) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;
  /** A form model owns the value, so a native reset takes the model's value. */
  private formBound = false;

  /**
   * The identifier the label points at. A consumer's own wins, then the
   * field's: a field writes `for` at its label whether or not the control it
   * holds draws one, so a switch that kept its own identifier inside a field
   * would leave that label pointing at nothing.
   */
  readonly controlId =
    this.writtenId ?? this.field?.ids().control ?? inject(SlSwitchIdFactory).next();
  /** The region the pending label is written into. */
  readonly pendingId = `${this.controlId}-pending`;

  readonly checked = computed(() => this.checkedValue() ?? this.own());

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedIndicator = computed(() => this.indicator() ?? this.defaults.indicator);
  readonly resolvedLabelPlacement = computed(
    () => this.labelPlacement() ?? this.defaults.labelPlacement,
  );
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(() => this.readOnly() ?? this.field?.resolvedReadOnly());
  readonly resolvedInvalid = computed(() => this.invalid() ?? this.field?.invalid());
  /** The family's words in the language in force, with this switch's `messages` laid over them. */
  readonly t = injectMessages(switchMessages, this.messages);

  /** Merged after the consumer's own, and the pending region last. */
  protected readonly describedBy = computed(() => {
    const merged = [
      this.writtenDescribedBy,
      this.description()?.id,
      this.field?.describedBy(),
      this.loading() ? this.pendingId : null,
    ].filter(Boolean);
    return merged.length === 0 ? null : merged.join(' ');
  });
  protected readonly ariaInvalid = computed(() =>
    this.resolvedInvalid() === true ? 'true' : null,
  );
  protected readonly ariaReadOnly = computed(() =>
    this.resolvedReadOnly() === true ? 'true' : null,
  );
  protected readonly ariaRequired = computed(() =>
    this.field?.required() === true ? 'true' : null,
  );
  protected readonly ariaBusy = computed(() => (this.loading() ? 'true' : null));
  protected readonly disabledAttribute = computed(() =>
    this.resolvedDisabled() === true ? '' : null,
  );
  /** The element's own attribute, passed through and never written by the family. */
  protected readonly requiredAttribute = computed(() => this.writtenRequired ?? null);
  /** Silence first, and the pending label only if the write is slow enough to notice. */
  protected readonly announcement = computed(() =>
    this.loading() && this.announced() ? this.t('loading') : '',
  );

  constructor() {
    effect((onCleanup) => {
      if (!this.loading()) {
        this.announced.set(false);
        return;
      }
      const timer = setTimeout(() => this.announced.set(true), SWITCH_LOADING_ANNOUNCE_DELAY);
      onCleanup(() => clearTimeout(timer));
    });
  }

  /**
   * Angular creates every directive before it binds any input, so the starting
   * state is read here rather than in the constructor: read there,
   * `defaultChecked` is always `false` and an uncontrolled switch would start
   * off however it was written.
   */
  ngOnInit() {
    this.own.set(this.defaultChecked());

    /* A native reset restores the element and tells nothing, so the mirror
       would keep the last thing toggled and the track would disagree with the
       control inside it. A switch bound to a form model takes the model's
       reset value through writeValue instead, and its own default does not
       apply. The form resets its elements after this event, to a default no
       attribute wrote, so the element is put back after it — in a task,
       because a reset pressed by a person drains the microtasks first. */
    const element = this.control().nativeElement;
    const form = element.form;
    if (form !== null) {
      const onReset = () => {
        if (!this.formBound) this.own.set(this.defaultChecked());
        setTimeout(() => {
          if (element.checked !== this.checked()) element.checked = this.checked();
        });
      };
      form.addEventListener('reset', onReset);
      this.destroyRef.onDestroy(() => form.removeEventListener('reset', onReset));
    }
  }

  /** The native element, for `focus()` and anything else the platform ships. */
  get inputElement(): HTMLInputElement {
    return this.control().nativeElement;
  }

  /**
   * Toggles the switch the way the platform does. The click it fires is
   * untrusted and carries no detail, so the request reports itself as
   * `programmatic` rather than as a key press nobody pressed.
   */
  toggle() {
    this.inputElement.click();
  }

  writeValue(value: boolean | null | undefined) {
    this.own.set(value === true);
  }

  registerOnChange(fn: (checked: boolean) => void) {
    this.onChangeFn = fn;
    this.formBound = true;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  protected onClick(event: MouseEvent) {
    if (this.resolvedDisabled() === true || this.resolvedReadOnly() === true || this.loading()) {
      this.refuse(event);
      return;
    }

    const next = !this.checked();
    const reason = activationReason({ detail: event.detail, isTrusted: event.isTrusted });

    let cancelled = false;
    const state = createControllable<boolean>({
      controlled: this.checkedValue(),
      initial: this.checked(),
      onRequest: (request) => {
        this.checkedChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    state.request(next, reason, event);

    if (cancelled || this.checkedValue() !== undefined) {
      this.refuse(event);
      return;
    }

    this.own.set(next);
    this.onChangeFn(next);
  }

  protected onBlur() {
    this.onTouchedFn();
  }

  /**
   * Cancelling the click is what the platform offers — a checkbox reverts its
   * own checkedness when its activation is cancelled — and the element is put
   * back beside it, because that revert is the one part of the mechanism an
   * environment can get wrong. A switch showing a state nobody committed is
   * the whole defect this path exists to prevent.
   *
   * The restore is a microtask rather than a line here: the revert the
   * platform does perform happens after the dispatch returns, so a value
   * written now would be the one overwritten. It reads the state again at that
   * point, so a consumer who accepted the move in the same tick keeps their
   * answer.
   */
  private refuse(event: MouseEvent) {
    event.preventDefault();
    queueMicrotask(() => {
      const element = this.inputElement;
      if (element.checked !== this.checked()) element.checked = this.checked();
    });
  }
}
