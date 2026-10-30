import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { SlField } from '@slotted/angular/field';
import { SlFieldGroup } from '@slotted/angular/field-group';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { type PartialMessages, ratingMessages, type RatingMessages } from '@slotted/core/i18n';
import {
  formatRatingValue,
  normaliseRating,
  ratingAtPoint,
  ratingFills,
  ratingForKey,
} from '@slotted/core/rating';
import type { RatingScale } from '@slotted/core/rating';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import { injectRatingDefaults, SlRatingIdFactory } from './rating-defaults';
import type { RatingSize, RatingStep, RatingTone } from './rating-defaults';

/** Why the value moved. A rating can produce exactly these three. */
export type RatingValueReason = 'pointer' | 'keyboard' | 'clear';

/** What the caption template is handed: the value held, and the one under the pointer. */
export interface RatingCaptionContext {
  $implicit: number | null;
  value: number | null;
  preview: number | null;
}

/** What the symbol template is handed: the symbol's position, and how much of it is lit. */
export interface RatingSymbolContext {
  $implicit: { index: number; fill: number };
  index: number;
  fill: number;
}

/**
 * The words beside the stars. On an element it is projected as it is; on an
 * `ng-template` it is rendered again whenever the value or the preview moves,
 * with both in its context — the word for the star under the pointer is the
 * whole point of a caption.
 */
@Directive({
  selector: '[slRatingCaption]',
  standalone: true,
})
export class SlRatingCaption {
  readonly template = inject<TemplateRef<RatingCaptionContext>>(TemplateRef, { optional: true });

  static ngTemplateContextGuard(
    _directive: SlRatingCaption,
    context: unknown,
  ): context is RatingCaptionContext {
    return context !== null;
  }
}

/**
 * The drawing of one symbol, in place of the star. It is rendered twice per
 * item — once in `symbol`, the unlit shape, and once in `fill`, the lit one
 * the stylesheet clips — so a consumer's heart lights the way a star does.
 */
@Directive({
  selector: 'ng-template[slRatingSymbol]',
  standalone: true,
})
export class SlRatingSymbol {
  readonly template = inject<TemplateRef<RatingSymbolContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: SlRatingSymbol,
    context: unknown,
  ): context is RatingSymbolContext {
    return context !== null;
  }
}

interface RatingRadio {
  value: number;
  half: boolean;
  label: string;
}

interface RatingItem {
  index: number;
  checked: boolean;
  radios: RatingRadio[];
  context: RatingSymbolContext;
}

/** A touch or a pen on the row, from its press to its release. */
interface RatingGesture {
  pointerId: number;
  moved: boolean;
}

const optionalBoolean = (value: boolean | string | undefined) =>
  value === undefined ? undefined : booleanAttribute(value);

/**
 * An ordinal value chosen from a row of symbols.
 *
 * **The radios are native, and that buys the rest.** Tab lands on the checked
 * one or on the first, Space checks, the form submits the value under one
 * `name`, and a disabled rating leaves the tab order — all the platform's. The
 * arrows are the family's (`ratingForKey`): the platform's wrap from the last
 * radio to the first, and a rating that falls from five to one on one key too
 * many is the defect every surveyed rating avoids.
 *
 * **A half step is a second radio over the inline-start half of the symbol**,
 * stacked above the whole one, so the pointer asks for the half by pressing
 * where the half is drawn.
 *
 * **The DOM is written back after every activation.** The HTML standard's
 * canceled activation restores only the clicked radio, and a press on the
 * checked one that empties the value leaves the platform nothing to undo, so
 * each radio's `checked` is set from the value once the request is answered.
 */
@Component({
  selector: 'div[slRating]',
  standalone: true,
  exportAs: 'slRating',
  imports: [NgTemplateOutlet, SlGlyph, SlIcon],
  template: `<div
      data-part="symbols"
      data-part-symbols=""
      (pointerdown)="onRowPointerDown($event)"
      (pointermove)="onRowPointerMove($event)"
      (pointerup)="onRowPointerUp($event)"
      (pointercancel)="onRowPointerCancel()"
    >
      @for (item of items(); track item.index) {
        <span data-part="item" data-part-item="" [attr.data-checked]="item.checked ? '' : null">
          @for (radio of item.radios; track radio.value) {
            <input
              #radioInput
              data-part="input"
              data-part-input=""
              type="radio"
              [attr.data-half]="radio.half ? '' : null"
              [attr.name]="resolvedName()"
              [attr.form]="form() ?? null"
              [attr.value]="radio.value"
              [attr.aria-label]="radio.label"
              [attr.disabled]="resolvedDisabled() === true ? '' : null"
              [checked]="radio.value === current()"
              (pointerover)="onPreview(radio.value)"
              (blur)="onBlur()"
            />
          }
          <span data-part="symbol" data-part-symbol="">
            @if (symbol(); as custom) {
              <ng-container *ngTemplateOutlet="custom.template; context: item.context" />
            } @else {
              <span slIcon><svg slGlyph name="star"></svg></span>
            }
          </span>
          <span data-part="fill" data-part-fill="">
            @if (symbol(); as custom) {
              <ng-container *ngTemplateOutlet="custom.template; context: item.context" />
            } @else {
              <span slIcon><svg slGlyph name="star"></svg></span>
            }
          </span>
        </span>
      }
    </div>
    @if (caption(); as words) {
      <span data-part="value" data-part-value="" aria-hidden="true">
        @if (words.template; as captionTemplate) {
          <ng-container *ngTemplateOutlet="captionTemplate; context: captionContext()" />
        } @else {
          <ng-content select="[slRatingCaption]" />
        }
      </span>
    }`,
  styleUrl: '../../../styles/src/rating/rating.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlRating), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlRating), multi: true },
  ],
  host: {
    'data-ui': 'rating',
    'data-ui-rating': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'resolvedRole()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-max]': 'resolvedMax()',
    '[attr.data-step]': "resolvedStep() === 0.5 ? '0.5' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-dragging]': "dragging() ? '' : null",
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': "resolvedInvalid() === true ? 'true' : null",
    '[attr.aria-readonly]': "resolvedReadOnly() === true ? 'true' : null",
    '[attr.aria-required]': "resolvedRequired() === true ? 'true' : null",
    '(keydown)': 'onKeyDown($event)',
    '(click)': 'onClick($event)',
    '(pointerleave)': 'onLeave()',
  },
})
export class SlRating implements ControlValueAccessor, Validator {
  /** The rating, `null` for none. Two-way; every move is asked first through `valueChangeRequest`. */
  readonly value = model<number | null>(null);
  readonly max = input<number | undefined>(undefined);
  readonly step = input<RatingStep>(1);
  readonly clearable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly size = input<RatingSize | undefined>(undefined);
  readonly tone = input<RatingTone | undefined>(undefined);
  /** The submission name the radios share. Generated when it is not written. */
  readonly name = input<string | undefined>(undefined);
  /** The form the radios belong to when the rating sits outside it. */
  readonly form = input<string | undefined>(undefined);
  /** Unstated rather than `false`, so the rating defers to the field around it. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly required = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<RatingMessages> | undefined>(undefined);
  /** The locale numbers are written in. Unstated, the language in force. */
  readonly locale = input<string | undefined>(undefined);

  /**
   * Emitted before the value moves, with the value asked for, the one it
   * replaces, the reason and the event. `cancel()` keeps the value.
   */
  readonly valueChangeRequest = output<ChangeRequest<number | null>>();
  /** The value under the pointer, and `null` when it leaves. It changes nothing. */
  readonly previewChange = output<number | null>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly field = inject(SlField, { optional: true });
  private readonly fieldGroup = inject(SlFieldGroup, { optional: true });
  private readonly defaults = injectRatingDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this rating's `messages` laid over them. */
  readonly t = injectMessages(ratingMessages, this.messages);
  private readonly generatedName = inject(SlRatingIdFactory).next();
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });

  protected readonly caption = contentChild(SlRatingCaption);
  protected readonly symbol = contentChild(SlRatingSymbol);
  private readonly radios = viewChildren<ElementRef<HTMLInputElement>>('radioInput');

  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private readonly preview = signal<number | null>(null);
  protected readonly dragging = signal(false);
  private gesture: RatingGesture | null = null;
  /** Set when a touch gesture has answered a press, so the click the platform sends after it does not answer it again. */
  private suppressClick = false;
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly resolvedName = computed(() => this.name() ?? this.generatedName);
  readonly resolvedMax = computed(() => Math.max(1, Math.round(this.max() ?? this.defaults.max)));
  readonly resolvedStep = computed<RatingStep>(() => (this.step() === 0.5 ? 0.5 : 1));
  readonly resolvedClearable = computed(() => this.clearable() ?? this.defaults.clearable);
  readonly resolvedSize = computed(
    () =>
      this.size() ??
      (this.field?.resolvedSize() as RatingSize | undefined) ??
      (this.fieldGroup?.resolvedSize() as RatingSize | undefined) ??
      this.defaults.size,
  );
  readonly resolvedTone = computed(() => this.tone() ?? this.defaults.tone);
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(() => this.readOnly() ?? this.field?.resolvedReadOnly());
  readonly resolvedInvalid = computed(() => this.invalid() ?? this.field?.invalid());
  readonly resolvedRequired = computed(
    () => this.required() ?? this.field?.required() ?? this.fieldGroup?.required(),
  );
  readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());

  private readonly scale = computed<RatingScale>(() => ({
    max: this.resolvedMax(),
    step: this.resolvedStep(),
  }));

  /** The value on the grid of the scale: 7 of 5 is 5, 3.2 on whole steps is 4, and `NaN` is none. */
  readonly current = computed(() => normaliseRating(this.value(), this.scale()));

  protected readonly items = computed<RatingItem[]>(() => {
    const { max, step } = this.scale();
    const current = this.current();
    const fills = ratingFills(current, max);
    const locale = this.resolvedLocale();
    return fills.map((fill, index) => {
      const whole = index + 1;
      const values = step === 0.5 ? [whole - 0.5, whole] : [whole];
      return {
        index,
        checked: current !== null && values.includes(current),
        radios: values.map((value) => ({
          value,
          half: value !== whole,
          label: this.t('itemLabel', { value: formatRatingValue(value, locale), max }),
        })),
        context: { $implicit: { index, fill }, index, fill },
      };
    });
  });

  protected readonly captionContext = computed<RatingCaptionContext>(() => ({
    $implicit: this.current(),
    value: this.current(),
    preview: this.preview(),
  }));

  protected readonly resolvedRole = computed(
    () => this.writtenRole ?? (this.fieldGroup === null ? 'radiogroup' : null),
  );
  protected readonly describedBy = computed(() => {
    const merged = [this.writtenDescribedBy, this.field?.describedBy()].filter(Boolean);
    return merged.length === 0 ? null : merged.join(' ');
  });

  private readonly inert = computed(
    () => this.resolvedDisabled() === true || this.resolvedReadOnly() === true,
  );

  /** The one action a value cannot express: focus on the checked radio, or on the first. */
  focus(options?: FocusOptions) {
    const target = this.inputFor(this.current()) ?? this.radios()[0]?.nativeElement;
    target?.focus(options);
  }

  protected onKeyDown(event: KeyboardEvent) {
    this.suppressClick = false;
    if (!this.isOwnRadio(event.target) || this.resolvedDisabled() === true) return;
    const next = ratingForKey(event.key, this.current(), this.scale(), {
      rtl: this.isRtl(),
      clearable: this.resolvedClearable(),
    });
    if (next === undefined) return;
    event.preventDefault();
    if (this.resolvedReadOnly() === true) return;
    if (next === null) {
      this.request(null, 'clear', event);
      this.syncElements();
      return;
    }
    this.request(next, 'keyboard', event);
    this.syncElements();
    this.inputFor(this.current())?.focus();
  }

  protected onClick(event: MouseEvent) {
    const target = event.target;
    if (this.suppressClick) {
      this.suppressClick = false;
      if (this.isOwnRadio(target)) {
        event.preventDefault();
        this.syncElements();
      }
      return;
    }
    if (!this.isOwnRadio(target)) return;
    if (this.inert()) {
      event.preventDefault();
      this.syncElements();
      return;
    }

    const picked = Number(target.value);
    if (picked === this.current()) {
      /* A click the keyboard synthesised — Space on the checked radio — reports
         no detail, and Space checks; it never empties. */
      if (this.resolvedClearable() && event.detail > 0) this.request(null, 'clear', event);
      this.syncElements();
      return;
    }
    const moved = this.request(picked, event.detail === 0 ? 'keyboard' : 'pointer', event);
    if (!moved) event.preventDefault();
    this.syncElements();
  }

  protected onRowPointerDown(event: PointerEvent) {
    this.suppressClick = false;
    if (this.inert() || event.pointerType === 'mouse' || event.pointerType === '') return;
    this.gesture = { pointerId: event.pointerId, moved: false };
    this.dragging.set(true);
    const row = event.currentTarget as HTMLElement;
    if (typeof row.setPointerCapture === 'function') row.setPointerCapture(event.pointerId);
  }

  protected onRowPointerMove(event: PointerEvent) {
    if (this.gesture === null || event.pointerId !== this.gesture.pointerId) return;
    this.gesture.moved = true;
    const next = this.valueAt(event);
    if (next === this.current()) return;
    this.request(next, 'pointer', event);
    this.syncElements();
  }

  /**
   * A touch that never moved is a press, answered here rather than by the
   * click that follows it: with the row capturing the pointer, the click lands
   * on the row and not on a radio.
   */
  protected onRowPointerUp(event: PointerEvent) {
    if (this.gesture === null || event.pointerId !== this.gesture.pointerId) return;
    if (!this.gesture.moved) {
      const next = this.valueAt(event);
      if (next !== this.current()) this.request(next, 'pointer', event);
      else if (this.resolvedClearable()) this.request(null, 'clear', event);
      this.syncElements();
    }
    this.gesture = null;
    this.dragging.set(false);
    this.suppressClick = true;
  }

  protected onRowPointerCancel() {
    this.gesture = null;
    this.dragging.set(false);
  }

  protected onPreview(value: number) {
    if (this.inert() || this.preview() === value) return;
    this.preview.set(value);
    this.previewChange.emit(value);
  }

  protected onLeave() {
    if (this.preview() === null) return;
    this.preview.set(null);
    this.previewChange.emit(null);
  }

  protected onBlur() {
    this.onTouched();
  }

  writeValue(value: number | null | undefined) {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: number | null) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  /** "Choose a rating" is a fact about the whole row, which no single radio can see. */
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.resolvedRequired() !== true) return null;
    const value = control.value as number | null | undefined;
    return normaliseRating(value, this.scale()) === null ? { required: true } : null;
  }

  /**
   * Asks for one value. Returns whether it moved: not while read-only or
   * disabled, not when it is the value already held, and not when the
   * consumer cancelled the request.
   */
  private request(next: number | null, reason: RatingValueReason, source: Event): boolean {
    if (this.inert()) return false;
    const previous = this.current();
    if (next === previous) return false;
    const state = createControllable<number | null>({
      initial: previous,
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (!state.request(next, reason, source)) return false;
    this.value.set(next);
    this.onChange(next);
    return true;
  }

  private valueAt(event: PointerEvent): number {
    const row = event.currentTarget as HTMLElement;
    const box = row.getBoundingClientRect();
    return ratingAtPoint(
      { x: event.clientX },
      { x: box.x, width: box.width },
      this.scale(),
      this.isRtl(),
    );
  }

  /** Writes every radio's `checked` from the value. */
  private syncElements() {
    const current = this.current();
    for (const { nativeElement } of this.radios()) {
      nativeElement.checked = Number(nativeElement.value) === current;
    }
  }

  private inputFor(value: number | null): HTMLInputElement | undefined {
    if (value === null) return undefined;
    return this.radios().find(({ nativeElement }) => Number(nativeElement.value) === value)
      ?.nativeElement;
  }

  private isOwnRadio(target: EventTarget | null): target is HTMLInputElement {
    return this.radios().some(({ nativeElement }) => nativeElement === target);
  }

  /** A right-to-left document is a property of the page, read from the element. */
  private isRtl() {
    return getComputedStyle(this.element).direction === 'rtl';
  }
}
