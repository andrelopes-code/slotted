import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import {
  clockFinest,
  clockHourGroups,
  clockModel,
  clockSlotGroups,
  clockUnitCells,
  createTimeFormat,
  plainTime,
  timeList,
  timeOfSeconds,
  withClockHour,
  withClockMinute,
  withClockSecond,
} from '@slotted/core/date';
import type { ClockCell, PlainDate, PlainTime, TimeGranularity } from '@slotted/core/date';
import { clockMessages } from '@slotted/core/i18n';
import type { ClockMessages, PartialMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';

import { groupsGrid, keyTarget, stopOf, unitsGrid } from './clock-view';
import type {
  ClockChangeRequest,
  ClockGridView,
  ClockHourCycle,
  ClockSlotState,
  ClockUnitName,
} from './clock.types';

interface ClockSlotContext {
  readonly $implicit: PlainTime;
  /** The day it is a time of, in a picker that has one. */
  readonly date?: PlainDate | null;
  /** The end it is a time of, in a picker of a run. */
  readonly position?: 'end' | 'start';
  readonly state: ClockSlotState;
}

/** What one whole time draws. The button around it is the family's. */
@Directive({ selector: 'ng-template[slClockSlot]', standalone: true })
export class SlClockSlot {
  readonly template = inject<TemplateRef<ClockSlotContext>>(TemplateRef);
}

/**
 * Every hour of the day in one grid, and the minutes of the step under it.
 *
 * A press on an hour writes a whole time: the minutes held stay, and minutes
 * the new hour refuses give way to the nearest it accepts. A stated list of
 * times (`options`) is drawn as whole times instead.
 */
@Component({
  selector: '[slClock]',
  standalone: true,
  exportAs: 'slClock',
  imports: [NgTemplateOutlet],
  template: `
    @for (grid of grids(); track grid.unit) {
      @if (grid.unit === 'hour') {
        <div
          data-part="hours"
          data-part-hours=""
          role="listbox"
          [attr.aria-label]="grid.name"
          (focusout)="onBlur($event)"
          (keydown)="onKeydown(grid, $event)"
        >
          @for (group of grid.groups; track $index) {
            <div role="group" [attr.aria-label]="group.name">
              <span aria-hidden="true" data-part="period" data-part-period="">{{
                group.label
              }}</span>
              <ng-container
                [ngTemplateOutlet]="cellsOf"
                [ngTemplateOutletContext]="{ $implicit: group.cells, grid }"
              />
            </div>
          }
        </div>
      } @else if (grid.unit === 'slot') {
        <div
          data-part="slots"
          data-part-slots=""
          role="listbox"
          [attr.aria-label]="grid.name"
          (focusout)="onBlur($event)"
          (keydown)="onKeydown(grid, $event)"
        >
          @for (group of grid.groups; track $index) {
            <div role="group" [attr.aria-label]="group.name">
              <span aria-hidden="true" data-part="period" data-part-period="">{{
                group.label
              }}</span>
              <div data-part="cells" data-part-cells="">
                <ng-container
                  [ngTemplateOutlet]="cellsOf"
                  [ngTemplateOutletContext]="{ $implicit: group.cells, grid }"
                />
              </div>
            </div>
          }
        </div>
      } @else {
        <div
          [attr.data-part]="grid.unit + 's'"
          [attr.data-part-minutes]="grid.unit === 'minute' ? '' : null"
          [attr.data-part-seconds]="grid.unit === 'second' ? '' : null"
          [attr.data-columns]="grid.columns"
        >
          <span aria-hidden="true" data-part="period" data-part-period="">{{ grid.name }}</span>
          <div
            data-part="cells"
            data-part-cells=""
            role="listbox"
            [attr.aria-label]="grid.name"
            (focusout)="onBlur($event)"
            (keydown)="onKeydown(grid, $event)"
          >
            <ng-container
              [ngTemplateOutlet]="cellsOf"
              [ngTemplateOutletContext]="{ $implicit: grid.cells, grid }"
            />
          </div>
        </div>
      }
    } @empty {
      <div data-part="empty" data-part-empty="">{{ t('empty') }}</div>
    }

    <ng-template #cellsOf let-cells let-grid="grid">
      @for (cell of cells; track cell.value) {
        <button
          role="option"
          type="button"
          [attr.data-part]="grid.unit"
          [attr.data-part-hour]="grid.unit === 'hour' ? '' : null"
          [attr.data-part-minute]="grid.unit === 'minute' ? '' : null"
          [attr.data-part-second]="grid.unit === 'second' ? '' : null"
          [attr.data-part-slot]="grid.unit === 'slot' ? '' : null"
          [attr.aria-disabled]="disabled() || cell.unavailable ? 'true' : null"
          [attr.aria-label]="cell.name ?? null"
          [attr.aria-selected]="cell.selected"
          [attr.data-disabled]="disabled() ? '' : null"
          [attr.data-now]="cell.now ? '' : null"
          [attr.data-selected]="cell.selected ? '' : null"
          [attr.data-unavailable]="cell.unavailable ? '' : null"
          [tabindex]="isStop(grid, cell) ? 0 : -1"
          (click)="pick(grid.unit, cell, $event)"
          (focus)="onFocus(grid, cell)"
        >
          @if (cell.time !== undefined && slot() !== undefined) {
            <ng-container
              [ngTemplateOutlet]="slot()!.template"
              [ngTemplateOutletContext]="{ $implicit: cell.time, state: cell }"
            />
          } @else {
            {{ cell.label }}
          }
        </button>
      }
    </ng-template>
  `,
  styleUrl: '../../../styles/src/clock/clock.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'group',
    'data-ui': 'clock',
    'data-ui-clock': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-granularity]': 'granularity()',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-readonly]': "readOnly() ? '' : null",
    '[attr.data-slots]': "options() === undefined ? null : ''",
  },
})
export class SlClock implements OnInit {
  /** Present means the consumer owns the value. */
  readonly value = input<PlainTime | null | undefined>(undefined);
  readonly defaultValue = input<PlainTime | null | undefined>(undefined);

  readonly min = input<PlainTime | undefined>(undefined);
  readonly max = input<PlainTime | undefined>(undefined);
  readonly isTimeUnavailable = input<((time: PlainTime) => boolean) | undefined>(undefined);
  /** Seconds between two offered times, counted from `min` or from midnight. */
  readonly step = input(900, { transform: numberAttribute });
  /**
   * The times to offer, stated rather than stepped: a clinic open at 09:00,
   * 09:20 and 13:45. The clock then draws whole times under the part of the
   * day each one is in.
   */
  readonly options = input<readonly PlainTime[] | undefined>(undefined);

  /** The finest unit drawn. */
  readonly granularity = input<TimeGranularity>('minute');
  readonly hourCycle = input<ClockHourCycle | undefined>(undefined);
  /** The time it is, whose hour is outlined. Unset, no hour is. */
  readonly now = input<PlainTime | undefined>(undefined);
  /** BCP 47. Unset, the language in force decides. */
  readonly locale = input<string | undefined>(undefined);

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });

  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<ClockMessages> | undefined>(undefined);

  readonly valueChange = output<ClockChangeRequest>();

  protected readonly slot = contentChild(SlClockSlot);

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly appLocale = injectLocale();
  protected readonly t = injectMessages(clockMessages, this.messages);

  private readonly ownValue = signal<PlainTime | null>(null);
  private readonly focused = signal<{ unit: ClockUnitName; index: number } | null>(null);

  private readonly held = computed(() => {
    const value = this.value();

    return value === undefined ? this.ownValue() : value;
  });

  private readonly format = computed(() =>
    createTimeFormat({
      locale: this.locale() ?? this.appLocale(),
      granularity: this.granularity(),
      hourCycle: this.hourCycle(),
    }),
  );

  private readonly rules = computed(() => ({
    step: this.step(),
    min: this.min(),
    max: this.max(),
    isTimeUnavailable: this.isTimeUnavailable(),
  }));

  private readonly model = computed(() => clockModel(this.rules()));

  private readonly periods = computed(
    () => [this.t('night'), this.t('morning'), this.t('afternoon'), this.t('evening')] as const,
  );

  protected readonly grids = computed((): ClockGridView[] => {
    const options = this.options();
    const held = this.held();
    if (options === undefined) return this.unitGrids(held);

    const list = timeList({ ...this.rules(), options });
    const groups = clockSlotGroups(list, held, this.format(), this.periods());

    return groups.length === 0 ? [] : [groupsGrid('slot', this.t('times'), groups)];
  });

  ngOnInit(): void {
    this.ownValue.set(this.defaultValue() ?? null);
  }

  /** Puts focus on the chosen hour, or on the one the clock opens at. */
  focus(): void {
    this.element.querySelector<HTMLElement>('[role="option"][tabindex="0"]')?.focus();
  }

  protected isStop(grid: ClockGridView, cell: ClockCell): boolean {
    return !this.disabled() && grid.cells.indexOf(cell) === stopOf(grid, this.focused());
  }

  protected onFocus(grid: ClockGridView, cell: ClockCell): void {
    this.focused.set({ unit: grid.unit, index: grid.cells.indexOf(cell) });
  }

  protected onBlur(event: FocusEvent): void {
    const list = event.currentTarget as HTMLElement;
    if (!list.contains(event.relatedTarget as Node | null)) this.focused.set(null);
  }

  protected onKeydown(grid: ClockGridView, event: KeyboardEvent): void {
    const target = keyTarget(grid, stopOf(grid, this.focused()), event);
    if (target === null) return;

    event.preventDefault();
    event.stopPropagation();
    const list = event.currentTarget as HTMLElement;
    list.querySelectorAll<HTMLElement>('[role="option"]').item(target).focus();
  }

  protected pick(unit: ClockUnitName, cell: ClockCell, event: MouseEvent): void {
    if (cell.unavailable || this.disabled() || this.readOnly()) return;

    const next = this.timeOf(unit, cell.value);
    if (next === null) return;

    const state = createControllable<PlainTime | null>({
      controlled: this.value(),
      initial: this.held(),
      /* A press on the time held is still an answer: the reader is done with it. */
      equals: () => false,
      onRequest: (asked) => this.valueChange.emit(Object.assign(asked, { unit })),
    });
    /* A press from a key carries no click count. */
    if (state.request(next, event.detail === 0 ? 'keyboard' : 'pointer', event)) {
      this.ownValue.set(next);
    }
  }

  private unitGrids(held: PlainTime | null): ClockGridView[] {
    const format = this.format();
    const model = this.model();
    const granularity = this.granularity();
    const hours = clockHourGroups({
      format,
      held,
      model,
      now: this.now(),
      periods: this.periods(),
    });
    const grids = [groupsGrid('hour', this.t('hours'), hours)];

    const minutes =
      clockFinest(granularity, this.step()) === 'hour' ? [] : model.minutes(held?.hour ?? 0);
    if (minutes.length > 0) {
      const cells = clockUnitCells(minutes, held?.minute ?? null, format);
      grids.push(unitsGrid('minute', this.t('minutes'), cells));
    }

    const seconds =
      granularity === 'second' ? model.seconds(held?.hour ?? 0, held?.minute ?? 0) : [];
    if (seconds.length > 0) {
      const cells = clockUnitCells(seconds, held?.second ?? null, format);
      grids.push(unitsGrid('second', this.t('seconds'), cells));
    }

    return grids;
  }

  private timeOf(unit: ClockUnitName, value: number): PlainTime | null {
    const model = this.model();
    if (unit === 'slot') return timeOfSeconds(value);
    if (unit === 'hour') return withClockHour(model, this.held(), value);

    /* A minute pressed before any hour is a minute of the first hour on offer. */
    const from = this.held() ?? model.nearest(plainTime(0));
    if (from === null) return null;

    return unit === 'minute'
      ? withClockMinute(model, from, value)
      : withClockSecond(model, from, value);
  }
}
