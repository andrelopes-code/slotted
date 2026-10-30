import {
  createDateFormat,
  firstDayOf,
  isDateInRange,
  isPlainDate,
  isPlainYearMonth,
  lastDayOf,
  yearMonthOf,
} from '@slotted/core/date';
import type { PlainDate, PlainYearMonth } from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { tabbables } from '@slotted/core/focus';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
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
  ViewChild,
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
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  datePickerMessages,
  type DatePickerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { SlCalendar, asDates } from '@slotted/angular/calendar';
import type { CalendarSelectionMode, CalendarValue, CalendarView } from '@slotted/angular/calendar';
import { SlDateField, SlDateFieldEnd } from '@slotted/angular/date-field';
import { SlField } from '@slotted/angular/field';

import { injectDatePickerDefaults } from './date-picker-defaults';
import type {
  DatePickerCalendar,
  DatePickerCloseOnSelect,
  DatePickerPlacement,
  DatePickerSize,
  DatePickerVariant,
} from './date-picker-defaults';

/** The reasons the contract's `stateModel.open` lists, and no other. */
type OpenReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select'
>;

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * §2.7 of `docs/component-features.md` asks for it by name. The query is here
 * as well as in the stylesheet because the DOM has to say which presentation it
 * is in, and a media query cannot write an attribute.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';
/** The surface needs an identifier the trigger can point `aria-controls` at. */
let sequence = 0;

/**
 * A date field, a trigger, and a calendar behind them.
 *
 * **It composes the other two families and redraws neither.** The field keeps
 * its own `data-ui` and the calendar keeps its own; this family owns the box the
 * positioner measures, the trigger inside the field's end slot, and the layer
 * the calendar stands on.
 *
 * **The trigger's name carries the chosen date.** Focus returns to it when the
 * surface closes, so the name is where the reader is told what was chosen —
 * which the APG's own example names as an accessibility feature.
 *
 * **`Escape` is staged.** `dismissable-layer` asks in the capture phase, so a
 * handler inside the surface is too late; the family decides there instead, and
 * walks the calendar's view down rather than closing while a month or year grid
 * is showing.
 */
@Component({
  selector: '[slDatePicker]',
  standalone: true,
  exportAs: 'slDatePicker',
  imports: [SlCalendar, SlDateField, SlDateFieldEnd, SlGlyph, SlIcon],
  template: `<div data-part="control" data-part-control="" (keydown)="onControlKeyDown($event)">
      <div
        slDateField
        #field="slDateField"
        [locale]="resolvedLocale()"
        [timeZone]="resolvedTimeZone()"
        [firstDayOfWeek]="firstDayOfWeek()"
        [yearPivot]="yearPivot()"
        [calendar]="resolvedCalendar()"
        [size]="resolvedSize()"
        [variant]="resolvedVariant()"
        [min]="minDay()"
        [max]="maxDay()"
        [granularity]="granularity()"
        [isDateUnavailable]="isDateUnavailable()"
        [clearable]="clearable()"
        [name]="name()"
        [disabled]="resolvedDisabled()"
        [readOnly]="readOnly()"
        [invalid]="invalid()"
        [required]="required()"
        [value]="singleValue()"
        (valueChange)="onFieldValue($event)"
        (focusout)="onControlFocusOut($event)"
      >
        <span slDateFieldEnd>
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
          >
            <span slIcon><svg slGlyph name="calendar"></svg></span>
          </button>
        </span>
      </div>
    </div>

    @if (isOpen()) {
      <div
        #layer
        data-ui="date-picker"
        data-ui-date-picker=""
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
          (keydown)="onContentKeyDown($event)"
        >
          @if (sheet()) {
            <span aria-hidden="true" data-part="grip" data-part-grip=""></span>
          }
          <ng-content select="[slDatePickerPresets]" />
          <div
            slCalendar
            [locale]="resolvedLocale()"
            [timeZone]="resolvedTimeZone()"
            [firstDayOfWeek]="firstDayOfWeek()"
            [min]="minDay()"
            [max]="maxDay()"
            [granularity]="granularity()"
            [isDateUnavailable]="isDateUnavailable()"
            [selectionMode]="selectionMode()"
            [months]="months()"
            [weekNumbers]="weekNumbers()"
            [fixedWeeks]="fixedWeeks()"
            [readOnly]="readOnly()"
            [value]="held()"
            [view]="view()"
            (viewChange)="view.set($event)"
            (valueChange)="onCalendarValue($event)"
          ></div>
          <ng-content select="[slDatePickerFooter]" />
        </div>
      </div>
    }`,
  styleUrl: '../../../styles/src/date-picker/date-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlDatePicker), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlDatePicker), multi: true },
  ],
  host: {
    'data-ui': 'date-picker',
    'data-ui-date-picker': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-calendar]': 'resolvedCalendar()',
    '[attr.data-open]': "isOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "resolvedRequired() === true ? '' : null",
  },
})
export class SlDatePicker<V extends CalendarValue | PlainYearMonth = CalendarValue>
  implements ControlValueAccessor, Validator, OnInit
{
  /**
   * The date, the run or the set; under `granularity="month"`, a
   * `PlainYearMonth`. Present means the consumer owns it. Its type is the
   * type `valueChange` reports.
   */
  readonly value = input<V | undefined>(undefined);
  readonly defaultValue = input<V | undefined>(undefined);
  /**
   * What a choice is. `month` opens the calendar on the months of a year and
   * chooses a month cell; the field shows the month and the year; `value`,
   * `defaultValue`, `min` and `max` are `PlainYearMonth`, `valueChange`
   * reports one, and `name` submits `YYYY-MM`.
   */
  readonly granularity = input<'day' | 'month' | undefined>(undefined);
  /** Present means the consumer owns whether the surface is showing. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  readonly min = input<PlainDate | PlainYearMonth | undefined>(undefined);
  readonly max = input<PlainDate | PlainYearMonth | undefined>(undefined);
  readonly isDateUnavailable = input<((date: PlainDate) => boolean) | undefined>(undefined);

  readonly selectionMode = input<CalendarSelectionMode>('single');
  readonly months = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly defaultView = input<CalendarView | undefined>(undefined);
  readonly weekNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Six rows whatever the month needs, on by default here and off in a bare
   * calendar: a surface that grows a row between one press of "next" and the
   * next moves the target the reader was aiming at.
   */
  readonly fixedWeeks = input(true, { transform: booleanAttribute });

  /** BCP 47. Writes the field, the grid and the trigger's date. Unset, the language in force decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  /** 0 is Sunday. Unset, the locale decides. */
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** How a two-digit typed year resolves in the field. */
  readonly yearPivot = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly calendar = input<DatePickerCalendar | undefined>(undefined);

  readonly size = input<DatePickerSize | undefined>(undefined);
  readonly variant = input<DatePickerVariant | undefined>(undefined);
  readonly placement = input<DatePickerPlacement | undefined>(undefined);
  readonly closeOnSelect = input<DatePickerCloseOnSelect | undefined>(undefined);

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
  readonly name = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's name before (`choose`) and after (`change`) a date is chosen.
   */
  readonly messages = input<PartialMessages<DatePickerMessages> | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<V | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();

  @ViewChild('layer') protected layer?: ElementRef<HTMLElement>;
  @ViewChild('trigger') protected triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('field') protected field?: SlDateField;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectDatePickerDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  readonly t = injectMessages(datePickerMessages, this.messages);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enclosing = inject(SlField, { optional: true });

  protected readonly contentId = `sl-date-picker-${String((sequence += 1))}`;

  private readonly ownOpen = signal(false);
  private readonly ownValue = signal<CalendarValue>(null);
  protected readonly view = signal<CalendarView>('day');
  protected readonly sheet = signal(false);
  private readonly formDisabled = signal<boolean | undefined>(undefined);

  private onChangeFn: (value: V | null) => void = () => undefined;
  /** Whether a form model holds the value, and answers a reset through `writeValue`. */
  private formBound = false;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  /**
   * Whether the next opening moves focus into the calendar. Set by a request
   * to open — the trigger, the chord, `openSurface()` — and never by a first
   * render that starts open, which would take focus from wherever the page put
   * it.
   */
  private focusOnOpen = false;
  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;
  private releaseGrip: (() => void) | null = null;

  protected readonly isOpen = computed(() => this.open() ?? this.ownOpen());
  /**
   * A month is its own value. Under `granularity="month"` the picker holds a
   * `PlainYearMonth`; the field and the calendar below it hold the first day of
   * that month, and the bounds become the first day of `min` and the last day
   * of `max`, so a month the bounds touch is a month the reader may choose.
   */
  protected readonly monthly = computed(() => this.granularity() === 'month');
  protected readonly held = computed(() => {
    const value = this.value();
    return value === undefined ? this.ownValue() : this.toDay(value);
  });
  protected readonly minDay = computed(() => {
    const min = this.min();
    return isPlainYearMonth(min) ? firstDayOf(min) : min;
  });
  protected readonly maxDay = computed(() => {
    const max = this.max();
    return isPlainYearMonth(max) ? lastDayOf(max) : max;
  });

  /** A month as the day the field and the calendar hold for it. */
  private toDay(value: CalendarValue | PlainYearMonth | null | undefined): CalendarValue {
    if (value === undefined || value === null) return null;
    return isPlainYearMonth(value) ? firstDayOf(value) : value;
  }

  /** What leaves the picker: the month under `month`, the value otherwise. */
  private outward(value: CalendarValue): V | null {
    if (!this.monthly()) return value as V | null;
    return (isPlainDate(value) ? yearMonthOf(value) : null) as V | null;
  }

  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  protected readonly resolvedTimeZone = computed(() => this.timeZone() ?? this.defaults.timeZone);
  protected readonly resolvedCalendar = computed(() => this.calendar() ?? this.defaults.calendar);
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.enclosing?.resolvedSize() ?? this.defaults.size,
  );
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedPlacement = computed(
    () => this.placement() ?? this.defaults.placement,
  );
  protected readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.enclosing?.resolvedDisabled(),
  );
  protected readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.enclosing?.resolvedReadOnly(),
  );
  protected readonly resolvedRequired = computed(
    () => this.required() ?? this.enclosing?.required(),
  );

  /**
   * Validity the family owns, beside the validity the consumer states: a date
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because this control is the only thing that knows.
   */
  protected readonly resolvedInvalid = computed(() => {
    const refused = asDates(this.held()).some(
      (date) =>
        !isDateInRange(date, this.minDay(), this.maxDay()) ||
        this.isDateUnavailable()?.(date) === true,
    );
    if (refused) return true;
    return this.invalid() ?? this.enclosing?.invalid();
  });

  protected readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  /**
   * The value the field shows, which is a single date or nothing at all. `null`
   * reaches the field as `null`, so a value emptied from outside — a form
   * reset, a controlled clear — empties the segments too.
   */
  protected readonly singleValue = computed(() => {
    const held = this.held();
    if (held !== null && (Array.isArray(held) || 'start' in held)) return undefined;
    return held;
  });

  /**
   * The trigger's accessible name. Focus returns here when the surface closes,
   * so this is where the reader is told what was chosen.
   */
  protected readonly triggerLabel = computed(() => {
    const chosen = asDates(this.held());
    if (chosen.length === 0) return this.t('choose');
    const format = createDateFormat({ locale: this.resolvedLocale() });
    const words = (date: PlainDate) =>
      this.monthly() ? format.monthYear(date) : format.describe(date);
    return this.t('change', { date: chosen.map(words).join(' – ') });
  });

  private readonly closesOnSelect = computed(() => {
    const axis = this.closeOnSelect() ?? this.defaults.closeOnSelect;
    return axis === 'always' || (axis === 'auto' && this.selectionMode() === 'single');
  });

  constructor() {
    /* The layer is created and torn down with the surface, not with the
       component: a layer that outlived its content would hold a place in the
       single stack that nothing occupies. */
    effect(() => {
      const open = this.isOpen();
      if (!open) {
        this.release();
        return;
      }
      afterNextRender(() => this.attach(), { injector: this.injector });
    });

    /* A bound that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.min();
      this.max();
      this.isDateUnavailable();
      this.onValidatorChangeFn();
    });

    this.destroyRef.onDestroy(() => this.release());
  }

  /* ── Forms ─────────────────────────────────────────────────────────── */

  writeValue(value: CalendarValue | PlainYearMonth | undefined) {
    this.ownValue.set(this.toDay(value));
  }

  registerOnChange(fn: (value: V | null) => void) {
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
   * The rules no other validator can see, under the names `date-field` reports
   * them with. `required` is left to Angular's own.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const dates = asDates(this.toDay(control.value as CalendarValue | PlainYearMonth | undefined));
    const min = this.minDay();
    const max = this.maxDay();
    const outside = dates.find((date) => !isDateInRange(date, min, max));
    if (outside !== undefined) return { slottedDateRange: { min, max, actual: outside } };
    const refused = dates.find((date) => this.isDateUnavailable()?.(date) === true);
    if (refused !== undefined) return { slottedDateUnavailable: { actual: refused } };
    return null;
  }

  ngOnInit() {
    this.ownOpen.set(this.defaultOpen());
    this.ownValue.set(this.toDay(this.defaultValue()));
    this.view.set(this.defaultView() ?? this.lowestView());

    /* A native reset restores the hidden input and tells nothing, so the
       picker would keep the last date chosen in a form that had been reset.
       The value returns to `defaultValue` through `valueChange`, reason
       `programmatic`. A picker bound to a form model takes the model's reset
       value through `writeValue` instead. */
    const form = this.element.closest('form');
    if (form !== null) {
      const onReset = (event: Event) => {
        if (!this.formBound) this.commit(this.toDay(this.defaultValue()), 'programmatic', event);
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

  protected toggle(source: Event) {
    this.setOpen(!this.isOpen(), 'pointer', source);
  }

  protected onControlKeyDown(event: KeyboardEvent) {
    if (!this.editable()) return;
    /* Angular Material records the platform note this inherits: ChromeOS turns
       the chord into PageDown before the browser sees it, which is why the
       trigger button is always drawn and this is only a shortcut. */
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.setOpen(true, 'keyboard', event);
    }
  }

  /** Tab and Shift+Tab wrap inside the surface while it is open. */
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

  protected onFieldValue(request: {
    value: PlainDate | null;
    reason: ChangeReason;
    source?: unknown;
  }) {
    this.commit(request.value, request.reason, request.source);
  }

  protected onCalendarValue(request: ChangeRequest<CalendarValue>) {
    this.commit(request.value, request.reason, request.source);
    if (!this.closesOnSelect()) return;
    this.setOpen(false, 'select', request.source as Event | undefined);
    this.triggerRef?.nativeElement.focus({ preventScroll: true });
  }

  /** The lowest view is where a choice is made: the days, or the months. */
  protected lowestView(): CalendarView {
    return this.monthly() ? 'month' : 'day';
  }

  private commit(next: CalendarValue, reason: ChangeReason, source: unknown) {
    let cancelled = false;
    const state = createControllable<CalendarValue>({
      controlled: this.value() === undefined ? undefined : this.held(),
      initial: this.held(),
      equals: () => false,
      onRequest: (request) => {
        /* The request keeps its own `cancel` and `cancelled`, and carries the
           months instead of the days under `month`. */
        const asked = this.monthly()
          ? (Object.create(request, {
              previous: { enumerable: true, value: this.outward(request.previous) },
              value: { enumerable: true, value: this.outward(request.value) },
            }) as ChangeRequest<V | null>)
          : (request as ChangeRequest<V | null>);
        this.valueChange.emit(asked);
        cancelled = request.cancelled;
      },
    });
    state.request(next, reason, source);
    if (cancelled) return;
    if (this.value() === undefined) this.ownValue.set(next);
    this.onChangeFn(this.outward(next));
  }

  private setOpen(next: boolean, reason: OpenReason, source: unknown) {
    const state = createControllable<boolean>({
      controlled: this.open(),
      initial: this.isOpen(),
      onRequest: (request) => {
        this.openChange.emit(request);
        this.focusOnOpen = request.value && !request.cancelled;
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

    /* The dialog takes focus when it opens, on the day that holds the roving
       tab stop: the chosen date, or today. */
    if (this.focusOnOpen) {
      this.focusOnOpen = false;
      layer
        .querySelector<HTMLElement>(
          '[data-part="day"][tabindex="0"], [data-part="period"][tabindex="0"]',
        )
        ?.focus({ preventScroll: true });
    }

    const trigger = this.triggerRef?.nativeElement;
    this.dismissable = createDismissableLayer(layer, {
      branches: trigger === undefined ? [] : [trigger],
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: (request) => {
        /**
         * The view first, the surface second. The layer listens in the capture
         * phase, so a handler on the calendar would already have lost the
         * surface by the time it ran; the decision is taken here, and the layer
         * is simply not asked to close.
         */
        if (request.reason === 'escape' && this.view() !== this.lowestView()) {
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
