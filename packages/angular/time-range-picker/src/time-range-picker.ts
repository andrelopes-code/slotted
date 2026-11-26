import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { SlClock, SlClockSlot } from '@slotted/angular/clock';
import type { ClockChangeRequest } from '@slotted/angular/clock';
import { SlField } from '@slotted/angular/field';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  pickerDraft,
  PickerLayer,
  PickerValue,
  SlPickerClocks,
  SlPickerCurrent,
  SlPickerFooter,
  SlPickerGroup,
  SlPickerHalf,
  SlPickerHalfPart,
  SlPickerLayer,
  SlPickerPanel,
  SlPickerRail,
  SlPickerRangeHead,
  SlPickerRuler,
  SlPickerSpan,
  SlPickerTrigger,
} from '@slotted/angular/picker-panel';
import type { PickerRulerMove } from '@slotted/angular/picker-panel';
import { SlTimeField } from '@slotted/angular/time-field';
import {
  clockFinest,
  clockModel,
  closingTimes,
  compareTime,
  isSameTime,
  nowIn,
  timeRangeProblems,
  toISOTime,
} from '@slotted/core/date';
import type { PickerPreset, PlainTime, TimeRunRules } from '@slotted/core/date';
import { clockMessages, pickerPanelMessages, timeRangePickerMessages } from '@slotted/core/i18n';
import type { PartialMessages, TimeRangePickerMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import {
  TIME_RANGE_PICKER_DURATIONS,
  timeRunDurationViews,
  timeRunPresetViews,
  timeRunSpanView,
} from './time-range-panel';
import { SlTimeRangePickerFooter } from './time-range-picker-parts';
import { injectTimeRangePickerDefaults } from './time-range-picker-defaults';
import type {
  TimeRange,
  TimeRangePickerDefaults,
  TimeRangePickerHourCycle,
  TimeRangePickerPlacement,
  TimeRangePickerPosition,
  TimeRangePickerSize,
  TimeRangePickerVariant,
} from './time-range-picker-defaults';
import {
  isSameTimeRange,
  normalizeTimes,
  timeEndWords,
  timeLimitWords,
  timeRefusalWords,
  timeSummary,
  timeTriggerName,
} from './time-range-words';
import type { TimeRangeWords } from './time-range-words';

/** An input an attribute may state, and `undefined` leaves to what is around the picker. */
function optionalBoolean(value: boolean | string | undefined): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null ? undefined : numberAttribute(value);
}

/**
 * A one-line frame — the run in words, a clear and the trigger — and behind it
 * the day as one axis with a clock for each end.
 *
 * **The frame is one line at any width.** Two segmented fields in it broke it
 * into two lines in any column narrower than they are. They live in the head
 * of the panel, where the width is the panel's.
 *
 * **The clock of the end answers the start.** What the start refuses of it —
 * the times before it, a run too short, too long, or across an unavailable
 * time — is struck in the gesture that chooses the start.
 *
 * **The panel keeps a draft.** Apply writes it; Escape and a press outside
 * leave the run as it was.
 */
@Component({
  selector: '[slTimeRangePicker]',
  standalone: true,
  exportAs: 'slTimeRangePicker',
  imports: [
    NgTemplateOutlet,
    SlClock,
    SlClockSlot,
    SlGlyph,
    SlIcon,
    SlPickerClocks,
    SlPickerCurrent,
    SlPickerFooter,
    SlPickerGroup,
    SlPickerHalf,
    SlPickerHalfPart,
    SlPickerLayer,
    SlPickerPanel,
    SlPickerRail,
    SlPickerRangeHead,
    SlPickerRuler,
    SlPickerSpan,
    SlPickerTrigger,
    SlTimeField,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTimeRangePicker), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlTimeRangePicker), multi: true },
  ],
  template: `
    <div data-part="control" data-part-control="">
      <button
        #trigger
        slPickerTrigger
        glyph="clock"
        [disabled]="!editable()"
        [label]="triggerLabel()"
        [layer]="layer"
        (blur)="onTriggerBlur()"
      >
        <span
          data-part="summary"
          data-part-summary=""
          [attr.data-placeholder]="summary() === null ? '' : null"
          >{{ summary() ?? t('choose') }}</span
        >
      </button>
      @if (clears() && state.held() !== null) {
        <button
          data-part="clear"
          data-part-clear=""
          type="button"
          [attr.aria-label]="t('clear')"
          [disabled]="!editable()"
          (click)="clear($event)"
        >
          <span slIcon><svg slGlyph name="x"></svg></span>
        </button>
      }
      <input
        data-part="hidden-input"
        data-part-hidden-input=""
        type="hidden"
        [attr.name]="startName() ?? null"
        [value]="posted(state.held()?.start)"
      />
      <input
        data-part="hidden-input"
        data-part-hidden-input=""
        type="hidden"
        [attr.name]="endName() ?? null"
        [value]="posted(state.held()?.end)"
      />
    </div>

    @if (layer.mounted()) {
      <div slPickerLayer [label]="triggerLabel()" [layer]="layer" (applied)="apply($event)">
        <div slPickerPanel kind="time-range">
          @if (presetViews().length > 0 || durationViews().length > 0) {
            <div slPickerRail [presets]="presetViews()">
              @if (durationViews().length > 0) {
                <div slPickerGroup [chips]="durationViews()" [label]="words('duration')"></div>
              }
            </div>
          }

          <div slPickerRangeHead>
            <div
              slPickerHalf
              [current]="currentPosition() === 'start'"
              [empty]="startWords().empty"
              [label]="t('start')"
              [meta]="startWords().meta"
              (entered)="enter('start', 'pointer')"
            >
              @if (layer.narrow()) {
                <button
                  slPickerHalfPart="time"
                  [current]="currentPosition() === 'start'"
                  (click)="enter('start', 'pointer', $event)"
                >
                  {{ startWords().text }}
                </button>
              } @else {
                <div
                  slTimeField
                  size="sm"
                  variant="plain"
                  [attr.aria-label]="t('start')"
                  [locale]="resolvedLocale()"
                  [timeZone]="resolvedTimeZone()"
                  [hourCycle]="resolvedHourCycle()"
                  [granularity]="resolvedGranularity()"
                  [referenceTime]="referenceTime()"
                  [relative]="relative()"
                  [min]="min()"
                  [max]="max()"
                  [readOnly]="!editable()"
                  [value]="draft()?.start ?? null"
                  (valueChange)="type('start', $event.value, $event.source)"
                ></div>
              }
            </div>
            <div slPickerSpan [span]="span()"></div>
            <div
              slPickerHalf
              [current]="currentPosition() === 'end'"
              [empty]="endWords().empty"
              [invalid]="refusal() !== null"
              [label]="t('end')"
              [meta]="endWords().meta"
              (entered)="enter('end', 'pointer')"
            >
              @if (layer.narrow()) {
                <button
                  slPickerHalfPart="time"
                  [current]="currentPosition() === 'end'"
                  (click)="enter('end', 'pointer', $event)"
                >
                  {{ endWords().text }}
                </button>
              } @else {
                <div
                  slTimeField
                  size="sm"
                  variant="plain"
                  [attr.aria-label]="t('end')"
                  [locale]="resolvedLocale()"
                  [timeZone]="resolvedTimeZone()"
                  [hourCycle]="resolvedHourCycle()"
                  [granularity]="resolvedGranularity()"
                  [referenceTime]="referenceTime()"
                  [relative]="relative()"
                  [min]="min()"
                  [max]="max()"
                  [readOnly]="!editable()"
                  [value]="draft()?.end ?? null"
                  (valueChange)="type('end', $event.value, $event.source)"
                ></div>
              }
            </div>
          </div>

          <div
            slPickerRuler
            [end]="draft()?.end ?? null"
            [hourCycle]="resolvedHourCycle()"
            [locale]="resolvedLocale()"
            [model]="model()"
            [start]="draft()?.start ?? null"
            [step]="resolvedStep()"
            (moved)="drag($event)"
          ></div>

          <div slPickerClocks>
            <div
              slClock
              #startClock="slClock"
              [slPickerCurrent]="currentPosition() === 'start'"
              [attr.aria-label]="t('start')"
              [locale]="resolvedLocale()"
              [hourCycle]="resolvedHourCycle()"
              [granularity]="resolvedGranularity()"
              [min]="min()"
              [max]="max()"
              [isTimeUnavailable]="isTimeUnavailable()"
              [now]="now()"
              [options]="options()"
              [readOnly]="!editable()"
              [step]="resolvedStep()"
              [value]="draft()?.start ?? null"
              (focusin)="enter('start', 'keyboard')"
              (valueChange)="press('start', $event)"
            >
              @if (slot(); as slot) {
                <ng-template slClockSlot let-time let-state="state">
                  <ng-container
                    [ngTemplateOutlet]="slot.template"
                    [ngTemplateOutletContext]="{ $implicit: time, state }"
                  />
                </ng-template>
              }
            </div>
            <div
              slClock
              #endClock="slClock"
              [slPickerCurrent]="currentPosition() === 'end'"
              [attr.aria-label]="t('end')"
              [locale]="resolvedLocale()"
              [hourCycle]="resolvedHourCycle()"
              [granularity]="resolvedGranularity()"
              [min]="min()"
              [max]="max()"
              [isTimeUnavailable]="closing().isTimeUnavailable"
              [now]="now()"
              [options]="options()"
              [readOnly]="!editable()"
              [step]="resolvedStep()"
              [value]="draft()?.end ?? null"
              (focusin)="enter('end', 'keyboard')"
              (valueChange)="press('end', $event)"
            >
              @if (slot(); as slot) {
                <ng-template slClockSlot let-time let-state="state">
                  <ng-container
                    [ngTemplateOutlet]="slot.template"
                    [ngTemplateOutletContext]="{ $implicit: time, state }"
                  />
                </ng-template>
              }
            </div>
          </div>

          @if (footerShown()) {
            <div
              slPickerFooter
              [clearable]="clears()"
              [canApply]="canApply()"
              [canClear]="draft() !== null"
              [confirm]="resolvedConfirm()"
              [hint]="hint()"
              [invalid]="refusal() !== null"
              (applied)="apply($event)"
              (cleared)="clearDraft($event)"
            >
              <ng-content select="[slTimeRangePickerFooter]">{{ hint() }}</ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: '../../../styles/src/time-range-picker/time-range-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'time-range-picker',
    'data-ui-time-range-picker': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-granularity]': 'resolvedGranularity()',
    '[attr.data-open]': "layer.isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlTimeRangePicker implements ControlValueAccessor, Validator, OnInit {
  readonly value = input<TimeRange | null | undefined>(undefined);
  readonly defaultValue = input<TimeRange | null | undefined>(undefined);
  /** Present means the consumer owns whether the surface is showing. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Present means the consumer owns which end is being edited. */
  readonly position = input<TimeRangePickerPosition | undefined>(undefined);
  readonly defaultPosition = input<TimeRangePickerPosition>('start');

  readonly min = input<PlainTime | undefined>(undefined);
  readonly max = input<PlainTime | undefined>(undefined);
  readonly isTimeUnavailable = input<((time: PlainTime) => boolean) | undefined>(undefined);
  /**
   * Whether a run may cross an unavailable time. On, and with a start chosen,
   * the times beyond the first unavailable one are refused in the clock of the
   * end; off, the run may jump over it.
   */
  readonly contiguous = input(true, { transform: booleanAttribute });
  /** The shortest and longest run allowed, in seconds. */
  readonly minLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  readonly lengthLabel = input<TimeRangePickerDefaults['lengthLabel'] | undefined>(undefined);

  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** The times to offer, stated rather than stepped; the same list for both ends. */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);

  /** BCP 47. Unset, the language in force (`provideSlotted`) decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly hourCycle = input<TimeRangePickerHourCycle | undefined>(undefined);
  readonly granularity = input<TimeRangePickerDefaults['granularity'] | undefined>(undefined);
  /** What "now" is, for a story or a test; the clock otherwise. */
  readonly referenceTime = input<PlainTime | undefined>(undefined);

  readonly size = input<TimeRangePickerSize | undefined>(undefined);
  readonly variant = input<TimeRangePickerVariant | undefined>(undefined);
  readonly placement = input<TimeRangePickerPlacement | undefined>(undefined);
  /**
   * Whether the panel keeps a draft until Apply. `false` writes a whole run on
   * every press, and closes on the one that completes it. On by default.
   */
  readonly confirm = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

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

  /** Draws one clear on the frame, which empties both ends. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Whether the fields of the two ends take the relative expression. */
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

  /** The consumer's own shortcuts. The panel writes the run each one is. */
  readonly presets = input<readonly PickerPreset<TimeRange>[]>([]);
  /** Lengths the run can take from its start, in seconds. An empty list draws none. */
  readonly durations = input<readonly number[]>(TIME_RANGE_PICKER_DURATIONS);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's names, the two ends, the limits, and what is said of a refused run.
   */
  readonly messages = input<PartialMessages<TimeRangePickerMessages> | undefined>(undefined);
  /** The names of the two hidden inputs a plain form post reads. */
  readonly startName = input<string | undefined>(undefined);
  readonly endName = input<string | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<TimeRange | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();
  readonly positionChange = output<ChangeRequest<TimeRangePickerPosition>>();

  /** What one whole time of `options` draws. The button around it is the clock's. */
  protected readonly slot = contentChild(SlClockSlot);
  private readonly startClock = viewChild<SlClock>('startClock');
  private readonly endClock = viewChild<SlClock>('endClock');
  private readonly trigger = viewChild('trigger', { read: ElementRef<HTMLButtonElement> });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectTimeRangePickerDefaults();
  private readonly appLocale = injectLocale();
  private readonly enclosing = inject(SlField, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  protected readonly t = injectMessages(timeRangePickerMessages, this.messages);
  protected readonly words = injectMessages(pickerPanelMessages);
  private readonly clockWords = injectMessages(clockMessages);

  private readonly clock = signal<PlainTime>({ hour: 12, minute: 0, second: 0 });
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private readonly ownPosition = signal<TimeRangePickerPosition>('start');

  private onChangeFn: (value: TimeRange | null) => void = () => undefined;
  /** Whether a form model holds the value, and answers a reset through `writeValue`. */
  private formBound = false;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly currentPosition = computed(() => this.position() ?? this.ownPosition());
  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  protected readonly resolvedTimeZone = computed(() => this.timeZone() ?? this.defaults.timeZone);
  protected readonly resolvedHourCycle = computed(
    () => this.hourCycle() ?? this.defaults.hourCycle,
  );
  protected readonly resolvedGranularity = computed(
    () => this.granularity() ?? this.defaults.granularity,
  );
  protected readonly resolvedStep = computed(() => this.step() ?? this.defaults.step);
  protected readonly resolvedConfirm = computed(() => this.confirm() ?? this.defaults.confirm);
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.enclosing?.resolvedSize() ?? this.defaults.size,
  );
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.enclosing?.resolvedDisabled(),
  );
  protected readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.enclosing?.resolvedReadOnly(),
  );
  protected readonly resolvedRequired = computed(
    () => this.required() ?? this.enclosing?.required(),
  );
  /** A required value offers no control that empties it. */
  protected readonly clears = computed(() => this.clearable() && this.resolvedRequired() !== true);
  /** The application's own words for the footer. */
  private readonly ownFooter = contentChild(SlTimeRangePickerFooter);
  /** With nothing to say and no action to offer, there is no footer. */
  protected readonly footerShown = computed(
    () =>
      this.clears() ||
      this.resolvedConfirm() ||
      this.refusal() !== null ||
      this.hint() !== '' ||
      this.ownFooter() !== undefined,
  );
  protected readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  protected readonly state = new PickerValue<TimeRange | null>(
    computed(() => {
      const value = this.value();

      return value === undefined ? undefined : normalizeTimes(value);
    }),
    null,
    isSameTimeRange,
    (request) => this.valueChange.emit(request),
  );
  protected readonly layer = new PickerLayer({
    focusPanel: () => this.clockOf(this.currentPosition())?.focus(),
    left: () => this.draft.set(this.state.held()),
    open: this.open,
    placement: computed(() => this.placement() ?? this.defaults.placement),
    requested: (request) => this.openChange.emit(request),
    root: this.element,
    trigger: () => this.trigger()?.nativeElement,
  });
  protected readonly draft = pickerDraft(this.state.held, isSameTimeRange);

  private readonly rules = computed((): TimeRunRules => ({
    contiguous: this.contiguous(),
    max: this.max(),
    maxLength: this.maxLength(),
    min: this.min(),
    minLength: this.minLength(),
    options: this.options(),
    step: this.resolvedStep(),
    unavailable: this.isTimeUnavailable(),
  }));
  private readonly rangeWords = computed((): TimeRangeWords => ({
    clock: this.clockWords,
    granularity: this.resolvedGranularity(),
    hourCycle: this.resolvedHourCycle(),
    lengthLabel: this.lengthLabel() ?? this.defaults.lengthLabel,
    locale: this.resolvedLocale(),
    rules: this.rules(),
    t: this.t,
    words: this.words,
  }));

  protected readonly now = computed(() => this.referenceTime() ?? this.clock());
  protected readonly model = computed(() =>
    clockModel({ ...this.rules(), isTimeUnavailable: this.isTimeUnavailable() }),
  );
  protected readonly closing = computed(() =>
    closingTimes(this.draft()?.start ?? null, this.rules()),
  );

  private readonly problems = computed(() => timeRangeProblems(this.state.held(), this.rules()));
  /**
   * Validity the family owns, beside the validity the consumer states: the
   * bounds, the predicate, the order of the two ends and the duration.
   */
  protected readonly resolvedInvalid = computed(() => {
    if (this.invalid() !== undefined) return this.invalid();
    if (this.problems().length > 0) return true;

    return this.enclosing?.invalid();
  });

  protected readonly summary = computed(() => timeSummary(this.state.held(), this.rangeWords()));
  protected readonly triggerLabel = computed(() =>
    timeTriggerName(this.state.held(), this.rangeWords()),
  );
  protected readonly startWords = computed(() =>
    timeEndWords(this.draft()?.start ?? null, this.rangeWords()),
  );
  protected readonly endWords = computed(() =>
    timeEndWords(this.draft()?.end ?? null, this.rangeWords()),
  );
  protected readonly refusal = computed(() => timeRefusalWords(this.draft(), this.rangeWords()));
  protected readonly hint = computed(() => this.refusal() ?? timeLimitWords(this.rangeWords()));
  protected readonly canApply = computed(() => {
    if (this.refusal() !== null) return false;

    const draft = this.draft();
    if (draft === null) return this.state.held() !== null;

    return draft.start !== null && draft.end !== null;
  });

  private readonly views = computed(() => ({
    choose: (run: TimeRange, event: Event) => this.choose(run, event),
    draft: this.draft(),
    take: (run: TimeRange, event: Event) => this.take(run, event),
    words: this.rangeWords(),
  }));
  protected readonly span = computed(() => timeRunSpanView(this.views()));
  protected readonly presetViews = computed(() => timeRunPresetViews(this.presets(), this.views()));
  protected readonly durationViews = computed(() =>
    timeRunDurationViews(this.durations(), this.views()),
  );

  constructor() {
    /* A rule that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.rules();
      this.onValidatorChangeFn();
    });

    /* A native reset restores the hidden inputs and tells nothing. A picker
       bound to a form model takes the model's reset value through `writeValue`. */
    afterNextRender(() => {
      const form = this.element.closest('form');
      const reset = (event: Event) => {
        if (!this.formBound) this.state.reset(event);
      };
      form?.addEventListener('reset', reset);
      this.destroyRef.onDestroy(() => form?.removeEventListener('reset', reset));
    });
  }

  ngOnInit(): void {
    this.layer.start(this.defaultOpen());
    this.ownPosition.set(this.defaultPosition());
    this.state.start(normalizeTimes(this.defaultValue() ?? null));
    this.clock.set({ ...nowIn(this.resolvedTimeZone()), second: 0 });
  }

  writeValue(value: TimeRange | null | undefined): void {
    this.state.start(normalizeTimes(value ?? null));
  }

  registerOnChange(fn: (value: TimeRange | null) => void): void {
    this.onChangeFn = fn;
    this.formBound = true;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChangeFn = fn;
  }

  /**
   * The rules no other validator can see: the bounds, the predicate, the order
   * of the two ends and the duration. `required` is left to Angular's own,
   * because a form already has a word for it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const actual = normalizeTimes((control.value as TimeRange | null | undefined) ?? null);
    const problems = timeRangeProblems(actual, this.rules());
    if (problems.length === 0) return null;

    const { max, maxLength, min, minLength } = this.rules();
    const errors: ValidationErrors = {};
    if (problems.includes('order')) errors['slottedTimeRangeOrder'] = { actual };
    if (problems.includes('min')) errors['slottedTimeRangeMin'] = { min, actual };
    if (problems.includes('max')) errors['slottedTimeRangeMax'] = { max, actual };
    if (problems.includes('unavailable')) errors['slottedTimeRangeUnavailable'] = { actual };
    if (problems.includes('length')) {
      errors['slottedTimeRangeLength'] = { minLength, maxLength, actual };
    }

    return errors;
  }

  /** Puts focus on the trigger, which is the frame. */
  focus(): void {
    this.trigger()?.nativeElement.focus();
  }

  openSurface(source?: Event): void {
    this.layer.show('programmatic', source);
  }

  closeSurface(source?: Event): void {
    this.layer.setOpen(false, 'programmatic', source);
  }

  protected posted(time: PlainTime | null | undefined): string {
    return time == null ? '' : toISOTime(time);
  }

  protected onTriggerBlur(): void {
    this.onTouchedFn();
  }

  protected clear(source: Event): void {
    this.request(null, 'clear', source);
    this.setPosition('start', 'clear', source);
    this.focus();
  }

  /** The end the next press writes, its clock brought to the screen. */
  protected enter(
    next: TimeRangePickerPosition,
    reason: 'keyboard' | 'pointer',
    source?: Event,
  ): void {
    if (next !== this.currentPosition()) this.setPosition(next, reason, source);
  }

  /** Typed in a half: without a draft to confirm, it is written as it is. */
  protected type(which: TimeRangePickerPosition, time: PlainTime | null, source: unknown): void {
    if (isSameTime(this.draft()?.[which] ?? null, time)) return;

    const next = normalizeTimes(this.moved(which, time));
    this.draft.set(next);
    if (!this.resolvedConfirm()) this.request(next, 'keyboard', source);
  }

  /** The press that leaves the other end missing moves to it. */
  protected press(which: TimeRangePickerPosition, request: ClockChangeRequest): void {
    const next = this.moved(which, request.value);
    const other = which === 'start' ? 'end' : 'start';
    const finest = clockFinest(this.resolvedGranularity(), this.resolvedStep());
    this.draft.set(normalizeTimes(next));
    if (request.unit !== 'slot' && request.unit !== finest) return;

    if (next[other] === null) {
      this.moveTo(other, request.source);
      afterNextRender(() => this.clockOf(other)?.focus(), { injector: this.injector });
    } else if (!this.resolvedConfirm() && this.refusal() === null) {
      this.write(next, request.source);
    }
  }

  /** A handle moves up to the other one and no further. */
  protected drag({ position, source, time }: PickerRulerMove): void {
    const next = this.moved(position, time);
    if (next.start !== null && next.end !== null && compareTime(next.start, next.end) >= 0) return;

    this.moveTo(position, source);
    this.take(next, source);
  }

  protected apply(source: Event): void {
    if (this.canApply()) this.write(this.draft(), source);
  }

  protected clearDraft(source: Event): void {
    this.draft.set(null);
    this.moveTo('start', source);
    if (!this.resolvedConfirm()) this.write(null, source, 'clear');
  }

  private choose(next: TimeRange, source: Event): void {
    this.draft.set(next);
    this.moveTo('start', source);
    if (!this.resolvedConfirm()) this.write(next, source);
  }

  /** The run with one end moved. Without a draft to confirm, a whole run is written. */
  private take(next: TimeRange, source: unknown): void {
    this.draft.set(normalizeTimes(next));
    const whole = next.start !== null && next.end !== null;
    if (this.resolvedConfirm() || !whole || this.refusal() !== null) return;

    this.request(next, 'select', source);
  }

  private write(next: TimeRange | null, source: unknown, reason: ChangeReason = 'select'): void {
    this.request(next, reason, source);
    this.moveTo('start', source);
    this.layer.finish(source);
  }

  private request(next: TimeRange | null, reason: ChangeReason, source: unknown): void {
    if (this.state.request(next, reason, source)) this.onChangeFn(next);
  }

  private moved(which: TimeRangePickerPosition, time: PlainTime | null): TimeRange {
    const draft = this.draft();

    return { start: draft?.start ?? null, end: draft?.end ?? null, [which]: time };
  }

  private moveTo(next: TimeRangePickerPosition, source: unknown): void {
    if (next !== this.currentPosition()) this.setPosition(next, 'select', source);
  }

  private setPosition(next: TimeRangePickerPosition, reason: ChangeReason, source: unknown): void {
    const state = createControllable<TimeRangePickerPosition>({
      controlled: this.position(),
      initial: this.currentPosition(),
      onRequest: (request) => this.positionChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownPosition.set(next);
  }

  private clockOf(position: TimeRangePickerPosition): SlClock | undefined {
    return position === 'start' ? this.startClock() : this.endClock();
  }
}
