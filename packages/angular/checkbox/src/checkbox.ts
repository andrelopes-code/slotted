import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  DestroyRef,
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
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlField } from '@slotted/angular/field';
import { SlFieldGroup } from '@slotted/angular/field-group';

import { injectCheckboxDefaults, SlCheckboxIdFactory } from './checkbox-defaults';
import type { CheckboxLabelPlacement, CheckboxSize, CheckboxVariant } from './checkbox-defaults';
import { SlCheckboxDescription } from './checkbox-parts';

export type {
  CheckboxDefaults,
  CheckboxLabelPlacement,
  CheckboxSize,
  CheckboxVariant,
} from './checkbox-defaults';

/** Why the box moved. A checkbox can produce exactly these two. */
export type CheckboxCheckedReason = 'pointer' | 'keyboard';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is the rule every activating family in this library writes,
 * and it is why `Space` and a pointer are told apart without a key listener.
 */
function activationReason(event: Event): CheckboxCheckedReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One choice, ticked or not.
 *
 * **The control is the platform's.** The element holding the value is a native
 * `input[type=checkbox]`, so `Space`, the form, `name`, `value`, `form.reset()`
 * and every native attribute arrive without a listener of this family's own.
 * The host element is the root, and it carries no role.
 *
 * **The mark is a sibling, not a pseudo-element.** Firefox renders neither
 * `::before` nor `::after` on an `input`, so the glyph is drawn in an element
 * beside the control. It is the dash while indeterminate — mixed outranks the
 * check — and the stylesheet only reveals it on `:checked` or `:indeterminate`.
 *
 * **Angular pays one element for the root, and React pays none.** React can
 * render a wrapper from inside a component; an Angular component's host *is*
 * the wrapper, so `<div slCheckbox>` is the root and the control lives in its
 * template.
 *
 * **Unset means ask the group, then the field.** `disabled`, `readOnly` and
 * `invalid` default to `undefined` rather than `false`, which is what makes
 * "not disabled" and "said nothing" different answers.
 */
/** A label with content, all of it hidden text: nothing a sighted reader sees. */
function showsNothing(label: HTMLElement): boolean {
  if (label.childNodes.length === 0) return false;
  return [...label.childNodes].every((node) =>
    node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE
      ? node.nodeType === Node.COMMENT_NODE || (node.textContent ?? '').trim() === ''
      : node instanceof Element && node.getAttribute('data-ui') === 'visually-hidden',
  );
}

@Component({
  selector: '[slCheckbox]',
  standalone: true,
  exportAs: 'slCheckbox',
  imports: [SlGlyph, SlIcon],
  template: `<input
      #control
      data-part="control"
      data-part-control=""
      type="checkbox"
      [attr.id]="controlId"
      [attr.name]="resolvedName()"
      [attr.value]="value()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="ariaInvalid()"
      [attr.aria-readonly]="ariaReadOnly()"
      [attr.aria-required]="ariaRequired()"
      [attr.tabindex]="tabIndex() ?? null"
      [attr.disabled]="disabledAttribute()"
      [attr.required]="requiredAttribute()"
      [checked]="resolvedChecked()"
      [attr.checked]="defaultAttribute()"
      (click)="onClick($event)"
      (blur)="onBlur()"
    />
    <span data-part="indicator" data-part-indicator=""
      ><span slIcon><svg slGlyph [name]="resolvedIndeterminate() ? 'minus' : 'check'"></svg></span
    ></span>
    <label #label data-part="label" data-part-label="" [attr.for]="controlId"><ng-content /></label>
    <ng-content select="[slCheckboxDescription]" />`,
  styleUrl: '../../../styles/src/checkbox/checkbox.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlCheckbox), multi: true },
  ],
  host: {
    'data-ui': 'checkbox',
    'data-ui-checkbox': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-label-placement]': 'resolvedLabelPlacement()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-checked]': "resolvedChecked() ? '' : null",
    '[attr.data-indeterminate]': "resolvedIndeterminate() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-label-hidden]': "labelHidden() ? '' : null",
  },
})
export class SlCheckbox implements ControlValueAccessor, OnInit {
  /** Present means the consumer owns the state. */
  readonly checked = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Whether the box starts ticked, when the control is uncontrolled. */
  readonly defaultChecked = input(false, { transform: booleanAttribute });
  /**
   * The mixed state. It is a state and never a third value of `checked`: the
   * submitted value stays boolean, and the platform agrees — `indeterminate` is
   * an IDL property that leaves `checked` alone.
   */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /**
   * Commands the whole set its group was given in `allValues`. Outside such a
   * group it does nothing, because there is no set to command.
   */
  readonly parent = input(false, { transform: booleanAttribute });
  /** What this box selects inside a group, and what it submits in a form. */
  readonly value = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  /**
   * The input's `tabindex`. A composite widget that owns the tab sequence — a
   * grid row's selection box — writes -1 until its cell is current; unset
   * leaves the native order.
   */
  readonly tabIndex = input<number | undefined>(undefined);
  readonly size = input<CheckboxSize | undefined>(undefined);
  readonly labelPlacement = input<CheckboxLabelPlacement | undefined>(undefined);
  readonly variant = input<CheckboxVariant | undefined>(undefined);
  /** Unstated rather than `false`, so the box defers to its group or field. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
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

  private readonly group = inject(SlCheckboxGroup, { optional: true });
  private readonly field = inject(SlField, { optional: true });
  private readonly fieldGroup = inject(SlFieldGroup, { optional: true });
  private readonly defaults = injectCheckboxDefaults();
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly writtenRequired = inject(new HostAttributeToken('required'), {
    optional: true,
  });

  private readonly element = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly label = viewChild.required<ElementRef<HTMLLabelElement>>('label');
  /**
   * Whether the label shows nothing: its only content is hidden text, the name
   * a table row or a data list gives a bare box. Read from the projected DOM,
   * and read again when it changes.
   */
  protected readonly labelHidden = signal(false);
  private readonly description = contentChild(SlCheckboxDescription, { descendants: true });

  private readonly own = signal(false);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  /** Whether a form directive owns the value through `ControlValueAccessor`. */
  private readonly formBound = signal(false);
  private onChangeFn: (checked: boolean) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  /** The identifier the label points at. A consumer's own wins. */
  readonly controlId = this.writtenId ?? inject(SlCheckboxIdFactory).next();

  /**
   * Three ways a box can know whether it is ticked, decided by what is around
   * it rather than by a mode input: a parent reads the whole set, a member
   * reads whether the selection holds its own value, and a box on its own reads
   * the consumer's `checked` or the state it keeps.
   */
  private readonly isParent = computed(() => this.parent() && this.group !== null);
  private readonly memberValue = computed(() =>
    !this.isParent() && this.group !== null ? this.value() : undefined,
  );

  readonly resolvedChecked = computed(() => {
    const group = this.group;
    if (this.isParent() && group !== null) {
      const all = group.allValues() ?? [];
      return all.length > 0 && all.every((item) => group.holds(item));
    }
    const member = this.memberValue();
    if (member !== undefined && group !== null) return group.holds(member);
    return this.checked() ?? this.own();
  });

  readonly resolvedIndeterminate = computed(() => {
    const group = this.group;
    if (!this.isParent() || group === null) return this.indeterminate();
    const all = group.allValues() ?? [];
    return all.some((item) => group.holds(item)) && !this.resolvedChecked();
  });

  readonly resolvedSize = computed(
    () =>
      this.size() ??
      this.group?.resolvedSize() ??
      this.field?.resolvedSize() ??
      this.fieldGroup?.resolvedSize() ??
      this.defaults.size,
  );
  readonly resolvedLabelPlacement = computed(
    () =>
      this.labelPlacement() ?? this.group?.resolvedLabelPlacement() ?? this.defaults.labelPlacement,
  );
  /**
   * One step shorter than `size`: a box states it, else the group around it,
   * else the provider. It never comes from the field — a field decides how its
   * own row is laid out, and a framed choice is a decision about the choice.
   */
  readonly resolvedVariant = computed(
    () => this.variant() ?? this.group?.resolvedVariant() ?? this.defaults.variant,
  );
  readonly resolvedDisabled = computed(
    () =>
      this.disabled() ??
      this.formDisabled() ??
      this.group?.resolvedDisabled() ??
      this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.group?.resolvedReadOnly() ?? this.field?.resolvedReadOnly(),
  );
  readonly resolvedInvalid = computed(
    () => this.invalid() ?? this.group?.resolvedInvalid() ?? this.field?.invalid(),
  );
  readonly resolvedRequired = computed(
    () => this.field?.required() ?? this.group?.resolvedRequired() ?? this.fieldGroup?.required(),
  );

  /**
   * Whether the box keeps its own state and starts it from `defaultChecked`:
   * nobody passed `checked`, no group holds it, and no form directive bound it.
   */
  private readonly ownsDefault = computed(
    () => this.checked() === undefined && this.group === null && !this.formBound(),
  );
  /**
   * The content attribute `checked`, which is what a native form reset puts
   * the element back to. A box that owns its state writes `defaultChecked`
   * there, the attribute React writes for the same prop. A box whose state
   * belongs to a consumer, a group or a form directive writes its current
   * state, so a native reset leaves the element showing what its owner holds.
   */
  protected readonly defaultAttribute = computed(() =>
    (this.ownsDefault() ? this.defaultChecked() : this.resolvedChecked()) ? '' : null,
  );

  protected readonly resolvedName = computed(() => this.name() ?? this.group?.name() ?? null);
  protected readonly describedBy = computed(() => {
    const merged = [
      this.writtenDescribedBy,
      this.description()?.id,
      this.group === null ? this.field?.describedBy() : undefined,
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
    this.resolvedRequired() === true ? 'true' : null,
  );
  protected readonly disabledAttribute = computed(() =>
    this.resolvedDisabled() === true ? '' : null,
  );
  /** The element's own attribute, passed through and never written by the family. */
  protected readonly requiredAttribute = computed(() => this.writtenRequired ?? null);

  constructor() {
    /**
     * `indeterminate` has no attribute; it is an IDL property, which is why
     * every implementation writes it from script and why the stylesheet reads
     * `:indeterminate` and stays in step with the element rather than with a
     * render.
     */
    effect(() => {
      this.element().nativeElement.indeterminate = this.resolvedIndeterminate();
    });

    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      /* A native reset restores the element and tells nothing, so a box that
         owns its state puts it back to where it started. The form is reached
         through the element, because `form` may name a form anywhere. */
      const form = this.element().nativeElement.form;
      if (form !== null) {
        const onReset = () => {
          if (this.ownsDefault()) this.own.set(this.defaultChecked());
        };
        form.addEventListener('reset', onReset);
        destroy.onDestroy(() => form.removeEventListener('reset', onReset));
      }

      const label = this.label().nativeElement;
      const read = () => this.labelHidden.set(showsNothing(label));
      read();
      if (typeof MutationObserver === 'undefined') return;
      const watch = new MutationObserver(read);
      watch.observe(label, { childList: true, characterData: true, subtree: true });
      destroy.onDestroy(() => watch.disconnect());
    });
  }

  ngOnInit() {
    if (this.checked() === undefined && this.group === null) this.own.set(this.defaultChecked());
  }

  /** The native element, for `focus()` and `click()`. */
  get inputElement(): HTMLInputElement {
    return this.element().nativeElement;
  }

  writeValue(value: boolean | null | undefined) {
    this.own.set(value === true);
  }

  registerOnChange(fn: (checked: boolean) => void) {
    this.onChangeFn = fn;
    this.formBound.set(true);
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  /**
   * One handler for the pointer and for `Space`, because the platform fires one
   * `click` for both — and refusing the default is the only way to refuse a
   * change a checkbox has no `readonly` to refuse.
   *
   * Nothing here writes the element. The HTML standard's canceled activation
   * behaviour for a checkbox is `checked = !checked` rather than a restore of a
   * saved value, so a family that corrected the element inside the listener
   * would have that correction toggled back out from under it. Refusing the
   * default and letting the platform undo its own pre-click toggle is both
   * shorter and the only version that is right: it was measured, in the first
   * run of this family's Angular spec, as a controlled box that stayed ticked
   * after its consumer had said no.
   */
  protected onClick(event: MouseEvent) {
    if (this.resolvedReadOnly() === true) {
      event.preventDefault();
      return;
    }

    const reason = activationReason(event);
    const next = !this.resolvedChecked();

    let cancelled = false;
    const state = createControllable<boolean>({
      controlled: this.checked() ?? (this.group === null ? undefined : this.resolvedChecked()),
      initial: this.resolvedChecked(),
      onRequest: (request) => {
        this.checkedChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, event);
    if (cancelled) {
      event.preventDefault();
      return;
    }

    if (this.isParent()) {
      if (this.group?.requestAll(next, reason, event) !== true) event.preventDefault();
      return;
    }

    const member = this.memberValue();
    if (member !== undefined) {
      if (this.group?.toggle(member, reason, event) !== true) event.preventDefault();
      return;
    }

    /* Controlled: the consumer owns the state and has been told. The element
       must not move on its own, so the activation is refused and the platform
       puts it back. */
    if (!moved) {
      event.preventDefault();
      return;
    }

    this.own.set(next);
    this.onChangeFn(next);
  }

  protected onBlur() {
    this.onTouchedFn();
    this.group?.markTouched();
  }
}
