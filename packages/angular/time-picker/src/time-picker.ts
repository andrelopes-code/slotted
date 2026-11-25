import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SlClock, SlClockSlot } from '@slotted/angular/clock';
import type { ClockChangeRequest } from '@slotted/angular/clock';
import { SlField } from '@slotted/angular/field';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import {
  isOpenChord,
  pickerDraft,
  PickerLayer,
  PickerValue,
  SlPickerBody,
  SlPickerFooter,
  SlPickerGroup,
  SlPickerLayer,
  SlPickerPanel,
  SlPickerRail,
  SlPickerTimeHead,
  SlPickerTrigger,
} from '@slotted/angular/picker-panel';
import { SlTimeField, SlTimeFieldEnd } from '@slotted/angular/time-field';
import type { TimeFieldHourCycle } from '@slotted/angular/time-field';
import {
  clockFinest,
  createTimeFormat,
  durationLabel,
  isSameTime,
  nowIn,
  timeMeta,
} from '@slotted/core/date';
import type { PickerPreset, PlainTime, TimeGranularity } from '@slotted/core/date';
import { pickerPanelMessages, timePickerMessages } from '@slotted/core/i18n';
import type { PartialMessages, TimePickerMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';

import { isRefusedTime, TIME_PICKER_OFFSETS, timeOffsetViews, timePresetViews } from './time-panel';
import { injectTimePickerDefaults } from './time-picker-defaults';
import type {
  TimePickerPlacement,
  TimePickerSize,
  TimePickerVariant,
} from './time-picker-defaults';

/** An input an attribute may state, and `undefined` leaves to what is around the picker. */
function optionalBoolean(value: boolean | string | undefined): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

/**
 * A time field, a trigger, and a clock behind them.
 *
 * **The panel never takes the field away.** `Alt`+`ArrowDown` opens it and
 * leaves focus in the field, so the segments keep every key they had and the
 * clock follows what is typed.
 *
 * **The panel keeps a draft.** Apply writes it; Escape and a press outside
 * leave the value as it was.
 */
@Component({
  selector: '[slTimePicker]',
  standalone: true,
  exportAs: 'slTimePicker',
  imports: [
    NgTemplateOutlet,
    SlClock,
    SlClockSlot,
    SlPickerBody,
    SlPickerFooter,
    SlPickerGroup,
    SlPickerLayer,
    SlPickerPanel,
    SlPickerRail,
    SlPickerTimeHead,
    SlPickerTrigger,
    SlTimeField,
    SlTimeFieldEnd,
  ],
  template: `
    <div data-part="control" data-part-control="" (keydown)="onControlKeydown($event)">
      <div
        slTimeField
        #field="slTimeField"
        [locale]="resolvedLocale()"
        [timeZone]="resolvedTimeZone()"
        [hourCycle]="resolvedHourCycle()"
        [granularity]="resolvedGranularity()"
        [referenceTime]="referenceTime()"
        [size]="resolvedSize()"
        [variant]="resolvedVariant()"
        [min]="min()"
        [max]="max()"
        [isTimeUnavailable]="isTimeUnavailable()"
        [clearable]="clearable()"
        [relative]="relative()"
        [name]="name()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [required]="required()"
        [value]="state.held()"
        (valueChange)="state.request($event.value, $event.reason, $event.source)"
      >
        <span slTimeFieldEnd>
          <button
            #trigger
            slPickerTrigger
            glyph="clock"
            [disabled]="!editable()"
            [label]="triggerLabel()"
            [layer]="layer"
          ></button>
        </span>
      </div>
    </div>

    @if (layer.isOpen()) {
      <div slPickerLayer [label]="triggerLabel()" [layer]="layer" (applied)="apply($event)">
        <div slPickerPanel kind="time">
          @if (hasRail()) {
            <div slPickerRail [presets]="presetViews()">
              @if (offsetViews().length > 0) {
                <div slPickerGroup [chips]="offsetViews()" [label]="words('fromNow')"></div>
              }
            </div>
          }

          <div slPickerTimeHead [label]="words('time')" [meta]="meta()">
            <div
              slTimeField
              size="sm"
              variant="plain"
              [attr.aria-label]="words('time')"
              [locale]="resolvedLocale()"
              [timeZone]="resolvedTimeZone()"
              [hourCycle]="resolvedHourCycle()"
              [granularity]="resolvedGranularity()"
              [referenceTime]="referenceTime()"
              [min]="min()"
              [max]="max()"
              [isTimeUnavailable]="isTimeUnavailable()"
              [readOnly]="!editable()"
              [value]="draft()"
              (valueChange)="draft.set($event.value)"
            ></div>
          </div>

          <div slPickerBody>
            <div
              slClock
              [attr.aria-label]="words('time')"
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
              [value]="draft()"
              (valueChange)="onClock($event)"
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

          <div
            slPickerFooter
            [canApply]="canApply()"
            [canClear]="draft() !== null"
            [confirm]="resolvedConfirm()"
            [hint]="hint()"
            [invalid]="refused()"
            (applied)="apply($event)"
            (cleared)="clear($event)"
          >
            <ng-content select="[slTimePickerFooter]">{{ hint() }}</ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: '../../../styles/src/time-picker/time-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'time-picker',
    'data-ui-time-picker': '',
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
export class SlTimePicker implements OnInit {
  readonly value = input<PlainTime | null | undefined>(undefined);
  readonly defaultValue = input<PlainTime | null | undefined>(undefined);
  /** Present means the consumer owns whether the surface is showing. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  readonly min = input<PlainTime | undefined>(undefined);
  readonly max = input<PlainTime | undefined>(undefined);
  readonly isTimeUnavailable = input<((time: PlainTime) => boolean) | undefined>(undefined);

  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /**
   * The times to offer, stated rather than stepped: a clinic open at 09:00,
   * 09:20 and 13:45, a broadcast schedule, a set of second-level marks.
   */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);

  /** BCP 47. Unset, the language in force (`provideSlotted`) decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly hourCycle = input<TimeFieldHourCycle | undefined>(undefined);
  readonly granularity = input<TimeGranularity | undefined>(undefined);
  readonly referenceTime = input<PlainTime | undefined>(undefined);

  readonly size = input<TimePickerSize | undefined>(undefined);
  readonly variant = input<TimePickerVariant | undefined>(undefined);
  readonly placement = input<TimePickerPlacement | undefined>(undefined);
  /**
   * Whether the panel keeps a draft until Apply. `false` writes the value on
   * the press that completes the time, and closes. On by default.
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

  readonly clearable = input(false, { transform: booleanAttribute });
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly name = input<string | undefined>(undefined);

  /** The consumer's own shortcuts, after `Now`. The panel writes what each one is. */
  readonly presets = input<readonly PickerPreset<PlainTime>[]>([]);
  /** Steps from now, in seconds. An empty list draws none. */
  readonly offsets = input<readonly number[]>(TIME_PICKER_OFFSETS);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, and what the panel says of a refused time.
   */
  readonly messages = input<PartialMessages<TimePickerMessages> | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<PlainTime | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();

  /** What one whole time of `options` draws. The button around it is the clock's. */
  protected readonly slot = contentChild(SlClockSlot);
  private readonly clockRef = viewChild(SlClock);
  private readonly field = viewChild<SlTimeField>('field');
  private readonly trigger = viewChild('trigger', { read: ElementRef<HTMLButtonElement> });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectTimePickerDefaults();
  private readonly appLocale = injectLocale();
  private readonly enclosing = inject(SlField, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly t = injectMessages(timePickerMessages, this.messages);
  protected readonly words = injectMessages(pickerPanelMessages);

  private readonly clock = signal<PlainTime>({ hour: 12, minute: 0, second: 0 });

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
    () => this.disabled() ?? this.enclosing?.resolvedDisabled(),
  );
  protected readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.enclosing?.resolvedReadOnly(),
  );
  protected readonly resolvedRequired = computed(
    () => this.required() ?? this.enclosing?.required(),
  );
  protected readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  protected readonly state = new PickerValue<PlainTime | null>(
    this.value,
    null,
    isSameTime,
    (request) => this.valueChange.emit(request),
  );
  protected readonly layer = new PickerLayer({
    focusPanel: () => this.clockRef()?.focus(),
    left: () => this.draft.set(this.state.held()),
    open: this.open,
    placement: computed(() => this.placement() ?? this.defaults.placement),
    requested: (request) => this.openChange.emit(request),
    root: this.element,
    trigger: () => this.trigger()?.nativeElement,
  });
  protected readonly draft = pickerDraft(this.state.held, isSameTime);

  private readonly rules = computed(() => ({
    isTimeUnavailable: this.isTimeUnavailable(),
    max: this.max(),
    min: this.min(),
  }));

  private readonly format = computed(() =>
    createTimeFormat({
      granularity: this.resolvedGranularity(),
      hourCycle: this.resolvedHourCycle(),
      locale: this.resolvedLocale(),
    }),
  );

  protected readonly now = computed(() => this.referenceTime() ?? this.clock());

  /**
   * Validity the family owns, beside the validity the consumer states: a time
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because this control is the only thing that knows.
   */
  protected readonly resolvedInvalid = computed(() => {
    const held = this.state.held();
    if (held !== null && isRefusedTime(held, this.rules())) return true;

    return this.invalid() ?? this.enclosing?.invalid();
  });

  /**
   * The trigger's accessible name. Focus returns here when the surface closes,
   * so this is where the reader is told what was chosen.
   */
  protected readonly triggerLabel = computed(() => {
    const held = this.state.held();

    return held === null
      ? this.t('choose')
      : this.t('change', { time: this.format().describe(held) });
  });

  protected readonly refused = computed(() => {
    const draft = this.draft();

    return draft !== null && isRefusedTime(draft, this.rules());
  });

  protected readonly canApply = computed(
    () => !this.refused() && (this.draft() !== null || this.state.held() !== null),
  );

  protected readonly meta = computed(() => {
    const draft = this.draft();
    if (draft === null) return this.format().format(this.now());

    return timeMeta(
      draft,
      this.now(),
      this.resolvedLocale(),
      this.words,
      this.resolvedGranularity(),
    );
  });

  protected readonly hint = computed(() => {
    if (this.refused()) return this.t('refused');
    if (this.options() !== undefined) return '';

    const length = durationLabel(this.resolvedStep(), this.resolvedLocale(), 'second');

    return this.words('every', { length });
  });

  /* A stated list holds the only times there are: no Now, and no steps from it. */
  private readonly steps = computed(() => (this.options() === undefined ? this.offsets() : []));

  private readonly shortcuts = computed(() => {
    const stated = this.presets();
    if (this.options() !== undefined) return stated;
    if (stated.length === 0 && this.steps().length === 0) return [];

    return [{ label: this.words('now'), value: this.now() }, ...stated];
  });

  protected readonly presetViews = computed(() =>
    timePresetViews({ ...this.views(), presets: this.shortcuts() }),
  );

  protected readonly offsetViews = computed(() =>
    timeOffsetViews({ ...this.views(), now: this.now(), offsets: this.steps() }),
  );

  protected readonly hasRail = computed(
    () => this.presetViews().length > 0 || this.offsetViews().length > 0,
  );

  private readonly views = computed(() => ({
    choose: (time: PlainTime, event: Event) => this.choose(time, event),
    draft: this.draft(),
    granularity: this.resolvedGranularity(),
    hourCycle: this.resolvedHourCycle(),
    locale: this.resolvedLocale(),
    rules: this.rules(),
  }));

  constructor() {
    afterNextRender(() => {
      const form = this.element.closest('form');
      const reset = (event: Event) => this.state.reset(event);
      form?.addEventListener('reset', reset);
      this.destroyRef.onDestroy(() => form?.removeEventListener('reset', reset));
    });
  }

  ngOnInit(): void {
    this.layer.start(this.defaultOpen());
    this.state.start(this.defaultValue() ?? null);
    this.clock.set({ ...nowIn(this.resolvedTimeZone()), second: 0 });
  }

  /** Puts focus on the first segment of the field. */
  focus(): void {
    this.field()?.focus();
  }

  openSurface(source?: Event): void {
    this.layer.show('programmatic', source);
  }

  closeSurface(source?: Event): void {
    this.layer.setOpen(false, 'programmatic', source);
  }

  protected onControlKeydown(event: KeyboardEvent): void {
    if (!this.editable() || !isOpenChord(event)) return;

    event.preventDefault();
    this.layer.show('keyboard', event, false);
  }

  protected onClock(request: ClockChangeRequest): void {
    const finest = clockFinest(this.resolvedGranularity(), this.resolvedStep());
    const complete = request.unit === 'slot' || request.unit === finest;
    if (this.resolvedConfirm() || !complete) this.draft.set(request.value);
    else this.write(request.value, request.source);
  }

  protected apply(source: Event): void {
    if (this.canApply()) this.write(this.draft(), source);
  }

  protected clear(source: Event): void {
    if (this.resolvedConfirm()) this.draft.set(null);
    else this.write(null, source);
  }

  /* A shortcut is a whole answer: without a draft to confirm, it is written. */
  private choose(time: PlainTime, source: Event): void {
    if (this.resolvedConfirm()) this.draft.set(time);
    else this.write(time, source);
  }

  private write(next: PlainTime | null, source: unknown): void {
    this.state.request(next, 'select', source);
    this.layer.finish(source);
  }
}
