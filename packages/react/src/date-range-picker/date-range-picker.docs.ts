import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import dateRangePickerTokens from '@slotted/styles/date-range-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DATE_RANGE_PICKER_TOKENS = dateRangePickerTokens.map((name) => ({
  name,
  purpose: 'A Date Range Picker value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { DateRangePicker, DateRangePickerDefaultsProvider, DateRangePickerPreset } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The outer box, carrying data-ui="date-range-picker", the size, variant and calendar axes, data-count, data-open and the state attributes. className, style and every native attribute reach it.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose:
      'The frame around both fields, and the box the calendar is positioned against. It draws the one border, focus ring and invalid state; the two date fields inside it use variant="plain" and draw none. Inside a field, it is a group named by the field’s label and takes the field’s control identifier.',
  },
  {
    part: 'start',
    element: 'div',
    required: true,
    purpose:
      'Holds the start date field. Carries data-current while the start is the end being edited, drawn as an underline while the calendar is open or focus is inside the frame.',
  },
  {
    part: 'separator',
    element: 'span',
    required: true,
    purpose:
      'The dash between the two fields. It is aria-hidden, because each field has its own name.',
  },
  {
    part: 'end',
    element: 'div',
    required: true,
    purpose: 'Holds the end date field, and carries data-current while the end is being edited.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Empties both ends with the clear reason, drawn with clearable while either end holds a date. It is the only clear button in the frame: the two fields draw none of their own.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'The calendar button. Its accessible name carries both dates in words and the length, because focus returns to it when the calendar closes. It is always drawn, because ChromeOS turns Alt+ArrowDown into PageDown before the browser receives it.',
  },
  {
    part: 'positioner',
    element: 'div, portalled to the end of the document',
    required: false,
    purpose:
      'The layer the calendar stands on, drawn while the calendar is open. It carries data-ui="date-range-picker" again, the position the positioner writes, and data-presentation: popover, or sheet on a touch screen narrower than 480 pixels.',
  },
  {
    part: 'content',
    element: 'div with role="dialog"',
    required: false,
    purpose:
      'The painted surface, with the same accessible name as the trigger. Its width is capped by the room available, so two months that do not fit side by side wrap.',
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
      'The band above the calendar: both dates as they stand, the length and the limit. It takes the width of the surface and does not widen it.',
  },
  {
    part: 'head-start',
    element: 'span',
    required: false,
    purpose:
      'The start date, written short. It carries data-placeholder while there is no start, and data-pending while it shows the start the next press would make instead of a chosen one.',
  },
  {
    part: 'head-end',
    element: 'span',
    required: false,
    purpose: 'The end date, written short, with the same two attributes as head-start.',
  },
  {
    part: 'length',
    element: 'span',
    required: false,
    purpose:
      'The length, such as "4 nights": of the range the next press would make while the end is pending, else of the value. It is a polite live region, so a screen reader announces it as the focused day moves. It carries data-pending while it describes a pending range.',
  },
  {
    part: 'limit',
    element: 'span',
    required: false,
    purpose:
      'The length rule, such as "2 to 7 nights", drawn while minLength or maxLength is set, so the band names the rule the calendar enforces.',
  },
  {
    part: 'panels',
    element: 'div',
    required: false,
    purpose:
      'The shortcuts and the calendar as a wrapping row: side by side where there is room, the calendar under the shortcuts where there is not.',
  },
  {
    part: 'presets',
    element: 'div',
    required: false,
    purpose:
      'A column for your own shortcuts, drawn when presets is set. The Date Range Picker ships the shortcut button and its column, never the list: the ranges belong to your product.',
  },
  {
    part: 'preset',
    element: 'button, or the element render returns',
    required: false,
    purpose:
      'One shortcut, DateRangePickerPreset. It writes its range with the select reason and carries data-selected while the value equals its range.',
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
    note: 'Check-in and check-out in one frame, driven by the controls below the canvas. Type into either field, or press the trigger and choose two days: while the range is drawn, the band above the calendar says how many nights it holds.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-playground',
      label: 'Usage',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Stay</FieldLabel>
  <DateRangePicker
    count="nights"
    endName="checkout"
    onValueChange={setValue}
    startName="checkin"
    value={value}
  />
</Field>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps of the control scale. Both fields, the dash and the trigger follow the step together, so a range in a dense table shrinks as one control.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-sizes',
      label: 'The three steps',
      language: 'tsx',
      source: `<>
  <DateRangePicker size="sm" />
  <DateRangePicker size="md" />
  <DateRangePicker size="lg" />
</>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control draws at rest. The two fields inside are plain, and the one frame answers hover, focus and invalid for both.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-variants',
      label: 'The three frames',
      language: 'tsx',
      source: `<>
  <DateRangePicker variant="outline" />
  <DateRangePicker variant="subtle" />
  <DateRangePicker variant="plain" />
</>;`,
    }),
  },
  {
    id: 'length',
    title: 'The length while the range is drawn',
    note: 'Open the calendar and choose a start: the band follows the pointer and the focused day, and says the length of the range the next press would make. count decides the unit: a stay counts nights and a leave request counts days, so the same two dates give 4 nights or 5 days.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-length',
      label: 'Nights and days',
      language: 'tsx',
      source: `<>
  <DateRangePicker count="nights" />
  <DateRangePicker count="days" />
</>;`,
    }),
  },
  {
    id: 'limits',
    title: 'Length limits',
    note: 'A stay of two to seven nights. Once a check-in is chosen, the calendar disables the days that would break the rule and the band names it; a typed range outside it marks the frame invalid. minLength and maxLength count in the unit count names.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-limits',
      label: 'Two to seven nights',
      language: 'tsx',
      source: `<DateRangePicker count="nights" maxLength={7} minLength={2} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Unavailable days',
    note: 'The room is taken from the 15th to the 18th. Choose a check-in before it: the calendar disables the nights past the first taken day, because a range runs without gaps. contiguous={false} lets a range run across an unavailable day and checks only its two ends.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-unavailable',
      label: 'A blocked run',
      language: 'tsx',
      source: `<DateRangePicker isDateUnavailable={(date) => date.day >= 15 && date.day <= 18} />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Presets',
    note: 'The stays a hotel offers by name. Each is a DateRangePickerPreset with its own range; pressing one writes the value and closes the calendar, and the one equal to the value carries data-selected. The list belongs to the product.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-presets',
      label: 'Named stays',
      language: 'tsx',
      source: `<DateRangePicker
  presets={
    <>
      <DateRangePickerPreset value={weekend}>Weekend</DateRangePickerPreset>
      <DateRangePickerPreset value={() => week(today)}>One week</DateRangePickerPreset>
    </>
  }
/>;`,
    }),
  },
  {
    id: 'open-end',
    title: 'An open end',
    note: 'A check-in without a check-out is a value, { start, end: null }, and the field shows it. Open the calendar over it and the first press writes the missing end. required asks for both ends.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-open-end',
      label: 'From a date on',
      language: 'tsx',
      source: `<DateRangePicker defaultValue={{ start: checkin, end: null }} clearable />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only keeps the dates legible and copyable and disables the buttons; disabled disables everything and keeps the dates readable; a check-out before its check-in is invalid on the end field and on the frame, and the ends are not swapped; required reaches both fields.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-states',
      label: 'The four',
      language: 'tsx',
      source: `<>
  <DateRangePicker readOnly />
  <DateRangePicker disabled />
  <DateRangePicker value={{ start: checkout, end: checkin }} />
  <DateRangePicker required />
</>;`,
    }),
  },
  {
    id: 'forms',
    title: 'Forms',
    note: 'A plain form post sends two ISO 8601 strings under startName and endName, whether the reader typed the dates or chose them. Choose a stay and submit.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-forms',
      label: 'Two names',
      language: 'tsx',
      source: `<form onSubmit={reserve}>
  <DateRangePicker endName="checkout" startName="checkin" required />
  <Button type="submit">Reserve</Button>
</form>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'Narrow',
    note: 'In a column narrower than two dates, the frame stays on one line: each date clips at its own edge and scrolls back into view when focus enters it, and the trigger keeps its place. The surface is capped by the room available, and the second month wraps under the first. On a touch screen narrower than 480 pixels, the surface is a sheet.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-narrow',
      label: 'In a narrow column',
      language: 'tsx',
      source: `<div className="slotted-demo-measure">
  <DateRangePicker />
</div>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'DateRangePickerDefaultsProvider sets the unit and the months for a section, and SlottedProvider sets the language and every word. The handle opens, closes and focuses one end; position and onPositionChange control which end the next press writes.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-composition',
      label: 'Provider and handle',
      language: 'tsx',
      source: `<DateRangePickerDefaultsProvider count="nights" months={1}>
  <DateRangePicker ref={handle} />
</DateRangePickerDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Alt+ArrowDown opens the calendar from either field and leaves focus there. Enter on the trigger opens it on the day of the end being edited; each arrow moves the pending end and the band says the length; Enter twice writes the range. Escape returns to the day grid first, then closes and discards a range that has only its start.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-keyboard',
      label: 'The keys',
      language: 'tsx',
      source: `// Alt + ArrowDown  opens the calendar from either field; focus stays in the field
// Enter, Space     on the trigger: opens on the day of the current end
// arrows           move the pending end; the band says the length
// Enter, Space     the first press starts the range, the second writes it
// Escape           returns to the day grid, or closes and discards the pending range
// Tab              cycles inside the surface while it is open`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'DateRange | null',
    '—',
    'DateRangePicker',
    'The range, { start, end }, where each end is a PlainDate or null. A range with both ends null is null. Setting it makes the value controlled.',
  ],
  [
    'defaultValue',
    'DateRange | null',
    '—',
    'DateRangePicker',
    'The starting value of an uncontrolled date range picker. Read once, on the first render.',
  ],
  [
    'open',
    'boolean',
    '—',
    'DateRangePicker',
    'Whether the calendar is showing. Setting it makes the open state controlled.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'DateRangePicker',
    'Whether the calendar shows on the first render. Focus does not move into it.',
  ],
  [
    'position',
    "'start' | 'end'",
    '—',
    'DateRangePicker',
    'The end being edited: the field that carries data-current, the day the calendar opens on, and the end the next press in the calendar writes. Setting it makes the position controlled.',
  ],
  [
    'defaultPosition',
    "'start' | 'end'",
    'start',
    'DateRangePicker',
    'The end being edited on the first render.',
  ],
  [
    'min',
    'PlainDate',
    '—',
    'DateRangePicker',
    'The earliest date both fields and the calendar accept. Earlier days are disabled in the calendar, and an earlier typed date marks the date range picker invalid. Once both ends are set, the start field also stops at the end and the end field at the start.',
  ],
  [
    'max',
    'PlainDate',
    '—',
    'DateRangePicker',
    'The latest date both fields and the calendar accept. Later days are disabled in the calendar, and a later typed date marks the date range picker invalid.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'DateRangePicker',
    'Returns true for a date the reader cannot choose. The calendar disables it, and a typed range that contains it marks the date range picker invalid.',
  ],
  [
    'contiguous',
    'boolean',
    'true',
    'DateRangePicker',
    'Whether a range must run without unavailable days. On, once a start is chosen the calendar also disables every day beyond the first unavailable one, searching up to maxLength days, or 366, on each side. Off, only the two ends are checked.',
  ],
  [
    'minLength',
    'number',
    '—',
    'DateRangePicker',
    'The shortest range allowed, in the unit count names. Once a start is chosen, the calendar disables the days that would make a shorter range, and the band names the limit.',
  ],
  [
    'maxLength',
    'number',
    '—',
    'DateRangePicker',
    'The longest range allowed, in the unit count names. A typed range outside either limit marks the date range picker invalid.',
  ],
  [
    'count',
    "'days' | 'nights'",
    'days',
    'DateRangePicker',
    'What the length counts. days counts both ends; nights counts the nights between them. The same day at both ends is 1 day or 0 nights.',
  ],
  [
    'months',
    'number',
    '2',
    'DateRangePicker',
    'How many months the calendar draws side by side. When they do not fit, they wrap.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'DateRangePicker',
    'Adds a column of ISO 8601 week numbers to the calendar.',
  ],
  [
    'fixedWeeks',
    'boolean',
    'true',
    'DateRangePicker',
    'Draws six rows for every month, so the surface keeps its height as the reader pages between months.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'DateRangePicker',
    'Where the calendar opens relative to the frame. When it does not fit on that side, it opens on the other.',
  ],
  [
    'closeOnSelect',
    "'auto' | 'always' | 'never'",
    'auto',
    'DateRangePicker',
    'When choosing closes the calendar. auto closes it when the range is complete, by a second press or a shortcut, and keeps it open after the first press; always closes it on every press that changes the value; never keeps it open.',
  ],
  [
    'locale',
    'string',
    'the SlottedProvider locale, else en-US',
    'DateRangePicker',
    'A BCP 47 tag. Sets the order, separators and placeholders of both fields, the month and weekday names, the short dates in the band and the dates the trigger announces.',
  ],
  [
    'timeZone',
    'string',
    'the browser’s time zone',
    'DateRangePicker',
    'The IANA time zone that decides which day is today. The value itself has no time zone.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'DateRangePicker',
    'The day the calendar starts each week on, from 0 for Sunday to 6 for Saturday.',
  ],
  [
    'yearPivot',
    'number',
    '20',
    'DateRangePicker',
    'How a two-digit year typed into either field resolves: with 20, 30 reads as 2030 and 80 as 1980.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'DateRangePicker',
    'The calendar system. Gregorian is the only one today.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'DateRangePicker',
    'One step of the control scale, for the frame, both fields and the trigger. Inside a field, an unset size follows the field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'DateRangePicker',
    'How much frame the control draws at rest.',
  ],
  [
    'disabled',
    'boolean',
    'the field’s',
    'DateRangePicker',
    'Disables both fields, the clear button and the trigger, and takes them out of the tab order.',
  ],
  [
    'readOnly',
    'boolean',
    'the field’s',
    'DateRangePicker',
    'Keeps both dates legible and focusable, and disables the clear button and the trigger.',
  ],
  [
    'invalid',
    'boolean',
    'the field’s',
    'DateRangePicker',
    'Marks the date range picker invalid. An end before its start, a date outside min and max, an unavailable date in the range or a length outside the limits marks it invalid whatever this says.',
  ],
  ['required', 'boolean', 'the field’s', 'DateRangePicker', 'Sets aria-required on both fields.'],
  [
    'clearable',
    'boolean',
    'false',
    'DateRangePicker',
    'Adds one clear button to the frame, which empties both ends.',
  ],
  [
    'messages',
    'Partial<DateRangePickerMessages>',
    '—',
    'DateRangePicker',
    'Replaces words of the active language, key by key: choose and change for the trigger’s name before and after a range is set (change takes {start}, {end} and {length}), clear, start and end for the two fields’ names and the band’s placeholders, and the counting phrases days.length and nights.length with between, atLeast and atMost for the limits.',
  ],
  [
    'startName',
    'string',
    '—',
    'DateRangePicker',
    'Adds a hidden input with this name that submits the start as an ISO 8601 string, such as 2026-09-30.',
  ],
  [
    'endName',
    'string',
    '—',
    'DateRangePicker',
    'Adds a hidden input with this name that submits the end as an ISO 8601 string.',
  ],
  [
    'presets',
    'ReactNode',
    '—',
    'DateRangePicker',
    'Your own shortcuts, as DateRangePickerPreset elements, in a column beside the calendar.',
  ],
  ['footer', 'ReactNode', '—', 'DateRangePicker', 'Your own actions, in a row under the calendar.'],
  [
    'value',
    'DateRange | (() => DateRange)',
    '—',
    'DateRangePickerPreset',
    'The range the shortcut writes, or a function that returns it when the shortcut is pressed, so a relative range such as "next weekend" is computed at the press.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: DateRange | null, request: ChangeRequest<DateRange | null>)',
    when: 'Before the value changes. request.reason is keyboard or blur for a typed end, select for a range completed in the calendar or written by a shortcut, and clear for the clear button. The first press in the calendar does not call it: the range is not complete yet. request.cancel() keeps the current value.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the calendar opens or closes. request.reason is pointer for the trigger, keyboard for Alt+ArrowDown and for the handle’s open() and close(), escape for the Escape key, outsidePress for a press outside the surface and select for a completed range. request.cancel() keeps the current state.',
  },
  {
    name: 'onPositionChange',
    payload: "(position: 'start' | 'end', request: ChangeRequest<'start' | 'end'>)",
    when: 'Before the end being edited changes. request.reason is pointer or keyboard when focus enters a field, select after a press in the calendar or a shortcut, and clear for the clear button.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'DateRangePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets timeZone, calendar, months, count, closeOnSelect, placement, size and variant for every DateRangePicker under it. A prop on one DateRangePicker wins, and inside a field the field’s size wins.',
  ],
  [
    'DateRangePickerPreset',
    'component',
    '—',
    'presets',
    'One shortcut inside presets. It takes every button prop, runs your onClick first, and takes render to substitute its element.',
  ],
  [
    'render',
    '(props: DateRangePickerRootProps) => ReactNode',
    '—',
    'DateRangePicker',
    'Renders the root as another element. Spread the props onto it: they carry the ref the date range picker needs.',
  ],
  [
    'ref',
    'Ref<DateRangePickerHandle>',
    '—',
    'DateRangePicker',
    'A handle with focus(position?), which focuses the first segment of one end (the current one by default), and open() and close(), which show and hide the calendar without a controlled open prop. open() moves focus into the calendar.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'DateRangePicker',
    'Runs before Alt+ArrowDown is read. Calling event.preventDefault() keeps the shortcut for the page.',
  ],
]);

const accessibility: string[] = [
  'The trigger’s accessible name carries both dates in words and the length, such as “Change range, Saturday, September 12, 2026 – Wednesday, September 16, 2026, 4 nights”. Focus returns to the trigger when the calendar closes, so a screen reader announces the range there.',
  'Opening the calendar from the trigger or from open() moves focus to the day of the end being edited, or to today when that end is empty. Alt+ArrowDown opens it and leaves focus in the field. While the calendar is open, Tab and Shift+Tab cycle through the shortcuts, the calendar and the footer.',
  'The length is a polite live region. A sighted reader sees it follow the pointer; a screen-reader user hears it follow each arrow key.',
  'Each field has its own name, from the start and end messages, and the dash between them is aria-hidden. Each field keeps its own spin buttons and its own keys. Inside a field, the frame is a group named by the field’s label, so a screen reader announces “Reporting period” and then “Start” on the way into the first date.',
  'Escape closes in steps: while the calendar shows the month or year grid, Escape returns to the day grid; on the day grid, it closes the calendar, discards a range that has only its start, and returns focus to the trigger.',
  'A range that has only its start in the calendar never reaches the value or a form: the first press is shown in the band, and the second press writes the range. A typed open end is a value, because the reader sees it in the field.',
  'The surface has role="dialog" and the same accessible name as the trigger. The trigger sets aria-expanded, and sets aria-controls only while the surface exists. One day of the calendar is in the tab order, as the grid pattern requires.',
];

export const REACT_DATE_RANGE_PICKER_DOCS = {
  dateRangePicker: {
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
