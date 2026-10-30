import {
  createDateTimeFormat,
  dateBoundsOf,
  dayWindow,
  hourJump,
  isDateTimeInRange,
  isSameDate,
  isSameDateTime,
  isSameTime,
  isTimeInRange,
  isTruncated,
  nearestIndex,
  nowDateTimeIn,
  timeList,
} from '@slotted/core/date';
import type {
  PlainDate,
  PlainDateTime,
  PlainTime,
  TimeGranularity,
  TimeOption,
} from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { tabbables } from '@slotted/core/focus';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChild,
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
  TemplateRef,
  untracked,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { AfterViewInit, OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  datetimePickerMessages,
  type DatetimePickerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { SlCalendar } from '@slotted/angular/calendar';
import type { CalendarValue, CalendarView } from '@slotted/angular/calendar';
import { SlDateTimeField, SlDateTimeFieldEnd } from '@slotted/angular/datetime-field';
import type { DateTimeFieldChangeRequest } from '@slotted/angular/datetime-field';
import { SlField } from '@slotted/angular/field';

import { injectDateTimePickerDefaults } from './datetime-picker-defaults';
import type {
  DateTimePickerCloseOnSelect,
  DateTimePickerHourCycle,
  DateTimePickerOpenTo,
  DateTimePickerPlacement,
  DateTimePickerSize,
  DateTimePickerUnavailableOptions,
  DateTimePickerVariant,
} from './datetime-picker-defaults';
import { SlDateTimePickerOption } from './datetime-picker-parts';

/** The reasons the contract's `stateModel.open` lists, and no other. */
type OpenReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select'
>;

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * §2.7 of `docs/component-features.md` asks for it by name.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';
/** The surface needs an identifier the trigger can point `aria-controls` at. */
let sequence = 0;

/** Where the reader is in the panel: one highlight for two surfaces. */
export interface DateTimePickerHighlight {
  readonly date: PlainDate;
  readonly time: PlainTime | null;
}

/**
 * A datetime field, a trigger, and the only panel in the library that holds two
 * surfaces.
 *
 * **Both surfaces are in the DOM at every width.** A `tablist` that exists on a
 * narrow container and not on a wide one tells assistive technology two
 * different stories about the same component, which is the arrangement Kendo
 * and MUI ship and this family declines. `openTo` decides where focus lands,
 * not what is drawn.
 *
 * **The decision this family owes, in one sentence:** the press that leaves the
 * value incomplete carries focus to the half that is missing, and the press
 * that completes the value closes the panel.
 *
 * **The list answers the day the reader is on**, not a day already committed.
 *
 * **Two pairs of bounds apply at once**, which MUI's own validation page
 * records that it cannot combine.
 */
@Component({
  selector: '[slDateTimePicker]',
  standalone: true,
  exportAs: 'slDateTimePicker',
  imports: [NgTemplateOutlet, SlCalendar, SlDateTimeField, SlDateTimeFieldEnd, SlGlyph, SlIcon],
  template: `<div data-part="control" data-part-control="" (keydown)="onControlKeyDown($event)">
      <div
        slDateTimeField
        #field="slDateTimeField"
        [locale]="resolvedLocale()"
        [timeZone]="resolvedTimeZone()"
        [hourCycle]="resolvedHourCycle()"
        [granularity]="resolvedGranularity()"
        [calendar]="resolvedCalendar()"
        [firstDayOfWeek]="firstDayOfWeek()"
        [referenceDateTime]="referenceDateTime()"
        [size]="resolvedSize()"
        [variant]="resolvedVariant()"
        [min]="min()"
        [max]="max()"
        [minTime]="minTime()"
        [maxTime]="maxTime()"
        [isDateUnavailable]="isDateUnavailable()"
        [isTimeUnavailable]="isTimeUnavailable()"
        [clearable]="clearable()"
        [relative]="relative()"
        [name]="name()"
        [disabled]="resolvedDisabled()"
        [readOnly]="readOnly()"
        [invalid]="invalid()"
        [required]="required()"
        [value]="held()"
        (valueChange)="onFieldValue($event)"
        (focusout)="onControlFocusOut($event)"
      >
        <span slDateTimeFieldEnd>
          <button
            #trigger
            data-part="trigger"
            data-part-trigger=""
            type="button"
            aria-haspopup="dialog"
            [attr.aria-label]="triggerLabel()"
            [attr.aria-expanded]="isOpen()"
            [attr.aria-controls]="isOpen() ? contentId : null"
            [disabled]="!editable()"
            (click)="toggle($event)"
            (keydown)="onTriggerKeyDown($event)"
          >
            <span slIcon><svg slGlyph name="calendar"></svg></span>
          </button>
        </span>
      </div>
    </div>

    @if (isOpen()) {
      <div
        #layer
        data-ui="datetime-picker"
        data-ui-datetime-picker=""
        data-part="positioner"
        data-part-positioner=""
        data-open
        [attr.data-presentation]="sheet() ? 'sheet' : 'popover'"
      >
        <div
          data-part="content"
          data-part-content=""
          role="dialog"
          [attr.id]="contentId"
          [attr.aria-label]="triggerLabel()"
          [attr.aria-description]="truncated() ? t('truncated') : null"
          [attr.data-granularity]="resolvedGranularity()"
          [attr.data-open-to]="resolvedOpenTo()"
          (keydown)="onContentKeyDown($event)"
        >
          @if (sheet()) {
            <span aria-hidden="true" data-part="grip" data-part-grip=""></span>
          }
          <div data-part="head" data-part-head="">
            <span data-part="head-value" data-part-head-value="">
              @if (held() !== null) {
                {{ headValue() }}
              } @else {
                {{ headDate() }},
                @if (headTime(); as time) {
                  {{ time }}
                } @else {
                  <span data-placeholder>{{ headPlaceholder() }}</span>
                }
              }
            </span>
            <ng-content select="[slDateTimePickerPresets]" />
            <button data-part="now" data-part-now="" type="button" (click)="chooseNow($event)">
              <span slIcon size="sm"><svg slGlyph name="clock"></svg></span>
              {{ t('now') }}
            </button>
          </div>

          <div data-part="panels" data-part-panels="">
            <div #datePanel data-part="date-panel" data-part-date-panel="">
              <div
                slCalendar
                #calendar="slCalendar"
                selectionMode="single"
                [locale]="resolvedLocale()"
                [timeZone]="resolvedTimeZone()"
                [firstDayOfWeek]="firstDayOfWeek()"
                [months]="months()"
                [weekNumbers]="weekNumbers()"
                [readOnly]="readOnly()"
                [min]="dateMin()"
                [max]="dateMax()"
                [isDateUnavailable]="isDateUnavailable()"
                [value]="dateValue()"
                [focusedDate]="highlight().date"
                [view]="view()"
                (valueChange)="onCalendarValue($event)"
                (focusedDateChange)="onFocusedDate($event)"
                (viewChange)="view.set($event)"
              ></div>
            </div>

            <div data-part="time-panel" data-part-time-panel="">
              @if (list().length === 0) {
                <div data-part="empty" data-part-empty="">{{ t('empty') }}</div>
              } @else {
                <div
                  #rows
                  data-part="list"
                  data-part-list=""
                  role="listbox"
                  [attr.aria-label]="listLabel()"
                  [attr.data-truncated]="truncated() ? '' : null"
                  (keydown)="onListKeyDown($event)"
                >
                  @for (option of list(); track $index) {
                    <div
                      data-part="option"
                      data-part-option=""
                      role="option"
                      [attr.aria-selected]="isSelected(option)"
                      [attr.aria-disabled]="option.unavailable ? 'true' : null"
                      [attr.data-disabled]="option.unavailable ? '' : null"
                      [attr.data-selected]="isSelected(option) ? '' : null"
                      [attr.data-current]="$index === highlightIndex() ? '' : null"
                      [tabindex]="$index === highlightIndex() ? 0 : -1"
                      (click)="selectTime(option, $event)"
                    >
                      @if (optionTemplate) {
                        <ng-container
                          [ngTemplateOutlet]="optionTemplate"
                          [ngTemplateOutletContext]="contextFor(option, $index)"
                        />
                      } @else {
                        {{ labelFor(option) }}
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <ng-content select="[slDateTimePickerFooter]" />
        </div>
      </div>
    }`,
  styleUrl: '../../../styles/src/datetime-picker/datetime-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlDateTimePicker), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDateTimePicker), multi: true },
  ],
  host: {
    'data-ui': 'datetime-picker',
    'data-ui-datetime-picker': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-granularity]': 'resolvedGranularity()',
    '[attr.data-open]': "isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlDateTimePicker implements AfterViewInit, ControlValueAccessor, Validator, OnInit {
  readonly value = input<PlainDateTime | null | undefined>(undefined);
  readonly defaultValue = input<PlainDateTime | null | undefined>(undefined);
  /** Present means the consumer owns whether the surface is showing. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  /** Where the reader is in the panel. Present means the consumer owns it. */
  readonly highlighted = input<DateTimePickerHighlight | undefined>(undefined);
  readonly defaultHighlighted = input<DateTimePickerHighlight | undefined>(undefined);

  readonly min = input<PlainDateTime | undefined>(undefined);
  readonly max = input<PlainDateTime | undefined>(undefined);
  /** The earliest time of every day inside the range, beside `min`. */
  readonly minTime = input<PlainTime | undefined>(undefined);
  /** The latest time of every day inside the range, beside `max`. */
  readonly maxTime = input<PlainTime | undefined>(undefined);
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);
  readonly isTimeUnavailable = input<((time: PlainTime, date: PlainDate) => boolean) | undefined>(
    undefined,
  );

  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /**
   * The times to offer, stated rather than stepped. A step describes a regular
   * list and a great many real ones are not.
   */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);
  readonly maxOptions = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly unavailableOptions = input<DateTimePickerUnavailableOptions | undefined>(undefined);

  /** BCP 47. Writes the field, the grid, the list and the trigger's moment. Unset, the language in force decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly hourCycle = input<DateTimePickerHourCycle | undefined>(undefined);
  readonly granularity = input<TimeGranularity | undefined>(undefined);
  readonly calendar = input<'gregory' | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined>(undefined);
  readonly months = input<number | undefined>(undefined);
  readonly weekNumbers = input<boolean | undefined>(undefined);
  readonly referenceDateTime = input<PlainDateTime | undefined>(undefined);

  readonly size = input<DateTimePickerSize | undefined>(undefined);
  readonly variant = input<DateTimePickerVariant | undefined>(undefined);
  readonly placement = input<DateTimePickerPlacement | undefined>(undefined);
  readonly openTo = input<DateTimePickerOpenTo | undefined>(undefined);
  readonly closeOnSelect = input<DateTimePickerCloseOnSelect | undefined>(undefined);

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

  readonly clearable = input(false, { transform: booleanAttribute });
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly name = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, the `now` button, what an empty day says and what a
   * cut list says.
   */
  readonly messages = input<PartialMessages<DatetimePickerMessages> | undefined>(undefined);

  readonly valueChange = output<DateTimeFieldChangeRequest | ChangeRequest<PlainDateTime | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();
  readonly highlightedChange = output<ChangeRequest<DateTimePickerHighlight>>();

  @ContentChild(SlDateTimePickerOption, { read: TemplateRef })
  protected optionTemplate?: TemplateRef<unknown>;

  @ViewChild('layer') protected layer?: ElementRef<HTMLElement>;
  @ViewChild('trigger') protected triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('rows') protected listRef?: ElementRef<HTMLElement>;
  @ViewChild('datePanel') protected datePanelRef?: ElementRef<HTMLElement>;
  @ViewChild('field') protected field?: SlDateTimeField;
  @ViewChild('calendar') protected calendarRef?: SlCalendar;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectDateTimePickerDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  readonly t = injectMessages(datetimePickerMessages, this.messages);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enclosing = inject(SlField, { optional: true });

  protected readonly contentId = `sl-datetime-picker-${String((sequence += 1))}`;

  private readonly ownOpen = signal(false);
  private readonly ownValue = signal<PlainDateTime | null>(null);
  /**
   * The half pressed in the panel while the other half is missing. The value
   * stays `null` until the second press writes both, so the half lives here and
   * is forgotten when the panel closes.
   */
  private readonly pendingDate = signal<PlainDate | null>(null);
  private readonly pendingTime = signal<PlainTime | null>(null);
  private readonly ownHighlight = signal<DateTimePickerHighlight>({
    date: { year: 2000, month: 1, day: 1 },
    time: null,
  });
  private readonly clock = signal<PlainDateTime>({
    date: { year: 2000, month: 1, day: 1 },
    time: { hour: 12, minute: 0, second: 0 },
  });
  protected readonly view = signal<CalendarView>('day');
  protected readonly sheet = signal(false);
  private readonly formDisabled = signal<boolean | undefined>(undefined);

  private onChangeFn: (value: PlainDateTime | null) => void = () => undefined;
  /** Whether a form model holds the value, and answers a reset through `writeValue`. */
  private formBound = false;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  /**
   * Whether the next opening moves focus into the panel. Set by a request to
   * open from the trigger or from `openSurface()`, and never by Alt+ArrowDown,
   * which leaves focus in the field, or by a first render that starts open,
   * which would take focus from wherever the page put it.
   */
  private focusOnOpen = false;

  /**
   * Whether the reader has moved the highlight themselves. Until they have, the
   * day the panel is on follows the value and then the reference.
   */
  private movedByReader = false;

  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;
  private releaseGrip: (() => void) | null = null;
  private typeahead: TypeaheadHandle | null = null;

  protected readonly isOpen = computed(() => this.open() ?? this.ownOpen());
  protected readonly held = computed(() => this.value() ?? this.ownValue());
  protected readonly highlight = computed(() => this.highlighted() ?? this.ownHighlight());

  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  protected readonly resolvedTimeZone = computed(() => this.timeZone() ?? this.defaults.timeZone);
  protected readonly resolvedHourCycle = computed(
    () => this.hourCycle() ?? this.defaults.hourCycle,
  );
  protected readonly resolvedGranularity = computed(
    () => this.granularity() ?? this.defaults.granularity,
  );
  protected readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.enclosing?.resolvedSize() ?? this.defaults.size,
  );
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedPlacement = computed(
    () => this.placement() ?? this.defaults.placement,
  );
  protected readonly resolvedOpenTo = computed(() => this.openTo() ?? this.defaults.openTo);
  protected readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.enclosing?.resolvedDisabled(),
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

  private readonly format = computed(() => {
    const firstDayOfWeek = this.firstDayOfWeek();
    return createDateTimeFormat({
      granularity: this.resolvedGranularity(),
      hourCycle: this.resolvedHourCycle(),
      locale: this.resolvedLocale(),
      ...(firstDayOfWeek === undefined ? {} : { firstDayOfWeek }),
    });
  });

  private readonly anchor = computed(() => this.referenceDateTime() ?? this.clock());
  private readonly bounds = computed(() => ({
    max: this.max(),
    maxTime: this.maxTime(),
    min: this.min(),
    minTime: this.minTime(),
  }));

  protected readonly dateMin = computed(() => dateBoundsOf(this.bounds()).min);
  protected readonly dateMax = computed(() => dateBoundsOf(this.bounds()).max);
  protected readonly dateValue = computed<CalendarValue>(
    () => this.held()?.date ?? this.pendingDate(),
  );

  /**
   * Validity the family owns, beside the validity the consumer states: both
   * pairs of bounds, and both predicates.
   */
  protected readonly resolvedInvalid = computed(() => {
    const value = this.held();
    if (value !== null) {
      if (!isDateTimeInRange(value, this.min(), this.max())) return true;
      const window = dayWindow(value.date, this.bounds());
      if (window === null || !isTimeInRange(value.time, window.earliest, window.latest)) {
        return true;
      }
      if (this.isDateUnavailable()?.(value.date) === true) return true;
      if (this.isTimeUnavailable()?.(value.time, value.date) === true) return true;
    }
    return this.invalid() ?? this.enclosing?.invalid();
  });

  /**
   * The day the list answers: the date half of the value when there is one, and
   * the day the calendar has focused when there is not — so a reader moving
   * through the month sees the times of the day under their cursor.
   */
  private readonly listDate = computed(
    () => this.held()?.date ?? this.pendingDate() ?? this.highlight().date,
  );

  private readonly window = computed(() => dayWindow(this.listDate(), this.bounds()));

  private readonly listOptions = computed(() => {
    const predicate = this.isTimeUnavailable();
    const date = this.listDate();
    const window = this.window();
    return {
      isTimeUnavailable:
        predicate === undefined ? undefined : (time: PlainTime) => predicate(time, date),
      max: window?.latest,
      maxOptions: this.maxOptions() ?? this.defaults.maxOptions,
      min: window?.earliest,
      options: this.options(),
      step: this.step() ?? this.defaults.step,
    };
  });

  protected readonly list = computed<TimeOption[]>(() => {
    if (this.window() === null) return [];
    if (this.isDateUnavailable()?.(this.listDate()) === true) return [];
    const built = timeList(this.listOptions());
    const hidden = (this.unavailableOptions() ?? this.defaults.unavailableOptions) === 'hide';
    return hidden ? built.filter((option) => !option.unavailable) : built;
  });

  protected readonly truncated = computed(() => isTruncated(this.listOptions()));

  private readonly labels = computed(() =>
    this.list().map((option) => this.format().time.format(option.time)),
  );

  protected readonly highlightIndex = computed(() => {
    const at = this.highlight().time;
    if (at === null) return -1;
    return this.list().findIndex((option) => isSameTime(option.time, at));
  });

  /** The list's own accessible name: the day its times belong to. */
  protected readonly listLabel = computed(() =>
    this.format().describeDate(this.listDate(), 'short'),
  );

  /* ── What the head says ──────────────────────────────────────────────── */

  protected readonly headValue = computed(() => {
    const value = this.held();
    return value === null ? '' : this.format().describe(value);
  });
  protected readonly headDate = computed(() =>
    this.format().describeDate(this.pendingDate() ?? this.highlight().date),
  );
  protected readonly headTime = computed(() => {
    const time = this.pendingTime();
    return time === null ? null : this.format().time.format(time);
  });
  protected readonly headPlaceholder = computed(() => {
    const granularity = this.resolvedGranularity();
    if (granularity === 'hour') return '--';
    return granularity === 'second' ? '--:--:--' : '--:--';
  });

  /**
   * The trigger's accessible name. Focus returns here when the panel closes, so
   * this is where the reader is told what was chosen.
   */
  protected readonly triggerLabel = computed(() => {
    const chosen = this.held();
    if (chosen === null) return this.t('choose');
    return this.t('change', { date: this.format().describe(chosen) });
  });

  constructor() {
    /* The layer is created and torn down with the surface, not with the
       component: a layer that outlived its content would hold a place in the
       single stack that nothing occupies. */
    effect(() => {
      if (!this.isOpen()) {
        this.release();
        /* A half pressed and never completed does not outlive the panel. */
        untracked(() => {
          this.pendingDate.set(null);
          this.pendingTime.set(null);
        });
        return;
      }
      afterNextRender(() => this.attach(), { injector: this.injector });
    });

    /* The day the panel is on, before the reader has said otherwise. */
    effect(() => {
      const date = this.held()?.date ?? this.anchor().date;
      untracked(() => {
        if (this.movedByReader || this.highlighted() !== undefined) return;
        if (isSameDate(date, this.highlight().date)) return;
        this.setHighlight({ date, time: this.highlight().time }, 'programmatic', undefined);
      });
    });

    /**
     * The highlight's **time** lands where the list opens. The date half is the
     * effect above's: one of the two has to own it, or the two write over each
     * other in the same change detection and the panel opens on whichever ran
     * last.
     */
    effect(() => {
      if (!this.isOpen()) return;
      const list = this.list();
      untracked(() => {
        const index = this.openingIndex();
        const option = list[index];
        if (index < 0 || option === undefined) return;
        if (isSameTime(option.time, this.highlight().time)) return;
        this.setHighlight(
          { date: this.highlight().date, time: option.time },
          'programmatic',
          undefined,
        );
      });
    });

    /**
     * The row the highlight is on is brought into view: a panel that opens on a
     * chosen time opens *at* it rather than at midnight, and a highlight moved
     * by a key lands whole rather than half under the edge.
     *
     * The reveal runs after the next render and again whenever the list is
     * resized. The list's height is the panel's, the panel's is the layer's,
     * and the layer has not been measured on the frame it mounts, so the first
     * call is made against a box with nothing to scroll and moves nothing — a
     * panel opened on 15:30 showed 00:00 to 03:30 and asked the reader to
     * scroll six hours to their own time. A reader's own scrolling resizes
     * nothing, so this never fights them.
     */
    effect(() => {
      const open = this.isOpen();
      const index = this.highlightIndex();
      if (!open || index < 0) {
        this.listResize?.disconnect();
        this.listResize = null;
        return;
      }
      untracked(() => this.revealHighlight());
    });

    /* A bound that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.min();
      this.max();
      this.minTime();
      this.maxTime();
      this.isDateUnavailable();
      this.isTimeUnavailable();
      this.onValidatorChangeFn();
    });

    this.destroyRef.onDestroy(() => this.release());
    this.destroyRef.onDestroy(() => this.listResize?.disconnect());
  }

  /* ── Forms ───────────────────────────────────────────────────────────── */

  writeValue(value: PlainDateTime | null | undefined) {
    this.ownValue.set(value ?? null);
  }

  registerOnChange(fn: (value: PlainDateTime | null) => void) {
    this.onChangeFn = fn;
    this.formBound = true;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  registerOnValidatorChange(fn: () => void) {
    this.onValidatorChangeFn = fn;
  }

  /**
   * The rules no other validator can see, under the names `datetime-field`
   * reports them with, because the field holds the bounds, the predicates and
   * the half the reader has not written. `required` is left to Angular's own.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    return this.field?.validate(control) ?? null;
  }

  /**
   * A day typed without a time leaves the value `null`, so the picker's own
   * value never moves; the field's validity does. The field says so on every
   * edit, and the form is told.
   */
  ngAfterViewInit() {
    this.field?.registerOnValidatorChange(() => this.onValidatorChangeFn());
  }

  ngOnInit() {
    this.ownOpen.set(this.defaultOpen());
    this.ownValue.set(this.defaultValue() ?? null);
    const start =
      this.defaultHighlighted() ??
      ({
        date: (this.defaultValue() ?? this.referenceDateTime() ?? this.clock()).date,
        time: null,
      } satisfies DateTimePickerHighlight);
    this.ownHighlight.set(start);
    this.clock.set(nowDateTimeIn(this.resolvedTimeZone()));
    this.typeahead = createTypeahead({ locale: () => this.resolvedLocale() });
    this.destroyRef.onDestroy(() => this.typeahead?.destroy());

    /* A native reset restores the hidden input and tells nothing, so the
       picker would keep the last moment chosen in a form that had been reset.
       The value returns to `defaultValue` through `valueChange`, reason
       `programmatic`, and a half pressed in the panel without the other is
       dropped with it. A picker bound to a form model takes the model's reset
       value through `writeValue` instead. */
    const form = this.element.closest('form');
    if (form !== null) {
      const onReset = (event: Event) => {
        if (this.formBound) return;
        this.pendingDate.set(null);
        this.pendingTime.set(null);
        this.commit(this.defaultValue() ?? null, 'programmatic', event);
      };
      form.addEventListener('reset', onReset);
      this.destroyRef.onDestroy(() => form.removeEventListener('reset', onReset));
    }

    /* `matchMedia` is absent in a server render and in some test environments,
       and the popover is the right answer wherever it cannot be asked. */
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(SHEET_QUERY);
    const read = () => this.sheet.set(query.matches);
    read();
    query.addEventListener('change', read);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', read));
  }

  /** Puts focus on the first segment of the field. */
  focus() {
    this.field?.focus();
  }

  openSurface(source?: Event) {
    this.setOpen(true, 'keyboard', source);
  }

  closeSurface(source?: Event) {
    this.setOpen(false, 'keyboard', source);
  }

  /* ── What the template reads ─────────────────────────────────────────── */

  protected labelFor(option: TimeOption): string {
    return this.format().time.format(option.time);
  }

  protected isSelected(option: TimeOption): boolean {
    const value = this.held();
    if (value === null) return isSameTime(option.time, this.pendingTime());
    return isSameDate(value.date, this.listDate()) && isSameTime(option.time, value.time);
  }

  protected contextFor(option: TimeOption, index: number) {
    return {
      $implicit: option.time,
      current: index === this.highlightIndex(),
      date: this.listDate(),
      label: this.labels()[index] ?? '',
      selected: this.isSelected(option),
      unavailable: option.unavailable,
    };
  }

  /* ── Focus follows the missing half ──────────────────────────────────── */

  protected toggle(source: Event) {
    this.setOpen(!this.isOpen(), 'pointer', source);
  }

  /** Tab and Shift+Tab wrap inside the panel while it is open. */
  protected onContentKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const content = event.currentTarget as HTMLElement;
    const items = tabbables(content);
    const first = items[0];
    const last = items[items.length - 1];
    if (first === undefined || last === undefined) return;
    const current = content.ownerDocument.activeElement;
    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  protected onControlFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.element.contains(next)) return;
    this.onTouchedFn();
  }

  protected chooseNow(source: Event) {
    const wasWhole = this.held() !== null;
    /* The clock, read at the press: `referenceDateTime` says where an empty
       field starts, not what time it is. */
    const now = nowDateTimeIn(this.resolvedTimeZone());
    this.pendingDate.set(null);
    this.pendingTime.set(null);
    this.commit(now, 'select', source);
    this.setHighlight({ date: now.date, time: now.time }, 'pointer', source);
    this.afterPress(now, wasWhole, 'time', source);
  }

  protected onCalendarValue(request: ChangeRequest<CalendarValue>) {
    if (!this.editable()) return;
    const next = request.value;
    /* `single` is the only mode this panel asks for, so a range or a set is a
       shape the calendar cannot hand back here — and narrowing it is what keeps
       `selectDate` taking one day. */
    const candidate = Array.isArray(next) ? next[0] : next;
    if (candidate === null || candidate === undefined) return;
    if (!('year' in candidate)) return;
    this.selectDate(candidate, request.source as Event | undefined);
  }

  protected onFocusedDate(request: ChangeRequest<PlainDate>) {
    this.setHighlight(
      { date: request.value, time: this.highlight().time },
      request.reason === 'pointer' ? 'pointer' : 'keyboard',
      request.source,
    );
  }

  /**
   * A day pressed in the calendar. The time half is the one the value holds,
   * or the one pressed in the list. With neither, the day waits for a time:
   * focus moves to the list, onto the option nearest `referenceDateTime`, and
   * the value does not move.
   */
  private selectDate(date: PlainDate, source: Event | undefined) {
    const wasWhole = this.held() !== null;
    const time = this.held()?.time ?? this.pendingTime();
    if (time === null) {
      this.pendingDate.set(date);
      this.setHighlight({ date, time: null }, 'pointer', source);
      this.enterSurface('time');
      return;
    }
    const next: PlainDateTime = { date, time };
    this.pendingDate.set(null);
    this.pendingTime.set(null);
    this.commit(next, 'select', source);
    this.setHighlight({ date, time: this.highlight().time }, 'pointer', source);
    this.afterPress(next, wasWhole, 'date', source);
  }

  /**
   * A time pressed in the list. The date half is the one the value holds, or
   * the day pressed in the calendar; with neither, the time waits for a day and
   * focus moves to the calendar.
   */
  protected selectTime(option: TimeOption, source: Event) {
    if (option.unavailable || !this.editable()) return;
    const wasWhole = this.held() !== null;
    const date = this.held()?.date ?? this.pendingDate();
    this.setHighlight({ date: this.listDate(), time: option.time }, 'pointer', source);
    if (date === null) {
      this.pendingTime.set(option.time);
      this.enterSurface('date');
      return;
    }
    const next: PlainDateTime = { date, time: option.time };
    this.pendingDate.set(null);
    this.pendingTime.set(null);
    this.commit(next, 'select', source);
    this.afterPress(next, wasWhole, 'time', source);
  }

  /**
   * The rule, in one place: a press that leaves the value incomplete carries
   * focus to the half that is missing; a press that completes it closes the
   * panel; and a press on a value that was already whole changes one half and
   * leaves the panel where it is.
   */
  private afterPress(
    next: PlainDateTime | null,
    wasWhole: boolean,
    wrote: 'date' | 'time',
    source: Event | undefined,
  ) {
    const closeOnSelect = this.closeOnSelect() ?? this.defaults.closeOnSelect;
    const nowWhole = next !== null;

    if (nowWhole && !wasWhole && closeOnSelect !== 'never') {
      this.close(source);
      return;
    }
    if (nowWhole && wasWhole && closeOnSelect === 'always') {
      this.close(source);
      return;
    }
    if (!nowWhole) this.enterSurface(wrote === 'date' ? 'time' : 'date');
  }

  private close(source: Event | undefined) {
    this.setOpen(false, 'select', source);
    this.triggerRef?.nativeElement.focus({ preventScroll: true });
  }

  private enterSurface(surface: 'date' | 'time') {
    afterNextRender(() => this.enterSurfaceNow(surface), { injector: this.injector });
  }

  /** Focus into one surface, on a panel that is already rendered. */
  private enterSurfaceNow(surface: 'date' | 'time') {
    if (surface === 'time') {
      this.enterList();
      return;
    }
    const day = this.datePanelRef?.nativeElement.querySelector<HTMLElement>(
      '[data-part="day"][tabindex="0"]',
    );
    day?.focus({ preventScroll: true });
  }

  /**
   * Where the list opens: on the chosen time, on the nearest step to the
   * reference when nothing is chosen, and on the first available option when
   * that is refused.
   */
  private openingIndex(): number {
    const list = this.list();
    if (list.length === 0) return -1;
    const near = nearestIndex(list, this.held()?.time ?? this.anchor().time);
    if (near >= 0 && list[near]?.unavailable !== true) return near;
    const first = list.findIndex((option) => !option.unavailable);
    return first >= 0 ? first : 0;
  }

  private enterList() {
    const index = this.highlightIndex() >= 0 ? this.highlightIndex() : this.openingIndex();
    if (index < 0) return;
    const option = this.list()[index];
    if (option !== undefined) {
      this.setHighlight({ date: this.listDate(), time: option.time }, 'keyboard', undefined);
    }
    this.focusOption(index);
  }

  /** Watches the list's own box, which is what "the layer has been measured" looks like from inside it. */
  private listResize: ResizeObserver | null = null;

  private revealHighlight() {
    afterNextRender(
      () => {
        const list = this.listRef?.nativeElement;
        if (list === undefined) return;
        const reveal = () => {
          const row = list.querySelector<HTMLElement>('[data-part="option"][data-current]');
          /* jsdom implements neither `scrollIntoView` nor `ResizeObserver`, and
             a test environment without a scroller is not a reason for the
             family to throw where a browser would scroll. */
          row?.scrollIntoView?.({ block: 'nearest' });
        };
        reveal();
        if (typeof ResizeObserver !== 'function') return;
        this.listResize?.disconnect();
        this.listResize = new ResizeObserver(reveal);
        this.listResize.observe(list);
      },
      { injector: this.injector },
    );
  }

  private focusOption(index: number) {
    const rows = this.listRef?.nativeElement.querySelectorAll<HTMLElement>('[data-part="option"]');
    const row = rows?.[index];
    row?.focus();
    /* jsdom does not implement `scrollIntoView`, and a test environment without
       a scroller is not a reason for the family to throw. */
    row?.scrollIntoView?.({ block: 'nearest' });
  }

  /* ── The keyboard ────────────────────────────────────────────────────── */

  protected onControlKeyDown(event: KeyboardEvent) {
    if (!this.editable()) return;
    /* ChromeOS turns the chord into `PageDown` before the browser sees it,
       which Angular Material records for its own input — so the trigger button
       is always drawn and this is only a shortcut. Focus stays in the field. */
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.setOpen(true, 'keyboard', event, false);
    }
  }

  protected onTriggerKeyDown(event: KeyboardEvent) {
    if (!this.editable()) return;
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (this.isOpen()) this.enterSurface(this.resolvedOpenTo());
    else this.setOpen(true, 'keyboard', event);
  }

  protected onListKeyDown(event: KeyboardEvent) {
    const list = this.list();
    const at = this.highlightIndex() >= 0 ? this.highlightIndex() : 0;

    const move = (index: number) => {
      event.preventDefault();
      const clamped = Math.max(0, Math.min(list.length - 1, index));
      const option = list[clamped];
      if (option === undefined) return;
      this.setHighlight({ date: this.listDate(), time: option.time }, 'keyboard', event);
      this.focusOption(clamped);
    };

    switch (event.key) {
      case 'ArrowDown':
        move(at + 1);
        return;
      case 'ArrowUp':
        move(at - 1);
        return;
      case 'Home':
        move(0);
        return;
      case 'End':
        move(list.length - 1);
        return;
      case 'PageDown':
        move(hourJump(list, at, 1));
        return;
      case 'PageUp':
        move(hourJump(list, at, -1));
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = list[at];
        if (option !== undefined) this.selectTime(option, event);
        return;
      }
      default:
        break;
    }

    /* Type-ahead, which the pattern recommends above seven options and this
       list passes at every step it offers. */
    const typeahead = this.typeahead;
    if (typeahead === null) return;
    if (!isPrintable(event.key, typeahead.query.length > 0)) return;
    const found = typeahead.match(event.key, this.labels(), at);
    if (found < 0) return;
    move(found);
  }

  /* ── The machinery ───────────────────────────────────────────────────── */

  protected onFieldValue(request: DateTimeFieldChangeRequest) {
    this.commit(request.value, request.reason, request.source, request);
  }

  private commit(
    next: PlainDateTime | null,
    reason: ChangeReason,
    source: unknown,
    carried?: DateTimeFieldChangeRequest,
  ) {
    let cancelled = false;
    const state = createControllable<PlainDateTime | null>({
      controlled: this.value(),
      initial: this.held(),
      equals: isSameDateTime,
      onRequest: (request) => {
        this.valueChange.emit(
          carried === undefined
            ? request
            : { ...request, incomplete: carried.incomplete, segments: carried.segments },
        );
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled || !moved) return;
    if (this.value() === undefined) this.ownValue.set(next);
    this.onChangeFn(next);
  }

  private setHighlight(next: DateTimePickerHighlight, reason: ChangeReason, source: unknown) {
    if (reason !== 'programmatic') this.movedByReader = true;
    const state = createControllable<DateTimePickerHighlight>({
      controlled: this.highlighted(),
      initial: this.highlight(),
      equals: (a, b) => isSameDate(a.date, b.date) && isSameTime(a.time, b.time),
      onRequest: (request) => this.highlightedChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownHighlight.set(next);
  }

  private setOpen(next: boolean, reason: OpenReason, source: unknown, enter = true) {
    const state = createControllable<boolean>({
      controlled: this.open(),
      initial: this.isOpen(),
      onRequest: (request) => {
        this.openChange.emit(request);
        this.focusOnOpen = enter && request.value && !request.cancelled;
      },
    });
    if (state.request(next, reason, source)) this.ownOpen.set(next);
  }

  /** Places the layer and puts it in the single stack. */
  private attach() {
    const layer = this.layer?.nativeElement;
    if (layer === undefined) return;
    this.release();

    /* A pull down on the sheet's grip dismisses it, as the grip of every other sheet does. */
    const grip = this.sheet()
      ? layer.querySelector<HTMLElement>(':scope > [data-part="content"] > [data-part="grip"]')
      : null;
    if (grip !== null) {
      this.releaseGrip = attachGripDismiss({
        grip,
        sheet: layer,
        onDismiss: (event) => {
          this.setOpen(false, 'pointer', event);
        },
      });
    }

    if (!this.sheet()) {
      const anchor =
        this.element.querySelector<HTMLElement>('[data-part="control"]') ?? this.element;
      const [side, align] = this.resolvedPlacement().split('-') as [
        'top' | 'bottom',
        'start' | 'end' | undefined,
      ];
      this.positioner = createPositioner(anchor, layer, { align: align ?? 'center', side });
      /* The positioner writes `data-positioned` with the side, on the element, in
         the task that opened the layer; a binding to say it again was a frame later. */
      void this.positioner.update();
    }

    /* The dialog takes focus when it opens, in the surface `openTo` names. */
    if (this.focusOnOpen) {
      this.focusOnOpen = false;
      this.enterSurfaceNow(this.resolvedOpenTo());
    }

    const trigger = this.triggerRef?.nativeElement;
    this.dismissable = createDismissableLayer(layer, {
      branches: trigger === undefined ? [] : [trigger],
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      /**
       * `Escape` is staged, and here it has three steps rather than two. The
       * field takes the key first while an expression is open — its own handler
       * stops it before this ever runs — then the calendar's view walks down
       * from year or month, and only then does the panel close.
       */
      onDismiss: (request) => {
        if (request.reason === 'escape' && this.view() !== 'day') {
          this.view.set(this.view() === 'year' ? 'month' : 'day');
          return;
        }
        this.setOpen(
          false,
          request.reason === 'escape' ? 'escape' : 'outsidePress',
          request.source,
        );
        if (request.reason === 'escape') {
          this.triggerRef?.nativeElement.focus({ preventScroll: true });
        }
      },
    });
  }

  private release() {
    this.releaseGrip?.();
    this.releaseGrip = null;
    this.positioner?.destroy();
    this.positioner = null;
    this.dismissable?.destroy();
    this.dismissable = null;
    this.layer?.nativeElement.removeAttribute('data-positioned');
  }
}
