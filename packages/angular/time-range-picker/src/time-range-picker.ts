import {
  compareTime,
  createTimeFormat,
  firstUnavailableIndex,
  hourJump,
  isSameTime,
  isTruncated,
  nearestIndex,
  openingIndex as openingIndexOf,
  nowIn,
  runRefusal,
  secondsOfDay,
  timeList,
  timeRangeProblems,
  timeRangeSeconds,
  toISOTime,
} from '@slotted/core/date';
import type { PlainTime, TimeOption } from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import {
  timeRangePickerMessages,
  type PartialMessages,
  type TimeRangePickerMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChild,
  DestroyRef,
  Directive,
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
import { SlField } from '@slotted/angular/field';
import { SlTimeField } from '@slotted/angular/time-field';
import type { TimeFieldChangeRequest } from '@slotted/angular/time-field';

import { injectTimeRangePickerDefaults } from './time-range-picker-defaults';
import type {
  TimeRange,
  TimeRangePickerCloseOnSelect,
  TimeRangePickerDefaults,
  TimeRangePickerHighlight,
  TimeRangePickerHourCycle,
  TimeRangePickerPlacement,
  TimeRangePickerPosition,
  TimeRangePickerSize,
  TimeRangePickerUnavailableOptions,
  TimeRangePickerVariant,
} from './time-range-picker-defaults';
import { SlTimeRangePickerOption } from './time-range-picker-parts';

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * The query is here as well as in the stylesheet because the DOM has to say
 * which presentation it is in, and a media query cannot write an attribute.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';
/** The surface needs an identifier the trigger can point `aria-controls` at. */
let sequence = 0;

const EMPTY: TimeRange = { start: null, end: null };
const NO_HIGHLIGHT: TimeRangePickerHighlight = { start: null, end: null };

/** The one word for nothing: a value whose both ends are `null` is `null`. */
function normalize(range: TimeRange | null | undefined): TimeRange | null {
  return range === null || range === undefined || (range.start === null && range.end === null)
    ? null
    : range;
}

export function isSameTimeRange(a: TimeRange | null, b: TimeRange | null): boolean {
  if (a === null || b === null) return a === b;
  return isSameTime(a.start, b.start) && isSameTime(a.end, b.end);
}

/**
 * Scrolls the list alone. `scrollIntoView` would scroll every ancestor too,
 * and a page with an open surface must not jump when a list opens on its
 * highlight. Centred when the list opens, and by the least that lands the row
 * whole when a key moves the highlight. jsdom measures nothing, so it is a
 * no-op there rather than a throw.
 */
function revealRow(list: HTMLElement, row: HTMLElement, centre: boolean) {
  const box = list.getBoundingClientRect();
  const cell = row.getBoundingClientRect();
  if (box.height === 0 || cell.height === 0) return;
  const above = cell.top - box.top;
  if (centre) list.scrollTop += above - (box.height - cell.height) / 2;
  else if (above < 0) list.scrollTop += above;
  else if (cell.bottom > box.bottom) list.scrollTop += cell.bottom - box.bottom;
}

function other(position: TimeRangePickerPosition): TimeRangePickerPosition {
  return position === 'start' ? 'end' : 'start';
}

/**
 * A one-line frame — the value in words, a clear and the trigger — and behind
 * it one end at a time: two tabs, the field of the current end, a hint, and
 * the list of that end.
 *
 * **The frame is one line at any width.** Two segmented fields stood in it
 * first and were withdrawn at the visual gate: a segment cannot shrink, and
 * two of them broke the frame into two lines in any form column narrower than
 * they are. The field lives in the panel's band, where the reader types.
 *
 * **One end at a time.** Two lists side by side were refused at the release
 * gate as too much interface at once for a lay reader and for a phone. The
 * tab says which end, the panel shows only that end, and choosing one end
 * moves to the other — the end list appears already striking what the chosen
 * start refuses, every row saying the duration the run would have.
 *
 * **A press that leaves the work with one end is not the value.** The press
 * that completes it emits the whole run; `Escape`, an outside press and the
 * trigger abandon the work. An end typed in the field is a value on its own.
 */
@Component({
  selector: '[slTimeRangePicker]',
  standalone: true,
  exportAs: 'slTimeRangePicker',
  imports: [NgTemplateOutlet, SlGlyph, SlIcon, SlTimeField],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTimeRangePicker), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SlTimeRangePicker), multi: true },
  ],
  template: `<div data-part="control" data-part-control="" (focusout)="onControlFocusOut($event)">
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
        <span
          data-part="summary"
          data-part-summary=""
          [attr.data-placeholder]="summary() === null ? '' : null"
          >{{ summary() ?? t('choose') }}</span
        >
        <span slIcon><svg slGlyph name="clock"></svg></span>
      </button>
      @if (clearable() && held() !== null) {
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
        [attr.name]="startName()"
        [value]="startIso()"
      />
      <input
        data-part="hidden-input"
        data-part-hidden-input=""
        type="hidden"
        [attr.name]="endName()"
        [value]="endIso()"
      />
    </div>

    @if (isOpen()) {
      <div
        #layer
        data-ui="time-range-picker"
        data-ui-time-range-picker=""
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
        >
          @if (sheet()) {
            <span aria-hidden="true" data-part="grip" data-part-grip=""></span>
          }
          <div data-part="head" data-part-head="">
            <div data-part="tabs" data-part-tabs="" role="tablist">
              @for (position of positions; track position) {
                <button
                  data-part="tab"
                  data-part-tab=""
                  role="tab"
                  type="button"
                  [attr.id]="contentId + '-tab-' + position"
                  [attr.data-position]="position"
                  [attr.aria-selected]="currentPosition() === position"
                  [attr.aria-controls]="contentId + '-panel'"
                  [attr.data-current]="currentPosition() === position ? '' : null"
                  [attr.data-placeholder]="work()[position] === null ? '' : null"
                  [tabindex]="currentPosition() === position ? 0 : -1"
                  [disabled]="!editable()"
                  (click)="selectTab(position, $event)"
                  (keydown)="onTabKeyDown($event)"
                >
                  <span data-part="tab-label" data-part-tab-label="">{{ labelFor(position) }}</span>
                  <span data-part="tab-value" data-part-tab-value="">{{ tabValue(position) }}</span>
                </button>
              }
            </div>
            <div
              #fieldBox
              data-part="field"
              data-part-field=""
              [attr.data-position]="currentPosition()"
            >
              <div
                slTimeField
                #field="slTimeField"
                variant="plain"
                size="sm"
                [label]="labelFor(currentPosition())"
                [locale]="resolvedLocale()"
                [timeZone]="resolvedTimeZone()"
                [hourCycle]="resolvedHourCycle()"
                [granularity]="resolvedGranularity()"
                [referenceTime]="referenceTime()"
                [relative]="relative()"
                [min]="currentPosition() === 'end' ? endMin() : min()"
                [max]="currentPosition() === 'start' ? startMax() : max()"
                [isTimeUnavailable]="isTimeUnavailable()"
                [invalid]="currentPosition() === 'end' && workReversed() ? true : undefined"
                [disabled]="resolvedDisabled()"
                [readOnly]="resolvedReadOnly()"
                [required]="resolvedRequired()"
                [value]="work()[currentPosition()]"
                (valueChange)="onFieldValue($event)"
              ></div>
            </div>
            <button
              data-part="now"
              data-part-now=""
              type="button"
              [disabled]="!editable()"
              (click)="chooseNow($event)"
            >
              {{ t('now') }}
            </button>
            <span
              data-part="hint"
              data-part-hint=""
              [attr.id]="contentId + '-hint'"
              [attr.data-invalid]="hintProblem() === undefined ? null : ''"
              >{{ hint() }}</span
            >
            <span
              data-part="length"
              data-part-length=""
              aria-live="polite"
              [attr.data-pending]="pending() === null ? null : ''"
              >{{ spokenLength() }}</span
            >
            @if (limitText() !== null) {
              <span data-part="limit" data-part-limit="">{{ limitText() }}</span>
            }
          </div>
          <ng-content select="[slTimeRangePickerPresets]" />
          @if (currentPosition(); as position) {
            <div
              data-part="panel"
              data-part-panel=""
              [attr.id]="contentId + '-panel'"
              [attr.data-position]="position"
            >
              @if (lists()[position].length === 0) {
                <div data-part="empty" data-part-empty="">{{ t('empty') }}</div>
              } @else {
                <div
                  data-part="list"
                  data-part-list=""
                  role="listbox"
                  [attr.aria-labelledby]="contentId + '-tab-' + position"
                  [attr.aria-describedby]="hint() === '' ? null : contentId + '-hint'"
                  [attr.aria-description]="truncated() ? t('truncated') : null"
                  [attr.data-truncated]="truncated() ? '' : null"
                  (keydown)="onListKeyDown(position, $event)"
                  (focusin)="listFocused.set(true)"
                  (focusout)="onListFocusOut($event)"
                  (pointerleave)="hovered.set(null)"
                >
                  @for (option of lists()[position]; track $index) {
                    <div
                      data-part="option"
                      data-part-option=""
                      role="option"
                      [attr.aria-selected]="isSelected(position, option)"
                      [attr.aria-disabled]="option.unavailable ? 'true' : null"
                      [attr.data-disabled]="option.unavailable ? '' : null"
                      [attr.data-selected]="isSelected(position, option) ? '' : null"
                      [attr.data-current]="$index === highlightIndex(position) ? '' : null"
                      [tabindex]="$index === highlightIndex(position) ? 0 : -1"
                      (click)="select(position, option, $event)"
                      (pointerenter)="hover(position, option)"
                    >
                      @if (optionTemplate) {
                        <ng-container
                          [ngTemplateOutlet]="optionTemplate"
                          [ngTemplateOutletContext]="contextFor(position, option, $index)"
                        />
                      } @else {
                        {{ labels()[position][$index] }}
                        @if (durationOf(position, option); as duration) {
                          <span data-part="option-duration" data-part-option-duration="">{{
                            duration
                          }}</span>
                        }
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
          <div data-part="footer" data-part-footer="">
            <ng-content select="[slTimeRangePickerFooter]" />
            <button data-part="done" data-part-done="" type="button" (click)="done($event)">
              {{ t('done') }}
            </button>
          </div>
        </div>
      </div>
    }`,
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
    '[attr.data-open]': "isOpen() ? '' : null",
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
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Present means the consumer owns which end is being edited. */
  readonly position = input<TimeRangePickerPosition | undefined>(undefined);
  readonly defaultPosition = input<TimeRangePickerPosition>('start');
  /** Where the reader is in each list. Present means the consumer owns it. */
  readonly highlighted = input<TimeRangePickerHighlight | undefined>(undefined);
  readonly defaultHighlighted = input<TimeRangePickerHighlight | undefined>(undefined);

  readonly min = input<PlainTime | undefined>(undefined);
  readonly max = input<PlainTime | undefined>(undefined);
  readonly isTimeUnavailable = input<((time: PlainTime) => boolean) | undefined>(undefined);
  /**
   * Whether a run may cross an unavailable time. On, and with a start chosen,
   * the options beyond the first unavailable one are refused in the end list.
   */
  readonly contiguous = input(true, { transform: booleanAttribute });
  /** The shortest and longest run allowed, in seconds. */
  readonly minLength = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly lengthLabel = input<TimeRangePickerDefaults['lengthLabel'] | undefined>(undefined);

  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** The times to offer, stated rather than stepped; the same list for both ends. */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);
  readonly maxOptions = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly unavailableOptions = input<TimeRangePickerUnavailableOptions | undefined>(undefined);

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
  readonly closeOnSelect = input<TimeRangePickerCloseOnSelect | undefined>(undefined);

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

  /** Draws one clear on the frame, which empties both ends. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Whether the two fields in the band take the relative expression. */
  readonly relative = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's names, the two ends, the hint, the limit, and what a panel says
   * when it is empty or cut short.
   */
  readonly messages = input<PartialMessages<TimeRangePickerMessages> | undefined>(undefined);
  /** The names of the two hidden inputs a plain form post reads. */
  readonly startName = input<string | undefined>(undefined);
  readonly endName = input<string | undefined>(undefined);

  readonly valueChange = output<ChangeRequest<TimeRange | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();
  readonly positionChange = output<ChangeRequest<TimeRangePickerPosition>>();
  readonly highlightedChange = output<ChangeRequest<TimeRangePickerHighlight>>();

  /** What one row draws; a template, because it is re-rendered once per option. */
  @ContentChild(SlTimeRangePickerOption, { read: TemplateRef })
  protected optionTemplate?: TemplateRef<unknown>;
  @ViewChild('layer') protected layer?: ElementRef<HTMLElement>;
  /** Whether the lists were scrolled to their highlight since the surface opened. */
  private revealed = false;
  @ViewChild('trigger') protected triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('field') protected field?: SlTimeField;
  @ViewChild('fieldBox') protected fieldBox?: ElementRef<HTMLElement>;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly defaults = injectTimeRangePickerDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  readonly t = injectMessages(timeRangePickerMessages, this.messages);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enclosing = inject(SlField, { optional: true });

  protected readonly contentId = `sl-time-range-picker-${String((sequence += 1))}`;
  protected readonly positions: readonly TimeRangePickerPosition[] = ['start', 'end'];

  private readonly ownOpen = signal(false);
  private readonly ownValue = signal<TimeRange | null>(null);
  private readonly ownPosition = signal<TimeRangePickerPosition>('start');
  private readonly ownHighlight = signal<TimeRangePickerHighlight>(NO_HIGHLIGHT);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private readonly clock = signal<PlainTime>({ hour: 12, minute: 0, second: 0 });
  protected readonly sheet = signal(false);
  /**
   * The work: the two ends as the reader left them while the panel is open. A
   * press in a list writes it; the value is asked for when it is whole. Closed
   * by anything, it is rebuilt from the value on the next open.
   */
  protected readonly work = signal<TimeRange>(EMPTY);
  /** The option under the pointer, which enters the duration and nothing else. */
  protected readonly hovered = signal<{
    position: TimeRangePickerPosition;
    time: PlainTime;
  } | null>(null);
  /** Whether the list holds focus, so its highlight is the pending end. */
  protected readonly listFocused = signal(false);
  /** Where focus lands once the surface is drawn. */
  private focusOnOpen: 'field' | 'list' | null = null;

  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;
  private releaseGrip: (() => void) | null = null;
  private readonly typeaheads: Record<TimeRangePickerPosition, TypeaheadHandle | null> = {
    start: null,
    end: null,
  };

  private onChangeFn: (value: TimeRange | null) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;
  private onValidatorChangeFn: () => void = () => undefined;

  protected readonly isOpen = computed(() => this.open() ?? this.ownOpen());
  protected readonly held = computed(() => {
    const value = this.value();
    return value === undefined ? this.ownValue() : normalize(value);
  });
  /** The range the picker holds. Public, so a preset can compare itself to it. */
  readonly selection = computed(() => this.held());
  protected readonly currentPosition = computed(() => this.position() ?? this.ownPosition());
  protected readonly highlight = computed(() => this.highlighted() ?? this.ownHighlight());
  protected readonly start = computed(() => this.held()?.start ?? null);
  protected readonly end = computed(() => this.held()?.end ?? null);
  protected readonly startIso = computed(() => {
    const start = this.start();
    return start === null ? '' : toISOTime(start);
  });
  protected readonly endIso = computed(() => {
    const end = this.end();
    return end === null ? '' : toISOTime(end);
  });

  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  protected readonly resolvedTimeZone = computed(() => this.timeZone() ?? this.defaults.timeZone);
  protected readonly resolvedHourCycle = computed(
    () => this.hourCycle() ?? this.defaults.hourCycle,
  );
  protected readonly resolvedGranularity = computed(
    () => this.granularity() ?? this.defaults.granularity,
  );
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
  protected readonly editable = computed(
    () => this.resolvedDisabled() !== true && this.resolvedReadOnly() !== true,
  );

  private readonly format = computed(() =>
    createTimeFormat({
      granularity: this.resolvedGranularity(),
      hourCycle: this.resolvedHourCycle(),
      locale: this.resolvedLocale(),
    }),
  );
  private readonly anchor = computed(() => this.referenceTime() ?? this.clock());
  private readonly lengthOf = computed(() => {
    const label = this.lengthLabel() ?? this.defaults.lengthLabel;
    const locale = this.resolvedLocale();
    return (seconds: number) => label(seconds, locale);
  });

  /**
   * Validity the family owns, beside the validity the consumer states: the
   * bounds, the predicate, the order of the two ends and the duration.
   */
  private readonly problems = computed(() =>
    timeRangeProblems(this.held(), {
      max: this.max(),
      maxLength: this.maxLength(),
      min: this.min(),
      minLength: this.minLength(),
      unavailable: this.isTimeUnavailable(),
    }),
  );
  protected readonly reversed = computed(() => this.problems().includes('order'));
  protected readonly resolvedInvalid = computed(() => {
    if (this.invalid() !== undefined) return this.invalid();
    if (this.problems().length > 0) return true;
    return this.enclosing?.invalid();
  });

  /* Crossed bounds, while the order holds. Reversed, each field keeps the
     outer bounds and the end field alone says the order is wrong. */
  private readonly workOrdered = computed(() => {
    const { start, end } = this.work();
    return start !== null && end !== null && compareTime(start, end) <= 0;
  });
  protected readonly startMax = computed(() => {
    const end = this.work().end;
    const max = this.max();
    if (!this.workOrdered() || end === null) return max;
    return max === undefined || compareTime(end, max) < 0 ? end : max;
  });
  protected readonly endMin = computed(() => {
    const start = this.work().start;
    const min = this.min();
    if (!this.workOrdered() || start === null) return min;
    return min === undefined || compareTime(start, min) > 0 ? start : min;
  });

  /* ── The two lists ─────────────────────────────────────────────────── */

  private readonly listOptions = computed(() => ({
    isTimeUnavailable: this.isTimeUnavailable(),
    max: this.max(),
    maxOptions: this.maxOptions() ?? this.defaults.maxOptions,
    min: this.min(),
    options: this.options(),
    step: this.step() ?? this.defaults.step,
  }));
  private readonly base = computed(() => timeList(this.listOptions()));
  protected readonly truncated = computed(() => isTruncated(this.listOptions()));

  /**
   * The list of one end: the shared list, and what the other end of the work
   * refuses of it — the options on the wrong side of it, those whose duration
   * would fall outside the limits, and with `contiguous` those beyond the
   * first refused option after it. The search runs over the list, never over
   * the seconds.
   */
  protected readonly lists = computed<Record<TimeRangePickerPosition, TimeOption[]>>(() => ({
    start: this.listFor('start'),
    end: this.listFor('end'),
  }));
  protected readonly labels = computed<Record<TimeRangePickerPosition, string[]>>(() => {
    const format = this.format();
    const lists = this.lists();
    return {
      start: lists.start.map((option) => format.format(option.time)),
      end: lists.end.map((option) => format.format(option.time)),
    };
  });

  private listFor(position: TimeRangePickerPosition): TimeOption[] {
    const base = this.base();
    const otherEnd = this.work()[other(position)];
    let refused: (option: TimeOption, index: number) => boolean = () => false;
    if (otherEnd !== null) {
      const direction: 1 | -1 = position === 'end' ? 1 : -1;
      const anchorSeconds = secondsOfDay(otherEnd);
      const anchorIndex = nearestIndex(base, otherEnd);
      const wall = this.contiguous() ? firstUnavailableIndex(base, anchorIndex, direction) : -1;
      const rules = { maxLength: this.maxLength(), minLength: this.minLength() };
      refused = (option, index) =>
        runRefusal(anchorSeconds, secondsOfDay(option.time), direction, rules) ||
        (wall >= 0 && (direction === 1 ? index >= wall : index <= wall));
    }
    const marked = base.map((option, index) =>
      option.unavailable || !refused(option, index) ? option : { ...option, unavailable: true },
    );
    const hide = (this.unavailableOptions() ?? this.defaults.unavailableOptions) === 'hide';
    return hide ? marked.filter((option) => !option.unavailable) : marked;
  }

  protected highlightIndex(position: TimeRangePickerPosition): number {
    const time = this.highlight()[position];
    if (time === null) return -1;
    return this.lists()[position].findIndex((option) => isSameTime(option.time, time));
  }

  protected isSelected(position: TimeRangePickerPosition, option: TimeOption): boolean {
    return isSameTime(option.time, this.work()[position]);
  }

  /** The name of one end: the field's, its tab's and the hint's `{end}`. */
  protected labelFor(position: TimeRangePickerPosition): string {
    return this.t(position);
  }

  /** The end written short in the tab, or a dash. */
  protected tabValue(position: TimeRangePickerPosition): string {
    const time = this.work()[position];
    return time === null ? '—' : this.format().format(time);
  }

  /** The problems of the work as it stands, once it is whole. */
  private readonly workProblems = computed(() => {
    const work = this.work();
    if (work.start === null || work.end === null) return [];
    return timeRangeProblems(work, {
      max: this.max(),
      maxLength: this.maxLength(),
      min: this.min(),
      minLength: this.minLength(),
      unavailable: this.isTimeUnavailable(),
    });
  });
  protected readonly workReversed = computed(() => this.workProblems().includes('order'));
  protected readonly hintProblem = computed(() => this.workProblems()[0]);

  /**
   * What the next press should be, or what is wrong: the difference between a
   * panel that refuses and a panel that explains. Empty while the work is
   * whole and valid, when the length says the duration.
   */
  protected readonly hint = computed(() => {
    const position = this.currentPosition();
    if (this.work()[position] === null)
      return this.t('chooseTime', { end: this.labelFor(position) });
    const problem = this.hintProblem();
    if (problem === undefined) return '';
    return this.t(problem === 'min' || problem === 'max' ? 'bounds' : problem);
  });

  /** The duration a row would make with the other end as it stands, or `null`. */
  protected durationOf(position: TimeRangePickerPosition, option: TimeOption): string | null {
    const otherEnd = this.work()[other(position)];
    if (otherEnd === null || option.unavailable) return null;
    const seconds =
      position === 'end'
        ? timeRangeSeconds(otherEnd, option.time)
        : timeRangeSeconds(option.time, otherEnd);
    return this.lengthOf()(seconds);
  }

  protected contextFor(position: TimeRangePickerPosition, option: TimeOption, index: number) {
    return {
      $implicit: option.time,
      current: index === this.highlightIndex(position),
      duration: this.durationOf(position, option),
      label: this.labels()[position][index] ?? '',
      position,
      selected: this.isSelected(position, option),
      unavailable: option.unavailable,
    };
  }

  /* ── What is said ──────────────────────────────────────────────────── */

  /**
   * The pending end: the option under the pointer, or the highlighted option
   * of the list that has focus.
   */
  protected readonly pending = computed(() => {
    const hovered = this.hovered();
    if (hovered !== null) return hovered;
    if (!this.listFocused()) return null;
    const position = this.currentPosition();
    const time = this.highlight()[position];
    return time === null ? null : { position, time };
  });
  protected readonly spokenLength = computed(() => {
    const pending = this.pending();
    const run: TimeRange =
      pending === null ? this.work() : { ...this.work(), [pending.position]: pending.time };
    if (run.start === null || run.end === null) return '';
    return this.lengthOf()(timeRangeSeconds(run.start, run.end));
  });
  protected readonly limitText = computed(() => {
    const min = this.minLength();
    const max = this.maxLength();
    const length = this.lengthOf();
    if (min !== undefined && max !== undefined) {
      return this.t('limit.between', { min: length(min), max: length(max) });
    }
    if (min !== undefined) return this.t('limit.atLeast', { min: length(min) });
    if (max !== undefined) return this.t('limit.atMost', { max: length(max) });
    return null;
  });

  /** The trigger's accessible name: focus returns here when the surface closes. */
  protected readonly triggerLabel = computed(() => {
    const start = this.start();
    const end = this.end();
    if (start === null || end === null) return this.t('choose');
    const format = this.format();
    const ends = { start: format.describe(start), end: format.describe(end) };
    return compareTime(start, end) <= 0
      ? this.t('change', { ...ends, length: this.lengthOf()(timeRangeSeconds(start, end)) })
      : this.t('changeReversed', ends);
  });
  /** The value in words, one line; `null` while nothing is chosen. */
  protected readonly summary = computed(() => {
    if (this.held() === null) return null;
    const format = this.format();
    const start = this.start();
    const end = this.end();
    return `${start === null ? '' : format.format(start)} – ${end === null ? '' : format.format(end)}`.trim();
  });

  constructor() {
    /* The layer is created and torn down with the surface, not with the
       component: a layer that outlived its content would hold a place in the
       single stack that nothing occupies. The work starts from the value
       every time the panel opens. */
    effect(() => {
      const open = this.isOpen();
      if (!open) {
        this.release();
        return;
      }
      /* Read untracked: the work is rebuilt when the panel opens, and not
         again when the value moves while it is open. */
      untracked(() => {
        const held = this.held();
        this.work.set(held ?? EMPTY);
        this.hovered.set(null);
        const missing: TimeRangePickerPosition | null =
          held?.start == null ? 'start' : held.end === null ? 'end' : null;
        if (missing !== null && missing !== this.currentPosition()) {
          this.setPosition(missing, 'programmatic', undefined);
        }
      });
      afterNextRender(() => this.attach(), { injector: this.injector });
    });

    /* The highlight of each list lands where the list opens, and follows the
       lists under it. */
    effect(() => {
      if (!this.isOpen()) return;
      const lists = this.lists();
      const current = this.highlight();
      const next = { ...current };
      for (const position of this.positions) {
        const index = this.openingIndex(position);
        next[position] = index < 0 ? null : (lists[position][index]?.time ?? null);
      }
      if (!isSameTime(next.start, current.start) || !isSameTime(next.end, current.end)) {
        this.setHighlight(next, 'programmatic', undefined);
      }
    });

    /* The lists open on their highlight once the layer is rendered, and follow
       it while the lists under it change. */
    effect(() => {
      if (!this.isOpen()) {
        this.revealed = false;
        return;
      }
      this.highlight();
      this.lists();
      this.currentPosition();
      afterNextRender(
        () => {
          this.revealHighlights(!this.revealed);
          this.revealed = true;
        },
        { injector: this.injector },
      );
    });

    /* A rule that changed is a validity that changed, and the form is told. */
    effect(() => {
      this.problems();
      this.onValidatorChangeFn();
    });

    this.destroyRef.onDestroy(() => this.release());
  }

  ngOnInit() {
    this.ownOpen.set(this.defaultOpen());
    this.ownValue.set(normalize(this.defaultValue()));
    this.ownPosition.set(this.defaultPosition());
    this.ownHighlight.set(this.defaultHighlighted() ?? NO_HIGHLIGHT);
    this.clock.set(nowIn(this.resolvedTimeZone()));

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(SHEET_QUERY);
    const read = () => this.sheet.set(query.matches);
    read();
    query.addEventListener('change', read);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', read));
  }

  /* ── Forms ─────────────────────────────────────────────────────────── */

  writeValue(value: TimeRange | null | undefined) {
    this.ownValue.set(normalize(value));
  }

  registerOnChange(fn: (value: TimeRange | null) => void) {
    this.onChangeFn = fn;
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
   * The rules no other validator can see: the bounds, the predicate, the
   * order of the two ends and the duration. `required` is left to Angular's
   * own, because a form already has a word for it.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const value = normalize(control.value as TimeRange | null | undefined);
    if (value === null) return null;
    const problems = timeRangeProblems(value, {
      max: this.max(),
      maxLength: this.maxLength(),
      min: this.min(),
      minLength: this.minLength(),
      unavailable: this.isTimeUnavailable(),
    });
    if (problems.length === 0) return null;
    const errors: ValidationErrors = {};
    if (problems.includes('order')) errors['slottedTimeRangeOrder'] = { actual: value };
    if (problems.includes('min'))
      errors['slottedTimeRangeMin'] = { min: this.min(), actual: value };
    if (problems.includes('max'))
      errors['slottedTimeRangeMax'] = { max: this.max(), actual: value };
    if (problems.includes('unavailable')) errors['slottedTimeRangeUnavailable'] = { actual: value };
    if (problems.includes('length')) {
      errors['slottedTimeRangeLength'] = {
        minLength: this.minLength(),
        maxLength: this.maxLength(),
        actual: value,
      };
    }
    return errors;
  }

  /* ── Imperative ────────────────────────────────────────────────────── */

  /** Puts focus on the trigger, which is the frame. */
  focus() {
    this.triggerRef?.nativeElement.focus();
  }

  openSurface(source?: Event) {
    this.setOpen(true, 'programmatic', source);
  }

  closeSurface(source?: Event) {
    this.setOpen(false, 'programmatic', source);
  }

  /** A preset writes its range through here, with the `select` reason. */
  choose(range: TimeRange, source?: Event) {
    this.work.set(range);
    this.commit(range, 'select', source);
    this.setPosition('start', 'select', source);
    this.closeAfter(true, source);
  }

  /* ── Handlers ──────────────────────────────────────────────────────── */

  protected toggle(source: Event) {
    this.focusOnOpen = 'field';
    this.setOpen(!this.isOpen(), 'pointer', source);
  }

  protected clear(source: Event) {
    this.work.set(EMPTY);
    this.commit(null, 'clear', source);
    this.setPosition('start', 'clear', source);
    this.focus();
  }

  protected onTriggerKeyDown(event: KeyboardEvent) {
    if (!this.editable()) return;
    /* ChromeOS turns the chord into PageDown before the browser sees it, which
       is why the trigger is the guaranteed way in and the chord a shortcut. */
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusOnOpen = 'list';
      if (!this.isOpen()) this.setOpen(true, 'keyboard', event);
      else this.enterList(this.currentPosition());
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.focusOnOpen = 'field';
      this.setOpen(!this.isOpen(), 'keyboard', event);
    }
  }

  protected selectTab(position: TimeRangePickerPosition, source: Event) {
    if (position !== this.currentPosition()) this.setPosition(position, 'pointer', source);
  }

  /** Automatic activation: the arrow moves the position with it. */
  protected onTabKeyDown(event: KeyboardEvent) {
    const next: TimeRangePickerPosition | null =
      event.key === 'ArrowRight' || event.key === 'End'
        ? 'end'
        : event.key === 'ArrowLeft' || event.key === 'Home'
          ? 'start'
          : null;
    if (next === null) return;
    event.preventDefault();
    if (next !== this.currentPosition()) this.setPosition(next, 'keyboard', event);
    this.layer?.nativeElement
      .querySelector<HTMLElement>(`[data-part="tab"][data-position="${next}"]`)
      ?.focus({ preventScroll: true });
  }

  /**
   * The way out of a sheet that fills the screen, and of an edit left half
   * way: a whole work is the value; one end alone stays as it is.
   */
  protected done(source: Event) {
    const work = this.work();
    if (work.start !== null && work.end !== null && !isSameTimeRange(work, this.held())) {
      this.commit(work, 'select', source);
    }
    this.setOpen(false, 'pointer', source);
    this.triggerRef?.nativeElement.focus({ preventScroll: true });
  }

  protected onControlFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.element.contains(next)) return;
    this.onTouchedFn();
  }

  protected onListFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && (event.currentTarget as HTMLElement).contains(next)) return;
    this.listFocused.set(false);
  }

  protected hover(position: TimeRangePickerPosition, option: TimeOption) {
    this.hovered.set(option.unavailable ? null : { position, time: option.time });
  }

  /**
   * A field in the band writes its end to the work at every request it emits,
   * with the field's own reason, and an open end is a value on its own.
   */
  protected onFieldValue(request: TimeFieldChangeRequest) {
    const next: TimeRange = { ...this.work(), [this.currentPosition()]: request.value };
    this.work.set(next);
    this.commit(next, request.reason, request.source);
  }

  protected chooseNow(source: Event) {
    if (!this.editable()) return;
    this.writeEnd(this.currentPosition(), this.anchor(), source);
  }

  protected select(position: TimeRangePickerPosition, option: TimeOption, source: Event) {
    if (option.unavailable || !this.editable()) return;
    this.writeEnd(position, option.time, source);
  }

  /**
   * A press in a list, or on `now`: the end of that list is written to the
   * work. Whole, the work is the value and the panel closes when the press
   * completed it; incomplete, focus carries to the end that is missing.
   */
  private writeEnd(position: TimeRangePickerPosition, time: PlainTime, source: unknown) {
    const before = this.work();
    const wasWhole = before.start !== null && before.end !== null;
    const next: TimeRange = { ...before, [position]: time };
    this.work.set(next);
    this.setHighlight({ ...this.highlight(), [position]: time }, 'pointer', source);
    if (next.start !== null && next.end !== null) {
      this.commit(next, 'select', source);
      this.setPosition(position, 'select', source);
      this.closeAfter(!wasWhole, source);
      return;
    }
    this.enterList(other(position), source);
  }

  private closeAfter(completed: boolean, source: unknown) {
    const axis = this.closeOnSelect() ?? this.defaults.closeOnSelect;
    if (!(axis === 'always' || (axis === 'auto' && completed))) return;
    this.setOpen(false, 'select', source);
    this.triggerRef?.nativeElement.focus({ preventScroll: true });
  }

  /** Where a list opens: on its end, on the nearest step to now, or on the first available option. */
  private openingIndex(position: TimeRangePickerPosition): number {
    const work = this.work();
    const otherEnd = work[other(position)];
    return openingIndexOf(
      this.lists()[position],
      work[position] ?? otherEnd ?? this.anchor(),
      otherEnd,
      position,
    );
  }

  /**
   * Into the list of one end: the tab moves there when it is not the current
   * one, and focus lands on its highlight after the render that drew it.
   */
  private enterList(position: TimeRangePickerPosition, source?: unknown) {
    if (position !== this.currentPosition()) this.setPosition(position, 'select', source);
    afterNextRender(
      () => {
        const at = this.highlightIndex(position);
        const index = at >= 0 ? at : this.openingIndex(position);
        if (index < 0) {
          this.field?.focus();
          return;
        }
        const option = this.lists()[position][index];
        if (option !== undefined) {
          this.setHighlight(
            { ...this.highlight(), [position]: option.time },
            'keyboard',
            undefined,
          );
        }
        this.focusOption(position, index);
      },
      { injector: this.injector },
    );
  }

  private focusOption(position: TimeRangePickerPosition, index: number) {
    const rows = this.layer?.nativeElement.querySelectorAll<HTMLElement>(
      `[data-part="panel"][data-position="${position}"] [data-part="option"]`,
    );
    const row = rows?.[index];
    row?.focus();
    const list = row?.closest<HTMLElement>('[data-part="list"]');
    if (row !== undefined && list) revealRow(list, row, false);
  }

  /** The list scrolled to its highlight: centred as the surface opens, by the least after. */
  private revealHighlights(centre: boolean) {
    const position = this.currentPosition();
    const index = this.highlightIndex(position);
    if (index < 0) return;
    const list = this.layer?.nativeElement.querySelector<HTMLElement>('[data-part="list"]');
    const row = list?.querySelectorAll<HTMLElement>('[data-part="option"]')[index];
    if (list && row !== undefined) revealRow(list, row, centre);
  }

  /** The field, or the list where the field is not drawn (a coarse pointer). */
  private focusField() {
    const box = this.fieldBox?.nativeElement;
    if (box !== undefined && getComputedStyle(box).display === 'none') {
      this.focusOption(
        this.currentPosition(),
        Math.max(0, this.highlightIndex(this.currentPosition())),
      );
      return;
    }
    this.field?.focus();
  }

  /* ── The keyboard ──────────────────────────────────────────────────── */

  protected onListKeyDown(position: TimeRangePickerPosition, event: KeyboardEvent) {
    const list = this.lists()[position];
    const found = this.highlightIndex(position);
    const at = found >= 0 ? found : 0;

    const move = (index: number) => {
      event.preventDefault();
      const clamped = Math.max(0, Math.min(list.length - 1, index));
      const option = list[clamped];
      if (option === undefined) return;
      this.setHighlight({ ...this.highlight(), [position]: option.time }, 'keyboard', event);
      this.focusOption(position, clamped);
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
        if (option !== undefined) this.select(position, option, event);
        return;
      }
      default:
        break;
    }

    const typeahead = this.typeaheads[position];
    if (typeahead === null) return;
    if (!isPrintable(event.key, typeahead.query.length > 0)) return;
    const found2 = typeahead.match(event.key, this.labels()[position], at);
    if (found2 < 0) return;
    move(found2);
  }

  /* ── The machinery ─────────────────────────────────────────────────── */

  private commit(next: TimeRange | null, reason: ChangeReason, source: unknown) {
    const normalized = normalize(next);
    let cancelled = false;
    const state = createControllable<TimeRange | null>({
      controlled: this.value() === undefined ? undefined : this.held(),
      initial: this.held(),
      equals: isSameTimeRange,
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    if (!state.request(normalized, reason, source) || cancelled) return;
    if (this.value() === undefined) this.ownValue.set(normalized);
    this.onChangeFn(normalized);
  }

  private setPosition(next: TimeRangePickerPosition, reason: ChangeReason, source: unknown) {
    const state = createControllable<TimeRangePickerPosition>({
      controlled: this.position(),
      initial: this.currentPosition(),
      onRequest: (request) => this.positionChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownPosition.set(next);
  }

  private setHighlight(next: TimeRangePickerHighlight, reason: ChangeReason, source: unknown) {
    const state = createControllable<TimeRangePickerHighlight>({
      controlled: this.highlighted(),
      initial: this.highlight(),
      equals: (a, b) => isSameTime(a.start, b.start) && isSameTime(a.end, b.end),
      onRequest: (request) => this.highlightedChange.emit(request),
    });
    if (state.request(next, reason, source)) this.ownHighlight.set(next);
  }

  private setOpen(next: boolean, reason: ChangeReason, source: unknown) {
    const state = createControllable<boolean>({
      controlled: this.open(),
      initial: this.isOpen(),
      onRequest: (request) => this.openChange.emit(request),
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

    const trigger = this.triggerRef?.nativeElement;
    this.dismissable = createDismissableLayer(layer, {
      branches: trigger === undefined ? [] : [trigger],
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: (request) => {
        /* A field with an expression open takes Escape first: the layer asks
           in the capture phase, so the field's own attribute is what says so. */
        if (
          request.reason === 'escape' &&
          layer.querySelector('[data-ui="time-field"][data-relative]') !== null
        ) {
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

    for (const position of this.positions) {
      this.typeaheads[position] = createTypeahead({ locale: () => this.resolvedLocale() });
    }

    /* Opened by Enter, Space or a press, focus lands on the first segment of
       the current end's field; by an arrow, in that end's list. */
    const where = this.focusOnOpen;
    this.focusOnOpen = null;
    if (where === 'list') this.enterList(this.currentPosition());
    else if (where === 'field') this.focusField();
  }

  private release() {
    this.releaseGrip?.();
    this.releaseGrip = null;
    this.positioner?.destroy();
    this.positioner = null;
    this.dismissable?.destroy();
    this.dismissable = null;
    for (const position of this.positions) {
      this.typeaheads[position]?.destroy();
      this.typeaheads[position] = null;
    }
    this.layer?.nativeElement.removeAttribute('data-positioned');
  }
}

/**
 * One shortcut. It writes its range with the `select` reason and carries
 * `data-selected` while the value equals it. The list is the product's — "the
 * morning shift" is a business clock — and the family ships the button, not
 * the list.
 */
@Directive({
  selector: 'button[slTimeRangePickerPreset]',
  standalone: true,
  exportAs: 'slTimeRangePickerPreset',
  host: {
    'data-part': 'preset',
    'data-part-preset': '',
    type: 'button',
    '[attr.data-selected]': "selected() ? '' : null",
    '(click)': 'choose($event)',
  },
})
export class SlTimeRangePickerPreset {
  /** The range the press writes, or a function resolving it at the press. */
  readonly range = input.required<TimeRange | (() => TimeRange)>({
    alias: 'slTimeRangePickerPreset',
  });

  private readonly picker = inject(SlTimeRangePicker);

  protected readonly selected = computed(() => {
    const range = this.range();
    return isSameTimeRange(this.picker.selection(), typeof range === 'function' ? range() : range);
  });

  protected choose(event: Event) {
    if (event.defaultPrevented) return;
    const range = this.range();
    this.picker.choose(typeof range === 'function' ? range() : range, event);
  }
}
