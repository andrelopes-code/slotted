import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import dateTimeRangePickerTokens from '@slotted/styles/datetime-range-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_DATETIME_RANGE_PICKER_TOKENS = dateTimeRangePickerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Date Time Range Picker decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlDateTimeRangePicker, SlDateTimeRangePickerPreset, SlDateTimeRangePickerPresets, SlDateTimeRangePickerFooter, SlDateTimeRangePickerOption } from '@slotted/angular/datetime-range-picker';",
  selector: '[slDateTimeRangePicker]',
  exportAs: 'slDateTimeRangePicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element',
    required: true,
    purpose:
      'The box the family is selected by. Carries data-ui="datetime-range-picker", the axes, data-granularity, data-open and the state attributes. The consumer writes this element, so its classes, its attributes and its own directives are its own.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose:
      'The frame: one line at the control height, at any width, and what the positioner measures. Two datetime fields need three hundred and sixty pixels on one line; the current end’s field lives in the band now, where the width is the surface’s.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'Fills the frame and opens the surface. Its accessible name carries both ends in words and the duration, because focus returns here when the surface closes. The calendar glyph sits at its reading end.',
  },
  {
    part: 'summary',
    element: 'span',
    required: true,
    purpose:
      'The value written short — "12 Sep, 14:00 – 16 Sep, 11:00" — or the placeholder with data-placeholder. Cut with an ellipsis where it does not fit; the trigger’s name carries it whole.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Empties both ends with the clear reason. Drawn with clearable, and the only clear in the family: the field in the band draws none.',
  },
  {
    part: 'hidden-input',
    element: 'input',
    required: true,
    purpose:
      'Two, under startName and endName, carrying YYYY-MM-DDTHH:mm:ss for a plain form post. They live in the frame because the surface is portalled and unmounted while it is closed.',
  },
  {
    part: 'positioner',
    element: 'div',
    required: false,
    purpose:
      'The layer the surface stands on, and what packages/core/src/positioner writes its position and custom properties onto. Carries data-presentation: popover, or sheet on a coarse pointer below 480 pixels.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'The painted surface, carrying role="dialog" and the same name as the trigger. Sized by the calendar and the list, capped at thirty rems and by the room the positioner measured.',
  },
  {
    part: 'grip',
    element: 'span, aria-hidden',
    required: false,
    purpose:
      'The pill at the top of the sheet, drawn only while data-presentation is sheet, in the drawer grip’s geometry and line colour. A pull down past half the sheet, or a flick down, closes it with the reason pointer; Escape and the press outside stay the accessible ways out.',
  },
  {
    part: 'head',
    element: 'div',
    required: false,
    purpose:
      'The band, three rows: the two tabs; the field of the current end and now; the hint, then the duration and the limit. It renders at the surface’s width and contributes nothing to it.',
  },
  {
    part: 'tabs',
    element: 'div',
    required: false,
    purpose: 'role="tablist": the two ends, one at a time.',
  },
  {
    part: 'tab',
    element: 'button',
    required: false,
    purpose:
      'role="tab", data-position="start" or "end". aria-selected and data-current on the current end, painted as an underline; data-placeholder while the end has no value. Its accessible name — the label and the value — names the list.',
  },
  {
    part: 'tab-label',
    element: 'span',
    required: false,
    purpose: '"Start" or "End", from the start and end messages.',
  },
  {
    part: 'tab-value',
    element: 'span',
    required: false,
    purpose: 'The end written short — "12 Sep, 14:00" — a day alone, a time alone, or a dash.',
  },
  {
    part: 'field',
    element: 'div',
    required: false,
    purpose:
      'Holds the current end’s datetime-field in variant="plain", data-position. Drawn on a fine pointer only: a segment is a spinbutton and raises no keyboard on a phone.',
  },
  {
    part: 'now',
    element: 'button',
    required: false,
    purpose:
      'Beside the field: writes the current date and time — referenceDateTime, or the clock — into the current end, both halves, and follows the focus rule.',
  },
  {
    part: 'hint',
    element: 'span',
    required: false,
    purpose:
      'What the next press should be, or what is wrong — "Return: choose a day", "Return: choose a time on 16 Sep", "The end must come after the start" — from the chooseDay, chooseTime, order, length, unavailable and bounds messages. data-invalid while it names a problem; aria-describedby of the list and the field. Empty while the work is whole and valid.',
  },
  {
    part: 'length',
    element: 'span',
    required: false,
    purpose:
      '"3 days 21 hr": the duration of the run the pending end would make — a day under the pointer in the grid, or a time in the list — or of the work. A polite live region. data-pending while it is a proposal.',
  },
  {
    part: 'limit',
    element: 'span',
    required: false,
    purpose: '"1 hr to 30 days", drawn while minLength or maxLength is set.',
  },
  {
    part: 'presets',
    element: 'div',
    required: false,
    purpose:
      'The row of the consumer’s own shortcuts, rendered from the presets prop, between the band and the panel; it wraps.',
  },
  {
    part: 'preset',
    element: 'button',
    required: false,
    purpose:
      'One shortcut, a DateTimeRangePickerPreset. Writes its range with the select reason and carries data-selected while the value equals it.',
  },
  {
    part: 'panel',
    element: 'div',
    required: false,
    purpose:
      'The current end, one at a time: data-position="start" or "end". The calendar with both dates drawn, and the list of that end beside it, under it where the row cannot hold both.',
  },
  {
    part: 'date-panel',
    element: 'div',
    required: false,
    purpose:
      'Inside the panel, before the list: the calendar in range mode — one month by default — with both dates drawn and the pending band date-range-picker gave it. It names itself; nothing is drawn over it.',
  },
  {
    part: 'list',
    element: 'div',
    required: false,
    purpose:
      'role="listbox": the times of the current end on its own day, inside that day’s window from both pairs of bounds, and the only thing that scrolls; named by the current tab. data-truncated when it stops at maxOptions.',
  },
  {
    part: 'option',
    element: 'div',
    required: false,
    purpose:
      'role="option", one whole time. data-selected for the end this list holds, data-current for the highlight, data-disabled and aria-disabled for a time a bound, the predicate or the other end refuses.',
  },
  {
    part: 'option-duration',
    element: 'span',
    required: false,
    purpose:
      'Beside the time, the duration the run would have with the other end — "15:00 · 1 hr" — while the two ends are on the same day; across days the band alone says it. The slDateTimeRangePickerOption template replaces the row’s content, this span included.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'Drawn in place of the list when its day offers no time at all — a closed Saturday, a day outside the bounds.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose:
      'The consumer’s own actions, rendered from the footer prop, and done at its reading end.',
  },
  {
    part: 'done',
    element: 'button',
    required: false,
    purpose:
      'Closes with what is written: a whole work is emitted as the value first; one end alone stays as it is. Always drawn — a sheet that fills the screen has no outside to press.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A car picked up on the 12th and returned on the 16th. The frame is one line: press it and the two tabs, the field, the hint, the calendar and the list of the current end open under it. Every input is on the controls panel.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-playground',
      label: 'A rental',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Pickup and return</label>
  <div
    slDateTimeRangePicker
    clearable
    locale="pt-BR"
    [messages]="{ start: 'Pickup', end: 'Return' }"
    [defaultValue]="rental"
  ></div>
</div>`,
    }),
  },
  {
    id: 'panel',
    title: 'One end at a time',
    note: 'Already open: two tabs say the two ends, and the panel shows the one being chosen — the calendar with both dates drawn, and the list of that end running on its day. Press a day: the run restarts on it, and the end’s time is kept.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-panel',
      label: 'A grid and one list',
      language: 'angular',
      source: `<div slDateTimeRangePicker defaultOpen locale="pt-BR" [defaultValue]="rental"></div>`,
    }),
  },
  {
    id: 'completeness',
    title: 'Focus follows the missing half',
    note: 'Press a day: focus moves to the list, because the start has no time. Press a time: the tab moves to the return and focus goes back to the grid, because the return has no date. Press a day and then a time: the work is whole and the surface closes. The hint says each step.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-completeness',
      label: 'Four presses',
      language: 'angular',
      source: `<div slDateTimeRangePicker defaultOpen locale="pt-BR"></div>`,
    }),
  },
  {
    id: 'length',
    title: 'The duration, while the run is drawn',
    note: 'Move along the grid: the band says the days and hours the rental would last for the day under you, with the time the end already holds. On the same day, every row of the end list says it too.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-length',
      label: 'Said as it is drawn',
      language: 'angular',
      source: `<div slDateTimeRangePicker locale="pt-BR" [defaultValue]="open"></div>`,
    }),
  },
  {
    id: 'limits',
    title: 'Limits, explained',
    note: 'A rental lasts an hour to thirty days. With a pickup chosen, the grid refuses the days past the thirtieth, the end list refuses the times inside the first hour, and the band says the rule. minLength and maxLength are seconds.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-limits',
      label: 'An hour to thirty days',
      language: 'angular',
      source: `<div slDateTimeRangePicker [maxLength]="30 * 86400" [minLength]="3600"></div>`,
    }),
  },
  {
    id: 'day-window',
    title: 'Two bounds, and the day they meet on',
    note: 'The agency opens from 08:00 to 18:00, and the fleet is booked from the 10th at 09:00. min and minTime both apply: on the 10th the lists start at 09:00, on every later day at 08:00 — the rule MUI declines.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-day-window',
      label: 'Opening hours inside a season',
      language: 'angular',
      source: `<div
  slDateTimeRangePicker
  [max]="seasonEnd"
  [maxTime]="closing"
  [min]="seasonStart"
  [minTime]="opening"
></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Unavailable days and times',
    note: 'The agency is closed on Sundays, and closes at noon on Saturdays. isDateUnavailable greys the Sundays; isTimeUnavailable empties the afternoon of a Saturday, on that day only. A rental cannot cross a Sunday while it is contiguous.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-unavailable',
      label: 'Closed on Sunday',
      language: 'angular',
      source: `<div
  slDateTimeRangePicker
  [isDateUnavailable]="isSunday"
  [isTimeUnavailable]="isSaturdayAfternoon"
></div>`,
    }),
  },
  {
    id: 'months',
    title: 'Months',
    note: 'One month by default, because the list stands beside the grid and two months beside a list do not fit in 720 pixels. Ask for two: the list drops under the grid where the row is too narrow.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-months',
      label: 'Two months',
      language: 'angular',
      source: `<div slDateTimeRangePicker [months]="2"></div>`,
    }),
  },
  {
    id: 'now',
    title: 'Now',
    note: '"Now" writes the current date and time into the current end, both halves, and the focus rule takes over. referenceDateTime fixes the clock for a story or a test.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-now',
      label: 'One now per end',
      language: 'angular',
      source: `<div slDateTimeRangePicker [messages]="{ now: 'Agora' }" [referenceDateTime]="clock"></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'Presets',
    note: 'The rentals the agency offers by name. Each is a button with slDateTimeRangePickerPreset and its own range; pressing one writes the value and closes, and the one equal to the value is marked. The list is the product’s.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-presets',
      label: 'Named rentals',
      language: 'angular',
      source: `<div slDateTimeRangePicker>
  <div slDateTimeRangePickerPresets>
    <button [slDateTimeRangePickerPreset]="weekend">Weekend</button>
    <button [slDateTimeRangePickerPreset]="week">One week</button>
  </div>
</div>`,
    }),
  },
  {
    id: 'open-end',
    title: 'One end only',
    note: 'A pickup and no return, written where the reader sees it. Open the surface: it opens on the return tab, the grid holds the start of an open run, and the list runs on the day the grid has focused until a return day is pressed.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-open-end',
      label: 'From the 12th at 14:00',
      language: 'angular',
      source: `<div slDateTimeRangePicker clearable [defaultValue]="open"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps the frame takes. Type, height, gutter and the clear’s box follow the control scales, so a rental in a dense fleet table shrinks whole rather than in parts.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-sizes',
      label: 'The three steps',
      language: 'angular',
      source: `<div slDateTimeRangePicker size="sm"></div>
<div slDateTimeRangePicker size="md"></div>
<div slDateTimeRangePicker size="lg"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows at rest. plain is for a box that belongs to something else — a table cell — and draws its ring inward.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-variants',
      label: 'The three frames',
      language: 'angular',
      source: `<div slDateTimeRangePicker variant="outline"></div>
<div slDateTimeRangePicker variant="subtle"></div>
<div slDateTimeRangePicker variant="plain"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only, disabled, invalid from the family and invalid from the consumer. A return before its pickup is invalid on the end field and on the frame, and nothing is swapped.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-states',
      label: 'Four states',
      language: 'angular',
      source: `<div slDateTimeRangePicker readOnly [defaultValue]="rental"></div>
<div slDateTimeRangePicker disabled [defaultValue]="rental"></div>
<div slDateTimeRangePicker [defaultValue]="reversed"></div>
<div slDateTimeRangePicker invalid [defaultValue]="rental"></div>`,
    }),
  },
  {
    id: 'forms',
    title: 'Forms',
    note: 'Two hidden inputs under startName and endName send YYYY-MM-DDTHH:mm:ss with a plain form post, whether the reader typed the values or pressed them.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-forms',
      label: 'A plain form post',
      language: 'angular',
      source: `<form [formGroup]="reservation" (ngSubmit)="reserve()">
  <div
    slDateTimeRangePicker
    formControlName="rental"
    startName="retirada"
    endName="devolucao"
  ></div>
  <button type="submit">Reservar</button>
</form>`,
    }),
  },
  {
    id: 'narrow',
    title: 'Narrow',
    note: 'In a column narrower than the value the frame stays one line and the summary is cut with an ellipsis; the trigger’s name carries it whole. Open it: the list drops under the grid.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-narrow',
      label: 'In a narrow column',
      language: 'angular',
      source: `<div class="slotted-demo-measure">
  <div slDateTimeRangePicker locale="pt-BR" [defaultValue]="rental"></div>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'provideDateTimeRangePickerDefaults sets the months, the step and how a duration is written once, provideSlotted the language and every word; the exported instance opens, closes and focuses; the slDateTimeRangePickerOption template replaces what a row draws; position — which tab — is the consumer’s to own.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-composition',
      label: 'Set once, and the handle',
      language: 'angular',
      source: `<div
  slDateTimeRangePicker
  #picker="slDateTimeRangePicker"
  [position]="position"
  (positionChange)="position = $event.value"
>
  <ng-template slDateTimeRangePickerOption let-label="label" let-duration="duration">
    {{ label }} <small>{{ duration }}</small>
  </ng-template>
</div>
<button type="button" (click)="picker.openSurface()">Open</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Enter opens onto the field of the current end; ArrowDown opens onto the grid, on its day. ArrowLeft and ArrowRight on a tab move to the other end. In the grid, the arrows move by day and the band says the duration; Enter writes a date and carries focus to the list. Escape walks the calendar down a view, then abandons the work.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-keyboard',
      label: 'The keys',
      language: 'angular',
      source: `<!-- Enter, Space         open onto the current end's field -->
<!-- ArrowDown, Alt+Down  open onto the current end's day in the grid -->
<!-- ArrowLeft, Right     on a tab: the other end, and its panel -->
<!-- the grid's keys      calendar's, unchanged; the band says the duration -->
<!-- Arrows, Page keys    move the list's highlight; Enter writes the time -->
<!-- Escape               the calendar's view, then close and abandon -->
<!-- Tab                  tabs, field, now, presets, grid, list, footer, done -->
<div slDateTimeRangePicker></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'DateTimeRange | null',
    '—',
    'SlDateTimeRangePicker',
    '{ start, end }, each end nullable. Present means the consumer owns it. Both ends null is null.',
  ],
  [
    'defaultValue',
    'DateTimeRange | null',
    '—',
    'SlDateTimeRangePicker',
    'What it starts from when nobody else writes one. Read once.',
  ],
  [
    'open',
    'boolean',
    '—',
    'SlDateTimeRangePicker',
    'Whether the surface is showing. Present means the consumer owns it.',
  ],
  ['defaultOpen', 'boolean', 'false', 'SlDateTimeRangePicker', 'Whether it opens already showing.'],
  [
    'position',
    "'start' | 'end'",
    '—',
    'SlDateTimeRangePicker',
    'The end being edited: the field and the panel carrying data-current, and where focus lands when the surface opens. Present means the consumer owns it.',
  ],
  ['defaultPosition', "'start' | 'end'", 'start', 'SlDateTimeRangePicker', 'Where editing starts.'],
  [
    'highlighted',
    '{ start: PlainTime | null; end: PlainTime | null }',
    '—',
    'SlDateTimeRangePicker',
    'The highlighted option of each end’s list. Present means the consumer owns it. Moving it moves no value.',
  ],
  [
    'defaultHighlighted',
    '{ start: PlainTime | null; end: PlainTime | null }',
    '—',
    'SlDateTimeRangePicker',
    'Where the highlights start; otherwise a list opens on its end, or on the nearest offered step.',
  ],
  [
    'min',
    'PlainDateTime',
    '—',
    'SlDateTimeRangePicker',
    'Where the range starts: the earliest whole value. Its time bounds the first day only, the platform’s own rule. Crossed with the work between the two fields.',
  ],
  [
    'max',
    'PlainDateTime',
    '—',
    'SlDateTimeRangePicker',
    'Where the range ends; its time bounds the last day only.',
  ],
  [
    'minTime',
    'PlainTime',
    '—',
    'SlDateTimeRangePicker',
    'The earliest time on every day inside the range, applied together with min — the pair MUI declines to combine.',
  ],
  [
    'maxTime',
    'PlainTime',
    '—',
    'SlDateTimeRangePicker',
    'The latest time on every day inside the range.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDateTimeRangePicker',
    'Refuses whole days. The grid greys them and a list on such a day is empty.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime, date: PlainDate) => boolean',
    '—',
    'SlDateTimeRangePicker',
    'Refuses one time on one day. Asked once per row of a list, on the day that list serves.',
  ],
  [
    'contiguous',
    'boolean',
    'true',
    'SlDateTimeRangePicker',
    'Whether a run may cross an unavailable day. On, and with a start chosen, the days beyond the first unavailable one are refused in the grid, and on the same day the times beyond the first unavailable one in the end list.',
  ],
  [
    'minLength',
    'number',
    '—',
    'SlDateTimeRangePicker',
    'The shortest run allowed, in seconds. The grid and the list refuse shorter ones and the band names the limit.',
  ],
  ['maxLength', 'number', '—', 'SlDateTimeRangePicker', 'The longest run allowed, in seconds.'],
  [
    'lengthLabel',
    '(seconds: number, locale?: string) => string',
    'durationLabel',
    'SlDateTimeRangePicker',
    'What the band and the rows say for a duration, in the product’s own words. The default writes "3 days 21 hr" in the family’s locale.',
  ],
  [
    'step',
    'number',
    '900',
    'SlDateTimeRangePicker',
    'Seconds between two offered times, counted from min’s time on the first day and from midnight elsewhere. Ignored when options states the list.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'SlDateTimeRangePicker',
    'The times to offer, stated rather than stepped; the same list for both ends. The bounds and the predicate still refuse.',
  ],
  [
    'maxOptions',
    'number',
    '1440',
    'SlDateTimeRangePicker',
    'How many rows a list may reach before it is cut. Cut, the list carries data-truncated and the panel’s description says the rest is typed.',
  ],
  [
    'unavailableOptions',
    "'disable' | 'hide'",
    'disable',
    'SlDateTimeRangePicker',
    'What a refused time looks like in a list: drawn muted with aria-disabled, or left out.',
  ],
  [
    'months',
    'number',
    '1',
    'SlDateTimeRangePicker',
    'How many months the grid shows. One, because the list stands beside it; a second wraps under the first where the surface is narrow.',
  ],
  [
    'weekNumbers',
    'boolean',
    '—',
    'SlDateTimeRangePicker',
    'Draws the ISO week number beside each row of the grid.',
  ],
  [
    'fixedWeeks',
    'boolean',
    'true',
    'SlDateTimeRangePicker',
    'Six rows whatever the month needs, so a press of "next" moves no target.',
  ],
  [
    'locale',
    'string',
    'provideSlotted',
    'SlDateTimeRangePicker',
    'BCP 47. Decides the field order, the digits, the month names, the day-period names and the duration’s units. Unset, the language in force decides.',
  ],
  ['timeZone', 'string', '—', 'SlDateTimeRangePicker', 'The zone "now" is read in.'],
  [
    'hourCycle',
    '12 | 24',
    '—',
    'SlDateTimeRangePicker',
    'Twelve- or twenty-four-hour times. Unset, the locale decides.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'SlDateTimeRangePicker',
    'How much of a time the fields and the rows write.',
  ],
  ['calendar', "'gregory'", 'gregory', 'SlDateTimeRangePicker', 'The calendar system. One today.'],
  [
    'firstDayOfWeek',
    'number',
    '—',
    'SlDateTimeRangePicker',
    'Which day the grid’s week starts on. Unset, the locale decides.',
  ],
  [
    'yearPivot',
    'number',
    '—',
    'SlDateTimeRangePicker',
    'The pivot two typed year digits are resolved through.',
  ],
  [
    'referenceDateTime',
    'PlainDateTime',
    '—',
    'SlDateTimeRangePicker',
    'What "now" is, for a story or a test; the clock otherwise. Anchors now, the day the panel opens on, and the relative expression.',
  ],
  ['size', "'sm' | 'md' | 'lg'", 'md', 'SlDateTimeRangePicker', 'The control scale of the frame.'],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDateTimeRangePicker',
    'How much frame the control shows at rest.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'SlDateTimeRangePicker',
    'Where the surface opens, before the positioner has read the room.',
  ],
  [
    'closeOnSelect',
    "'auto' | 'always' | 'never'",
    'auto',
    'SlDateTimeRangePicker',
    'auto closes when a press completes the work; always closes on any press that changes the value; never closes on none.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'SlDateTimeRangePicker',
    'Nothing answers; the value stays readable.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'SlDateTimeRangePicker',
    'Legible and copyable; the trigger and the clear are out of the tab sequence.',
  ],
  [
    'invalid',
    'boolean',
    '—',
    'SlDateTimeRangePicker',
    'The consumer’s own word. Set, it wins; unset, the family’s own rules and the field around it decide.',
  ],
  ['required', 'boolean', '—', 'SlDateTimeRangePicker', 'Reaches both fields as aria-required.'],
  [
    'clearable',
    'boolean',
    'false',
    'SlDateTimeRangePicker',
    'Draws one clear on the frame, which empties both ends.',
  ],
  [
    'relative',
    'boolean',
    '—',
    'SlDateTimeRangePicker',
    'Whether the field in the band takes the relative expression — +2d, 1h30, = — the way a datetime-field does.',
  ],
  [
    'messages',
    'Partial<DatetimeRangePickerMessages>',
    '—',
    'SlDateTimeRangePicker',
    'Words laid over the language in force, key by key: the two ends (start, end), the trigger’s names (choose; change with {start}, {end} and {length}; changeReversed), the hint (chooseDay with {end}; chooseTime with {end} and {day}; order, length, unavailable, bounds), the limit (limit.between, limit.atLeast, limit.atMost), now, done, clear, and a panel that is empty or cut short (empty, truncated).',
  ],
  [
    'startName',
    'string',
    '—',
    'SlDateTimeRangePicker',
    'The name of the hidden input carrying the start.',
  ],
  [
    'endName',
    'string',
    '—',
    'SlDateTimeRangePicker',
    'The name of the hidden input carrying the end.',
  ],
  [
    'slDateTimeRangePickerPresets',
    'Directive',
    '—',
    'SlDateTimeRangePicker',
    'The consumer’s own shortcuts, as a directive on their own element holding slDateTimeRangePickerPreset buttons.',
  ],
  [
    'slDateTimeRangePickerFooter',
    'Directive',
    '—',
    'SlDateTimeRangePicker',
    'The consumer’s own actions, before done in the footer, as a directive on their own element.',
  ],
  [
    'slDateTimeRangePickerOption',
    'Directive on ng-template',
    '—',
    'SlDateTimeRangePicker',
    'What one row draws. The context carries the time as $implicit, plus position, date, label, duration, selected, current and unavailable.',
  ],
  [
    'slDateTimeRangePickerPreset',
    'DateTimeRange | (() => DateTimeRange)',
    '—',
    'SlDateTimeRangePickerPreset',
    'The range the press writes, or a function resolving it at the press.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<DateTimeRange | null>',
    when: 'Before the value moves, and cancellable. keyboard, blur or clear when an end was typed in the band, select when a press in the grid or the list, now, done or a preset completed the work or changed a whole one, clear for the clear button. A press that leaves a half missing emits nothing. There is no two-way [(value)]: a form control carries it instead.',
  },
  {
    name: 'openChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the surface opens or closes, and cancellable. pointer for the trigger and for done, keyboard for a key on the trigger, escape for the key, outsidePress for a press elsewhere, select for a press that completed the work.',
  },
  {
    name: 'positionChange',
    payload: "ChangeRequest<'start' | 'end'>",
    when: 'Before the current end moves. pointer for a press on a tab, keyboard for the arrows on one, select when a press in the grid, the list or a preset moved it, clear for the clear button, programmatic when the panel opened on the first end with a half missing.',
  },
  {
    name: 'highlightedChange',
    payload: 'ChangeRequest<{ start; end }>',
    when: 'Before a highlight moves in either list. keyboard for the arrows and type-ahead, pointer for a press, programmatic when a list opened or changed under it.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDateTimeRangePickerDefaults',
    'Provider',
    '—',
    'application',
    'Sets timeZone, calendar, firstDayOfWeek, months, hourCycle, granularity, step, maxOptions, unavailableOptions, closeOnSelect, placement, size, variant and lengthLabel once for everything under the injector. The locale and the words come from provideSlotted.',
  ],
  [
    'ControlValueAccessor and Validator',
    'formControl, formControlName, ngModel',
    '—',
    'SlDateTimeRangePicker',
    'The whole { start, end } is the control’s value, and the family reports what no other validator can see: slottedDateTimeRangeOrder, slottedDateTimeRangeMin, slottedDateTimeRangeMax, slottedDateTimeRangeUnavailable and slottedDateTimeRangeLength.',
  ],
  [
    'exportAs',
    'slDateTimeRangePicker',
    '—',
    'SlDateTimeRangePicker',
    'Hands a template the instance, so focus(), openSurface(), closeSurface() and choose(range) are reachable without a component of its own.',
  ],
  [
    'ng-content slots',
    'slDateTimeRangePickerPresets, slDateTimeRangePickerFooter',
    '—',
    'SlDateTimeRangePicker',
    'The two places a consumer fills, as directives on their own elements, so a button, a list or a toolbar all keep their own semantics.',
  ],
  [
    'slDateTimeRangePickerOption',
    'Directive on ng-template',
    '—',
    'list',
    'One row’s content, rendered once per option with the time, its label and its duration in the context; the row itself — role, states, keyboard, target size — stays the family’s.',
  ],
  [
    'slDateTimeRangePickerPreset',
    'Directive on button',
    '—',
    'presets',
    'One shortcut on the consumer’s own button: it takes the range, writes data-part and type, and composes the click — a handler that calls preventDefault keeps the value where it was.',
  ],
]);

const accessibility: string[] = [
  'The trigger’s accessible name carries both ends in words and the duration — "Change range, 12 September 2026 at 14:00 – 16 September 2026 at 11:00, 3 days 21 hr". Focus returns to it when the surface closes; the summary’s ellipsis removes nothing a screen-reader user cannot hear.',
  'The two ends are a tablist with automatic activation, and the panel is one end at a time: a grid and a listbox, the listbox named by the current tab, so "Pickup, 12 Sep, 14:00" is heard before the first option. The hint is the list’s description, so what to choose next — the day, then the time — is read with it.',
  'The duration is a polite live region: a sighted reader sees it follow the pointer across the grid and beside every row of a same-day list; a screen-reader user hears it on every arrow.',
  'The rule datetime-picker wrote, once per end: a press that leaves a half missing carries focus to it — the grid for a date, the list for a time, the tab moving when it is the other end’s — and the press that completes the work closes the panel. A half-drawn run never reaches a form. Done is the way out when nothing closed it.',
  'Typing lives in the band: Enter on the trigger opens onto the first segment of the current end’s field, and the field keeps every key a datetime-field has. On a coarse pointer the field is not drawn and Enter opens onto the grid. Escape is staged: the field’s expression first, the calendar’s view second, the surface last.',
];

export const ANGULAR_DATETIME_RANGE_PICKER_DOCS = {
  dateTimeRangePicker: {
    accessibility,
    anatomy,
    api,
    composition,
    events,
    imports,
    scenes,
    snippets: [],
  },
};
