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

export const REACT_DATE_PICKER_TOKENS = datePickerTokens.map((name) => ({
  name,
  purpose: 'A Date Picker value the theme sets.',
}));

const imports: ReferenceImport = {
  source: "import { DatePicker, DatePickerDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The outer box, carrying data-ui="date-picker", the size, variant and calendar axes, data-open and the state attributes. className, style and every native attribute reach it.',
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
      'The calendar button, in the end slot of the date field. Its accessible name carries the chosen date in words, because focus returns to it when the calendar closes. It is always drawn, because ChromeOS turns Alt+ArrowDown into PageDown before the browser receives it.',
  },
  {
    part: 'positioner',
    element: 'div, portalled to the end of the document',
    required: true,
    purpose:
      'The layer the calendar stands on. It carries data-ui="date-picker" again, data-presentation (popover or sheet) and the position the positioner writes. It takes no pointer events of its own, so a press on the page around the surface reaches the page.',
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
    element: 'div',
    required: false,
    purpose:
      'A column beside the calendar for your own shortcuts, drawn when presets is set. The Date Picker ships no list of shortcuts: the labels and dates belong to your product.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose: 'A row under the calendar for your own actions, drawn when footer is set.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A field, a trigger and a calendar, driven by the controls below the canvas. Type into the field, or press the trigger and move through the calendar with the arrow keys: both write the same value.',
    snippet: defineSnippet({
      id: 'date-picker-react-playground',
      label: 'Usage',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Due date</FieldLabel>
  <DatePicker name="dueDate" onValueChange={setValue} value={value} />
</Field>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps of the control scale. The trigger follows the field: its box is the icon plus one step of space, inside the frame, as in every other control with an inner button.',
    snippet: defineSnippet({
      id: 'date-picker-react-sizes',
      label: 'The three steps',
      language: 'tsx',
      source: `<>
  <DatePicker size="sm" />
  <DatePicker size="md" />
  <DatePicker size="lg" />
</>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the field draws at rest. The trigger keeps its calendar icon in all three.',
    snippet: defineSnippet({
      id: 'date-picker-react-variants',
      label: 'The three frames',
      language: 'tsx',
      source: `<>
  <DatePicker variant="outline" />
  <DatePicker variant="subtle" />
  <DatePicker variant="plain" />
</>;`,
    }),
  },
  {
    id: 'placement',
    title: 'Where the surface opens',
    note: 'A preference: when the calendar does not fit on that side, it opens on the other, and data-placement on the positioner records the side it took.',
    snippet: defineSnippet({
      id: 'date-picker-react-placement',
      label: 'Placement',
      language: 'tsx',
      source: `<>
  <DatePicker placement="bottom-start" />
  <DatePicker placement="top-end" />
</>;`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'min and max bound the field and the calendar together: the calendar disables the days outside them, and a typed date outside them marks the date picker invalid.',
    snippet: defineSnippet({
      id: 'date-picker-react-range-bounds',
      label: 'min and max',
      language: 'tsx',
      source: `<DatePicker max={{ year: 2026, month: 12, day: 31 }} min={{ year: 2026, month: 1, day: 1 }} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days that are refused',
    note: 'One function reaches the field and the calendar. A refused date marks the date picker invalid when it is typed, and is disabled in the calendar.',
    snippet: defineSnippet({
      id: 'date-picker-react-unavailable',
      label: 'A predicate',
      language: 'tsx',
      source: `<DatePicker isDateUnavailable={(date) => isWeekend(date)} />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts and actions',
    note: 'The two slots you fill: shortcuts beside the calendar and actions under it. The Date Picker ships no list of shortcuts, because the labels and dates belong to your product.',
    snippet: defineSnippet({
      id: 'date-picker-react-presets',
      label: 'Presets and footer',
      language: 'tsx',
      source: `<DatePicker
  footer={<Button onClick={apply}>Apply</Button>}
  presets={<Button onClick={() => setValue(today)}>Today</Button>}
/>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Disabled and read-only both disable the trigger, so the calendar cannot open. Invalid draws the frame and the focus ring in the danger tone.',
    snippet: defineSnippet({
      id: 'date-picker-react-states',
      label: 'The four states',
      language: 'tsx',
      source: `<>
  <DatePicker readOnly />
  <DatePicker invalid />
  <DatePicker disabled />
  <DatePicker required />
</>;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'name adds a hidden input that submits the date as an ISO 8601 string, so a plain form post sends 2026-09-09 whether the reader typed the date or chose it.',
    snippet: defineSnippet({
      id: 'date-picker-react-forms',
      label: 'A plain form post',
      language: 'tsx',
      source: `<form action="/bookings" method="post">
  <DatePicker name="checkIn" required />
  <Button type="submit">Book</Button>
</form>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'On a narrow touch screen',
    note: 'Under 480 pixels on a coarse pointer, the calendar opens as a sheet attached to the bottom of the viewport. The markup stays the same, and data-presentation on the positioner records which presentation is showing.',
    snippet: defineSnippet({
      id: 'date-picker-react-narrow',
      label: 'Sheet',
      language: 'tsx',
      source: `<DatePicker fixedWeeks />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'DatePickerDefaultsProvider sets the time zone and the placement once, SlottedProvider sets the language and the trigger’s names, the ref returns focus(), open() and close(), and request.cancel() refuses a value before it is applied.',
    snippet: defineSnippet({
      id: 'date-picker-react-composition',
      label: 'Provider and handle',
      language: 'tsx',
      source: `<DatePickerDefaultsProvider timeZone="America/Sao_Paulo">
  <DatePicker ref={handle} onValueChange={(value, request) => request.cancel()} />
</DatePickerDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Alt+ArrowDown opens the calendar from the field and moves focus to the chosen day. Escape closes it and returns focus to the trigger; while the calendar shows months or years, Escape first returns to the day grid.',
    snippet: defineSnippet({
      id: 'date-picker-react-keyboard',
      label: 'The keys',
      language: 'tsx',
      source: `// Alt + ArrowDown  opens the surface from the field
// Escape           returns to the day grid, or closes and returns focus
// Tab              cycles inside the surface while it is open
// the grid's own keys, once focus is in it`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDate | DateRange | PlainDate[] | null',
    '—',
    'DatePicker',
    "The selected value, whose shape follows selectionMode. Setting it makes the value controlled. PlainDate is exported by @slotted/core/date. parseISODate(text) returns a PlainDate or null, toISODate(date) returns 'YYYY-MM-DD', and isPlainDate(value) narrows the CalendarValue onValueChange reports: value={parseISODate(iso)} onValueChange={(v) => setIso(isPlainDate(v) ? toISODate(v) : '')}.",
  ],
  [
    'defaultValue',
    'PlainDate | DateRange | PlainDate[] | null',
    '—',
    'DatePicker',
    'The starting value of an uncontrolled date picker. Read once, on the first render.',
  ],
  [
    'open',
    'boolean',
    '—',
    'DatePicker',
    'Whether the calendar is showing. Setting it makes the open state controlled.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'DatePicker',
    'Whether the calendar shows on the first render. Focus does not move into it.',
  ],
  [
    'min',
    'PlainDate',
    '—',
    'DatePicker',
    'The earliest date the field and the calendar accept. Earlier days are disabled in the calendar, and an earlier typed date marks the date picker invalid.',
  ],
  [
    'max',
    'PlainDate',
    '—',
    'DatePicker',
    'The latest date the field and the calendar accept. Later days are disabled in the calendar, and a later typed date marks the date picker invalid.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'DatePicker',
    'Returns true for a date the reader cannot choose. The calendar disables it, and a typed unavailable date marks the date picker invalid.',
  ],
  [
    'granularity',
    "'day' | 'month'",
    'day',
    'DatePicker',
    'What a choice is. month opens the calendar on the months of a year and chooses a month cell; the field shows the month and the year segments; value, defaultValue, min and max are PlainYearMonth from @slotted/core/date ({ year, month }), onValueChange reports one, and name submits YYYY-MM. parseISOYearMonth and toISOYearMonth convert to and from that text. selectionMode, months, isDateUnavailable and the week props do not apply.',
  ],
  [
    'selectionMode',
    "'single' | 'range' | 'multiple'",
    'single',
    'DatePicker',
    'How many dates the calendar selects, and so the shape of the value. The field shows a single date only; for a start and an end, use DateRangePicker.',
  ],
  ['months', 'number', '1', 'DatePicker', 'How many months the calendar draws side by side.'],
  [
    'defaultView',
    "'day' | 'month' | 'year'",
    'day',
    'DatePicker',
    'The grid the calendar opens on.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'DatePicker',
    'Adds a column of ISO 8601 week numbers to the calendar.',
  ],
  [
    'fixedWeeks',
    'boolean',
    'true',
    'DatePicker',
    'Draws six rows for every month, so the surface keeps its height as the reader pages between months.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'DatePicker',
    'Where the calendar opens relative to the field. When it does not fit on that side, it opens on the other.',
  ],
  [
    'closeOnSelect',
    "'auto' | 'always' | 'never'",
    'auto',
    'DatePicker',
    'Whether choosing a day closes the calendar. auto closes it for a single date and keeps it open for a range or several dates, which need more than one press.',
  ],
  [
    'locale',
    'string',
    'the SlottedProvider locale, else en-US',
    'DatePicker',
    'A BCP 47 tag. Sets the order, separators and placeholders of the segments, the month and weekday names, the first day of the week and the date the trigger announces.',
  ],
  [
    'timeZone',
    'string',
    'the browser’s time zone',
    'DatePicker',
    'The IANA time zone that decides which day is today. The value itself has no time zone.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'DatePicker',
    'The day the calendar starts each week on, from 0 for Sunday to 6 for Saturday.',
  ],
  [
    'yearPivot',
    'number',
    '20',
    'DatePicker',
    'How a two-digit typed year resolves: a year up to this many years ahead of today is read in this century, and a later one in the previous century.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'DatePicker',
    'The calendar system. gregory is the only value today.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'DatePicker',
    'One step of the control scale for the field and the trigger. Inside a Field, an unset size follows the field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'DatePicker',
    'How much frame the field draws at rest: a border, a filled ground, or neither.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'DatePicker',
    'Disables the segments and the trigger, and takes both out of the tab order. Read from the enclosing Field when unset.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'DatePicker',
    'Keeps the date legible and focusable and disables the trigger, so the calendar cannot open. Read from the enclosing Field when unset.',
  ],
  [
    'invalid',
    'boolean',
    '—',
    'DatePicker',
    'Draws the frame and the focus ring in the danger tone and sets aria-invalid. A date outside min and max, or refused by isDateUnavailable, sets it on its own.',
  ],
  [
    'required',
    'boolean',
    '—',
    'DatePicker',
    'Sets aria-required on the field. Read from the enclosing Field when unset.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'DatePicker',
    'Adds a clear button to the field while it holds a date. It sets the value to null and returns focus to the field.',
  ],
  [
    'name',
    'string',
    '—',
    'DatePicker',
    'Adds a hidden input with this name that submits the date as an ISO 8601 string, such as 2026-09-30.',
  ],
  [
    'messages',
    'Partial<DatePickerMessages>',
    '—',
    'DatePicker',
    'Replaces the trigger’s accessible name, key by key: choose while no date is set, and change, with the date in its {date} slot, once one is.',
  ],
  [
    'presets',
    'ReactNode',
    '—',
    'DatePicker',
    'Your own shortcuts, drawn in a column beside the calendar.',
  ],
  [
    'footer',
    'ReactNode',
    '—',
    'DatePicker',
    'Your own actions, drawn in a row under the calendar.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: CalendarValue, request: ChangeRequest<CalendarValue>)',
    when: 'Before the value changes, from the field or the calendar. request.reason is keyboard for typing and for the calendar’s keys, pointer for a press on a day, clear for the clear button and blur for a date completed when the field loses focus. request.cancel() keeps the current value.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the calendar opens or closes. request.reason is pointer for the trigger, keyboard for Alt+ArrowDown and for the handle’s open() and close(), escape for the Escape key, outsidePress for a press outside the surface and select for a chosen day. request.cancel() keeps the current state.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'DatePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets timeZone, placement, closeOnSelect, calendar, size and variant for every DatePicker under it. A prop on one DatePicker wins.',
  ],
  [
    'render',
    '(props: DatePickerRootProps) => ReactNode',
    '—',
    'DatePicker',
    'Renders the root as another element. Spread the props onto it: they carry the ref the calendar is positioned against.',
  ],
  [
    'ref',
    'Ref<DatePickerHandle>',
    '—',
    'DatePicker',
    'A handle with focus(), which focuses the first segment, and open() and close(), which show and hide the calendar without a controlled open prop. open() moves focus into the calendar.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'DatePicker',
    'Runs before Alt+ArrowDown is read. Calling event.preventDefault() keeps the shortcut for the page.',
  ],
]);

const accessibility: string[] = [
  'The trigger’s accessible name carries the chosen date in words, such as “Change date, Wednesday, September 30, 2026”. Focus returns to the trigger when the calendar closes from a chosen day or from Escape, so a screen reader announces the date there.',
  'Opening the calendar from the trigger, from Alt+ArrowDown or from open() moves focus to the chosen day, or to today when no date is set. While the calendar is open, Tab and Shift+Tab cycle through the shortcuts, the calendar and the footer.',
  'Escape closes in steps: while the calendar shows the month or year grid, Escape returns to the day grid; on the day grid, it closes the calendar and returns focus to the trigger.',
  'Alt+ArrowDown is a shortcut, never the only way in. ChromeOS turns it into PageDown before the browser receives it, so the trigger is always drawn.',
  'The surface has role="dialog" and the same accessible name as the trigger. The trigger sets aria-expanded, and sets aria-controls only while the surface exists.',
  'The field and the calendar refuse the same dates, from the same min, max and isDateUnavailable, so a date the calendar disables marks the field invalid when it is typed.',
];

export const REACT_DATE_PICKER_DOCS = {
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
