import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import timeRangePickerTokens from '@slotted/styles/time-range-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TIME_RANGE_PICKER_TOKENS = timeRangePickerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Time Range Picker decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlottedProvider, TimeRangePicker, TimeRangePickerDefaultsProvider, TimeRangePickerPreset } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The box the family is selected by. Carries data-ui="time-range-picker", the axes, data-granularity, data-open and the state attributes. className, style and every native attribute reach it.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose:
      'The frame: one line at the control height, at any width, and what the positioner measures. Two segmented fields stood here first and broke it into two lines in a narrow form column; the current end’s field lives in the band now.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'Fills the frame and opens the surface. Its accessible name carries both ends in words and the duration, because focus returns here when the surface closes. The clock glyph sits at its reading end.',
  },
  {
    part: 'summary',
    element: 'span',
    required: true,
    purpose:
      'The value written short — "14:00 – 16:30" — or the placeholder with data-placeholder. Cut with an ellipsis where it does not fit; the trigger’s name carries it whole.',
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
      'Two, under startName and endName, carrying HH:mm:ss for a plain form post. They live in the frame because the surface is portalled and unmounted while it is closed.',
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
      'The painted surface, carrying role="dialog" and the same name as the trigger. The anchor’s width, between sixteen and twenty-two rems, so a column is never too tight to read a time and its duration in.',
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
    purpose: 'The end written short — "14:00" — or a dash.',
  },
  {
    part: 'field',
    element: 'div',
    required: false,
    purpose:
      'Holds the current end’s time-field in variant="plain", data-position. Drawn on a fine pointer only: a segment is a spinbutton and raises no keyboard on a phone.',
  },
  {
    part: 'now',
    element: 'button',
    required: false,
    purpose:
      'Beside the field: writes the current time — referenceTime, or the clock — into the current end, and follows the focus rule.',
  },
  {
    part: 'hint',
    element: 'span',
    required: false,
    purpose:
      'What the next press should be, or what is wrong — "End: choose a time", "The end must come after the start" — from the chooseTime, order, length, unavailable and bounds messages. data-invalid while it names a problem; aria-describedby of the list and the field. Empty while the work is whole and valid.',
  },
  {
    part: 'length',
    element: 'span',
    required: false,
    purpose:
      '"2 hr 30 min": the duration of the run the pending end would make, or of the work. A polite live region, so a screen reader hears it on every arrow. data-pending while it is a proposal.',
  },
  {
    part: 'limit',
    element: 'span',
    required: false,
    purpose: '"30 min to 4 hr", drawn while minLength or maxLength is set.',
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
      'One shortcut, a TimeRangePickerPreset. Writes its range with the select reason and carries data-selected while the value equals it.',
  },
  {
    part: 'panel',
    element: 'div',
    required: false,
    purpose:
      'The current end, one at a time: data-position="start" or "end". Its list already refuses what the other end of the work refuses, and choosing an end moves the tab to the other.',
  },
  {
    part: 'list',
    element: 'div',
    required: false,
    purpose:
      'role="listbox": the times of the current end, at every step, and the only thing that scrolls. Eight rows and half of the ninth, so it is seen to scroll; named by the current tab. data-truncated when it stops at maxOptions.',
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
      'Beside the time, the duration the run would have with the other end as it stands — "15:00 · 1 hr". A refused row carries none. renderOption replaces the row’s content, this span included.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'Drawn in place of a list when its end has no time available at all.',
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
    note: 'A meeting room booked for the afternoon. The frame is one line: press it and the two tabs, the field, the hint and the list of the current end open under it. Every prop is on the controls panel.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-playground',
      label: 'A room booking',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Reserva da sala</FieldLabel>
  <TimeRangePicker
    clearable
    defaultValue={{ start: plainTime(14), end: plainTime(16, 30) }}
    locale="pt-BR"
    messages={{ start: 'Start', end: 'End' }}
  />
</Field>;`,
    }),
  },
  {
    id: 'panel',
    title: 'One end at a time',
    note: 'Open it: two tabs say the two ends, and the panel shows the one being chosen. The start is 14:00, so the end tab is current and its list strikes every time before 14:00, writing the duration beside every other. Press one: the meeting is whole and the surface closes.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-panel',
      label: 'The end tab',
      language: 'tsx',
      source: `<TimeRangePicker defaultOpen defaultValue={{ start: plainTime(14), end: null }} locale="pt-BR" />;`,
    }),
  },
  {
    id: 'length',
    title: 'The duration, while the run is drawn',
    note: 'Move along the end list with the pointer or the arrows: the band says "1 hr", "1 hr 15 min", "1 hr 30 min" for the row under you, and every row says it beside its time. lengthLabel writes it in the product’s own words.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-length',
      label: 'Said as it is drawn',
      language: 'tsx',
      source: `<TimeRangePicker
  defaultValue={{ start: plainTime(14), end: null }}
  lengthLabel={(seconds) => \`\${String(seconds / 60)} min\`}
  locale="pt-BR"
/>;`,
    }),
  },
  {
    id: 'limits',
    title: 'Limits, explained',
    note: 'A room is booked for thirty minutes to four hours. With a start chosen, the end list refuses the times that would break the rule and the band says the rule; typed past it, the frame goes invalid. minLength and maxLength are seconds, the unit step is written in.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-limits',
      label: 'Thirty minutes to four hours',
      language: 'tsx',
      source: `<TimeRangePicker maxLength={4 * 3600} minLength={30 * 60} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Unavailable times',
    note: 'The room is cleaned from 12:00 to 13:00. Choose a start before it: the end list refuses everything past the first cleaning slot, because a booking is contiguous. contiguous={false} lets the run jump over it.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-unavailable',
      label: 'A blocked hour',
      language: 'tsx',
      source: `<TimeRangePicker isTimeUnavailable={(time) => time.hour === 12} />;`,
    }),
  },
  {
    id: 'step',
    title: 'The step, the bounds, and a stated list',
    note: 'Office hours at half-hour slots: min, max and step shape both lists at once, and the fields still type any minute. options states an irregular list outright, for a room that only opens on the hour before noon.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-step',
      label: 'Half-hour slots between eight and twenty',
      language: 'tsx',
      source: `<TimeRangePicker max={plainTime(20)} min={plainTime(8)} step={1800} />;`,
    }),
  },
  {
    id: 'now',
    title: 'Now',
    note: '"Now" writes the current time into the current end and the focus rule takes over — with the other end missing, the tab moves to it and focus lands in its list. referenceTime fixes the clock for a story or a test.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-now',
      label: 'One now per end',
      language: 'tsx',
      source: `<TimeRangePicker messages={{ now: 'Agora' }} referenceTime={plainTime(10, 20)} />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Presets',
    note: 'The slots the office books by name. Each is a TimeRangePickerPreset with its own range; pressing one writes the value and closes, and the one equal to the value is marked. The list is the product’s.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-presets',
      label: 'Named slots',
      language: 'tsx',
      source: `<TimeRangePicker
  presets={
    <>
      <TimeRangePickerPreset value={morning}>Morning</TimeRangePickerPreset>
      <TimeRangePickerPreset value={() => nextHour()}>Next hour</TimeRangePickerPreset>
    </>
  }
/>;`,
    }),
  },
  {
    id: 'open-end',
    title: 'One end only',
    note: 'A start and no end, written where the reader sees it. Open the surface: the end list is the one to finish, and its first press completes the work. The clear empties both ends at once.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-open-end',
      label: 'From 14:00',
      language: 'tsx',
      source: `<TimeRangePicker clearable defaultValue={{ start: plainTime(14), end: null }} />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps the frame takes. Type, height, gutter and the clear’s box follow the control scales, so a booking in a dense table shrinks whole rather than in parts.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-sizes',
      label: 'The three steps',
      language: 'tsx',
      source: `<>
  <TimeRangePicker size="sm" />
  <TimeRangePicker size="md" />
  <TimeRangePicker size="lg" />
</>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows at rest. plain is for a box that belongs to something else — a table cell — and draws its ring inward.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-variants',
      label: 'The three frames',
      language: 'tsx',
      source: `<>
  <TimeRangePicker variant="outline" />
  <TimeRangePicker variant="subtle" />
  <TimeRangePicker variant="plain" />
</>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only, disabled, invalid from the family and invalid from the consumer. An end before its start is invalid on the end field and on the frame, and nothing is swapped.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-states',
      label: 'Four states',
      language: 'tsx',
      source: `<>
  <TimeRangePicker defaultValue={booking} readOnly />
  <TimeRangePicker defaultValue={booking} disabled />
  <TimeRangePicker defaultValue={{ start: plainTime(22), end: plainTime(6) }} />
  <Field invalid>
    <TimeRangePicker defaultValue={booking} />
  </Field>
</>;`,
    }),
  },
  {
    id: 'forms',
    title: 'Forms',
    note: 'Two hidden inputs under startName and endName send HH:mm:ss with a plain form post, whether the reader typed the times or pressed them.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-forms',
      label: 'A plain form post',
      language: 'tsx',
      source: `<form onSubmit={onSubmit}>
  <TimeRangePicker endName="end" required startName="start" />
  <Button type="submit">Book</Button>
</form>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'Narrow',
    note: 'In a column narrower than the value the frame stays one line and the summary is cut with an ellipsis; the trigger’s name carries it whole. The surface keeps its own width.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-narrow',
      label: 'In a narrow column',
      language: 'tsx',
      source: `<TimeRangePicker defaultValue={booking} locale="pt-BR" />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'The provider sets the step and how a duration is written once, SlottedProvider the language and every word; the handle opens, closes and focuses; renderOption replaces what a row draws; position — which tab — is the consumer’s to own.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-composition',
      label: 'Set once, and the handle',
      language: 'tsx',
      source: `<SlottedProvider locale="pt-BR">
  <TimeRangePickerDefaultsProvider step={1800}>
    <TimeRangePicker ref={handle} />
  </TimeRangePickerDefaultsProvider>
</SlottedProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Enter opens onto the field of the current end; ArrowDown opens onto its list. ArrowLeft and ArrowRight on a tab move to the other end. In the list, every arrow moves the pending end and the band says the duration; Enter writes the end and moves on to the one that is missing. Escape abandons the work.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-keyboard',
      label: 'The keys',
      language: 'tsx',
      source: `// Enter, Space         open onto the current end's field
// ArrowDown, Alt+Down  open onto the current end's list
// ArrowLeft, Right     on a tab: the other end, and its panel
// Arrows, Home, End    move the highlight; the band says the duration
// PageUp, PageDown     one hour
// Enter, Space         write this end, then the missing one
// Escape               close and abandon the work
// Tab                  tabs, field, now, presets, list, footer, done`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'TimeRange | null',
    '—',
    'TimeRangePicker',
    '{ start, end }, each end nullable. Present means the consumer owns it. Both ends null is null.',
  ],
  [
    'defaultValue',
    'TimeRange | null',
    '—',
    'TimeRangePicker',
    'What it starts from when nobody else writes one. Read once.',
  ],
  [
    'open',
    'boolean',
    '—',
    'TimeRangePicker',
    'Whether the surface is showing. Present means the consumer owns it.',
  ],
  ['defaultOpen', 'boolean', 'false', 'TimeRangePicker', 'Whether it opens already showing.'],
  [
    'position',
    "'start' | 'end'",
    '—',
    'TimeRangePicker',
    'The end being edited: the field and the panel carrying data-current, and where focus lands when the surface opens. Present means the consumer owns it.',
  ],
  ['defaultPosition', "'start' | 'end'", 'start', 'TimeRangePicker', 'Where editing starts.'],
  [
    'highlighted',
    '{ start: PlainTime | null; end: PlainTime | null }',
    '—',
    'TimeRangePicker',
    'The highlighted option of each end’s list. Present means the consumer owns it. Moving it moves no value.',
  ],
  [
    'defaultHighlighted',
    '{ start: PlainTime | null; end: PlainTime | null }',
    '—',
    'TimeRangePicker',
    'Where the highlights start; otherwise a list opens on its end, or on the nearest offered step.',
  ],
  [
    'min',
    'PlainTime',
    '—',
    'TimeRangePicker',
    'The earliest time both fields and both lists accept. Crossed with the work: the start cannot step past the end, nor the end before the start.',
  ],
  ['max', 'PlainTime', '—', 'TimeRangePicker', 'The latest time any of the four accepts.'],
  [
    'isTimeUnavailable',
    '(time: PlainTime) => boolean',
    '—',
    'TimeRangePicker',
    'Refuses particular times. Typed at an end, it makes the control invalid; listed, the row cannot be pressed.',
  ],
  [
    'contiguous',
    'boolean',
    'true',
    'TimeRangePicker',
    'Whether a run may cross an unavailable time. On, and with a start chosen, the options beyond the first unavailable one are refused in the end list; the search runs over the list, never over the seconds.',
  ],
  [
    'minLength',
    'number',
    '—',
    'TimeRangePicker',
    'The shortest run allowed, in seconds. The lists refuse shorter ones and the band names the limit.',
  ],
  ['maxLength', 'number', '—', 'TimeRangePicker', 'The longest run allowed, in seconds.'],
  [
    'lengthLabel',
    '(seconds: number, locale?: string) => string',
    'durationLabel',
    'TimeRangePicker',
    'What the band and the rows say for a duration, in the product’s own words. The default writes "2 hr 30 min" in the family’s locale.',
  ],
  [
    'step',
    'number',
    '900',
    'TimeRangePicker',
    'Seconds between two offered times, in both lists. Ignored when options states the list. The fields’ arrows move by one of their own unit regardless.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'TimeRangePicker',
    'The times to offer, stated rather than stepped; the same list for both ends. The bounds and the predicate still refuse.',
  ],
  [
    'maxOptions',
    'number',
    '1440',
    'TimeRangePicker',
    'How many rows a list may reach before it is cut. Cut, the list carries data-truncated and the panel’s description says the rest is typed.',
  ],
  [
    'unavailableOptions',
    "'disable' | 'hide'",
    'disable',
    'TimeRangePicker',
    'What a refused time looks like in a list: drawn muted with aria-disabled, or left out.',
  ],
  [
    'locale',
    'string',
    'SlottedProvider',
    'TimeRangePicker',
    'BCP 47. Decides the field order, the digits, the day-period names and the duration’s units. Unset, the language in force decides.',
  ],
  ['timeZone', 'string', '—', 'TimeRangePicker', 'The zone "now" is read in.'],
  [
    'hourCycle',
    '12 | 24',
    '—',
    'TimeRangePicker',
    'Twelve- or twenty-four-hour times. Unset, the locale decides.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'TimeRangePicker',
    'How much of a time the fields and the rows write.',
  ],
  [
    'referenceTime',
    'PlainTime',
    '—',
    'TimeRangePicker',
    'What "now" is, for a story or a test; the clock otherwise. Anchors now and the relative expression.',
  ],
  ['size', "'sm' | 'md' | 'lg'", 'md', 'TimeRangePicker', 'The control scale of the frame.'],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'TimeRangePicker',
    'How much frame the control shows at rest.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'TimeRangePicker',
    'Where the surface opens, before the positioner has read the room.',
  ],
  [
    'closeOnSelect',
    "'auto' | 'always' | 'never'",
    'auto',
    'TimeRangePicker',
    'auto closes when a press completes the work; always closes on any press that changes the value; never closes on none.',
  ],
  ['disabled', 'boolean', '—', 'TimeRangePicker', 'Nothing answers; the value stays readable.'],
  [
    'readOnly',
    'boolean',
    '—',
    'TimeRangePicker',
    'Legible and copyable; the trigger and the clear are out of the tab sequence.',
  ],
  [
    'invalid',
    'boolean',
    '—',
    'TimeRangePicker',
    'The consumer’s own word. Set, it wins; unset, the family’s own rules and the field around it decide.',
  ],
  ['required', 'boolean', '—', 'TimeRangePicker', 'Reaches both fields as aria-required.'],
  [
    'clearable',
    'boolean',
    'false',
    'TimeRangePicker',
    'Draws one clear on the frame, which empties both ends.',
  ],
  [
    'relative',
    'boolean',
    '—',
    'TimeRangePicker',
    'Whether the field in the band takes the relative expression — +40, 1h30, = — the way a time-field does.',
  ],
  [
    'messages',
    'Partial<TimeRangePickerMessages>',
    '—',
    'TimeRangePicker',
    'Words laid over the language in force, key by key: the two ends (start, end), the trigger’s names (choose; change with {start}, {end} and {length}; changeReversed), the hint (chooseTime with {end}; order, length, unavailable, bounds), the limit (limit.between, limit.atLeast, limit.atMost), now, done, clear, and a panel that is empty or cut short (empty, truncated).',
  ],
  [
    'startName',
    'string',
    '—',
    'TimeRangePicker',
    'The name of the hidden input carrying the start.',
  ],
  ['endName', 'string', '—', 'TimeRangePicker', 'The name of the hidden input carrying the end.'],
  [
    'presets',
    'ReactNode',
    '—',
    'TimeRangePicker',
    'The consumer’s shortcuts, as TimeRangePickerPreset elements.',
  ],
  ['footer', 'ReactNode', '—', 'TimeRangePicker', 'The consumer’s own actions, under the lists.'],
  [
    'renderOption',
    '(state: TimeRangePickerOptionState) => ReactNode',
    '—',
    'TimeRangePicker',
    'What one row draws. The state carries the end, the time, its label, its duration, and whether it is selected, current or unavailable.',
  ],
  [
    'value',
    'TimeRange | (() => TimeRange)',
    '—',
    'TimeRangePickerPreset',
    'The range the press writes, or a function resolving it at the press.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: TimeRange | null, request: ChangeRequest<TimeRange | null>)',
    when: 'Before the value moves, and cancellable. keyboard, blur or clear when an end was typed in the band, select when a press in the list, now, done or a preset completed the work or changed a whole one, clear for the clear button. A press that leaves the work with one end emits nothing.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the surface opens or closes, and cancellable. pointer for the trigger and for done, keyboard for a key on the trigger, escape for the key, outsidePress for a press elsewhere, select for a press that completed the work.',
  },
  {
    name: 'onPositionChange',
    payload: "(position: 'start' | 'end', request: ChangeRequest<'start' | 'end'>)",
    when: 'Before the current end moves. pointer for a press on a tab, keyboard for the arrows on one, select when a press in the list or a preset moved it, clear for the clear button, programmatic when the panel opened on the first missing end.',
  },
  {
    name: 'onHighlightedChange',
    payload: '(value: { start; end }, request: ChangeRequest<{ start; end }>)',
    when: 'Before a highlight moves in either list. keyboard for the arrows and type-ahead, pointer for a press, programmatic when a list opened or changed under it.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'TimeRangePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets timeZone, hourCycle, granularity, step, maxOptions, unavailableOptions, closeOnSelect, placement, size, variant and lengthLabel once for everything under it. The locale and the words come from SlottedProvider.',
  ],
  [
    'TimeRangePickerPreset',
    'component',
    '—',
    'presets',
    'One shortcut inside presets. Takes every button prop, composes onClick, and takes render to substitute its element.',
  ],
  [
    'render',
    '(props: TimeRangePickerRootProps) => ReactNode',
    '—',
    'TimeRangePicker',
    'Substitutes the element the root renders. The props carry the ref, which the positioner measures its anchor through.',
  ],
  [
    'ref',
    'Ref<TimeRangePickerHandle>',
    '—',
    'TimeRangePicker',
    'focus() puts the reader on the trigger; open() and close() move the surface without a controlled prop.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'TimeRangePicker',
    'Runs before the trigger, the tabs and the list read a key, and calling preventDefault stops them.',
  ],
]);

const accessibility: string[] = [
  'The trigger’s accessible name carries both ends in words and the duration — "Change range, 14:00 – 16:30, 2 hr 30 min". Focus returns to it when the surface closes, so it is where a screen-reader user is told what happened; the summary’s ellipsis removes nothing they cannot hear.',
  'The two ends are a tablist with automatic activation, and the panel is one end at a time: the list is a listbox named by the current tab, so "Start, 14:00" is heard before the first option. The hint is the list’s description, so what to choose next is read with it.',
  'The duration is a polite live region: a sighted reader sees it beside every row, a screen-reader user hears it on every arrow.',
  'Typing lives in the band: Enter on the trigger opens onto the first segment of the current end’s field, and the field keeps every key a time-field has, the relative expression included. On a coarse pointer the field is not drawn — a segment raises no keyboard — and Enter opens onto the list.',
  'The rule datetime-picker wrote, once per end: a press that leaves the work with one end moves the tab to the other and carries focus to its list; the press that completes it closes the panel and returns focus to the trigger. A half-drawn run never reaches a form. Done is the way out when nothing closed it.',
  'Escape is staged. dismissable-layer listens in the capture phase, so a field with an expression open takes the key first; then the surface closes and the work is abandoned.',
];

export const REACT_TIME_RANGE_PICKER_DOCS = {
  timeRangePicker: {
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
