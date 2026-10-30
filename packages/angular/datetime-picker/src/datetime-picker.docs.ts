import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import dateTimePickerTokens from '@slotted/styles/datetime-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_DATETIME_PICKER_TOKENS = dateTimePickerTokens.map((name) => ({
  name,
  purpose: 'A Datetime Picker value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { SlDateTimePicker, SlDateTimePickerOption, SlDateTimePickerPresets, SlDateTimePickerFooter } from '@slotted/angular/datetime-picker';",
  selector: '[slDateTimePicker]',
  exportAs: 'slDateTimePicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element the directive is on',
    required: true,
    purpose:
      'The outer box, carrying data-ui="datetime-picker", the size, variant and granularity axes, data-open and the state attributes. It has no role: the control inside holds the field and the trigger, and the panel is a layer of its own.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose:
      'The box the panel is positioned against, and where Alt+ArrowDown is handled. It draws no frame: the datetime field inside it draws its own border, focus ring and states.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'The calendar button, in the end slot of the datetime field. It has aria-haspopup="dialog", aria-expanded while the panel is open, and an accessible name that carries the chosen date and time, because focus returns to it when the panel closes. It draws the calendar icon, the icon input[type=datetime-local] draws for the same control.',
  },
  {
    part: 'positioner',
    element: 'div, after the control inside the root',
    required: false,
    purpose:
      'The layer the panel stands on, drawn while the panel is open. It carries data-ui="datetime-picker" again, plus data-placement for the side the positioner chose and data-presentation (popover or sheet).',
  },
  {
    part: 'content',
    element: 'div with role="dialog"',
    required: false,
    purpose:
      'The painted panel, with the same accessible name as the trigger. It holds a grid and a listbox, the arrangement the APG Date Picker Combobox example uses for its popup. data-open-to names the surface that takes focus on open.',
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
      'The band above both surfaces, with a rule under it: the value so far, your shortcuts and the Now button. It takes the panel’s width and does not widen it, so a row of shortcuts wraps instead of stretching the calendar.',
  },
  {
    part: 'head-value',
    element: 'span',
    required: false,
    purpose:
      'The value in words. While no value is set, it shows the day the calendar has focused and a placeholder for the time, so the reader knows which day the times in the list belong to.',
  },
  {
    part: 'now',
    element: 'button',
    required: false,
    purpose:
      'Writes the current date and time, read from the clock in timeZone when pressed. It draws the clock icon. It does the same as the relative expression 0 in the field, for a reader who does not know the expression.',
  },
  {
    part: 'presets',
    element: 'your own element, marked slDateTimePickerPresets',
    required: false,
    purpose:
      'A row in the head, beside Now, for your own shortcuts. The Datetime Picker ships no list of shortcuts: the labels and times belong to your product.',
  },
  {
    part: 'panels',
    element: 'div',
    required: false,
    purpose:
      'The two surfaces, as a wrapping flex row: side by side when the panel has room for both, stacked with the calendar first when it does not. Nothing is hidden at any width.',
  },
  {
    part: 'date-panel',
    element: 'div',
    required: false,
    purpose:
      'Holds SlCalendar with its grid, its month and year views and its keyboard. It never shrinks below one month, so the time panel is the one that wraps.',
  },
  {
    part: 'time-panel',
    element: 'div',
    required: false,
    purpose:
      'Holds the list of times. Beside the calendar it is a narrow column; on a line of its own it takes the whole line.',
  },
  {
    part: 'list',
    element: 'div with role="listbox"',
    required: false,
    purpose:
      'The times available on the day the reader is on, with an accessible name that names that day. It is the only part of the panel that scrolls. data-truncated is set when the configuration asks for more rows than maxOptions.',
  },
  {
    part: 'option',
    element: 'div with role="option"',
    required: false,
    purpose:
      'One time. It carries aria-selected, data-selected on the chosen time, data-current on the highlighted time and aria-disabled with data-disabled on a refused time. It shows the time only: the calendar shows the day.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'Drawn in place of the list when the day the reader is on offers no time: an unavailable day, a window the bounds leave empty, or a day on which isTimeUnavailable refuses every time. It says so in a sentence, the empty message.',
  },
  {
    part: 'footer',
    element: 'your own element, marked slDateTimePickerFooter',
    required: false,
    purpose:
      'A row under both surfaces for your own actions. The panel closes on the press that completes the value, so a confirm button is optional; add one here for a flow that asks for it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One Datetime Picker driven by the controls below the canvas. Open it: the calendar and the list are both in the panel, the head shows the value so far, and the panel closes on the press that completes the value.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-playground',
      label: 'Usage',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Pickup date and time</label>
  <div slDateTimePicker name="pickupAt" [clearable]="true"></div>
  <span slFieldDescription>The carrier collects at this date and time.</span>
</div>`,
    }),
  },
  {
    id: 'panel',
    title: 'Two surfaces in one dialog',
    note: 'The panel holds a grid drawn by SlCalendar and a listbox drawn by the Datetime Picker. Both are in the DOM at every width; no tabs switch between them, so assistive technology reads the same structure on a wide and a narrow screen.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-panel',
      label: 'The panel',
      language: 'angular',
      source: `<div slDateTimePicker [defaultOpen]="true"></div>`,
    }),
  },
  {
    id: 'open-to',
    title: 'Which surface takes focus on open',
    note: 'openTo decides where focus lands when the panel opens, not what the panel draws. Both surfaces are present either way, in the same order: the calendar, then the list.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-open-to',
      label: 'Opening on the time',
      language: 'angular',
      source: `<div slDateTimePicker openTo="time"></div>`,
    }),
  },
  {
    id: 'completeness',
    title: 'The value closes the panel, not a button',
    note: 'With closeOnSelect="auto", the press that completes the value closes the panel. A press on a value that was already whole changes one half and leaves the panel open, so the reader can change the day and then the time. always closes on every press that changes the value; never closes on none.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-completeness',
      label: 'The three closings',
      language: 'angular',
      source: `<div slDateTimePicker closeOnSelect="auto"></div>
<div slDateTimePicker closeOnSelect="always"></div>
<div slDateTimePicker closeOnSelect="never"></div>`,
    }),
  },
  {
    id: 'seconds',
    title: 'Seconds',
    note: 'granularity="second" writes seconds in the field, and a step of 30 offers a time every half minute. The list stops at maxOptions rows, so a step in seconds needs a window from minTime to maxTime to stay short.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-seconds',
      label: 'A half-minute step',
      language: 'angular',
      source: `<div slDateTimePicker granularity="second" [step]="30"></div>`,
    }),
  },
  {
    id: 'step',
    title: 'The step, and where it counts from',
    note: 'The list counts from min’s time when min is set and from midnight when it is not, the rule input[type=time] uses. A step of 900 from 09:07 offers 09:07, 09:22 and 09:37; the field still accepts 09:15 by typing.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-step',
      label: 'A quarter hour from 09:07',
      language: 'angular',
      source: `<div slDateTimePicker [min]="opensAt0907" [step]="900"></div>`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Two pairs of bounds together',
    note: 'min and max bound the whole value; minTime and maxTime bound the times of every day inside the range. On the day of min the list starts at min’s time, on the day of max it stops at max’s time, and on every day between it runs from minTime to maxTime.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-range-bounds',
      label: 'A booking window',
      language: 'angular',
      source: `<div
  slDateTimePicker
  [min]="bookingOpens"
  [max]="bookingCloses"
  [minTime]="nine"
  [maxTime]="six"
></div>`,
    }),
  },
  {
    id: 'day-window',
    title: 'The list follows the day the reader is on',
    note: 'Before a day is chosen, the list answers the day the calendar has focused. Moving through the month recomputes it, so a Saturday that closes early shows its shorter list, or the empty state, while the reader is still deciding.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-day-window',
      label: 'A Saturday that closes early',
      language: 'angular',
      source: `<div slDateTimePicker [isTimeUnavailable]="closesEarlyOnSaturday"></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Refused times are disabled or hidden',
    note: 'A refused time stays in the list, disabled, so the reader can still see the step. unavailableOptions="hide" removes refused times instead. A day that offers no time shows the empty message.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-unavailable',
      label: 'Disable, and hide',
      language: 'angular',
      source: `<div slDateTimePicker unavailableOptions="disable" [isTimeUnavailable]="isLunch"></div>
<div slDateTimePicker unavailableOptions="hide" [isTimeUnavailable]="isLunch"></div>`,
    }),
  },
  {
    id: 'now',
    title: 'One press for the current date and time',
    note: 'Now writes both halves from the clock in timeZone. It does the same as the relative expression 0 in the field, for a reader who does not know the expression. messages.now replaces its label.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-now',
      label: 'The head control',
      language: 'angular',
      source: `<div slDateTimePicker [messages]="{ now: 'Right now' }"></div>`,
    }),
  },
  {
    id: 'relative',
    title: 'Typing with the panel open',
    note: 'Alt+ArrowDown opens the panel and leaves focus in the field, so every key the segments take still works, including +, - and = for a relative expression. Escape closes the expression first and leaves the panel open.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-relative',
      label: 'Typing while the panel is open',
      language: 'angular',
      source: `<div slDateTimePicker [defaultOpen]="true" [referenceDateTime]="reference"></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'Your own shortcuts',
    note: 'An element with slDateTimePickerPresets adds a row in the head beside Now. The row wraps inside the panel’s width instead of widening it.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-presets',
      label: 'Two shortcuts',
      language: 'angular',
      source: `<div slDateTimePicker>
  <div slDateTimePickerPresets>
    <button slButton size="sm" variant="ghost" type="button" (click)="tomorrowAtNine()">
      Tomorrow, 9:00 AM
    </button>
    <button slButton size="sm" variant="ghost" type="button" (click)="mondayAtTwo()">
      Monday, 2:00 PM
    </button>
  </div>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps of the control scale. Inside a field, an unset size follows the field. The rows of the list follow the same scale.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-sizes',
      label: 'The three steps',
      language: 'angular',
      source: `<div slDateTimePicker size="sm"></div>
<div slDateTimePicker size="md"></div>
<div slDateTimePicker size="lg"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The frame is the datetime field’s, the same frame every field in a form draws. plain draws no frame at rest, for a table cell or a toolbar, and still shows hover and focus.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-variants',
      label: 'The three frames',
      language: 'angular',
      source: `<div slDateTimePicker variant="outline"></div>
<div slDateTimePicker variant="subtle"></div>
<div slDateTimePicker variant="plain"></div>`,
    }),
  },
  {
    id: 'placement',
    title: 'Placement',
    note: 'Where the panel opens relative to the control. It is a preference: when the panel does not fit on that side, the positioner opens it on the other, and data-placement says which side it chose.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-placement',
      label: 'Above the control',
      language: 'angular',
      source: `<div slDateTimePicker placement="top-start"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only stays focusable and legible. Disabled takes no key and no press, and its trigger is a disabled button. Invalid draws the frame and the focus ring in the danger tone. In the list, the chosen time outranks the highlighted time, which outranks hover.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-states',
      label: 'The four states',
      language: 'angular',
      source: `<div slDateTimePicker readOnly></div>
<div slDateTimePicker disabled></div>
<div slDateTimePicker required></div>
<div slDateTimePicker invalid></div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'The Datetime Picker is a form control: formControlName, formControl and ngModel bind the value, and name adds a hidden input that submits it as YYYY-MM-DDTHH:mm:ss. The field around it supplies the label, the description and the error, and passes its size, disabled state and validity to the Datetime Picker unless it sets its own.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-forms',
      label: 'A form row',
      language: 'angular',
      source: `<form [formGroup]="form">
  <div slField>
    <label slFieldLabel>Pickup date and time</label>
    <div slDateTimePicker formControlName="pickupAt"></div>
    <span slFieldDescription>The dock is open from 9:00 AM to 6:00 PM.</span>
  </div>
</form>`,
    }),
  },
  {
    id: 'narrow',
    title: 'Narrow',
    note: 'With too little room for both surfaces, the list wraps under the calendar, in the value’s own order. Nothing is hidden and no switch is drawn.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-narrow',
      label: 'A narrow panel',
      language: 'angular',
      source: `<div slDateTimePicker [defaultOpen]="true"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'provideDateTimePickerDefaults sets the step and the clock once; provideSlotted sets the language and the words; an ng-template with slDateTimePickerOption draws the content of one row; slDateTimePickerFooter takes your actions; and exportAs reaches focus(), openSurface() and closeSurface(). A value set on one Datetime Picker still wins over the provider.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-composition',
      label: 'A row of your own',
      language: 'angular',
      source: `<div slDateTimePicker>
  <ng-template slDateTimePickerOption let-time let-label="label">
    <span>{{ label }}</span>
    <span>{{ seatsLeft(time) }} seats left</span>
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Alt+ArrowDown opens the panel from a segment and leaves focus in the field. ArrowDown on the trigger opens it and moves focus into the surface openTo names. In the list: the arrow keys, Home, End, type-ahead, and PageUp and PageDown to the previous or next hour. Tab stays inside the panel while it is open, and each surface is one Tab stop.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-keyboard',
      label: 'Your own key listener',
      language: 'angular',
      source: `<div slDateTimePicker (keydown)="recordKey($event)"></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDateTime | null',
    '—',
    'SlDateTimePicker',
    'The value, when you control it. Update it from (valueChange).',
  ],
  [
    'defaultValue',
    'PlainDateTime | null',
    '—',
    'SlDateTimePicker',
    'The starting value when the Datetime Picker holds its own state. Read once, on init.',
  ],
  [
    'open',
    'boolean',
    '—',
    'SlDateTimePicker',
    'Whether the panel is open, when you control it. Update it from (openChange).',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'SlDateTimePicker',
    'Whether the panel starts open. A panel that starts open does not take focus.',
  ],
  [
    'highlighted',
    'DateTimePickerHighlight',
    '—',
    'SlDateTimePicker',
    'Where the reader is in the panel, as { date, time }: the day the calendar has focused and the time the list has highlighted. Set it to control the highlight; update it from (highlightedChange).',
  ],
  [
    'defaultHighlighted',
    'DateTimePickerHighlight',
    '—',
    'SlDateTimePicker',
    'Where the highlight starts. Unset, the panel opens on the day of the value, or of referenceDateTime, and on the time nearest to it.',
  ],
  [
    'min',
    'PlainDateTime',
    '—',
    'SlDateTimePicker',
    'The earliest whole value. The calendar disables the days before its date, and on its date the list starts at its time.',
  ],
  [
    'max',
    'PlainDateTime',
    '—',
    'SlDateTimePicker',
    'The latest whole value. The calendar disables the days after its date, and on its date the list stops at its time.',
  ],
  [
    'minTime',
    'PlainTime',
    '—',
    'SlDateTimePicker',
    'The earliest time on every day inside the range. It applies together with min.',
  ],
  [
    'maxTime',
    'PlainTime',
    '—',
    'SlDateTimePicker',
    'The latest time on every day inside the range. It applies together with max.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDateTimePicker',
    'Returns true for a day the reader cannot choose. The calendar disables it, its list is empty, and a typed value on it marks the Datetime Picker invalid.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime, date: PlainDate) => boolean',
    '—',
    'SlDateTimePicker',
    'Returns true for a time the reader cannot choose on a given day, so the rule can differ by day. A typed value it refuses marks the Datetime Picker invalid.',
  ],
  [
    'step',
    'number',
    '900',
    'SlDateTimePicker',
    'Seconds between two times in the list, counted from the earliest time of the day, or from midnight. It applies to the list only; the field accepts any time. Ignored when options is set.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'SlDateTimePicker',
    'The times the list offers, in the order given, in place of step. Bounds and predicates still refuse times in it.',
  ],
  [
    'maxOptions',
    'number',
    '1440',
    'SlDateTimePicker',
    'The most rows the list draws, a whole day at a one-minute step. Past it, the list is cut, carries data-truncated, and the panel’s accessible description says the remaining times are typed into the field.',
  ],
  [
    'unavailableOptions',
    "'disable' | 'hide'",
    'disable',
    'SlDateTimePicker',
    'What the list does with a refused time: shows it disabled, or leaves it out.',
  ],
  [
    'locale',
    'string',
    'the provider’s locale, then en-US',
    'SlDateTimePicker',
    'A BCP 47 tag. It sets the segments, the clock, the calendar’s month and weekday names, the times in the list and the date and time in words.',
  ],
  [
    'timeZone',
    'string',
    'the browser’s time zone',
    'SlDateTimePicker',
    'The IANA time zone that decides today in the calendar and what Now and the default referenceDateTime read from the clock. The value itself has no time zone.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'the locale’s',
    'SlDateTimePicker',
    'A 12-hour clock with a day period, or a 24-hour clock, in the field and the list.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'SlDateTimePicker',
    'The smallest unit the field writes.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'SlDateTimePicker',
    'The calendar system. gregory is the only value today.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'SlDateTimePicker',
    'The first day of the calendar’s week, from 0 for Sunday to 6 for Saturday.',
  ],
  ['months', 'number', '1', 'SlDateTimePicker', 'How many months the calendar draws side by side.'],
  [
    'weekNumbers',
    'boolean',
    'false',
    'SlDateTimePicker',
    'Adds a column of ISO 8601 week numbers to the calendar.',
  ],
  [
    'referenceDateTime',
    'PlainDateTime',
    'the current date and time',
    'SlDateTimePicker',
    'The date and time assumed where the reader has given none: the month the calendar opens on, the time the list opens on after a day is pressed on an empty value, and the point a relative expression and the arrow keys on an empty field count from.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlDateTimePicker',
    'One step of the control scale for the field, the trigger and the rows of the list. Inside a field, an unset size follows the field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDateTimePicker',
    'The frame of the field: a border, a fill, or none at rest.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'SlDateTimePicker',
    'Where the panel opens relative to the control. When it does not fit on that side, it opens on the other.',
  ],
  [
    'openTo',
    "'date' | 'time'",
    'date',
    'SlDateTimePicker',
    'The surface that takes focus when the trigger or openSurface() opens the panel. Both surfaces are drawn either way.',
  ],
  [
    'closeOnSelect',
    "'auto' | 'always' | 'never'",
    'auto',
    'SlDateTimePicker',
    'When a press closes the panel: auto on the press that completes the value, always on every press that changes the value, never on none.',
  ],
  [
    'disabled',
    'boolean',
    'the field’s',
    'SlDateTimePicker',
    'Disables the field and the trigger. Unset, it follows the form control, then the enclosing field.',
  ],
  [
    'readOnly',
    'boolean',
    'the field’s',
    'SlDateTimePicker',
    'Keeps the value focusable and legible, and disables the trigger. Unset, it follows the enclosing field.',
  ],
  [
    'invalid',
    'boolean',
    'the field’s',
    'SlDateTimePicker',
    'Marks the value invalid. A value outside the bounds or refused by a predicate is invalid whatever this says.',
  ],
  [
    'required',
    'boolean',
    'the field’s',
    'SlDateTimePicker',
    'Sets aria-required on the field. Unset, it follows the enclosing field. Validators.required checks the value in a form.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'SlDateTimePicker',
    'Adds a clear button to the field while it holds any part of a value. The button empties both halves.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'SlDateTimePicker',
    'Whether +, - and = on a segment open a relative expression in the field, such as +2h.',
  ],
  [
    'name',
    'string',
    '—',
    'SlDateTimePicker',
    'Adds a hidden input with this name that submits the value as YYYY-MM-DDTHH:mm:ss.',
  ],
  [
    'messages',
    'Partial<DatetimePickerMessages>',
    '—',
    'SlDateTimePicker',
    'Replaces the words of the language in force, key by key: the trigger’s name with no value (choose) and with one (change, with the value in its {date} slot), the Now button (now), the sentence for a day with no time (empty), and the panel’s description when the list is cut at maxOptions (truncated).',
  ],
  [
    'slDateTimePickerPresets',
    'directive',
    '—',
    'SlDateTimePickerPresets',
    'Marks your own element as the shortcuts row in the head, beside Now.',
  ],
  [
    'slDateTimePickerFooter',
    'directive',
    '—',
    'SlDateTimePickerFooter',
    'Marks your own element as the row of actions under both surfaces.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'DateTimeFieldChangeRequest | ChangeRequest<PlainDateTime | null>',
    when: 'Before the value changes. reason is keyboard for typing, select for a press in the calendar, the list or Now, clear for the clear button and blur for a value completed when the field loses focus. When the field moved the value, the request also carries segments and incomplete, the half still missing. A value that does not change emits nothing.',
  },
  {
    name: 'openChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the panel opens or closes. reason is pointer for the trigger, keyboard for Alt+ArrowDown and ArrowDown on the trigger, programmatic for openSurface() and closeSurface(), escape and outsidePress for a dismissal, and select for the press that closed it.',
  },
  {
    name: 'highlightedChange',
    payload: 'ChangeRequest<DateTimePickerHighlight>',
    when: 'When the reader moves through either surface: the day the calendar has focused and the time the list has highlighted, as one value. Moving the highlight never changes the value.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDateTimePickerDefaults',
    'provider',
    '—',
    'application',
    'Sets timeZone, hourCycle, granularity, calendar, step, maxOptions, placement, openTo, closeOnSelect, unavailableOptions, size and variant once for every Datetime Picker under it. A value set on one Datetime Picker still wins.',
  ],
  [
    'slDateTimePickerOption',
    'ng-template',
    '—',
    'SlDateTimePickerOption',
    'Draws the content of one row of the list. The context carries the time as $implicit, plus date, label, selected, current and unavailable. The row keeps its role, states and keyboard.',
  ],
  [
    'exportAs',
    'slDateTimePicker',
    '—',
    'SlDateTimePicker',
    'Gives a template the instance: focus() moves focus to the first segment of the field, openSurface() opens the panel and moves focus into it, as the trigger does, and closeSurface() closes it.',
  ],
  [
    'ControlValueAccessor',
    'interface',
    '—',
    'SlDateTimePicker',
    'formControlName, formControl and ngModel bind the value. As a validator it reports slottedDateTimeRange outside min and max, slottedDateTimeWindow outside minTime and maxTime, slottedDateTimeUnavailable for a refused date or time, and slottedDateTimeIncomplete while only one half is typed. Validators.required covers an empty value.',
  ],
  [
    '(keydown)',
    'EventListener',
    '—',
    'SlDateTimePicker',
    'A listener on the host runs before the Datetime Picker handles keys on the control, the trigger and the list.',
  ],
]);

const accessibility: string[] = [
  'The panel has role="dialog" and holds a role="grid" and a role="listbox", the arrangement the APG Date Picker Combobox example uses for its popup. The trigger has aria-haspopup="dialog" and aria-expanded, and aria-controls only while the panel exists. Both surfaces are in the DOM at every width.',
  'The trigger’s accessible name carries the chosen date and time in words, such as “Change date and time, September 30, 2026 at 9:00 AM”. Focus returns to the trigger when the panel closes from a press or from Escape, so a screen reader announces the value there. The listbox has its own accessible name, the day its times belong to.',
  'Opening the panel from the trigger or from openSurface() moves focus into the surface openTo names: the focused day in the calendar, or the chosen or nearest time in the list. Alt+ArrowDown opens the panel and leaves focus in the field. While the panel is open, Tab and Shift+Tab cycle through the head, the calendar, the list and the footer; each surface is one Tab stop.',
  'Moving the highlight through the list never changes the value; Enter, Space or a press does. Changing the value on every highlight would send one change per time the reader passes.',
  'Escape closes in steps: an open relative expression in the field closes first, then the calendar returns from the month or year grid to the day grid, and then the panel closes and focus returns to the trigger.',
  'Alt+ArrowDown is a shortcut, never the only way in. ChromeOS turns it into PageDown before the browser receives it, so the trigger is always drawn.',
];

export const ANGULAR_DATETIME_PICKER_DOCS = {
  dateTimePicker: {
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
