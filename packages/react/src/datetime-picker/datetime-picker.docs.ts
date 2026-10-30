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

export const REACT_DATETIME_PICKER_TOKENS = dateTimePickerTokens.map((name) => ({
  name,
  purpose: 'A Datetime Picker value the theme sets.',
}));

const imports: ReferenceImport = {
  source: "import { DateTimePicker, DateTimePickerDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
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
    element: 'div, portalled to the end of the document',
    required: false,
    purpose:
      'The layer the panel stands on. It carries data-ui="datetime-picker" again, because a stylesheet cannot reach a subtree outside the root, plus data-placement for the side the positioner chose and data-presentation (popover or sheet).',
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
      'The pill at the top of the sheet, drawn only while data-presentation is sheet, in the drawer grip’s geometry and line color. A pull down past half the sheet, or a flick down, closes it with the reason pointer; Escape and the press outside stay the accessible ways out.',
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
    element: 'div',
    required: false,
    purpose:
      'A row in the head, beside Now, for your own shortcuts, drawn when presets is set. The Datetime Picker ships no list of shortcuts: the labels and times belong to your product.',
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
      'Holds the Calendar with its grid, its month and year views and its keyboard. It never shrinks below one month, so the time panel is the one that wraps.',
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
    element: 'div',
    required: false,
    purpose:
      'A row under both surfaces for your own actions, drawn when footer is set. The panel closes on the press that completes the value, so a confirm button is optional; add one here for a flow that asks for it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One Datetime Picker driven by the controls below the canvas. Open it: the calendar and the list are both in the panel, the head shows the value so far, and the panel closes on the press that completes the value.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-playground',
      label: 'Usage',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Pickup date and time</FieldLabel>
  <DateTimePicker clearable name="pickupAt" />
  <FieldDescription>The carrier collects at this date and time.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'panel',
    title: 'Two surfaces in one dialog',
    note: 'The panel holds a grid drawn by Calendar and a listbox drawn by the Datetime Picker. Both are in the DOM at every width; no tabs switch between them, so assistive technology reads the same structure on a wide and a narrow screen.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-panel',
      label: 'The panel',
      language: 'tsx',
      source: `<DateTimePicker defaultOpen />;`,
    }),
  },
  {
    id: 'open-to',
    title: 'Which surface takes focus on open',
    note: 'openTo decides where focus lands when the panel opens, not what the panel draws. Both surfaces are present either way, in the same order: the calendar, then the list.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-open-to',
      label: 'Opening on the time',
      language: 'tsx',
      source: `<DateTimePicker openTo="time" />;`,
    }),
  },
  {
    id: 'completeness',
    title: 'The value closes the panel, not a button',
    note: 'With closeOnSelect="auto", the press that completes the value closes the panel. A press on a value that was already whole changes one half and leaves the panel open, so the reader can change the day and then the time. always closes on every press that changes the value; never closes on none.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-completeness',
      label: 'The three closings',
      language: 'tsx',
      source: `<>
  <DateTimePicker closeOnSelect="auto" />
  <DateTimePicker closeOnSelect="always" />
  <DateTimePicker closeOnSelect="never" />
</>;`,
    }),
  },
  {
    id: 'seconds',
    title: 'Seconds',
    note: 'granularity="second" writes seconds in the field, and a step of 30 offers a time every half minute. The list stops at maxOptions rows, so a step in seconds needs a window from minTime to maxTime to stay short.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-seconds',
      label: 'A half-minute step',
      language: 'tsx',
      source: `<DateTimePicker granularity="second" step={30} />;`,
    }),
  },
  {
    id: 'step',
    title: 'The step, and where it counts from',
    note: 'The list counts from min’s time when min is set and from midnight when it is not, the rule input[type=time] uses. A step of 900 from 09:07 offers 09:07, 09:22 and 09:37; the field still accepts 09:15 by typing.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-step',
      label: 'A quarter hour from 09:07',
      language: 'tsx',
      source: `<DateTimePicker
  min={{ date: { year: 2026, month: 9, day: 30 }, time: { hour: 9, minute: 7, second: 0 } }}
  step={900}
/>;`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Two pairs of bounds together',
    note: 'min and max bound the whole value; minTime and maxTime bound the times of every day inside the range. On the day of min the list starts at min’s time, on the day of max it stops at max’s time, and on every day between it runs from minTime to maxTime.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-range-bounds',
      label: 'A booking window',
      language: 'tsx',
      source: `<DateTimePicker
  max={{ date: { year: 2026, month: 12, day: 18 }, time: { hour: 12, minute: 0, second: 0 } }}
  maxTime={{ hour: 18, minute: 0, second: 0 }}
  min={{ date: { year: 2026, month: 10, day: 1 }, time: { hour: 14, minute: 0, second: 0 } }}
  minTime={{ hour: 9, minute: 0, second: 0 }}
/>;`,
    }),
  },
  {
    id: 'day-window',
    title: 'The list follows the day the reader is on',
    note: 'Before a day is chosen, the list answers the day the calendar has focused. Moving through the month recomputes it, so a Saturday that closes early shows its shorter list, or the empty state, while the reader is still deciding.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-day-window',
      label: 'A Saturday that closes early',
      language: 'tsx',
      source: `<DateTimePicker isTimeUnavailable={(time, date) => dayOfWeek(date) === 6 && time.hour >= 13} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Refused times are disabled or hidden',
    note: 'A refused time stays in the list, disabled, so the reader can still see the step. unavailableOptions="hide" removes refused times instead. A day that offers no time shows the empty message.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-unavailable',
      label: 'Disable, and hide',
      language: 'tsx',
      source: `<>
  <DateTimePicker isTimeUnavailable={(time) => time.hour === 12} unavailableOptions="disable" />
  <DateTimePicker isTimeUnavailable={(time) => time.hour === 12} unavailableOptions="hide" />
</>;`,
    }),
  },
  {
    id: 'now',
    title: 'One press for the current date and time',
    note: 'Now writes both halves from the clock in timeZone. It does the same as the relative expression 0 in the field, for a reader who does not know the expression. messages.now replaces its label.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-now',
      label: 'The head control',
      language: 'tsx',
      source: `<DateTimePicker messages={{ now: 'Right now' }} />;`,
    }),
  },
  {
    id: 'relative',
    title: 'Typing with the panel open',
    note: 'Alt+ArrowDown opens the panel and leaves focus in the field, so every key the segments take still works, including +, - and = for a relative expression. Escape closes the expression first and leaves the panel open.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-relative',
      label: 'Typing while the panel is open',
      language: 'tsx',
      source: `<DateTimePicker
  defaultOpen
  referenceDateTime={{
    date: { year: 2026, month: 9, day: 30 },
    time: { hour: 14, minute: 40, second: 0 },
  }}
/>;`,
    }),
  },
  {
    id: 'presets',
    title: 'Your own shortcuts',
    note: 'presets adds a row in the head beside Now. The row wraps inside the panel’s width instead of widening it.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-presets',
      label: 'Two shortcuts',
      language: 'tsx',
      source: `<DateTimePicker
  presets={
    <>
      <Button onClick={tomorrowAtNine} size="sm" variant="ghost">
        Tomorrow, 9:00 AM
      </Button>
      <Button onClick={mondayAtTwo} size="sm" variant="ghost">
        Monday, 2:00 PM
      </Button>
    </>
  }
/>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps of the control scale. Inside a field, an unset size follows the field. The rows of the list follow the same scale.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-sizes',
      label: 'The three steps',
      language: 'tsx',
      source: `<>
  <DateTimePicker size="sm" />
  <DateTimePicker size="md" />
  <DateTimePicker size="lg" />
</>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The frame is the datetime field’s, the same frame every field in a form draws. plain draws no frame at rest, for a table cell or a toolbar, and still shows hover and focus.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-variants',
      label: 'The three frames',
      language: 'tsx',
      source: `<>
  <DateTimePicker variant="outline" />
  <DateTimePicker variant="subtle" />
  <DateTimePicker variant="plain" />
</>;`,
    }),
  },
  {
    id: 'placement',
    title: 'Placement',
    note: 'Where the panel opens relative to the control. It is a preference: when the panel does not fit on that side, the positioner opens it on the other, and data-placement says which side it chose.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-placement',
      label: 'Above the control',
      language: 'tsx',
      source: `<DateTimePicker placement="top-start" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only stays focusable and legible. Disabled takes no key and no press, and its trigger is a disabled button. Invalid draws the frame and the focus ring in the danger tone. In the list, the chosen time outranks the highlighted time, which outranks hover.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-states',
      label: 'The four states',
      language: 'tsx',
      source: `<>
  <DateTimePicker readOnly />
  <DateTimePicker disabled />
  <DateTimePicker required />
  <DateTimePicker invalid />
</>;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'name adds a hidden input that submits the value as YYYY-MM-DDTHH:mm:ss. The field around the Datetime Picker supplies the label, the description and the error, and passes its size, disabled state and validity to the Datetime Picker unless it sets its own.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-forms',
      label: 'A form row',
      language: 'tsx',
      source: `<form action="/pickups" method="post">
  <Field>
    <FieldLabel>Pickup date and time</FieldLabel>
    <DateTimePicker name="pickupAt" required />
    <FieldDescription>The dock is open from 9:00 AM to 6:00 PM.</FieldDescription>
  </Field>
</form>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'Narrow',
    note: 'With too little room for both surfaces, the list wraps under the calendar, in the value’s own order. Nothing is hidden and no switch is drawn.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-narrow',
      label: 'A narrow panel',
      language: 'tsx',
      source: `<DateTimePicker defaultOpen />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'DateTimePickerDefaultsProvider sets the step and the clock once; SlottedProvider sets the language and the words; renderOption draws the content of one row; footer takes your actions; and the ref reaches focus(), open() and close(). A value set on one Datetime Picker still wins over the provider.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-composition',
      label: 'Defaults once, and a row of your own',
      language: 'tsx',
      source: `<DateTimePickerDefaultsProvider step={1800}>
  <DateTimePicker
    ref={handle}
    renderOption={({ label, time }) => (
      <>
        <span>{label}</span>
        <span>{seatsLeft(time)} seats left</span>
      </>
    )}
  />
</DateTimePickerDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Alt+ArrowDown opens the panel from a segment and leaves focus in the field. ArrowDown on the trigger opens it and moves focus into the surface openTo names. In the list: the arrow keys, Home, End, type-ahead, and PageUp and PageDown to the previous or next hour. Tab stays inside the panel while it is open, and each surface is one Tab stop.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-keyboard',
      label: 'Your own key handler',
      language: 'tsx',
      source: `<DateTimePicker
  onKeyDown={(event) => {
    if (event.key === 'Escape') recordDismissal();
  }}
/>;`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDateTime | null',
    '—',
    'DateTimePicker',
    'The value, when you control it. Update it from onValueChange.',
  ],
  [
    'defaultValue',
    'PlainDateTime | null',
    '—',
    'DateTimePicker',
    'The starting value when the Datetime Picker holds its own state.',
  ],
  [
    'open',
    'boolean',
    '—',
    'DateTimePicker',
    'Whether the panel is open, when you control it. Update it from onOpenChange.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'DateTimePicker',
    'Whether the panel starts open. A panel that starts open does not take focus.',
  ],
  [
    'highlighted',
    'DateTimePickerHighlight',
    '—',
    'DateTimePicker',
    'Where the reader is in the panel, as { date, time }: the day the calendar has focused and the time the list has highlighted. Set it to control the highlight; update it from onHighlightedChange.',
  ],
  [
    'defaultHighlighted',
    'DateTimePickerHighlight',
    '—',
    'DateTimePicker',
    'Where the highlight starts. Unset, the panel opens on the day of the value, or of referenceDateTime, and on the time nearest to it.',
  ],
  [
    'min',
    'PlainDateTime',
    '—',
    'DateTimePicker',
    'The earliest whole value. The calendar disables the days before its date, and on its date the list starts at its time.',
  ],
  [
    'max',
    'PlainDateTime',
    '—',
    'DateTimePicker',
    'The latest whole value. The calendar disables the days after its date, and on its date the list stops at its time.',
  ],
  [
    'minTime',
    'PlainTime',
    '—',
    'DateTimePicker',
    'The earliest time on every day inside the range. It applies together with min.',
  ],
  [
    'maxTime',
    'PlainTime',
    '—',
    'DateTimePicker',
    'The latest time on every day inside the range. It applies together with max.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'DateTimePicker',
    'Returns true for a day the reader cannot choose. The calendar disables it, its list is empty, and a typed value on it marks the Datetime Picker invalid.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime, date: PlainDate) => boolean',
    '—',
    'DateTimePicker',
    'Returns true for a time the reader cannot choose on a given day, so the rule can differ by day. A typed value it refuses marks the Datetime Picker invalid.',
  ],
  [
    'step',
    'number',
    '900',
    'DateTimePicker',
    'Seconds between two times in the list, counted from the earliest time of the day, or from midnight. It applies to the list only; the field accepts any time.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'DateTimePicker',
    'The times the list offers, in the order given, in place of step. Bounds and predicates still refuse times in it.',
  ],
  [
    'maxOptions',
    'number',
    '1440',
    'DateTimePicker',
    'The most rows the list draws, a whole day at a one-minute step. Past it, the list is cut, carries data-truncated, and the panel’s accessible description says the remaining times are typed into the field.',
  ],
  [
    'unavailableOptions',
    "'disable' | 'hide'",
    'disable',
    'DateTimePicker',
    'What the list does with a refused time: shows it disabled, or leaves it out.',
  ],
  [
    'locale',
    'string',
    'the provider’s locale, then en-US',
    'DateTimePicker',
    'A BCP 47 tag. It sets the segments, the clock, the calendar’s month and weekday names, the times in the list and the date and time in words.',
  ],
  [
    'timeZone',
    'string',
    'the browser’s time zone',
    'DateTimePicker',
    'The IANA time zone that decides today in the calendar and what Now and the default referenceDateTime read from the clock. The value itself has no time zone.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'the locale’s',
    'DateTimePicker',
    'A 12-hour clock with a day period, or a 24-hour clock, in the field and the list.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'DateTimePicker',
    'The smallest unit the field writes.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'DateTimePicker',
    'The calendar system. gregory is the only value today.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'DateTimePicker',
    'The first day of the calendar’s week, from 0 for Sunday to 6 for Saturday.',
  ],
  ['months', 'number', '1', 'DateTimePicker', 'How many months the calendar draws side by side.'],
  [
    'weekNumbers',
    'boolean',
    'false',
    'DateTimePicker',
    'Adds a column of ISO 8601 week numbers to the calendar.',
  ],
  [
    'referenceDateTime',
    'PlainDateTime',
    'the current date and time',
    'DateTimePicker',
    'The date and time assumed where the reader has given none: the month the calendar opens on, the time the list opens on after a day is pressed on an empty value, and the point a relative expression and the arrow keys on an empty field count from.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'DateTimePicker',
    'One step of the control scale for the field, the trigger and the rows of the list. Inside a field, an unset size follows the field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'DateTimePicker',
    'The frame of the field: a border, a fill, or none at rest.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'DateTimePicker',
    'Where the panel opens relative to the control. When it does not fit on that side, it opens on the other.',
  ],
  [
    'openTo',
    "'date' | 'time'",
    'date',
    'DateTimePicker',
    'The surface that takes focus when the trigger or open() opens the panel. Both surfaces are drawn either way.',
  ],
  [
    'closeOnSelect',
    "'auto' | 'always' | 'never'",
    'auto',
    'DateTimePicker',
    'When a press closes the panel: auto on the press that completes the value, always on every press that changes the value, never on none.',
  ],
  [
    'disabled',
    'boolean',
    'the field’s',
    'DateTimePicker',
    'Disables the field and the trigger. Unset, it follows the enclosing field.',
  ],
  [
    'readOnly',
    'boolean',
    'the field’s',
    'DateTimePicker',
    'Keeps the value focusable and legible, and disables the trigger. Unset, it follows the enclosing field.',
  ],
  [
    'invalid',
    'boolean',
    'the field’s',
    'DateTimePicker',
    'Marks the value invalid. A value outside the bounds or refused by a predicate is invalid whatever this says.',
  ],
  [
    'required',
    'boolean',
    'the field’s',
    'DateTimePicker',
    'Sets aria-required on the field. Unset, it follows the enclosing field.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'DateTimePicker',
    'Adds a clear button to the field while it holds any part of a value. The button empties both halves.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'DateTimePicker',
    'Whether +, - and = on a segment open a relative expression in the field, such as +2h.',
  ],
  [
    'name',
    'string',
    '—',
    'DateTimePicker',
    'Adds a hidden input with this name that submits the value as YYYY-MM-DDTHH:mm:ss.',
  ],
  [
    'messages',
    'Partial<DatetimePickerMessages>',
    '—',
    'DateTimePicker',
    'Replaces the words of the language in force, key by key: the trigger’s name with no value (choose) and with one (change, with the value in its {date} slot), the Now button (now), the sentence for a day with no time (empty), and the panel’s description when the list is cut at maxOptions (truncated).',
  ],
  [
    'presets',
    'ReactNode',
    '—',
    'DateTimePicker',
    'Your own shortcuts, in a row in the head beside Now.',
  ],
  ['footer', 'ReactNode', '—', 'DateTimePicker', 'Your own actions, in a row under both surfaces.'],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: PlainDateTime | null, request: DateTimeFieldChangeRequest)',
    when: 'Before the value changes. request.reason is keyboard for typing, select for a press in the calendar, the list or Now, clear for the clear button and blur for a value completed when the field loses focus. When the field moved the value, the request also carries segments and incomplete, the half still missing. A value that does not change emits nothing.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the panel opens or closes. request.reason is pointer for the trigger, keyboard for Alt+ArrowDown, ArrowDown on the trigger, open() and close(), escape and outsidePress for a dismissal, and select for the press that closed it.',
  },
  {
    name: 'onHighlightedChange',
    payload:
      '(highlighted: DateTimePickerHighlight, request: ChangeRequest<DateTimePickerHighlight>)',
    when: 'When the reader moves through either surface: the day the calendar has focused and the time the list has highlighted, as one value. Moving the highlight never changes the value.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'DateTimePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets timeZone, hourCycle, granularity, calendar, step, maxOptions, placement, openTo, closeOnSelect, unavailableOptions, size and variant once for every Datetime Picker under it. A value set on one Datetime Picker still wins.',
  ],
  [
    'renderOption',
    '(option: DateTimePickerOptionRender) => ReactNode',
    '—',
    'DateTimePicker',
    'Draws the content of one row of the list. It receives the time, the date it belongs to, the formatted label, and whether the time is selected, current or unavailable. The row keeps its role, states and keyboard.',
  ],
  [
    'render',
    '(props: DateTimePickerRootProps) => ReactNode',
    '—',
    'DateTimePicker',
    'Replaces the root element. The props include the ref.',
  ],
  [
    'ref',
    'Ref<DateTimePickerHandle>',
    '—',
    'DateTimePicker',
    'focus() moves focus to the first segment of the field. open() opens the panel and moves focus into it, as the trigger does; close() closes it.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'DateTimePicker',
    'Runs before the Datetime Picker handles a key on the control, the trigger or the list. Calling preventDefault stops the Datetime Picker handling it.',
  ],
]);

const accessibility: string[] = [
  'The panel has role="dialog" and holds a role="grid" and a role="listbox", the arrangement the APG Date Picker Combobox example uses for its popup. The trigger has aria-haspopup="dialog" and aria-expanded, and aria-controls only while the panel exists. Both surfaces are in the DOM at every width.',
  'The trigger’s accessible name carries the chosen date and time in words, such as “Change date and time, September 30, 2026 at 9:00 AM”. Focus returns to the trigger when the panel closes from a press or from Escape, so a screen reader announces the value there. The listbox has its own accessible name, the day its times belong to.',
  'Opening the panel from the trigger or from open() moves focus into the surface openTo names: the focused day in the calendar, or the chosen or nearest time in the list. Alt+ArrowDown opens the panel and leaves focus in the field. While the panel is open, Tab and Shift+Tab cycle through the head, the calendar, the list and the footer; each surface is one Tab stop.',
  'Moving the highlight through the list never changes the value; Enter, Space or a press does. Changing the value on every highlight would send one change per time the reader passes.',
  'Escape closes in steps: an open relative expression in the field closes first, then the calendar returns from the month or year grid to the day grid, and then the panel closes and focus returns to the trigger.',
  'Alt+ArrowDown is a shortcut, never the only way in. ChromeOS turns it into PageDown before the browser receives it, so the trigger is always drawn.',
];

export const REACT_DATETIME_PICKER_DOCS = {
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
