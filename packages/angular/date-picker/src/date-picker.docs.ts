import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import datePickerTokens from '@slotted/styles/date-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_DATE_PICKER_TOKENS = datePickerTokens.map((name) => ({
  name,
  purpose: 'A Date Picker value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { SlDatePicker, SlDatePickerPresets, SlDatePickerFooter } from '@slotted/angular/date-picker';",
  selector: '[slDatePicker]',
  exportAs: 'slDatePicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'your own element carrying slDatePicker',
    required: true,
    purpose:
      'The outer box, carrying data-ui="date-picker", the size, variant and calendar axes, data-open and the state attributes. You write this element, so its classes, attributes and other directives stay yours.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose:
      'The box the calendar is positioned against. It draws no frame: the date field inside it draws its own border, focus ring and states.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'The calendar button, in the slDateFieldEnd slot of the date field. Its accessible name carries the chosen date in words, because focus returns to it when the calendar closes. It is always drawn, because ChromeOS turns Alt+ArrowDown into PageDown before the browser receives it.',
  },
  {
    part: 'positioner',
    element: 'div, after the control inside the root',
    required: true,
    purpose:
      'The layer the calendar stands on, drawn while the calendar is open. It carries data-ui="date-picker" again, data-presentation (popover or sheet) and the position the positioner writes. It takes no pointer events of its own, so a press on the page around the surface reaches the page.',
  },
  {
    part: 'content',
    element: 'div with role="dialog"',
    required: true,
    purpose:
      'The painted surface, with the same accessible name as the trigger. Its width comes from the calendar inside it, not from the field it opens from.',
  },
  {
    part: 'grip',
    element: 'span, aria-hidden',
    required: false,
    purpose:
      'The pill at the top of the sheet, drawn only while data-presentation is sheet, in the drawer grip’s geometry and line color. A pull down past half the sheet, or a flick down, closes it with the reason pointer; Escape and the press outside stay the accessible ways out.',
  },
  {
    part: 'presets',
    element: 'your own element carrying slDatePickerPresets',
    required: false,
    purpose:
      'A column beside the calendar for your own shortcuts. The Date Picker ships no list of shortcuts: the labels and dates belong to your product.',
  },
  {
    part: 'footer',
    element: 'your own element carrying slDatePickerFooter',
    required: false,
    purpose: 'A row under the calendar for your own actions.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A field, a trigger and a calendar, driven by the controls below the canvas. Type into the field, or press the trigger and move through the calendar with the arrow keys: both write the same value.',
    snippet: defineSnippet({
      id: 'date-picker-angular-playground',
      label: 'Usage',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Due date</label>
  <div slDatePicker name="dueDate" (valueChange)="onValue($event)"></div>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps of the control scale. The trigger follows the field: its box is the icon plus one step of space, inside the frame, as in every other control with an inner button.',
    snippet: defineSnippet({
      id: 'date-picker-angular-sizes',
      label: 'The three steps',
      language: 'angular',
      source: `<div slDatePicker size="sm"></div>
<div slDatePicker size="md"></div>
<div slDatePicker size="lg"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the field draws at rest. The trigger keeps its calendar icon in all three.',
    snippet: defineSnippet({
      id: 'date-picker-angular-variants',
      label: 'The three frames',
      language: 'angular',
      source: `<div slDatePicker variant="outline"></div>
<div slDatePicker variant="subtle"></div>
<div slDatePicker variant="plain"></div>`,
    }),
  },
  {
    id: 'placement',
    title: 'Where the surface opens',
    note: 'A preference: when the calendar does not fit on that side, it opens on the other, and data-placement on the positioner records the side it took.',
    snippet: defineSnippet({
      id: 'date-picker-angular-placement',
      label: 'Placement',
      language: 'angular',
      source: `<div slDatePicker placement="bottom-start"></div>
<div slDatePicker placement="top-end"></div>`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'min and max bound the field and the calendar together: the calendar disables the days outside them, and a typed date outside them marks the date picker invalid.',
    snippet: defineSnippet({
      id: 'date-picker-angular-range-bounds',
      label: 'min and max',
      language: 'angular',
      source: `<div slDatePicker [min]="first" [max]="last"></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days that are refused',
    note: 'One function reaches the field and the calendar. A refused date marks the date picker invalid when it is typed, and is disabled in the calendar.',
    snippet: defineSnippet({
      id: 'date-picker-angular-unavailable',
      label: 'A predicate',
      language: 'angular',
      source: `<div slDatePicker [isDateUnavailable]="isWeekend"></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts and actions',
    note: 'The two slots you fill: shortcuts beside the calendar and actions under it. The Date Picker ships no list of shortcuts, because the labels and dates belong to your product.',
    snippet: defineSnippet({
      id: 'date-picker-angular-presets',
      label: 'Presets and footer',
      language: 'angular',
      source: `<div slDatePicker>
  <div slDatePickerPresets>
    <button type="button" (click)="today()">Today</button>
  </div>
  <div slDatePickerFooter>
    <button type="button" (click)="apply()">Apply</button>
  </div>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Disabled and read-only both disable the trigger, so the calendar cannot open. Invalid draws the frame and the focus ring in the danger tone.',
    snippet: defineSnippet({
      id: 'date-picker-angular-states',
      label: 'The four states',
      language: 'angular',
      source: `<div slDatePicker readOnly></div>
<div slDatePicker invalid></div>
<div slDatePicker disabled></div>
<div slDatePicker required></div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'name adds a hidden input that submits the date as an ISO 8601 string, so a plain form post sends 2026-09-09 whether the reader typed the date or chose it. formControlName binds it to a reactive form.',
    snippet: defineSnippet({
      id: 'date-picker-angular-forms',
      label: 'A plain form post',
      language: 'angular',
      source: `<form action="/bookings" method="post">
  <div slDatePicker name="checkIn" required></div>
  <button type="submit">Book</button>
</form>`,
    }),
  },
  {
    id: 'narrow',
    title: 'On a narrow touch screen',
    note: 'Under 480 pixels on a coarse pointer, the calendar opens as a sheet attached to the bottom of the viewport. The markup stays the same, and data-presentation on the positioner records which presentation is showing.',
    snippet: defineSnippet({
      id: 'date-picker-angular-narrow',
      label: 'Sheet',
      language: 'angular',
      source: `<div slDatePicker fixedWeeks></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'provideDatePickerDefaults sets the time zone and the placement once, provideSlotted sets the language and the trigger’s names, exportAs returns focus(), openSurface() and closeSurface(), and cancel() refuses a value before it is applied.',
    snippet: defineSnippet({
      id: 'date-picker-angular-composition',
      label: 'Provider and exportAs',
      language: 'angular',
      source: `<div slDatePicker #picker="slDatePicker" (valueChange)="$event.cancel()"></div>
<button type="button" (click)="picker.openSurface()">Open calendar</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Alt+ArrowDown opens the calendar from the field and moves focus to the chosen day. Escape closes it and returns focus to the trigger; while the calendar shows months or years, Escape first returns to the day grid.',
    snippet: defineSnippet({
      id: 'date-picker-angular-keyboard',
      label: 'The keys',
      language: 'angular',
      source: `<!-- Alt + ArrowDown  opens the surface from the field -->
<!-- Escape           returns to the day grid, or closes and returns focus -->
<!-- Tab              cycles inside the surface while it is open -->
<div slDatePicker></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDate | DateRange | PlainDate[] | PlainYearMonth | null',
    '—',
    'SlDatePicker',
    "The selected value, whose shape follows selectionMode. Binding it makes the value controlled. PlainDate is exported by @slotted/core/date. parseISODate(text) returns a PlainDate or null, toISODate(date) returns 'YYYY-MM-DD', and isPlainDate(value) narrows the CalendarValue (valueChange) reports.",
  ],
  [
    'defaultValue',
    'PlainDate | DateRange | PlainDate[] | PlainYearMonth | null',
    '—',
    'SlDatePicker',
    'The starting value of an uncontrolled date picker. Read once, when the date picker initializes.',
  ],
  [
    'open',
    'boolean',
    '—',
    'SlDatePicker',
    'Whether the calendar is showing. Binding it makes the open state controlled.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'SlDatePicker',
    'Whether the calendar shows when the date picker initializes. Focus does not move into it.',
  ],
  [
    'min',
    'PlainDate | PlainYearMonth',
    '—',
    'SlDatePicker',
    'The earliest date the field and the calendar accept. Earlier days are disabled in the calendar, an earlier typed date marks the date picker invalid, and a form reports slottedDateRange.',
  ],
  [
    'max',
    'PlainDate | PlainYearMonth',
    '—',
    'SlDatePicker',
    'The latest date the field and the calendar accept. Later days are disabled in the calendar, a later typed date marks the date picker invalid, and a form reports slottedDateRange.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDatePicker',
    'Returns true for a date the reader cannot choose. The calendar disables it, a typed unavailable date marks the date picker invalid, and a form reports slottedDateUnavailable.',
  ],
  [
    'granularity',
    "'day' | 'month'",
    'day',
    'SlDatePicker',
    'What a choice is. month opens the calendar on the months of a year and chooses a month cell; the field shows the month and the year segments; value, defaultValue, min and max are PlainYearMonth from @slotted/core/date ({ year, month }), (valueChange) reports one, and name submits YYYY-MM. parseISOYearMonth and toISOYearMonth convert to and from that text. selectionMode, months, isDateUnavailable and the week inputs do not apply.',
  ],
  [
    'selectionMode',
    "'single' | 'range' | 'multiple'",
    'single',
    'SlDatePicker',
    'How many dates the calendar selects, and so the shape of the value. The field shows a single date only; for a start and an end, use slDateRangePicker.',
  ],
  ['months', 'number', '1', 'SlDatePicker', 'How many months the calendar draws side by side.'],
  [
    'defaultView',
    "'day' | 'month' | 'year'",
    'day',
    'SlDatePicker',
    'The grid the calendar opens on.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'SlDatePicker',
    'Adds a column of ISO 8601 week numbers to the calendar.',
  ],
  [
    'fixedWeeks',
    'boolean',
    'true',
    'SlDatePicker',
    'Draws six rows for every month, so the surface keeps its height as the reader pages between months.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'SlDatePicker',
    'Where the calendar opens relative to the field. When it does not fit on that side, it opens on the other.',
  ],
  [
    'closeOnSelect',
    "'auto' | 'always' | 'never'",
    'auto',
    'SlDatePicker',
    'Whether choosing a day closes the calendar. auto closes it for a single date and keeps it open for a range or several dates, which need more than one press.',
  ],
  [
    'locale',
    'string',
    'the provideSlotted locale, else en-US',
    'SlDatePicker',
    'A BCP 47 tag. Sets the order, separators and placeholders of the segments, the month and weekday names, the first day of the week and the date the trigger announces.',
  ],
  [
    'timeZone',
    'string',
    'the browser’s time zone',
    'SlDatePicker',
    'The IANA time zone that decides which day is today. The value itself has no time zone.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'SlDatePicker',
    'The day the calendar starts each week on, from 0 for Sunday to 6 for Saturday.',
  ],
  [
    'yearPivot',
    'number',
    '20',
    'SlDatePicker',
    'How a two-digit typed year resolves: a year up to this many years ahead of today is read in this century, and a later one in the previous century.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'SlDatePicker',
    'The calendar system. gregory is the only value today.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlDatePicker',
    'One step of the control scale for the field and the trigger. Inside slField, an unset size follows the field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDatePicker',
    'How much frame the field draws at rest: a border, a filled ground, or neither.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'SlDatePicker',
    'Disables the segments and the trigger, and takes both out of the tab order. Read from the form control, then from the enclosing slField, when unset.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'SlDatePicker',
    'Keeps the date legible and focusable and disables the trigger, so the calendar cannot open. Read from the enclosing slField when unset.',
  ],
  [
    'invalid',
    'boolean',
    '—',
    'SlDatePicker',
    'Draws the frame and the focus ring in the danger tone and sets aria-invalid. A date outside min and max, or refused by isDateUnavailable, sets it on its own.',
  ],
  [
    'required',
    'boolean',
    '—',
    'SlDatePicker',
    'Sets aria-required on the field. Read from the enclosing slField when unset. In a form, add Validators.required.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'SlDatePicker',
    'Adds a clear button to the field while it holds a date. It sets the value to null and returns focus to the field.',
  ],
  [
    'name',
    'string',
    '—',
    'SlDatePicker',
    'Adds a hidden input with this name that submits the date as an ISO 8601 string, such as 2026-09-30.',
  ],
  [
    'messages',
    'Partial<DatePickerMessages>',
    '—',
    'SlDatePicker',
    'Replaces the trigger’s accessible name, key by key: choose while no date is set, and change, with the date in its {date} slot, once one is.',
  ],
  [
    'slDatePickerPresets',
    'Directive',
    '—',
    'SlDatePicker',
    'Marks your own element as the shortcuts column beside the calendar.',
  ],
  [
    'slDatePickerFooter',
    'Directive',
    '—',
    'SlDatePicker',
    'Marks your own element as the actions row under the calendar.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<CalendarValue>',
    when: 'Before the value changes, from the field or the calendar. reason is keyboard for typing and for the calendar’s keys, pointer for a press on a day, clear for the clear button and blur for a date completed when the field loses focus. cancel() keeps the current value. There is no [(value)] two-way binding: bind [value] and update it from this output.',
  },
  {
    name: 'openChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the calendar opens or closes. reason is pointer for the trigger, keyboard for Alt+ArrowDown, programmatic for openSurface() and closeSurface(), escape for the Escape key, outsidePress for a press outside the surface and select for a chosen day. cancel() keeps the current state.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDatePickerDefaults',
    'Provider',
    '—',
    'application',
    'Sets timeZone, placement, closeOnSelect, calendar, size and variant for every slDatePicker under the injector. An input on one date picker wins.',
  ],
  [
    'ControlValueAccessor',
    'NG_VALUE_ACCESSOR',
    '—',
    'SlDatePicker',
    'formControl, formControlName and ngModel bind the value, a form reset empties the field, and the form’s disabled state reaches the date picker.',
  ],
  [
    'Validator',
    'NG_VALIDATORS',
    '—',
    'SlDatePicker',
    'Reports slottedDateRange, with min, max and the date, for a date outside the bounds, and slottedDateUnavailable for a date isDateUnavailable refuses. required is left to Validators.required.',
  ],
  [
    'exportAs',
    'slDatePicker',
    '—',
    'SlDatePicker',
    'A template reference to the instance, with focus(), which focuses the first segment, and openSurface() and closeSurface(), which show and hide the calendar without a bound open input. openSurface() moves focus into the calendar.',
  ],
  [
    'ng-content slots',
    'slDatePickerPresets, slDatePickerFooter',
    '—',
    'SlDatePicker',
    'The two places you fill, as directives on your own elements, so a button, a list or a toolbar keeps its own semantics.',
  ],
]);

const accessibility: string[] = [
  'The trigger’s accessible name carries the chosen date in words, such as “Change date, Wednesday, September 30, 2026”. Focus returns to the trigger when the calendar closes from a chosen day or from Escape, so a screen reader announces the date there.',
  'Opening the calendar from the trigger, from Alt+ArrowDown or from openSurface() moves focus to the chosen day, or to today when no date is set. While the calendar is open, Tab and Shift+Tab cycle through the shortcuts, the calendar and the footer.',
  'Escape closes in steps: while the calendar shows the month or year grid, Escape returns to the day grid; on the day grid, it closes the calendar and returns focus to the trigger.',
  'Alt+ArrowDown is a shortcut, never the only way in. ChromeOS turns it into PageDown before the browser receives it, so the trigger is always drawn.',
  'The surface has role="dialog" and the same accessible name as the trigger. The trigger sets aria-expanded, and sets aria-controls only while the surface exists.',
  'The field and the calendar refuse the same dates, from the same min, max and isDateUnavailable, so a date the calendar disables marks the field invalid when it is typed.',
];

export const ANGULAR_DATE_PICKER_DOCS = {
  datePicker: {
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
