import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { createNumberFormat } from '@slotted/core/number';
import {
  fractionAtPoint,
  fractionOfValue,
  moveThumb,
  nearestThumb,
  normalizeValues,
  sameValues,
  thumbBounds,
  valueAtFraction,
} from '@slotted/core/slider';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { SlField } from '@slotted/angular/field';
import { injectLocale } from '@slotted/angular/i18n';

import { injectSliderDefaults } from './slider-defaults';
import type {
  SliderMark,
  SliderOrientation,
  SliderOrigin,
  SliderSize,
  SliderValueLabel,
} from './slider-defaults';

export type {
  SliderMark,
  SliderOrientation,
  SliderOrigin,
  SliderSize,
  SliderValueLabel,
} from './slider-defaults';

/** `undefined` stays absent; anything else becomes a number. */
const optionalNumber = (value: unknown) =>
  value === undefined || value === null || value === '' ? undefined : numberAttribute(value);

const toArray = (value: number | readonly number[]): number[] =>
  Array.isArray(value) ? [...value] : [value as number];

/**
 * A scale, a rail and one thumb per value.
 *
 * **Every thumb is a real `input[type="range"]`.** Angular Material's own
 * thumbs are `input[matSliderThumb]` elements, and the element is taken for the
 * same reasons: it carries the `slider` role, `aria-valuenow`, `aria-valuemin`,
 * `aria-valuemax`, form submission, form reset and `disabled` without the
 * family writing any of them. It is invisible and unhittable, filling the thumb
 * it lives in, so the thumb a reader sees is this family's own element.
 *
 * **The family owns the keyboard and the pointer.** Browsers disagree about a
 * range input's larger step — Chrome moves Page Up by a tenth of the range and
 * Firefox by one step — and `largeStep` has to mean one thing in both bindings.
 *
 * **Two thumbs cannot cross, and the accessibility tree says so.** Each input's
 * own `min` and `max` follow its neighbour, which is what the APG's multi-thumb
 * pattern requires of the dependent sliders' announced range.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default to
 * `undefined` rather than `false`.
 */
@Component({
  selector: '[slSlider]',
  standalone: true,
  exportAs: 'slSlider',
  template: `@if (resolvedValueLabel() !== 'none') {
      <output data-part="output" data-part-output="" [attr.for]="controlId()">{{
        outputText()
      }}</output>
    }
    <div
      data-part="control"
      data-part-control=""
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
    >
      <div data-part="track" data-part-track="" #track>
        <div
          data-part="indicator"
          data-part-indicator=""
          [style.--_start]="span().start"
          [style.--_end]="span().end"
        ></div>
        @for (mark of markList(); track mark.value) {
          <span
            data-part="mark"
            data-part-mark=""
            [attr.data-edge]="edgeOf(mark.value)"
            [style.--_position]="percentOf(mark.value)"
          >
            @if (mark.label !== undefined) {
              <span data-part="mark-label" data-part-mark-label="">{{ mark.label }}</span>
            }
          </span>
        }
        @for (thumbValue of values(); track $index) {
          <div
            data-part="thumb"
            data-part-thumb=""
            [attr.data-index]="$index"
            [attr.data-active]="dragging() === $index ? '' : null"
            [style.--_position]="percentOf(thumbValue)"
          >
            <input
              data-part="input"
              data-part-input=""
              type="range"
              [attr.id]="$index === 0 ? controlId() : controlId() + '-' + $index"
              [attr.name]="submissionName()"
              [attr.form]="submissionForm()"
              [attr.aria-label]="thumbLabelAt($index)"
              [attr.aria-describedby]="describedBy()"
              [attr.aria-invalid]="ariaInvalid()"
              [attr.aria-required]="ariaRequired()"
              [attr.aria-readonly]="resolvedReadOnly() === true ? 'true' : null"
              [attr.aria-orientation]="resolvedOrientation()"
              [attr.aria-valuetext]="valueTextOf(thumbValue)"
              [attr.disabled]="resolvedDisabled() === true ? '' : null"
              [min]="boundsAt($index).min"
              [max]="boundsAt($index).max"
              [step]="step()"
              [value]="thumbValue"
              (keydown)="onKeyDown($index, $event)"
              (blur)="onTouched()"
            />
            <span data-part="bubble" data-part-bubble="" aria-hidden="true">{{
              valueTextOf(thumbValue)
            }}</span>
          </div>
        }
      </div>
    </div>`,
  styleUrl: '../../../styles/src/slider/slider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlSlider), multi: true }],
  host: {
    'data-ui': 'slider',
    'data-ui-slider': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-value-label]': 'resolvedValueLabel()',
    '[attr.data-marks]': 'marksMode()',
    '[attr.data-dragging]': "dragging() === null ? null : ''",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
  },
})
export class SlSlider implements ControlValueAccessor {
  /**
   * Present means the consumer owns the value, for the life of the component.
   * An array makes a range; a number makes one thumb, and the shape handed in
   * is the shape every request carries back.
   */
  readonly value = input<number | readonly number[] | undefined>(undefined);
  /** The value an uncontrolled slider starts from, read once. */
  readonly defaultValue = input<number | readonly number[]>(0);

  readonly min = input<number, unknown>(0, { transform: (raw) => optionalNumber(raw) ?? 0 });
  readonly max = input<number, unknown>(100, { transform: (raw) => optionalNumber(raw) ?? 100 });
  readonly step = input<number, unknown>(1, { transform: (raw) => optionalNumber(raw) ?? 1 });
  /** The amount `Shift` and the page keys move by. Defaults to `step * 10`. */
  readonly largeStep = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** How many steps must stay between two neighbouring thumbs. */
  readonly minStepsBetween = input<number, unknown>(0, {
    transform: (raw) => optionalNumber(raw) ?? 0,
  });
  /** Where the filled portion starts. Defaults to `min`. */
  readonly origin = input<SliderOrigin>('min');
  /** The ticks drawn beside the rail. A mark's label becomes its announced value. */
  readonly marks = input<readonly (number | SliderMark)[] | undefined>(undefined);
  /** How the value is written, through `Intl.NumberFormat`. */
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);
  /** BCP 47. Unset, the language in force decides. */
  readonly locale = input<string | undefined>(undefined);
  /** The accessible name of each thumb, in order. */
  readonly thumbLabels = input<readonly string[] | undefined>(undefined);

  readonly size = input<SliderSize | undefined>(undefined);
  readonly orientation = input<SliderOrientation | undefined>(undefined);
  readonly valueLabel = input<SliderValueLabel | undefined>(undefined);

  /** Unstated rather than `false`, so the control defers to the field. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (raw) => (raw === undefined ? undefined : booleanAttribute(raw)),
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (raw) => (raw === undefined ? undefined : booleanAttribute(raw)),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (raw) => (raw === undefined ? undefined : booleanAttribute(raw)),
  });

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no `[(value)]`,
   * because a two-way binding has one slot and can carry none of those; a form
   * gets the same movement through `ControlValueAccessor`.
   */
  readonly valueChange = output<ChangeRequest<number | number[]>>();
  /**
   * The end of a drag, or a key that settled the value. A drag emits a hundred
   * changes and one commit; this is the commit.
   */
  readonly valueCommit = output<number | number[]>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly field = inject(SlField, { optional: true });
  private readonly defaults = injectSliderDefaults();
  private readonly appLocale = injectLocale();

  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenName = inject(new HostAttributeToken('name'), { optional: true });
  private readonly writtenForm = inject(new HostAttributeToken('form'), { optional: true });
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly writtenInvalid = inject(new HostAttributeToken('aria-invalid'), {
    optional: true,
  });
  private readonly writtenRequired = inject(new HostAttributeToken('aria-required'), {
    optional: true,
  });

  /** What the family holds when nobody else owns it. */
  private readonly own = signal<number[] | null>(null);
  private readonly formValue = signal<number[] | null>(null);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  protected readonly dragging = signal<number | null>(null);
  private onChangeFn: (value: number | number[]) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  protected readonly scale = computed(() => ({
    min: this.min(),
    max: this.max(),
    step: this.step(),
  }));

  /** The shape the consumer handed in is the shape every request carries back. */
  private readonly isRange = computed(() => {
    const bound = this.value();
    return Array.isArray(bound ?? this.defaultValue());
  });

  readonly values = computed<number[]>(() => {
    const bound = this.value();
    const held = bound ?? this.formValue() ?? this.own() ?? this.defaultValue();
    return normalizeValues(toArray(held), this.scale());
  });

  private readonly formatter = computed(() => {
    const options = this.format();
    return createNumberFormat({
      locale: this.locale() ?? this.appLocale(),
      ...(options === undefined ? {} : { options }),
    });
  });

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);
  readonly resolvedValueLabel = computed(() => this.valueLabel() ?? this.defaults.valueLabel);
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(() => this.readOnly() ?? this.field?.resolvedReadOnly());
  readonly resolvedInvalid = computed(() => this.invalid() ?? this.field?.invalid());
  private readonly inert = computed(
    () => this.resolvedDisabled() === true || this.resolvedReadOnly() === true,
  );

  readonly controlId = computed(() => this.writtenId ?? this.field?.ids().control ?? null);
  protected readonly submissionName = computed(() => this.writtenName);
  protected readonly submissionForm = computed(() => this.writtenForm);

  protected readonly markList = computed<SliderMark[]>(() => {
    const marks = this.marks();
    if (marks === undefined) return [];
    return marks.map((mark) => (typeof mark === 'number' ? { value: mark } : mark));
  });

  protected readonly marksMode = computed(() => {
    const marks = this.markList();
    if (marks.length === 0) return null;
    return marks.some((mark) => mark.label !== undefined) ? 'labelled' : 'ticks';
  });

  protected readonly describedBy = computed(() => {
    const merged = [this.writtenDescribedBy, this.field?.describedBy()].filter(Boolean);
    return merged.length === 0 ? null : merged.join(' ');
  });
  protected readonly ariaInvalid = computed(
    () => this.writtenInvalid ?? (this.resolvedInvalid() === true ? 'true' : null),
  );
  protected readonly ariaRequired = computed(
    () => this.writtenRequired ?? (this.field?.required() === true ? 'true' : null),
  );

  /** Where the fill starts, which is an end of the scale or a point on it. */
  protected readonly span = computed(() => {
    const values = this.values();
    const scale = this.scale();
    const origin = this.origin();
    const originValue = origin === 'min' ? scale.min : origin === 'max' ? scale.max : origin;
    const first = values[0] ?? scale.min;
    const last = values[values.length - 1] ?? scale.min;
    const start = values.length > 1 ? first : Math.min(originValue, first);
    const end = values.length > 1 ? last : Math.max(originValue, first);
    return {
      start: fractionOfValue(start, scale) * 100,
      end: fractionOfValue(end, scale) * 100,
    };
  });

  protected readonly outputText = computed(() =>
    this.values()
      .map((value) => this.valueTextOf(value))
      .join(' – '),
  );

  /** The native element, for `focus()` on the root and for a consumer's own query. */
  get sliderElement(): HTMLElement {
    return this.element;
  }

  /** The one action a value cannot express: putting focus on a named thumb. */
  focusThumb(index = 0) {
    this.thumbInputs()[index]?.focus();
  }

  protected percentOf(value: number) {
    return fractionOfValue(value, this.scale()) * 100;
  }

  protected edgeOf(value: number) {
    if (value === this.min()) return 'start';
    if (value === this.max()) return 'end';
    return null;
  }

  protected boundsAt(index: number) {
    return thumbBounds({
      ...this.scale(),
      values: this.values(),
      index,
      minStepsBetween: this.minStepsBetween(),
    });
  }

  protected thumbLabelAt(index: number) {
    const labels = this.thumbLabels();
    if (labels?.[index] !== undefined) return labels[index];
    return this.values().length > 1 ? null : this.writtenLabel;
  }

  /**
   * The APG names `aria-valuetext` for a value that is not user-friendly, and
   * gives "Monday" as its example. A mark that already carries a label is that
   * string, so a five-step quality scale announces "Medium" rather than "50".
   */
  protected valueTextOf(value: number) {
    const labelled = this.markList().find(
      (mark) => mark.value === value && mark.label !== undefined,
    );
    return labelled?.label ?? this.formatter().format(value);
  }

  protected onTouched() {
    this.onTouchedFn();
  }

  writeValue(value: number | readonly number[] | null) {
    this.formValue.set(
      value === null || value === undefined ? null : normalizeValues(toArray(value), this.scale()),
    );
  }

  registerOnChange(fn: (value: number | number[]) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  protected onPointerDown(event: PointerEvent) {
    if (this.inert() || event.button !== 0) return;
    const target = this.valueAtPointer(event);
    if (target === null) return;

    const index = nearestThumb(this.values(), target);
    if (index === -1) return;

    event.preventDefault();
    this.thumbInputs()[index]?.focus();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(index);
    this.move(index, target, 'pointer', event);
  }

  protected onPointerMove(event: PointerEvent) {
    const index = this.dragging();
    if (index === null) return;
    const target = this.valueAtPointer(event);
    if (target === null) return;
    this.move(index, target, 'pointer', event);
  }

  protected onPointerUp(event: PointerEvent) {
    if (this.dragging() === null) return;
    const host = event.currentTarget as HTMLElement;
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    this.dragging.set(null);
    this.valueCommit.emit(this.shape(this.values()));
  }

  /**
   * The whole keyboard table, and `preventDefault()` on every key in it. The
   * inline arrows follow the reading direction — in a mirrored document
   * `ArrowRight` moves the thumb toward the end of the track the reader sees —
   * and the block arrows do not, because a scale has a direction and bidi is
   * not it.
   */
  protected onKeyDown(index: number, event: KeyboardEvent) {
    if (event.defaultPrevented || this.inert()) return;

    const step = this.step();
    const large = this.largeStep() ?? step * 10;
    const amount = event.shiftKey ? large : step;
    const inlineSign = this.isRtl() ? -1 : 1;
    const current = this.values()[index] ?? this.min();
    const bounds = this.boundsAt(index);

    const stepBy = (direction: number, by: number) => {
      event.preventDefault();
      this.move(index, current + direction * by, 'keyboard', event);
      this.valueCommit.emit(this.shape(this.values()));
    };

    switch (event.key) {
      case 'ArrowRight':
        stepBy(inlineSign, amount);
        return;
      case 'ArrowLeft':
        stepBy(-inlineSign, amount);
        return;
      case 'ArrowUp':
        stepBy(1, amount);
        return;
      case 'ArrowDown':
        stepBy(-1, amount);
        return;
      case 'PageUp':
        stepBy(1, large);
        return;
      case 'PageDown':
        stepBy(-1, large);
        return;
      case 'Home':
        event.preventDefault();
        this.move(index, bounds.min, 'keyboard', event);
        this.valueCommit.emit(this.shape(this.values()));
        return;
      case 'End':
        event.preventDefault();
        this.move(index, bounds.max, 'keyboard', event);
        this.valueCommit.emit(this.shape(this.values()));
        return;
      default:
    }
  }

  private thumbInputs(): HTMLInputElement[] {
    return Array.from(this.element.querySelectorAll<HTMLInputElement>('[data-part="input"]'));
  }

  /**
   * Which way the inline arrows move, read from the element rather than from an
   * input: a right-to-left document is a property of the page.
   */
  private isRtl() {
    const track = this.track()?.nativeElement;
    return track !== undefined && getComputedStyle(track).direction === 'rtl';
  }

  private valueAtPointer(event: PointerEvent) {
    const track = this.track()?.nativeElement;
    if (track === undefined) return null;
    const rect = track.getBoundingClientRect();
    const fraction = fractionAtPoint(
      { x: event.clientX, y: event.clientY },
      { rect, orientation: this.resolvedOrientation(), rtl: this.isRtl() },
    );
    return valueAtFraction(fraction, this.scale());
  }

  private shape(values: number[]): number | number[] {
    return this.isRange() ? values : (values[0] ?? this.min());
  }

  private move(index: number, next: number, reason: ChangeReason, source: Event | undefined) {
    const values = this.values();
    const moved = moveThumb({
      ...this.scale(),
      values,
      index,
      next,
      minStepsBetween: this.minStepsBetween(),
    });
    if (moved === values) return;
    this.request(moved, reason, source);
  }

  /**
   * Asks to move, and moves nothing the consumer owns. A refused request stops
   * here: a control that wrote the value regardless would show one the consumer
   * never accepted.
   */
  private request(next: number[], reason: ChangeReason, source: Event | undefined) {
    const current = this.values();
    if (sameValues(next, current)) return;

    let cancelled = false;
    /* The request is built over the shape the consumer handed in, so the value
       it carries and the value they passed are the same kind of thing — and so
       `cancel()` still belongs to the object that owns it. */
    const state = createControllable<number | number[]>({
      controlled: undefined,
      initial: this.shape(current),
      equals: (a, b) => (Array.isArray(a) && Array.isArray(b) ? sameValues(a, b) : Object.is(a, b)),
      onRequest: (pending) => {
        this.valueChange.emit(pending);
        cancelled = pending.cancelled;
      },
    });
    state.request(this.shape(next), reason, source);
    if (cancelled) return;

    this.onChangeFn(this.shape(next));
    /* A controlled slider never moves its own value: it asks, and waits. */
    if (this.value() !== undefined) return;
    this.formValue.set(next);
    this.own.set(next);
  }
}
