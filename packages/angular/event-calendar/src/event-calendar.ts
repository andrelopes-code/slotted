import { writeSelectorKey } from '@slotted/core/selector-key';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import {
  addDays,
  compareDate,
  compareDateTime,
  createDateFormat,
  daysBetween,
  isPlainDateTime,
  isSameDate,
  nowDateTimeIn,
  plainDateTime,
  secondsOfDay,
  timeOfSeconds,
  todayIn,
  toISODate,
} from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import {
  calendarColor,
  contextSlot,
  formatOccurrence,
  occurrenceWhen,
  slotMinutes,
  formatTimeRange,
  moveDate,
  movePlacement,
  nextAllowedPlacement,
  occurrencesIn,
  occurrencesOn,
  placementOf,
  placeOccurrence,
  resizePlacement,
  stepView,
  viewRange,
  viewTitle,
  withPlacement,
} from '@slotted/core/event-calendar';
import type {
  CalendarEvent,
  DateMove,
  EventPlacement,
  EventShift,
  EventCalendarCalendar,
  EventCalendarListRange,
  EventCalendarView,
  EventCalendarWeekends,
  EventOccurrence,
  WorkingHours,
} from '@slotted/core/event-calendar';
import {
  eventCalendarMessages,
  type EventCalendarMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { COMPACT_BELOW, createWidthGate } from '@slotted/core/measure';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerHeader,
  SlDrawerResizer,
  SlDrawerTitle,
} from '@slotted/angular/drawer';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlContextMenuTrigger } from '@slotted/angular/context-menu';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import {
  SlPopover,
  SlPopoverBody,
  SlPopoverClose,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
} from '@slotted/angular/popover';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';

import { injectEventCalendarDefaults } from './event-calendar-defaults';
import type {
  EventCalendarCompact,
  EventCalendarEventChange,
  EventCalendarHourCycle,
  EventCalendarRange,
  EventCalendarContextTarget,
  EventCalendarSelection,
  EventCalendarSelectionMode,
} from './event-calendar-defaults';
import {
  SlEventCalendarActions,
  SlEventCalendarContextMenu,
  SlEventCalendarDayContent,
  SlEventCalendarDetail,
  SlEventCalendarEmpty,
  SlEventCalendarError,
  SlEventCalendarEvent,
} from './event-calendar-templates';
import { drawList, drawMonth, drawTimeGrid, fullDate } from './event-calendar-view';
import type { DrawingInput, EventView } from './event-calendar-view';

const ALL_VIEWS: readonly EventCalendarView[] = ['month', 'week', 'day', 'list'];
const WIDGETS = "[data-part='day-number'], [data-part='event'], [data-part='more']";
type GridRow = 'header' | 'all-day' | 'timed';

let sequence = 0;

const sameKeys = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

function sameSelection(a: EventCalendarSelection | null, b: EventCalendarSelection | null) {
  if (a === null || b === null) return a === b;
  if (isPlainDateTime(a.start) !== isPlainDateTime(b.start)) return false;
  if (isPlainDateTime(a.start)) {
    return (
      compareDateTime(a.start, b.start as PlainDateTime) === 0 &&
      compareDateTime(a.end as PlainDateTime, b.end as PlainDateTime) === 0
    );
  }
  return (
    compareDate(a.start, b.start as PlainDate) === 0 &&
    compareDate(a.end as PlainDate, b.end as PlainDate) === 0
  );
}

const orderedDays = (a: PlainDate, b: PlainDate) =>
  compareDate(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };

/** A minute of `date`; 1440 is 00:00 of the day after, where an exclusive end lands. */
const atMinutes = (date: PlainDate, minutes: number): PlainDateTime =>
  minutes >= 1440
    ? plainDateTime(addDays(date, 1), timeOfSeconds(0))
    : plainDateTime(date, timeOfSeconds(Math.max(0, minutes) * 60));

/**
 * The day under a point, in one row of the grid, found by the cells' boxes.
 * The day of the cell that holds an event is not it: a bar lives in its first
 * day's cell, so a bar picked up by its middle measured every move from its
 * start and travelled the days in between twice. Columns and the all-day row
 * are vertical strips and answer by the horizontal position alone, so a hand
 * that drifts off the row keeps its day; a month cell answers by both.
 */
function dayUnder(root: ParentNode, row: string, x: number, y: number): PlainDate | null {
  for (const cell of root.querySelectorAll<HTMLElement>(`[data-row='${row}'][data-date]`)) {
    const box = cell.getBoundingClientRect();
    const across = x >= box.left && x < box.right;
    if (across && (row !== 'day' || (y >= box.top && y < box.bottom))) {
      return parseIso(cell.dataset['date'] ?? '');
    }
  }
  return null;
}

const sameChange = (a: EventCalendarEventChange, b: EventCalendarEventChange) =>
  JSON.stringify([a.start, a.end]) === JSON.stringify([b.start, b.end]);

const parseIso = (iso: string): PlainDate => {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  return { year, month, day };
};

/** One request: value, previous, reason, source, cancellable, not emitted for an equal value. */
function ask<T>(
  current: T,
  next: T,
  equals: (a: T, b: T) => boolean,
  reason: ChangeReason,
  source: unknown,
  emit: (request: ChangeRequest<T>) => void,
): boolean {
  if (equals(current, next)) return false;
  let cancelled = false;
  emit({
    value: next,
    previous: current,
    reason,
    source,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  });
  return !cancelled;
}

const pressReason = (event: MouseEvent) => (event.detail === 0 ? 'keyboard' : 'pointer');

/**
 * A calendar of events: month, week, day and list, over wall-clock values.
 *
 * **The events are the consumer's.** The family expands their recurrence, lays
 * them out and asks, with a reason, to move the date, the view, the calendars
 * in view, the chosen stretch of time and the open event. Each is a `model()`
 * with a `…Request` output carrying the `ChangeRequest`, which the consumer can
 * cancel before anything commits.
 *
 * **The grid is a layout grid from the APG with the day as its cell.** One cell
 * holds the tab stop; arrows move the day; Enter goes into the day's events and
 * Escape comes back out. The list is not a grid: every event is in the tab
 * order, under a heading per day.
 *
 * **Below the compact size class the month and the week are a list** of the
 * same days, without the view changing.
 *
 * It is not a form control: nothing it holds is a submitted value, so it
 * implements no `ControlValueAccessor`.
 */
@Component({
  selector: '[slEventCalendar]',
  standalone: true,
  exportAs: 'slEventCalendar',
  imports: [
    NgTemplateOutlet,
    SlContextMenuTrigger,
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuItem,
    SlMenuTrigger,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerResizer,
    SlDrawerTitle,
    SlPopover,
    SlPopoverBody,
    SlPopoverClose,
    SlPopoverContent,
    SlPopoverDescription,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlProgressBar,
    SlSegment,
    SlSegmentedControl,
  ],
  template: `
    @if (header()) {
      <div data-part="header" data-part-header="">
        <div
          data-part="title"
          data-part-title=""
          role="heading"
          aria-live="polite"
          [attr.aria-level]="level()"
          [attr.id]="titleId"
        >
          {{ title() }}
        </div>
        <div
          data-part="navigation"
          data-part-navigation=""
          role="group"
          [attr.aria-label]="t('navigation')"
        >
          <button
            data-part="previous"
            data-part-previous=""
            type="button"
            [attr.aria-label]="previousLabel()"
            (click)="step(-1, $event)"
          >
            <span slIcon><svg slGlyph name="chevron-right"></svg></span>
          </button>
          <button data-part="today" data-part-today="" type="button" (click)="goToday($event)">
            {{ t('today') }}
          </button>
          <button
            data-part="next"
            data-part-next=""
            type="button"
            [attr.aria-label]="nextLabel()"
            (click)="step(1, $event)"
          >
            <span slIcon><svg slGlyph name="chevron-right"></svg></span>
          </button>
        </div>
        @if (views().length > 1) {
          <div data-part="views" data-part-views="">
            <div
              slSegmentedControl
              fullWidth
              [attr.aria-label]="t('views')"
              [value]="currentView()"
              (valueChange)="onViewRequest($event)"
            >
              @for (name of views(); track name) {
                <label slSegment [value]="name">{{ viewLabel(name) }}</label>
              }
            </div>
          </div>
        }
        @if (calendars().length > 1) {
          <button
            #filterButton
            data-part="filter"
            data-part-filter=""
            type="button"
            [slMenuTriggerFor]="filterMenu"
          >
            <span slIcon><svg slGlyph name="funnel"></svg></span>
            <span>{{ t('calendars') }}</span>
            <span slIcon><svg slGlyph name="chevron-down"></svg></span>
          </button>
          <sl-menu #filterMenu>
            @for (entry of calendars(); track entry.key) {
              <button
                slMenuCheckboxItem
                [checked]="shown().includes(entry.key)"
                (checkedChangeRequest)="onCalendarRequest(entry.key, $event)"
              >
                <!-- The calendar's color opens the label; the column before it is the
                     check's, and a dot there drew the check over itself. -->
                <svg aria-hidden="true" width="14" height="10" viewBox="0 0 14 10">
                  <circle cx="5" cy="5" r="4" [style.fill]="swatch(entry.key)" />
                </svg>
                {{ entry.label }}
              </button>
            }
          </sl-menu>
        }
        @if (actions()) {
          <div data-part="actions" data-part-actions="">
            <ng-content select="[slEventCalendarActions]" />
          </div>
        }
      </div>
    }

    <!-- With a context menu the body is that family's target: one region for
         every day, hour and event. -->
    @if (contextMenu(); as items) {
      <div
        #body
        data-part="body"
        data-part-body=""
        [slContextMenuTriggerFor]="contextMenuRef"
        [attr.aria-busy]="loading() ? true : null"
        (keydown)="onKeyDown($event)"
        (pointerdown)="onPointerDown($event)"
      >
        <ng-container *ngTemplateOutlet="bodyContent" />
      </div>
      <sl-menu
        #contextMenuRef
        [aria-label]="contextLabel()"
        (openChangeRequest)="onContextRequest($event)"
      >
        @if (contextOn(); as on) {
          <ng-container
            *ngTemplateOutlet="
              items.template;
              context: { $implicit: on.target };
              injector: contextInjector()
            "
          />
        }
      </sl-menu>
    } @else {
      <div
        #body
        data-part="body"
        data-part-body=""
        [attr.aria-busy]="loading() ? true : null"
        (keydown)="onKeyDown($event)"
        (pointerdown)="onPointerDown($event)"
      >
        <ng-container *ngTemplateOutlet="bodyContent" />
      </div>
    }

    <ng-template #bodyContent>
      <div data-part="loader" data-part-loader="">
        @if (loaderMounted()) {
          <div
            slProgressBar
            hideLabel
            size="sm"
            [loading]="loading()"
            [label]="t('loading')"
            [delay]="loadingDelayValue()"
            [minDuration]="loadingMinDurationValue()"
          ></div>
        }
      </div>
      @if (errorContent()) {
        <div data-part="error" data-part-error="">
          <ng-content select="[slEventCalendarError]" />
        </div>
      }

      @if (layout() === 'list') {
        <div data-part="list" data-part-list="">
          @for (day of listDrawing(); track day.iso) {
            <section
              data-part="list-day"
              data-part-list-day=""
              [attr.aria-labelledby]="day.headingId"
              [attr.data-date]="day.iso"
              [attr.data-today]="day.today ? '' : null"
            >
              <div
                data-part="list-day-heading"
                data-part-list-day-heading=""
                role="heading"
                [attr.aria-level]="level() + 1"
                [attr.id]="day.headingId"
                [attr.aria-label]="day.heading.label"
              >
                <span data-part="list-weekday" data-part-list-weekday="">{{
                  day.heading.weekday
                }}</span>
                <span data-part="list-date" data-part-list-date="">{{ day.heading.date }}</span>
              </div>
              <ul data-part="list-events" data-part-list-events="" role="list">
                @for (view of day.events; track view.key) {
                  <li>
                    <ng-container
                      *ngTemplateOutlet="eventTemplate; context: { $implicit: view, inGrid: false }"
                    />
                  </li>
                }
              </ul>
            </section>
          } @empty {
            <div data-part="empty" data-part-empty="">
              <p>{{ emptyText() }}</p>
              <ng-content select="[slEventCalendarEmpty]" />
            </div>
          }
        </div>
      } @else if (currentView() === 'month') {
        <table data-part="month" data-part-month="" role="grid" [attr.aria-labelledby]="titleId">
          <thead>
            <tr data-part="weekdays" data-part-weekdays="">
              @if (weekNumbersValue()) {
                <th data-part="week-number-header" data-part-week-number-header="" scope="col">
                  <span data-ui="visually-hidden" data-ui-visually-hidden="">{{
                    t('weekNumber')
                  }}</span>
                </th>
              }
              @for (name of monthDrawing().weekdays; track name.key) {
                <th data-part="weekday" data-part-weekday="" scope="col" [attr.abbr]="name.long">
                  {{ name.short }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of monthDrawing().rows; track row.key) {
              <tr
                data-part="week"
                data-part-week=""
                [style.--slotted-event-calendar-lanes]="maxEventsValue()"
              >
                @if (weekNumbersValue()) {
                  <th data-part="week-number" data-part-week-number="" scope="row">
                    {{ row.weekNumber }}
                  </th>
                }
                @for (cell of row.cells; track cell.iso) {
                  <td
                    data-part="day"
                    data-part-day=""
                    data-row="day"
                    role="gridcell"
                    [attr.data-date]="cell.iso"
                    [attr.tabindex]="cell.tabIndex"
                    [attr.aria-labelledby]="
                      id + '-day-' + cell.iso + ' ' + id + '-day-' + cell.iso + '-count'
                    "
                    [attr.aria-selected]="selectionMode() === 'range' ? cell.selected : null"
                    [attr.data-today]="cell.today ? '' : null"
                    [attr.data-outside-month]="cell.outside ? '' : null"
                    [attr.data-non-working]="cell.nonWorking ? '' : null"
                    [attr.data-selected]="cell.selected ? '' : null"
                  >
                    <div data-part="day-header" data-part-day-header="">
                      <button
                        data-part="day-number"
                        data-part-day-number=""
                        type="button"
                        tabindex="-1"
                        [attr.id]="id + '-day-' + cell.iso"
                        [attr.aria-label]="cell.label"
                        [attr.aria-haspopup]="narrow() ? 'dialog' : null"
                        (click)="drill(cell.date, $event)"
                      >
                        {{ cell.date.day }}
                      </button>
                      @if (dayContent(); as content) {
                        <div data-part="day-content" data-part-day-content="">
                          <ng-container
                            *ngTemplateOutlet="
                              content.template;
                              context: { $implicit: cell.date, view: currentView() }
                            "
                          />
                        </div>
                      }
                      <span
                        data-ui="visually-hidden"
                        data-ui-visually-hidden=""
                        [attr.id]="id + '-day-' + cell.iso + '-count'"
                        >{{ cell.count }}</span
                      >
                    </div>
                    <div data-part="day-events" data-part-day-events="">
                      @for (view of cell.events; track view.key) {
                        <ng-container
                          *ngTemplateOutlet="
                            eventTemplate;
                            context: { $implicit: view, inGrid: true }
                          "
                        />
                      }
                      @for (text of cell.continuations; track $index) {
                        <span data-part="continuation" data-part-continuation="">{{ text }}</span>
                      }
                      @if (cell.more > 0) {
                        <button
                          data-part="more"
                          data-part-more=""
                          type="button"
                          tabindex="-1"
                          aria-haspopup="dialog"
                          [attr.aria-expanded]="moreIso() === cell.iso"
                          [attr.aria-label]="cell.moreLabel"
                          (click)="openMore(cell.date, $event)"
                        >
                          +{{ cell.more }}<span>{{ t('more') }}</span>
                        </button>
                      }
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div
          data-part="time-grid"
          data-part-time-grid=""
          role="grid"
          [attr.aria-labelledby]="titleId"
          [style.--slotted-event-calendar-days]="timeDrawing().days"
          [style.--slotted-event-calendar-slot]="slotDurationValue()"
        >
          <div data-part="time-head" data-part-time-head="" role="rowgroup">
            <div data-part="columns" data-part-columns="" role="row">
              <div data-part="zone" data-part-zone="" role="columnheader">
                {{ timeDrawing().zone }}
              </div>
              @for (column of timeDrawing().headers; track column.iso) {
                <div
                  data-part="column-header"
                  data-part-column-header=""
                  data-row="header"
                  role="columnheader"
                  [attr.data-date]="column.iso"
                  [attr.tabindex]="column.tabIndex"
                  [attr.data-today]="column.today ? '' : null"
                  [attr.data-offset-change]="column.offsetShort === null ? null : ''"
                >
                  <span data-part="weekday" data-part-weekday="" aria-hidden="true">{{
                    column.weekday
                  }}</span>
                  <button
                    data-part="day-number"
                    data-part-day-number=""
                    type="button"
                    tabindex="-1"
                    [attr.aria-label]="column.label"
                    (click)="drill(column.date, $event)"
                  >
                    {{ column.date.day }}
                  </button>
                  @if (dayContent(); as content) {
                    <div data-part="day-content" data-part-day-content="">
                      <ng-container
                        *ngTemplateOutlet="
                          content.template;
                          context: { $implicit: column.date, view: currentView() }
                        "
                      />
                    </div>
                  }
                  @if (column.offsetShort !== null) {
                    <span
                      data-part="offset-change"
                      data-part-offset-change=""
                      role="note"
                      [attr.aria-label]="column.offsetLong"
                      >{{ column.offsetShort }}</span
                    >
                  }
                </div>
              }
            </div>
            <div
              data-part="all-day-row"
              data-part-all-day-row=""
              role="row"
              [style.--slotted-event-calendar-lanes]="timeDrawing().lanes"
            >
              <div data-part="all-day-label" data-part-all-day-label="" role="rowheader">
                {{ t('allDay') }}
              </div>
              @for (cell of timeDrawing().allDay; track cell.iso) {
                <div
                  data-part="all-day-cell"
                  data-part-all-day-cell=""
                  data-row="all-day"
                  role="gridcell"
                  [attr.data-date]="cell.iso"
                  [attr.tabindex]="cell.tabIndex"
                  [attr.aria-selected]="selectionMode() === 'range' ? cell.selected : null"
                  [attr.data-today]="cell.today ? '' : null"
                  [attr.data-non-working]="cell.nonWorking ? '' : null"
                  [attr.data-selected]="cell.selected ? '' : null"
                >
                  @for (view of cell.events; track view.key) {
                    <ng-container
                      *ngTemplateOutlet="eventTemplate; context: { $implicit: view, inGrid: true }"
                    />
                  }
                  @for (text of cell.continuations; track $index) {
                    <span data-part="continuation" data-part-continuation="">{{ text }}</span>
                  }
                </div>
              }
            </div>
          </div>
          <div #scroller data-part="scroller" data-part-scroller="" role="rowgroup">
            <div data-part="time-row" data-part-time-row="" role="row">
              <div data-part="gutter" data-part-gutter="" role="rowheader">
                <span data-ui="visually-hidden" data-ui-visually-hidden="">{{ t('timed') }}</span>
                @for (hour of timeDrawing().hours; track hour.hour) {
                  <span data-part="hour" data-part-hour="" aria-hidden="true">{{
                    hour.label
                  }}</span>
                }
              </div>
              @for (column of timeDrawing().columns; track column.iso) {
                <div
                  data-part="column"
                  data-part-column=""
                  data-row="timed"
                  role="gridcell"
                  [attr.data-date]="column.iso"
                  [attr.tabindex]="column.tabIndex"
                  [attr.data-today]="column.today ? '' : null"
                  [attr.data-non-working]="column.nonWorking ? '' : null"
                >
                  @for (off of column.offHours; track $index) {
                    <div
                      data-part="off-hours"
                      data-part-off-hours=""
                      aria-hidden="true"
                      [style]="off"
                    ></div>
                  }
                  @if (column.offsetLine; as line) {
                    <div
                      data-part="offset-line"
                      data-part-offset-line=""
                      aria-hidden="true"
                      [style]="line"
                    ></div>
                  }
                  @if (column.selection; as chosen) {
                    <div
                      data-part="selection"
                      data-part-selection=""
                      aria-hidden="true"
                      [style]="chosen.style"
                    >
                      {{ chosen.text }}
                    </div>
                  }
                  @for (view of column.items; track view.key) {
                    <ng-container
                      *ngTemplateOutlet="eventTemplate; context: { $implicit: view, inGrid: true }"
                    />
                  }
                  @for (entry of column.more; track $index) {
                    <button
                      data-part="more"
                      data-part-more=""
                      type="button"
                      tabindex="-1"
                      aria-haspopup="dialog"
                      [attr.aria-expanded]="moreIso() === column.iso"
                      [attr.aria-label]="entry.label"
                      [attr.data-overlay]="entry.overlay ? '' : null"
                      [style]="entry.style"
                      (click)="openMore(column.date, $event)"
                    >
                      +{{ entry.count }}<span>{{ t('more') }}</span>
                    </button>
                  }
                  @if (column.now; as now) {
                    <div data-part="now" data-part-now="" aria-hidden="true" [style]="now"></div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </ng-template>

    <!-- Below the compact size class the "+N" panel and the detail are sheets
         from the bottom edge, inside the root: a region that contains its fixed
         layers (a phone frame, a pane) keeps them. -->
    @if (narrow()) {
      <sl-drawer
        side="bottom"
        [container]="host"
        [finalFocus]="moreAnchor() ?? undefined"
        [open]="moreIso() !== null"
        (openChange)="onMoreOpen($event)"
      >
        @if (moreDate(); as date) {
          <div slDrawerResizer></div>
          <div slDrawerHeader>
            <h2 slDrawerTitle>{{ dateLabel(date) }}</h2>
            <button slDrawerClose></button>
          </div>
          <div slDrawerBody>
            <ul
              data-part="list-events"
              data-part-list-events=""
              data-layout="stacked"
              role="list"
              [attr.aria-label]="t('dayEvents', { day: dateLabel(date) })"
            >
              @for (view of moreViews(); track view.key) {
                <li>
                  <ng-container
                    *ngTemplateOutlet="eventTemplate; context: { $implicit: view, inGrid: false }"
                  />
                </li>
              }
            </ul>
          </div>
        }
      </sl-drawer>
      @if (detail(); as template) {
        <sl-drawer
          side="bottom"
          [container]="host"
          [finalFocus]="detailAnchor() ?? undefined"
          [open]="openOccurrence() !== null"
          (openChangeRequest)="onDetailRequest($event)"
        >
          @if (openOccurrence(); as occurrence) {
            <div slDrawerResizer></div>
            <div slDrawerHeader>
              <h2 slDrawerTitle>{{ occurrence.event.title }}</h2>
              <p slDrawerDescription>
                @if (whenOf(occurrence); as when) {
                  @if (when.day !== null) {
                    <span data-part="detail-day" data-part-detail-day="">{{ when.day }},</span
                    >{{ ' ' }}
                  }
                  <span data-part="detail-range" data-part-detail-range="">{{ when.range }}</span>
                }
              </p>
              <button slDrawerClose></button>
            </div>
            <div slDrawerBody>
              <ng-container
                *ngTemplateOutlet="
                  template.template;
                  context: { $implicit: occurrence, close: closeDetail }
                "
              />
            </div>
          }
        </sl-drawer>
      }
    } @else {
      <ng-container
        slPopover
        #morePopover="slPopover"
        [portal]="false"
        [open]="moreIso() !== null"
        (openChange)="onMoreOpen($event)"
      >
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            @if (moreDate(); as date) {
              <div slPopoverHeader>
                <div slPopoverTitle>{{ dateLabel(date) }}</div>
                <button slPopoverClose></button>
              </div>
              <div slPopoverBody>
                <ul
                  data-part="list-events"
                  data-part-list-events=""
                  data-layout="stacked"
                  role="list"
                  [attr.aria-label]="t('dayEvents', { day: dateLabel(date) })"
                >
                  @for (view of moreViews(); track view.key) {
                    <li>
                      <ng-container
                        *ngTemplateOutlet="
                          eventTemplate;
                          context: { $implicit: view, inGrid: false }
                        "
                      />
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        </ng-template>
      </ng-container>

      @if (detail(); as template) {
        <ng-container
          slPopover
          #detailPopover="slPopover"
          size="lg"
          [portal]="false"
          [open]="openOccurrence() !== null"
          (openChangeRequest)="onDetailRequest($event)"
        >
          <ng-template slPopoverLayer>
            <div slPopoverContent>
              @if (openOccurrence(); as occurrence) {
                <div slPopoverHeader>
                  <div slPopoverTitle>{{ occurrence.event.title }}</div>
                  <div slPopoverDescription>
                    @if (whenOf(occurrence); as when) {
                      @if (when.day !== null) {
                        <span data-part="detail-day" data-part-detail-day="">{{ when.day }},</span
                        >{{ ' ' }}
                      }
                      <span data-part="detail-range" data-part-detail-range="">{{
                        when.range
                      }}</span>
                    }
                  </div>
                  <button slPopoverClose></button>
                </div>
                <div slPopoverBody>
                  <ng-container
                    *ngTemplateOutlet="
                      template.template;
                      context: { $implicit: occurrence, close: closeDetail }
                    "
                  />
                </div>
              }
            </div>
          </ng-template>
        </ng-container>
      }
    }

    <ng-template #eventTemplate let-view let-inGrid="inGrid">
      @if (view.href !== null) {
        <a
          data-part="event"
          data-part-event=""
          [attr.href]="view.href"
          [attr.tabindex]="inGrid ? -1 : null"
          [attr.data-key]="view.key"
          [attr.data-all-day]="view.allDay ? '' : null"
          [attr.data-bar]="view.bar ? '' : null"
          [attr.data-color]="view.color"
          [attr.data-status]="view.status"
          [attr.data-open]="view.open ? '' : null"
          [attr.data-continues-before]="view.continuesBefore ? '' : null"
          [attr.data-continues-after]="view.continuesAfter ? '' : null"
          [attr.data-clipped-start]="view.clippedStart ? '' : null"
          [attr.data-clipped-end]="view.clippedEnd ? '' : null"
          [attr.data-short]="view.short ? '' : null"
          [attr.data-editable]="view.editable ? '' : null"
          [attr.data-past]="view.past ? '' : null"
          [attr.data-dragging]="view.dragging ? '' : null"
          [attr.data-drop-invalid]="view.dropInvalid ? '' : null"
          [attr.data-context]="view.context ? '' : null"
          [style]="view.style"
          ><ng-container *ngTemplateOutlet="eventContent; context: { $implicit: view }"
        /></a>
      } @else {
        <button
          data-part="event"
          data-part-event=""
          type="button"
          [attr.tabindex]="inGrid ? -1 : null"
          [attr.data-key]="view.key"
          [attr.data-all-day]="view.allDay ? '' : null"
          [attr.data-bar]="view.bar ? '' : null"
          [attr.data-color]="view.color"
          [attr.data-status]="view.status"
          [attr.data-open]="view.open ? '' : null"
          [attr.data-continues-before]="view.continuesBefore ? '' : null"
          [attr.data-continues-after]="view.continuesAfter ? '' : null"
          [attr.data-clipped-start]="view.clippedStart ? '' : null"
          [attr.data-clipped-end]="view.clippedEnd ? '' : null"
          [attr.data-short]="view.short ? '' : null"
          [attr.data-editable]="view.editable ? '' : null"
          [attr.data-past]="view.past ? '' : null"
          [attr.data-dragging]="view.dragging ? '' : null"
          [attr.data-drop-invalid]="view.dropInvalid ? '' : null"
          [attr.data-context]="view.context ? '' : null"
          [attr.aria-expanded]="hostsDetail() || currentOpen() !== null ? view.open : null"
          [attr.aria-haspopup]="hostsDetail() ? 'dialog' : null"
          [style]="view.style"
          (click)="activate(view, $event)"
        >
          <ng-container *ngTemplateOutlet="eventContent; context: { $implicit: view }" />
        </button>
      }
    </ng-template>

    <ng-template #eventContent let-view>
      @if (view.bar && view.continuesBefore) {
        <span slIcon size="sm" data-edge="start"><svg slGlyph name="chevron-right"></svg></span>
      }
      @if (eventContentTemplate(); as custom) {
        <ng-container
          *ngTemplateOutlet="
            custom.template;
            context: {
              $implicit: view.occurrence,
              layout: view.layout,
              date: view.date,
              time: view.time,
            }
          "
        />
      } @else {
        @if (view.time !== null) {
          <span data-part="event-time" data-part-event-time="">{{ view.time }}</span>
        }
        <span data-part="event-title" data-part-event-title="">{{ view.title }}</span>
        @if (view.location) {
          <span data-part="event-location" data-part-event-location="">{{ view.location }}</span>
        }
      }
      <span data-part="event-meta" data-part-event-meta="">{{ view.meta }}</span>
      @if (view.bar && view.continuesAfter) {
        <span slIcon size="sm" data-edge="end"><svg slGlyph name="chevron-right"></svg></span>
      }
      @if (view.resizable) {
        <span aria-hidden="true" data-part="resize-handle" data-part-resize-handle=""></span>
      }
    </ng-template>
  `,
  styleUrls: [
    '../../../styles/src/event-calendar/event-calendar.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'event-calendar',
    'data-ui-event-calendar': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-view]': 'currentView()',
    '[attr.data-layout]': 'layout()',
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-slot-duration]': 'slotDurationValue()',
  },
})
export class SlEventCalendar implements OnInit {
  readonly events = input<readonly CalendarEvent[]>([]);
  readonly calendars = input<readonly EventCalendarCalendar[]>([]);
  /** The views the switcher offers, in order. */
  readonly views = input<readonly EventCalendarView[]>(ALL_VIEWS);

  /** The day the calendar is on. Two-way. */
  readonly date = model<PlainDate | undefined>(undefined);
  readonly defaultDate = input<PlainDate | undefined>(undefined);
  /**
   * Now, in the calendar's zone. Bound means the consumer owns it: the clock
   * is no longer read, so a page dated by its content marks the same today on
   * every machine and at every minute.
   */
  readonly now = input<PlainDateTime | undefined>(undefined);
  readonly view = model<EventCalendarView | undefined>(undefined);
  readonly defaultView = input<EventCalendarView | undefined>(undefined);
  /** Keys of the calendars drawn. Unbound starts with all of them. */
  readonly visibleCalendars = model<readonly string[] | undefined>(undefined);
  readonly defaultVisibleCalendars = input<readonly string[] | undefined>(undefined);
  readonly selectionMode = input<EventCalendarSelectionMode>('none');
  readonly selection = model<EventCalendarSelection | null | undefined>(undefined);
  readonly defaultSelection = input<EventCalendarSelection | null | undefined>(undefined);
  /** The key of the occurrence whose detail is open. */
  readonly openEvent = model<string | null | undefined>(undefined);
  readonly defaultOpenEvent = input<string | null | undefined>(undefined);

  /** Keeps an occurrence when it returns true — a search, a `filter-bar` predicate. */
  readonly filter = input<((occurrence: EventOccurrence) => boolean) | undefined>(undefined);
  /** Events move and resize, by dragging or by Alt and the arrows; a predicate decides per occurrence. */
  readonly editable = input<boolean | ((occurrence: EventOccurrence) => boolean), unknown>(false, {
    transform: (value) =>
      typeof value === 'function'
        ? (value as (occurrence: EventOccurrence) => boolean)
        : booleanAttribute(value),
  });
  readonly workingHours = input<readonly WorkingHours[]>([]);
  readonly header = input(true, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly level = input(2, { transform: numberAttribute });

  readonly compact = input<EventCalendarCompact | undefined>(undefined);
  readonly dayHours = input<readonly [number, number] | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly fixedWeeks = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly hourCycle = input<EventCalendarHourCycle | undefined>(undefined);
  readonly listRange = input<EventCalendarListRange | undefined>(undefined);
  readonly loadingDelay = input<number | undefined>(undefined);
  readonly loadingMinDuration = input<number | undefined>(undefined);
  /** BCP 47. Unset, the language in force (`provideSlotted`) decides. */
  readonly locale = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * toolbar, the views, the empty and loading states, the counts and the
   * sentences said aloud.
   */
  readonly messages = input<PartialMessages<EventCalendarMessages> | undefined>(undefined);
  readonly maxColumns = input<number | undefined>(undefined);
  readonly maxEvents = input<number | undefined>(undefined);
  readonly scrollTime = input<PlainTime | undefined>(undefined);
  /** Minutes, 5 to 120: the lighter rules and the step of a selection or a drag. */
  readonly slotDuration = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly timeZone = input<string | undefined>(undefined);
  readonly weekends = input<EventCalendarWeekends | undefined>(undefined);
  readonly weekNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  readonly dateRequest = output<ChangeRequest<PlainDate>>();
  readonly viewRequest = output<ChangeRequest<EventCalendarView>>();
  readonly visibleCalendarsRequest = output<ChangeRequest<readonly string[]>>();
  readonly selectionRequest = output<ChangeRequest<EventCalendarSelection | null>>();
  readonly openEventRequest = output<ChangeRequest<string | null>>();
  /**
   * Before an event moves or its end does. Not a model: the family holds no
   * event, and the application answers by changing `events`.
   */
  readonly eventChangeRequest = output<ChangeRequest<EventCalendarEventChange>>();
  /**
   * Whether an event may land where it is being moved, asked with the change
   * `eventChangeRequest` would carry: at every step of a drag, and at every
   * step Alt and an arrow try. A refused destination is drawn as refused, and
   * letting go there puts the event back and asks for nothing.
   */
  readonly canDrop = input<((change: EventCalendarEventChange) => boolean) | undefined>(undefined);
  /** A fact, after the period in view changes: fetch it. */
  readonly rangeChange = output<EventCalendarRange>();

  protected readonly eventContentTemplate = contentChild(SlEventCalendarEvent);
  protected readonly detail = contentChild(SlEventCalendarDetail);
  protected readonly dayContent = contentChild(SlEventCalendarDayContent);
  protected readonly actions = contentChild(SlEventCalendarActions);
  protected readonly empty = contentChild(SlEventCalendarEmpty);
  protected readonly errorContent = contentChild(SlEventCalendarError);

  /* Read as the element: with a context menu the trigger component stands on it. */
  private readonly body = viewChild<string, ElementRef<HTMLElement>>('body', { read: ElementRef });
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly filterButton = viewChild<ElementRef<HTMLElement>>('filterButton');
  private readonly morePopover = viewChild<SlPopover>('morePopover');
  private readonly detailPopover = viewChild<SlPopover>('detailPopover');

  private readonly defaults = injectEventCalendarDefaults();
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly id = `sl-event-calendar-${String((sequence += 1))}`;
  protected readonly titleId = `${this.id}-title`;

  /* ── Resolved options ──────────────────────────────────────────────── */

  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this calendar's `messages` laid over them. */
  readonly t = injectMessages(eventCalendarMessages, this.messages);
  private readonly localeValue = computed(() => this.locale() ?? this.appLocale());
  private readonly zoneValue = computed(() => this.timeZone() ?? this.defaults.timeZone);
  private readonly cycleValue = computed(() => this.hourCycle() ?? this.defaults.hourCycle);
  private readonly hoursValue = computed(() => this.dayHours() ?? this.defaults.dayHours);
  protected readonly slotDurationValue = computed(() =>
    slotMinutes(this.slotDuration() ?? this.defaults.slotDuration),
  );
  private readonly scrollValue = computed(() => this.scrollTime() ?? this.defaults.scrollTime);
  protected readonly maxEventsValue = computed(() =>
    Math.max(1, this.maxEvents() ?? this.defaults.maxEvents),
  );
  private readonly maxColumnsValue = computed(() =>
    Math.max(2, this.maxColumns() ?? this.defaults.maxColumns),
  );
  /**
   * As many columns as blocks of 64 pixels — a word of a wrapped title and its
   * padding — fit in a day's column, never more than `maxColumns`; with one,
   * the first column's events are drawn whole and the rest is a count laid
   * over them. The event's container query has already hidden the time at
   * this width.
   */
  private readonly columnsThatFit = computed(() => {
    const width = this.columnWidth();
    const most = this.maxColumnsValue();
    return width === null ? most : Math.max(1, Math.min(most, Math.floor(width / 64)));
  });
  protected readonly weekNumbersValue = computed(
    () => this.weekNumbers() ?? this.defaults.weekNumbers,
  );
  protected readonly loadingDelayValue = computed(
    () => this.loadingDelay() ?? this.defaults.loadingDelay,
  );
  protected readonly loadingMinDurationValue = computed(
    () => this.loadingMinDuration() ?? this.defaults.loadingMinDuration,
  );
  private readonly viewOptions = computed(() => ({
    firstDayOfWeek: createDateFormat({
      locale: this.localeValue(),
      firstDayOfWeek: this.firstDayOfWeek() ?? this.defaults.firstDayOfWeek,
    }).firstDayOfWeek,
    weekends: this.weekends() ?? this.defaults.weekends,
    fixedWeeks: this.fixedWeeks() ?? this.defaults.fixedWeeks,
    listRange: this.listRange() ?? this.defaults.listRange,
  }));

  /* ── The five models ───────────────────────────────────────────────── */

  private readonly firstDate = signal<PlainDate | null>(null);
  protected readonly currentDate = computed(
    () => this.date() ?? this.firstDate() ?? todayIn(this.zoneValue()),
  );
  /** Which view is showing. Public, so a template reaches it through `exportAs`. */
  readonly currentView = computed<EventCalendarView>(
    () => this.view() ?? this.defaultView() ?? this.views()[0] ?? 'month',
  );
  protected readonly shown = computed(
    () =>
      this.visibleCalendars() ??
      this.defaultVisibleCalendars() ??
      this.calendars().map((entry) => entry.key),
  );
  private readonly currentSelection = computed(() => {
    const held = this.selection();
    return held === undefined ? (this.defaultSelection() ?? null) : held;
  });
  protected readonly currentOpen = computed(() => {
    const held = this.openEvent();
    return held === undefined ? (this.defaultOpenEvent() ?? null) : held;
  });

  /* ── Time ──────────────────────────────────────────────────────────── */

  private readonly clock = signal<PlainDateTime | null>(null);
  private readonly resolvedNow = computed(() => this.now() ?? this.clock());
  private readonly today = computed(() => this.resolvedNow()?.date ?? null);
  protected readonly narrow = signal(false);
  private readonly row = signal<GridRow>('timed');
  private readonly pending = signal<EventCalendarSelection | null>(null);
  protected readonly moreDate = signal<PlainDate | null>(null);
  protected readonly moreIso = computed(() => {
    const date = this.moreDate();
    return date === null ? null : toISODate(date);
  });
  protected readonly detailAnchor = signal<HTMLElement | null>(null);
  /** The "+N" or the day number a day's sheet returns focus to. */
  protected readonly moreAnchor = signal<HTMLElement | null>(null);

  protected readonly layout = computed<'grid' | 'list'>(() => {
    const view = this.currentView();
    const compact = this.compact() ?? this.defaults.compact;
    return view === 'list' ||
      (this.narrow() && compact === 'list' && (view === 'month' || view === 'week'))
      ? 'list'
      : 'grid';
  });

  protected readonly range = computed(() => {
    const view = this.currentView();
    const date = this.currentDate();
    const options = this.viewOptions();
    return this.layout() === 'list' && view !== 'list'
      ? viewRange('list', date, { ...options, listRange: view === 'month' ? 'month' : 'week' })
      : viewRange(view, date, options);
  });

  private readonly collator = computed(() => new Intl.Collator(this.localeValue()));
  private readonly occurrences = computed(() => {
    const range = this.range();
    const keys = this.calendars().map((entry) => entry.key);
    const shown = this.shown();
    const filter = this.filter();
    return occurrencesIn(this.events(), range.start, range.end, {
      collator: this.collator(),
    }).filter(
      (occurrence) =>
        (occurrence.event.calendar === undefined ||
          !keys.includes(occurrence.event.calendar) ||
          shown.includes(occurrence.event.calendar)) &&
        (filter === undefined || filter(occurrence)),
    );
  });

  private readonly canEdit = computed(() => {
    const editable = this.editable();
    return typeof editable === 'function' ? editable : () => editable;
  });

  /**
   * The occurrence a pointer is moving, drawn where it would land: the views
   * lay the proposal out like any other placement, so a moved block takes its
   * columns and pushes its neighbours as it will once the application agrees.
   */
  private readonly editing = signal<{
    key: string;
    placement: EventPlacement;
    invalid: boolean;
  } | null>(null);
  private readonly laidOut = computed(() => {
    const editing = this.editing();
    const occurrences = this.occurrences();
    return editing === null
      ? occurrences
      : withPlacement(occurrences, editing.key, editing.placement);
  });

  protected readonly title = computed(() =>
    viewTitle(this.currentView(), this.range(), this.currentDate(), {
      locale: this.localeValue(),
      listRange: this.currentView() === 'list' ? this.viewOptions().listRange : undefined,
    }),
  );

  private readonly drawingInput = computed<DrawingInput>(() => ({
    id: this.id,
    t: this.t,
    locale: this.localeValue(),
    hourCycle: this.cycleValue(),
    timeZone: this.zoneValue(),
    view: this.currentView(),
    date: this.currentDate(),
    today: this.today(),
    now: this.resolvedNow(),
    calendars: this.calendars(),
    openKey: this.currentOpen(),
    selection: this.pending() ?? this.contextSlot() ?? this.currentSelection(),
    narrow: this.narrow(),
    maxEvents: this.maxEventsValue(),
    maxColumns: this.columnsThatFit(),
    dayHours: this.hoursValue(),
    workingHours: this.workingHours(),
    row: this.row(),
    canEdit: this.canEdit(),
    draggingKey: this.editing()?.key ?? null,
    dropInvalid: this.editing()?.invalid ?? false,
    contextKey: this.contextKey(),
  }));

  protected readonly monthDrawing = computed(() =>
    drawMonth(this.drawingInput(), this.range().weeks, this.laidOut()),
  );
  protected readonly timeDrawing = computed(() =>
    drawTimeGrid(this.drawingInput(), this.range().days, this.laidOut()),
  );
  protected readonly listDrawing = computed(() =>
    drawList(this.drawingInput(), this.range().days, this.laidOut()),
  );
  protected readonly moreViews = computed(() => {
    const date = this.moreDate();
    if (date === null) return [];
    return (
      drawList(this.drawingInput(), [date], occurrencesOn(this.occurrences(), date))[0]?.events ??
      []
    );
  });
  protected readonly openOccurrence = computed(() => {
    const key = this.currentOpen();
    return key === null ? null : (this.occurrences().find((entry) => entry.key === key) ?? null);
  });
  protected readonly hostsDetail = computed(() => this.detail() !== undefined);
  protected readonly emptyKey = computed(() =>
    this.currentView() === 'month' ? 'month' : this.currentView() === 'day' ? 'day' : 'week',
  );
  /** The empty state's sentence for the period in view. */
  protected readonly emptyText = computed(() => this.t(`empty.${this.emptyKey()}` as const));
  /** The names of the two steps, which say how far each one moves. */
  protected readonly previousLabel = computed(() =>
    this.t(`previous.${this.currentView()}` as const),
  );
  protected readonly nextLabel = computed(() => this.t(`next.${this.currentView()}` as const));
  /** A view's name in the switcher. */
  protected viewLabel(view: EventCalendarView): string {
    return this.t(`view.${view}` as const);
  }

  /**
   * The indicator exists while there is a wait, and a little after: through
   * the delay it may still be withheld in, and the hold it keeps once shown.
   * Mounted with nothing to report it was an element that is only `hidden`,
   * and a `hidden` progress bar is still painted in its linear shape.
   */
  protected readonly loaderMounted = signal(false);

  /** One day's column, measured: a cluster never draws blocks too narrow for a word. */
  private readonly columnWidth = signal<number | null>(null);

  private selectionAnchor: PlainDate | null = null;
  private drag:
    | { kind: 'days'; anchor: PlainDate }
    | { kind: 'hours'; date: PlainDate; anchor: number; column: HTMLElement }
    | null = null;
  private edit: {
    occurrence: EventOccurrence;
    kind: 'move' | 'resize';
    row: string;
    date: PlainDate;
    x: number;
    y: number;
    started: boolean;
    placement: EventPlacement;
    invalid: boolean;
  } | null = null;
  /** A drag ends in a click on the event it moved; that click opens nothing. */
  private swallowClick = false;

  protected readonly closeDetail = () => this.requestOpen(null, 'programmatic');

  /* ── Context menu ──────────────────────────────────────────────────── */

  protected readonly contextMenu = contentChild(SlEventCalendarContextMenu);
  private readonly contextMenuRef = viewChild<SlMenu>('contextMenuRef');
  /* The items are the application's template, declared outside the menu: an
     embedded view injects from where it was declared, so the menu is given
     to them. */
  protected readonly contextInjector = computed(() => {
    const menu = this.contextMenuRef();
    return menu === undefined
      ? null
      : Injector.create({
          providers: [{ provide: SlMenu, useValue: menu }],
          parent: this.injector,
        });
  });

  /**
   * The target of the menu that shows, and the element it stands on. Its event
   * carries `data-context`; its stretch is drawn as the selection being made,
   * so the reader sees what "New event" will cover before choosing it.
   */
  protected readonly contextOn = signal<{
    target: EventCalendarContextTarget;
    element: HTMLElement;
  } | null>(null);
  /* What the press that is opening the menu pointed at, resolved before the
     family asks to open; the request is refused when it pointed at nothing. */
  private aimed: { target: EventCalendarContextTarget; element: HTMLElement } | null = null;

  private readonly contextKey = computed(() => {
    const on = this.contextOn();
    return on?.target.kind === 'event' ? on.target.occurrence.key : null;
  });
  private readonly contextSlot = computed(() => {
    const on = this.contextOn();
    return on?.target.kind === 'slot' ? on.target.slot : null;
  });
  protected readonly contextLabel = computed(() => {
    const on = this.contextOn();
    if (on === null) return undefined;
    return on.target.kind === 'event'
      ? on.target.occurrence.event.title
      : this.stretchWords(on.target.slot);
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    /* Now, ticked on the minute after the first paint. */
    afterNextRender(() => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const tick = () => {
        if (this.now() === undefined) this.clock.set(nowDateTimeIn(this.zoneValue()));
        timer = setTimeout(tick, 60_000 - (Date.now() % 60_000));
      };
      tick();
      const gate = createWidthGate(this.host, {
        at: COMPACT_BELOW,
        onChange: (narrow) => this.narrow.set(narrow),
      });
      this.narrow.set(gate.narrow());
      destroyRef.onDestroy(() => {
        clearTimeout(timer);
        gate.destroy();
      });
    });

    /* The period in view, reported after it changes. */
    let reported: string | null = null;
    effect(() => {
      const range = this.range();
      const view = this.currentView();
      const key = `${toISODate(range.start)}/${toISODate(range.end)}/${view}`;
      if (key === reported) return;
      reported = key;
      untracked(() => this.rangeChange.emit({ start: range.start, end: range.end, view }));
    });

    /* `slMenuTriggerFor` binds `data-part` to null on its own element, which
       erases the part this family wrote; the expression is a constant, so the
       part written back after the first render stays. */
    afterRenderEffect(() => {
      const button = this.filterButton()?.nativeElement;
      if (button !== undefined && button.getAttribute('data-part') !== 'filter') {
        writeSelectorKey(button, 'part', 'filter');
      }
    });

    /* The detail stands on the event that opened it, or on the "+N" it came from. */
    afterRenderEffect(() => {
      const popover = this.detailPopover();
      const key = this.currentOpen();
      if (popover === undefined || key === null) return;
      const drawn = this.eventElement(key);
      popover.anchorNode.set(drawn ?? this.detailAnchor());
    });

    /* Entering the hours scrolls to the working morning; paging keeps the place. */
    let enteredHours = false;
    afterRenderEffect(() => {
      const inHours =
        this.layout() === 'grid' && (this.currentView() === 'week' || this.currentView() === 'day');
      if (inHours && !enteredHours) untracked(() => this.scrollToTime(this.scrollValue()));
      enteredHours = inHours;
    });

    effect((onCleanup) => {
      if (this.loading()) {
        this.loaderMounted.set(true);
        return;
      }
      const timer = setTimeout(
        () => this.loaderMounted.set(false),
        untracked(() => this.loadingDelayValue() + this.loadingMinDurationValue()),
      );
      onCleanup(() => clearTimeout(timer));
    });

    let observer: ResizeObserver | null = null;
    let observed: Element | null = null;
    afterRenderEffect(() => {
      this.currentView();
      const column = this.scroller()?.nativeElement.querySelector("[data-part='column']") ?? null;
      if (column === observed) return;
      observer?.disconnect();
      observed = column;
      if (column === null || typeof ResizeObserver === 'undefined') {
        untracked(() => this.columnWidth.set(null));
        return;
      }
      const measure = () => this.columnWidth.set(column.getBoundingClientRect().width || null);
      observer = new ResizeObserver(measure);
      observer.observe(column);
      untracked(measure);
    });
    destroyRef.onDestroy(() => observer?.disconnect());

    /* A template binds no capture phase; the click a drag ends in is stopped here. */
    this.host.addEventListener('click', this.onClickCapture, true);
    this.host.addEventListener('contextmenu', this.onContextCapture, true);
    this.host.addEventListener('keydown', this.onContextKeyCapture, true);
    this.host.addEventListener('pointerdown', this.onPressCapture, true);
    destroyRef.onDestroy(() => {
      this.host.removeEventListener('click', this.onClickCapture, true);
      this.host.removeEventListener('contextmenu', this.onContextCapture, true);
      this.host.removeEventListener('keydown', this.onContextKeyCapture, true);
      this.host.removeEventListener('pointerdown', this.onPressCapture, true);
    });

    /* One polite announcement per wait, after the delay the indicator waits. */
    effect((onCleanup) => {
      if (!this.loading()) return;
      const words = untracked(() => this.t('loading'));
      const timer = setTimeout(
        () => getLiveAnnouncer().announce(words),
        untracked(() => this.loadingDelayValue()),
      );
      onCleanup(() => clearTimeout(timer));
    });
  }

  ngOnInit() {
    this.firstDate.set(this.defaultDate() ?? todayIn(this.zoneValue()));
    if (this.writtenLabel !== null) this.host.setAttribute('aria-label', this.writtenLabel);
  }

  /* ── Requests ──────────────────────────────────────────────────────── */

  requestDate(next: PlainDate, reason: ChangeReason, source?: unknown): boolean {
    const accepted = ask(this.currentDate(), next, isSameDate, reason, source, (request) =>
      this.dateRequest.emit(request),
    );
    if (accepted) this.date.set(next);
    return accepted;
  }

  requestView(next: EventCalendarView, reason: ChangeReason, source?: unknown): boolean {
    const accepted = ask(this.currentView(), next, Object.is, reason, source, (request) =>
      this.viewRequest.emit(request),
    );
    if (accepted) this.view.set(next);
    return accepted;
  }

  private requestVisible(next: readonly string[], reason: ChangeReason, source?: unknown) {
    const accepted = ask(this.shown(), next, sameKeys, reason, source, (request) =>
      this.visibleCalendarsRequest.emit(request),
    );
    if (accepted) this.visibleCalendars.set(next);
    return accepted;
  }

  requestSelection(next: EventCalendarSelection | null, reason: ChangeReason, source?: unknown) {
    const accepted = ask(this.currentSelection(), next, sameSelection, reason, source, (request) =>
      this.selectionRequest.emit(request),
    );
    if (accepted) this.selection.set(next);
    return accepted;
  }

  requestOpen(next: string | null, reason: ChangeReason, source?: unknown) {
    const accepted = ask(this.currentOpen(), next, Object.is, reason, source, (request) =>
      this.openEventRequest.emit(request),
    );
    if (accepted) this.openEvent.set(next);
    return accepted;
  }

  /** The change the family would ask for: `canDrop` and `eventChangeRequest` read the same one. */
  private changeFor(
    occurrence: EventOccurrence,
    placement: EventPlacement,
    kind: 'move' | 'resize',
  ): EventCalendarEventChange {
    return {
      key: occurrence.key,
      event: occurrence.event,
      occurrence: occurrence.start.date,
      recurring: occurrence.recurring,
      kind,
      ...placeOccurrence(placement),
    } as EventCalendarEventChange;
  }

  private allows(occurrence: EventOccurrence, placement: EventPlacement, kind: 'move' | 'resize') {
    const canDrop = this.canDrop();
    return canDrop === undefined || canDrop(this.changeFor(occurrence, placement, kind));
  }

  /** Asks the application to put an occurrence somewhere else; the family holds no event. */
  requestEventChange(
    occurrence: EventOccurrence,
    placement: EventPlacement,
    kind: 'move' | 'resize',
    reason: ChangeReason,
    source?: unknown,
  ): boolean {
    const change = (value: EventPlacement) => this.changeFor(occurrence, value, kind);
    const accepted = ask(
      change(placementOf(occurrence)),
      change(placement),
      sameChange,
      reason,
      source,
      (request) => this.eventChangeRequest.emit(request),
    );
    if (accepted) {
      getLiveAnnouncer().announce(
        `${occurrence.event.title}, ${formatOccurrence(
          { ...occurrence, start: placement.start, end: placement.end },
          { locale: this.localeValue(), hourCycle: this.cycleValue() },
        )}`,
      );
    }
    return accepted;
  }

  /* ── The imperative actions ────────────────────────────────────────── */

  /** Puts focus on the cell holding the grid's tab stop, or the first event of a list. */
  focus() {
    const body = this.body()?.nativeElement;
    (
      body?.querySelector<HTMLElement>("[data-row][tabindex='0']") ??
      body?.querySelector<HTMLElement>("[data-part='event']")
    )?.focus();
  }

  /** Moves the calendar to a date and focuses its cell. */
  focusDate(next: PlainDate) {
    const row = this.currentView() === 'month' ? 'day' : this.row();
    this.requestDate(next, 'programmatic');
    this.focusCell(next, row);
  }

  /** Focuses an occurrence that is drawn, by key; returns whether one was. */
  focusEvent(key: string): boolean {
    const element = this.eventElement(key);
    element?.focus();
    return element !== null;
  }

  /** Scrolls the hours so `time` is at the top. */
  scrollToTime(time: PlainTime) {
    const scroller = this.scroller()?.nativeElement;
    const column = scroller?.querySelector<HTMLElement>("[data-part='column']");
    if (scroller === undefined || column === null || column === undefined) return;
    const [startHour, endHour] = this.hoursValue();
    const hourSize = column.getBoundingClientRect().height / Math.max(1, endHour - startHour);
    /* Half a label above the hour: the label is centerd on its rule, and a
       scroll that stopped on the rule cut the first visible one in half. */
    /* Half a line of the label's own type: its box is the whole hour. */
    const label = scroller.querySelector<HTMLElement>("[data-part='hour']");
    const lead = label === null ? 0 : parseFloat(getComputedStyle(label).lineHeight) / 2 || 0;
    scroller.scrollTop = Math.max(0, (secondsOfDay(time) / 3600 - startHour) * hourSize - lead);
  }

  /* ── Template handlers ─────────────────────────────────────────────── */

  protected swatch(key: string) {
    const color = calendarColor(key, this.calendars());
    return color === null ? 'currentColor' : `var(--slotted-data-${color})`;
  }

  /** When the open occurrence happens, as the two parts the detail writes. */
  protected whenOf(occurrence: EventOccurrence) {
    return occurrenceWhen(occurrence, { locale: this.localeValue(), hourCycle: this.cycleValue() });
  }

  protected dateLabel(date: PlainDate) {
    return fullDate(this.localeValue(), date);
  }

  protected step(direction: 1 | -1, event: MouseEvent) {
    this.requestDate(
      stepView(this.currentView(), this.currentDate(), direction, this.viewOptions()),
      pressReason(event),
      event,
    );
  }

  protected goToday(event: MouseEvent) {
    this.requestDate(this.today() ?? todayIn(this.zoneValue()), pressReason(event), event);
  }

  protected onViewRequest(request: ChangeRequest<string | undefined>) {
    if (request.value === undefined) return;
    if (!this.requestView(request.value as EventCalendarView, request.reason, request.source)) {
      request.cancel();
    }
  }

  protected onCalendarRequest(key: string, request: ChangeRequest<boolean>) {
    const shown = this.shown();
    const next = request.value
      ? this.calendars()
          .map((entry) => entry.key)
          .filter((candidate) => candidate === key || shown.includes(candidate))
      : shown.filter((candidate) => candidate !== key);
    if (!this.requestVisible(next, request.reason, request.source)) request.cancel();
  }

  protected drill(date: PlainDate, event: MouseEvent) {
    /* A month of marks on a phone opens the day's events where the finger is,
       as a sheet; the day view there is a list of one day. */
    if (this.narrow() && this.currentView() === 'month' && this.layout() === 'grid') {
      this.openMore(date, event);
      return;
    }
    const reason = pressReason(event);
    this.requestView('day', reason, event);
    this.requestDate(date, reason, event);
  }

  protected activate(view: EventView, event: MouseEvent) {
    this.detailAnchor.set(event.currentTarget as HTMLElement);
    this.moreDate.set(null);
    this.requestOpen(this.currentOpen() === view.key ? null : view.key, pressReason(event), event);
  }

  protected openMore(date: PlainDate, event: MouseEvent) {
    const held = this.moreDate();
    if (held !== null && isSameDate(held, date)) {
      this.moreDate.set(null);
      return;
    }
    this.moreAnchor.set(event.currentTarget as HTMLElement);
    this.morePopover()?.anchorNode.set(event.currentTarget as HTMLElement);
    this.moreDate.set(date);
  }

  protected onMoreOpen(open: boolean) {
    if (!open) this.moreDate.set(null);
  }

  protected onDetailRequest(request: ChangeRequest<boolean>) {
    if (request.value) return;
    if (!this.requestOpen(null, request.reason, request.source)) request.cancel();
  }

  private eventElement(key: string): HTMLElement | null {
    return this.host.querySelector<HTMLElement>(
      `[data-part='event'][data-key='${CSS.escape(key)}']`,
    );
  }

  private focusCell(date: PlainDate, row: string) {
    afterNextRender(
      () => {
        this.body()
          ?.nativeElement.querySelector<HTMLElement>(
            `[data-row='${row}'][data-date='${toISODate(date)}']`,
          )
          ?.focus();
      },
      { injector: this.injector },
    );
  }

  /** A stretch in words: the day, its hours, or the first and the last day. */
  private stretchWords(next: EventCalendarSelection) {
    const locale = this.localeValue();
    return isPlainDateTime(next.start)
      ? `${fullDate(locale, next.start.date)}, ${formatTimeRange(
          next.start.time,
          (next.end as PlainDateTime).time,
          { locale, hourCycle: this.cycleValue() },
        )}`
      : isSameDate(next.start, next.end as PlainDate)
        ? fullDate(locale, next.start)
        : `${fullDate(locale, next.start)} – ${fullDate(locale, next.end as PlainDate)}`;
  }

  private announce(next: EventCalendarSelection) {
    getLiveAnnouncer().announce(this.t('selected', { text: this.stretchWords(next) }));
  }

  /* ── Selection by pointer ──────────────────────────────────────────── */

  private minuteAt(column: HTMLElement, clientY: number) {
    const [startHour, endHour] = this.hoursValue();
    const slot = this.slotDurationValue();
    const rect = column.getBoundingClientRect();
    const raw =
      startHour * 60 +
      ((clientY - rect.top) / Math.max(1, rect.height)) * (endHour - startHour) * 60;
    return Math.min(endHour * 60, Math.max(startHour * 60, Math.floor(raw / slot) * slot));
  }

  /**
   * The press is aimed before the `context-menu` family sees it — at an event,
   * or at the stretch under the pointer. A press at nothing, or at a target
   * the application gives no menu, is stopped here, so the family never
   * prevents it and the browser's own menu opens.
   */
  private aimAt(target: EventTarget | null, clientY: number | null) {
    this.aimed = null;
    const items = this.contextMenu();
    const body = this.body()?.nativeElement;
    /* Containment rather than `instanceof`: the node may carry another
       window's constructors. */
    if (items === undefined || body === undefined || target === null) return null;
    if (!body.contains(target as Node)) return null;
    const from = target as Element;
    const drawn = from.closest<HTMLElement>("[data-part='event'][data-key]");
    const occurrence =
      drawn === null
        ? undefined
        : this.occurrences().find((entry) => entry.key === drawn.dataset['key']);
    let found: { target: EventCalendarContextTarget; element: HTMLElement };
    if (drawn !== null && occurrence !== undefined) {
      found = { target: { kind: 'event', occurrence }, element: drawn };
    } else {
      const cell = from.closest<HTMLElement>('[data-date]');
      const iso = cell?.dataset['date'];
      if (cell === null || cell === undefined || iso === undefined) return null;
      const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
      const timed = cell.dataset['row'] === 'timed';
      const slot = contextSlot({
        date: { year, month, day },
        minute: timed && clientY !== null ? this.minuteAt(cell, clientY) : null,
        timed,
        held: this.pending() ?? this.currentSelection(),
        slot: this.slotDurationValue(),
        endMinute: this.hoursValue()[1] * 60,
      }) as EventCalendarSelection;
      /* From the keyboard a column is the height of the day: the menu hangs
         from the selection drawn in it, or from the day's header. */
      const element =
        timed && clientY === null
          ? (cell.querySelector<HTMLElement>("[data-part='selection']") ??
            body.querySelector<HTMLElement>(`[data-part='column-header'][data-date='${iso}']`) ??
            cell)
          : cell;
      found = { target: { kind: 'slot', slot }, element };
    }
    if (!items.for()(found.target)) return null;
    this.aimed = found;
    return found;
  }

  private readonly onContextCapture = (event: MouseEvent) => {
    if (this.contextMenu() === undefined) return;
    if (this.aimAt(event.target, event.clientY) === null) event.stopPropagation();
  };

  private readonly onContextKeyCapture = (event: KeyboardEvent) => {
    if (this.contextMenu() === undefined) return;
    if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
    if (this.aimAt(event.target, null) === null) event.stopPropagation();
  };

  private readonly onPressCapture = (event: PointerEvent) => {
    if (this.contextMenu() === undefined || event.pointerType === 'mouse') return;
    this.aimAt(event.target, event.clientY);
  };

  protected onContextRequest(request: ChangeRequest<boolean>) {
    if (!request.value) {
      this.contextOn.set(null);
      return;
    }
    const found = this.aimed;
    if (found === null) {
      request.cancel();
      return;
    }
    this.contextOn.set(found);
    /* From the keyboard the menu hangs from what it acts on, not the grid. */
    if (request.reason === 'keyboard') this.contextMenuRef()?.anchor.set(found.element);
  }

  private readonly onClickCapture = (event: MouseEvent) => {
    if (!this.swallowClick) return;
    this.swallowClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * A press on an editable event picks it up once it travels four pixels;
   * short of that it is a click. The resize handle moves the end only.
   */
  private startEdit(event: PointerEvent): boolean {
    const target = event.target as HTMLElement;
    const element = target.closest<HTMLElement>("[data-part='event'][data-editable]");
    const cell = element?.closest<HTMLElement>('[data-row]');
    const key = element?.dataset['key'];
    const iso = cell?.dataset['date'];
    if (element === null || element === undefined || cell === null || cell === undefined)
      return false;
    const occurrence = this.occurrences().find((entry) => entry.key === key);
    if (occurrence === undefined || iso === undefined) return false;
    const [startHour, endHour] = this.hoursValue();
    const slot = this.slotDurationValue();
    this.edit = {
      occurrence,
      kind: target.closest("[data-part='resize-handle']") ? 'resize' : 'move',
      row: cell.dataset['row'] ?? '',
      date:
        dayUnder(this.host, cell.dataset['row'] ?? '', event.clientX, event.clientY) ??
        parseIso(iso),
      x: event.clientX,
      y: event.clientY,
      started: false,
      placement: placementOf(occurrence),
      invalid: false,
    };
    const hourSize = () =>
      Math.max(1, cell.getBoundingClientRect().height / Math.max(1, endHour - startHour));
    const move = (moved: PointerEvent) => {
      const state = this.edit;
      if (state === null) return;
      if (!state.started && Math.hypot(moved.clientX - state.x, moved.clientY - state.y) < 4)
        return;
      state.started = true;
      const over = dayUnder(this.host, state.row, moved.clientX, moved.clientY);
      const shift: EventShift = {
        days: over === null ? 0 : daysBetween(state.date, over),
        minutes:
          state.row === 'timed'
            ? Math.round(((moved.clientY - state.y) / hourSize()) * (60 / slot)) * slot
            : 0,
      };
      state.placement =
        state.kind === 'move'
          ? movePlacement(placementOf(state.occurrence), shift)
          : resizePlacement(placementOf(state.occurrence), shift, slot);
      state.invalid = !this.allows(state.occurrence, state.placement, state.kind);
      this.editing.set({
        key: state.occurrence.key,
        placement: state.placement,
        invalid: state.invalid,
      });
    };
    const finish = (ended: Event, commit: boolean) => {
      const state = this.edit;
      this.edit = null;
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('keydown', cancel, true);
      this.editing.set(null);
      if (state === null || !state.started) return;
      this.swallowClick = true;
      /* Let go over a refused destination: the event goes back, and nothing is asked. */
      if (commit && !state.invalid) {
        this.requestEventChange(state.occurrence, state.placement, state.kind, 'pointer', ended);
      }
    };
    const up = (ended: PointerEvent) => finish(ended, true);
    const cancel = (pressed: KeyboardEvent) => {
      if (pressed.key !== 'Escape' || this.edit?.started !== true) return;
      pressed.stopPropagation();
      finish(pressed, false);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('keydown', cancel, true);
    return true;
  }

  protected onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    if (this.startEdit(event)) return;
    if (this.selectionMode() !== 'range') return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input')) return;
    const cell = target.closest<HTMLElement>('[data-row]');
    const iso = cell?.dataset['date'];
    if (cell === null || cell === undefined || iso === undefined) return;
    const date = parseIso(iso);
    const slot = this.slotDurationValue();
    const endHour = this.hoursValue()[1];
    if (cell.dataset['row'] === 'timed') {
      const anchor = this.minuteAt(cell, event.clientY);
      this.drag = { kind: 'hours', date, anchor, column: cell };
      this.pending.set({
        start: atMinutes(date, anchor),
        end: atMinutes(date, Math.min(anchor + slot, endHour * 60)),
      });
    } else if (cell.dataset['row'] === 'day' || cell.dataset['row'] === 'all-day') {
      this.drag = { kind: 'days', anchor: date };
      this.pending.set({ start: date, end: date });
    } else return;
    event.preventDefault();

    const move = (moved: PointerEvent) => {
      const state = this.drag;
      if (state === null) return;
      if (state.kind === 'hours') {
        const here = this.minuteAt(state.column, moved.clientY);
        this.pending.set({
          start: atMinutes(state.date, Math.min(state.anchor, here)),
          end: atMinutes(state.date, Math.min(Math.max(state.anchor, here) + slot, endHour * 60)),
        });
        return;
      }
      const over =
        dayUnder(this.host, 'day', moved.clientX, moved.clientY) ??
        dayUnder(this.host, 'all-day', moved.clientX, moved.clientY);
      if (over !== null) this.pending.set(orderedDays(state.anchor, over));
    };
    const finish = (ended: Event, commit: boolean) => {
      const chosen = this.pending();
      this.drag = null;
      this.pending.set(null);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('keydown', cancel, true);
      if (commit && chosen !== null && this.requestSelection(chosen, 'pointer', ended)) {
        this.announce(chosen);
      }
    };
    const up = (ended: PointerEvent) => finish(ended, true);
    const cancel = (pressed: KeyboardEvent) => {
      if (pressed.key === 'Escape') finish(pressed, false);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('keydown', cancel, true);
  }

  /* ── Keyboard ──────────────────────────────────────────────────────── */

  /** Alt and an arrow move the event a slot or a day; with Shift, its end. */
  private editByKey(event: KeyboardEvent, element: HTMLElement, cell: HTMLElement, row: string) {
    const occurrence = this.occurrences().find((entry) => entry.key === element.dataset['key']);
    if (occurrence === undefined) return;
    event.preventDefault();
    const rtl = getComputedStyle(cell).direction === 'rtl';
    const slot = this.slotDurationValue();
    const sideways = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    const forward =
      event.key === 'ArrowRight'
        ? !rtl
        : event.key === 'ArrowLeft'
          ? rtl
          : event.key === 'ArrowDown';
    const step = forward ? 1 : -1;
    const shift: EventShift = sideways
      ? { days: step, minutes: 0 }
      : row === 'timed'
        ? { days: 0, minutes: step * slot }
        : { days: row === 'day' ? step * 7 : 0, minutes: 0 };
    if (shift.days === 0 && shift.minutes === 0) return;
    const kind = event.shiftKey ? 'resize' : 'move';
    /* A refused destination is passed over for the next one allowed; with
       none in reach the event stays, and the reader is told why. */
    const placement = nextAllowedPlacement(placementOf(occurrence), shift, kind, {
      slot,
      hours: this.hoursValue(),
      allowed: (candidate) => this.allows(occurrence, candidate, kind),
    });
    if (placement === null) {
      getLiveAnnouncer().announce(this.t('dropInvalid', { title: occurrence.event.title }));
      return;
    }
    if (!this.requestEventChange(occurrence, placement, kind, 'keyboard', event)) return;
    /* Focus stays on the event where it lands, once the application has moved it. */
    afterNextRender(() => this.eventElement(occurrence.key)?.focus(), {
      injector: this.injector,
    });
  }

  protected onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const cell = target.closest<HTMLElement>('[data-row]');
    const row = cell?.dataset['row'];
    if (cell === null || cell === undefined || row === undefined) return;

    if (target !== cell) {
      const element = target.closest<HTMLElement>("[data-part='event'][data-editable]");
      if (element !== null && event.altKey && event.key.startsWith('Arrow')) {
        this.editByKey(event, element, cell, row);
        return;
      }
      if (event.key === 'Escape' || event.key === 'F2') {
        event.preventDefault();
        cell.focus();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const widgets = [...cell.querySelectorAll<HTMLElement>(WIDGETS)];
        const index = widgets.indexOf(target.closest<HTMLElement>(WIDGETS) ?? target);
        event.preventDefault();
        widgets[index + (event.key === 'ArrowDown' ? 1 : -1)]?.focus();
      }
      return;
    }

    const date = this.currentDate();
    const view = this.currentView();
    const options = this.viewOptions();
    const rtl = getComputedStyle(cell).direction === 'rtl';
    const month = row === 'day';
    const range = this.selectionMode() === 'range';
    const slot = this.slotDurationValue();
    const [startHour, endHour] = this.hoursValue();

    if (
      row === 'timed' &&
      event.shiftKey &&
      range &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      event.preventDefault();
      const held = this.currentSelection();
      if (held === null || !isPlainDateTime(held.start) || !isSameDate(held.start.date, date))
        return;
      const from = secondsOfDay(held.start.time) / 60;
      const endValue = held.end as PlainDateTime;
      const to = isSameDate(endValue.date, date) ? secondsOfDay(endValue.time) / 60 : 1440;
      const nextEnd = Math.min(
        endHour * 60,
        Math.max(from + slot, to + (event.key === 'ArrowDown' ? slot : -slot)),
      );
      const next = { start: held.start, end: atMinutes(date, nextEnd) };
      if (this.requestSelection(next, 'keyboard', event)) this.announce(next);
      return;
    }

    if (!month && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const order: GridRow[] = ['header', 'all-day', 'timed'];
      const nextRow = order[order.indexOf(row as GridRow) + (event.key === 'ArrowDown' ? 1 : -1)];
      if (nextRow === undefined) return;
      this.row.set(nextRow);
      this.focusCell(date, nextRow);
      return;
    }

    const moves: Record<string, DateMove | undefined> = {
      ArrowLeft: rtl ? 'next' : 'previous',
      ArrowRight: rtl ? 'previous' : 'next',
      Home: event.ctrlKey || event.metaKey ? 'periodStart' : 'rowStart',
      End: event.ctrlKey || event.metaKey ? 'periodEnd' : 'rowEnd',
      PageUp: event.shiftKey && month ? 'yearBack' : 'pageBack',
      PageDown: event.shiftKey && month ? 'yearForward' : 'pageForward',
      ArrowUp: month ? 'up' : undefined,
      ArrowDown: month ? 'down' : undefined,
    };
    const move = moves[event.key];
    if (move !== undefined) {
      event.preventDefault();
      const next = moveDate(view, date, move, options);
      if (event.shiftKey && range && event.key.startsWith('Arrow') && row !== 'timed') {
        const anchor = this.selectionAnchor ?? date;
        this.selectionAnchor = anchor;
        const chosen = orderedDays(anchor, next);
        if (this.requestSelection(chosen, 'keyboard', event)) this.announce(chosen);
      } else if (!event.shiftKey) {
        this.selectionAnchor = null;
      }
      if (!isSameDate(next, date)) this.requestDate(next, 'keyboard', event);
      this.focusCell(next, row);
      return;
    }

    if (event.key === 'Enter' || event.key === 'F2') {
      const first = cell.querySelector<HTMLElement>(WIDGETS);
      if (first === null) return;
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.key === ' ' && range) {
      event.preventDefault();
      this.selectionAnchor = date;
      const next: EventCalendarSelection =
        row === 'timed'
          ? (() => {
              const from = Math.min(
                Math.max(secondsOfDay(this.scrollValue()) / 60, startHour * 60),
                endHour * 60 - slot,
              );
              return { start: atMinutes(date, from), end: atMinutes(date, from + slot) };
            })()
          : { start: date, end: date };
      if (this.requestSelection(next, 'keyboard', event)) this.announce(next);
      return;
    }

    if (event.key === 'Escape' && this.currentSelection() !== null) {
      event.preventDefault();
      this.requestSelection(null, 'escape', event);
    }
  }
}
