import {
  createTimeFormat,
  hourJump,
  isSameTime,
  isTimeInRange,
  isTruncated,
  nearestIndex,
  nowIn,
  timeList,
} from '@slotted/core/date';
import type { PlainTime, TimeGranularity, TimeOption } from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import {
  timePickerMessages,
  type PartialMessages,
  type TimePickerMessages,
} from '@slotted/core/i18n';
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
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  ContentChild,
  signal,
  TemplateRef,
  untracked,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlField } from '@slotted/angular/field';
import { SlTimeField, SlTimeFieldEnd } from '@slotted/angular/time-field';
import type { TimeFieldChangeRequest, TimeFieldHourCycle } from '@slotted/angular/time-field';

import { injectTimePickerDefaults } from './time-picker-defaults';
import type {
  TimePickerCloseOnSelect,
  TimePickerPlacement,
  TimePickerSize,
  TimePickerUnavailableOptions,
  TimePickerVariant,
} from './time-picker-defaults';
import { SlTimePickerOption } from './time-picker-option';

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * §2.7 of `docs/component-features.md` asks for it by name.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';
/** The surface needs an identifier the trigger can point `aria-controls` at. */
let sequence = 0;

/**
 * A time field, a trigger, and a list of times behind them.
 *
 * **It composes `time-field` and redraws none of it.** The field keeps its own
 * `data-ui`; this family owns the box the positioner measures, the trigger
 * inside the field's end slot, and the layer the list stands on.
 *
 * **One panel shape, at every step.** A listbox of whole times. A column per
 * unit was drawn and withdrawn — the field types every second, and `options`
 * states any set of times a step cannot describe.
 *
 * **The panel never takes the field away.** `Alt`+`ArrowDown` opens it and
 * leaves focus in the field, so the segments keep every key they had.
 */
@Component({
  selector: '[slTimePicker]',
  standalone: true,
  exportAs: 'slTimePicker',
  imports: [NgTemplateOutlet, SlGlyph, SlIcon, SlTimeField, SlTimeFieldEnd],
  template: `<div data-part="control" data-part-control="" (keydown)="onControlKeyDown($event)">
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
        [value]="held()"
        (valueChange)="onFieldValue($event)"
      >
        <span slTimeFieldEnd>
          <button
            #trigger
            data-part="trigger"
            data-part-trigger=""
            type="button"
            aria-haspopup="listbox"
            [attr.aria-label]="triggerLabel()"
            [attr.aria-expanded]="isOpen()"
            [attr.aria-controls]="isOpen() ? contentId : null"
            [disabled]="!editable()"
            (click)="toggle($event)"
            (keydown)="onTriggerKeyDown($event)"
          >
            <span slIcon><svg slGlyph name="clock"></svg></span>
          </button>
        </span>
      </div>
    </div>

    @if (isOpen()) {
      <div
        #layer
        data-ui="time-picker"
        data-ui-time-picker=""
        data-part="positioner"
        data-part-positioner=""
        data-open
        [attr.data-presentation]="sheet() ? 'sheet' : 'popover'"
      >
        <div
          data-part="content"
          data-part-content=""
          role="listbox"
          [attr.id]="contentId"
          [attr.aria-label]="triggerLabel()"
          [attr.aria-description]="truncated() ? t('truncated') : null"
        >
          @if (sheet()) {
            <span aria-hidden="true" data-part="grip" data-part-grip=""></span>
          }
          <ng-content select="[slTimePickerPresets]" />
          <div data-part="head" data-part-head="">
            <button data-part="now" data-part-now="" type="button" (click)="chooseNow($event)">
              {{ t('now') }}
            </button>
          </div>
          @if (list().length === 0) {
            <div data-part="empty" data-part-empty="">{{ t('empty') }}</div>
          } @else {
            <div
              #rows
              data-part="list"
              data-part-list=""
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
                  (click)="select(option, $event)"
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
          <ng-content select="[slTimePickerFooter]" />
        </div>
      </div>
    }`,
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
    '[attr.data-open]': "isOpen() ? '' : null",
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
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  /** Where the reader is in the list. Present means the consumer owns it. */
  readonly highlightedValue = input<PlainTime | null | undefined>(undefined);
  readonly defaultHighlightedValue = input<PlainTime | null | undefined>(undefined);

  readonly min = input<PlainTime | undefined>(undefined);
  readonly max = input<PlainTime | undefined>(undefined);
  readonly isTimeUnavailable = input<((time: PlainTime) => boolean) | undefined>(undefined);

  /** Seconds between two offered times. Ignored when `options` states the list. */
  readonly step = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /**
   * The times to offer, stated rather than stepped. A step describes a regular
   * list and a great many real ones are not: a clinic open at 09:00, 09:20 and
   * 13:45, a broadcast schedule, a set of second-level marks.
   */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);
  readonly maxOptions = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly unavailableOptions = input<TimePickerUnavailableOptions | undefined>(undefined);

  /** BCP 47. Unset, the language in force (`provideSlotted`) decides. */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly hourCycle = input<TimeFieldHourCycle | undefined>(undefined);
  readonly granularity = input<TimeGranularity | undefined>(undefined);
  readonly referenceTime = input<PlainTime | undefined>(undefined);

  readonly size = input<TimePickerSize | undefined>(undefined);
  readonly variant = input<TimePickerVariant | undefined>(undefined);
  readonly placement = input<TimePickerPlacement | undefined>(undefined);
  readonly closeOnSelect = input<TimePickerCloseOnSelect | undefined>(undefined);

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
   * trigger's two names, the now control, and what the panel says when it is
   * empty or cut short.
   */
  readonly messages = input<PartialMessages<TimePickerMessages> | undefined>(undefined);

  readonly valueChange = output<TimeFieldChangeRequest | ChangeRequest<PlainTime | null>>();
  readonly openChange = output<ChangeRequest<boolean>>();
  readonly highlightedValueChange = output<ChangeRequest<PlainTime | null>>();

  /**
   * What one row draws. The row is the family's — its role, its states and its
   * keyboard — and what is written inside it is the consumer's. A template
   * rather than a slot, because it is re-rendered once per option.
   */
  @ContentChild(SlTimePickerOption, { read: TemplateRef })
  protected optionTemplate?: TemplateRef<unknown>;

  @ViewChild('layer') protected layer?: ElementRef<HTMLElement>;
  @ViewChild('trigger') protected triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('rows') protected listRef?: ElementRef<HTMLElement>;
  @ViewChild('field') protected field?: SlTimeField;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly defaults = injectTimePickerDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  readonly t = injectMessages(timePickerMessages, this.messages);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enclosing = inject(SlField, { optional: true });

  protected readonly contentId = `sl-time-picker-${String((sequence += 1))}`;

  private readonly ownOpen = signal(false);
  private readonly ownValue = signal<PlainTime | null>(null);
  private readonly ownHighlight = signal<PlainTime | null>(null);
  private readonly clock = signal<PlainTime>({ hour: 12, minute: 0, second: 0 });
  protected readonly sheet = signal(false);

  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;
  private releaseGrip: (() => void) | null = null;
  private typeahead: TypeaheadHandle | null = null;

  protected readonly isOpen = computed(() => this.open() ?? this.ownOpen());
  protected readonly held = computed(() => this.value() ?? this.ownValue());

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
    () => this.disabled() ?? this.enclosing?.resolvedDisabled(),
  );
  protected readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.enclosing?.resolvedReadOnly(),
  );
  protected readonly resolvedRequired = computed(
    () => this.required() ?? this.enclosing?.required(),
  );

  /**
   * Validity the family owns, beside the validity the consumer states: a time
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because this control is the only thing that knows.
   */
  protected readonly resolvedInvalid = computed(() => {
    const time = this.held();
    if (time !== null && !isTimeInRange(time, this.min(), this.max())) return true;
    if (time !== null && this.isTimeUnavailable()?.(time) === true) return true;
    return this.invalid() ?? this.enclosing?.invalid();
  });

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

  private readonly listOptions = computed(() => ({
    isTimeUnavailable: this.isTimeUnavailable(),
    max: this.max(),
    maxOptions: this.maxOptions() ?? this.defaults.maxOptions,
    min: this.min(),
    options: this.options(),
    step: this.step() ?? this.defaults.step,
  }));

  protected readonly list = computed<TimeOption[]>(() => {
    const built = timeList(this.listOptions());
    const hidden = (this.unavailableOptions() ?? this.defaults.unavailableOptions) === 'hide';
    return hidden ? built.filter((option) => !option.unavailable) : built;
  });

  protected readonly truncated = computed(() => isTruncated(this.listOptions()));

  private readonly labels = computed(() =>
    this.list().map((option) => this.format().format(option.time)),
  );

  protected readonly highlight = computed(() => this.highlightedValue() ?? this.ownHighlight());
  protected readonly highlightIndex = computed(() => {
    const at = this.highlight();
    if (at === null) return -1;
    return this.list().findIndex((option) => isSameTime(option.time, at));
  });

  /**
   * The trigger's accessible name. Focus returns here when the surface closes,
   * so this is where the reader is told what was chosen.
   */
  protected readonly triggerLabel = computed(() => {
    const chosen = this.held();
    if (chosen === null) return this.t('choose');
    return this.t('change', { time: this.format().describe(chosen) });
  });

  private readonly closesOnSelect = computed(
    () => (this.closeOnSelect() ?? this.defaults.closeOnSelect) !== 'never',
  );

  constructor() {
    /* The layer is created and torn down with the surface, not with the
       component: a layer that outlived its content would hold a place in the
       single stack that nothing occupies. */
    effect(() => {
      if (!this.isOpen()) {
        this.release();
        return;
      }
      afterNextRender(() => this.attach(), { injector: this.injector });
    });

    /**
     * The highlight lands where the panel opens, and follows the list under it.
     *
     * Everything but the two signals it should answer is read untracked. Left
     * tracked, `setHighlight` reads the highlight itself, the effect took a
     * dependency on it, and every arrow press re-ran the effect and snapped the
     * reader back to where the panel had opened — which is what the Angular
     * spec showed as a highlight that would not move.
     */
    effect(() => {
      if (!this.isOpen()) return;
      const list = this.list();
      untracked(() => {
        const index = this.openingIndex();
        const option = list[index];
        if (index >= 0 && option !== undefined) {
          this.setHighlight(option.time, 'programmatic', undefined);
        }
      });
    });

    this.destroyRef.onDestroy(() => this.release());
  }

  ngOnInit() {
    this.ownOpen.set(this.defaultOpen());
    this.ownValue.set(this.defaultValue() ?? null);
    this.ownHighlight.set(this.defaultHighlightedValue() ?? null);
    this.clock.set(nowIn(this.resolvedTimeZone()));
    this.typeahead = createTypeahead({ locale: () => this.resolvedLocale() });
    this.destroyRef.onDestroy(() => this.typeahead?.destroy());

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
    this.setOpen(true, 'programmatic', source);
  }

  closeSurface(source?: Event) {
    this.setOpen(false, 'programmatic', source);
  }

  /* ── What the template reads ─────────────────────────────────────────── */

  protected labelFor(option: TimeOption): string {
    return this.format().format(option.time);
  }

  protected isSelected(option: TimeOption): boolean {
    return isSameTime(option.time, this.held());
  }

  protected contextFor(option: TimeOption, index: number) {
    return {
      $implicit: option.time,
      current: index === this.highlightIndex(),
      label: this.labels()[index] ?? '',
      selected: this.isSelected(option),
      unavailable: option.unavailable,
    };
  }

  /* ── Opening, choosing and closing ───────────────────────────────────── */

  protected toggle(source: Event) {
    const next = !this.isOpen();
    this.setOpen(next, 'pointer', source);
    if (next) this.enterList();
  }

  protected chooseNow(source: Event) {
    this.commit(this.anchor(), 'select', source);
    if (this.closesOnSelect()) this.close(source);
  }

  protected select(option: TimeOption, source: Event) {
    if (option.unavailable || !this.editable()) return;
    this.commit(option.time, 'select', source);
    this.setHighlight(option.time, 'pointer', source);
    if (this.closesOnSelect()) this.close(source);
  }

  private close(source: Event) {
    this.setOpen(false, 'select', source);
    this.triggerRef?.nativeElement.focus({ preventScroll: true });
  }

  /**
   * Where the panel opens: on the chosen time, on the nearest step to now when
   * nothing is chosen, and on the first available option when that is refused.
   */
  private openingIndex(): number {
    const list = this.list();
    if (list.length === 0) return -1;
    const near = nearestIndex(list, this.held() ?? this.anchor());
    if (near >= 0 && list[near]?.unavailable !== true) return near;
    const first = list.findIndex((option) => !option.unavailable);
    return first >= 0 ? first : 0;
  }

  private enterList() {
    afterNextRender(
      () => {
        const index = this.highlightIndex() >= 0 ? this.highlightIndex() : this.openingIndex();
        if (index < 0) return;
        const option = this.list()[index];
        if (option !== undefined) this.setHighlight(option.time, 'keyboard', undefined);
        this.focusOption(index);
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
      this.setOpen(true, 'keyboard', event);
    }
  }

  protected onTriggerKeyDown(event: KeyboardEvent) {
    if (!this.editable()) return;
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (!this.isOpen()) this.setOpen(true, 'keyboard', event);
    this.enterList();
  }

  protected onListKeyDown(event: KeyboardEvent) {
    const list = this.list();
    const at = this.highlightIndex() >= 0 ? this.highlightIndex() : 0;

    const move = (index: number) => {
      event.preventDefault();
      const clamped = Math.max(0, Math.min(list.length - 1, index));
      const option = list[clamped];
      if (option === undefined) return;
      this.setHighlight(option.time, 'keyboard', event);
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
        if (option !== undefined) this.select(option, event);
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

  protected onFieldValue(request: TimeFieldChangeRequest) {
    this.commit(request.value, request.reason, request.source, request);
  }

  private commit(
    next: PlainTime | null,
    reason: ChangeReason,
    source: unknown,
    carried?: TimeFieldChangeRequest,
  ) {
    let cancelled = false;
    const state = createControllable<PlainTime | null>({
      controlled: this.value(),
      initial: this.held(),
      equals: isSameTime,
      onRequest: (request) => {
        this.valueChange.emit(
          carried === undefined
            ? request
            : { ...request, crossesMidnight: carried.crossesMidnight, segments: carried.segments },
        );
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (!cancelled && moved && this.value() === undefined) this.ownValue.set(next);
  }

  private setHighlight(next: PlainTime | null, reason: ChangeReason, source: unknown) {
    const state = createControllable<PlainTime | null>({
      controlled: this.highlightedValue(),
      initial: this.highlight(),
      equals: isSameTime,
      onRequest: (request) => this.highlightedValueChange.emit(request),
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
