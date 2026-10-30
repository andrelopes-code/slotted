import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import timePickerTokens from '@slotted/styles/time-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TIME_PICKER_TOKENS = timePickerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Time Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { TimePicker, TimePickerDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame. Carries data-ui="time-picker", the axes and the state attributes, including data-open. It draws no border of its own: the time-field inside draws one, and a second would be a second place to fix one defect.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose:
      'The box the positioner measures, holding the field and the trigger. The surface hangs from this rather than from the button, so it lines up with the frame the reader sees.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'Opens the panel, from inside the field’s end slot. Its accessible name carries the chosen time, because focus returns here when the surface closes. It carries aria-haspopup="listbox", aria-expanded and aria-controls, and it is always drawn: ChromeOS turns Alt+ArrowDown into PageDown before the browser sees it.',
  },
  {
    part: 'positioner',
    element: 'div',
    required: false,
    purpose:
      'The layer the surface stands on, portalled to the end of the document so nothing between the control and the root can clip it. It carries data-ui too — a stylesheet cannot reach a subtree that is no longer inside the root — plus data-placement and data-presentation.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'The panel: one role="listbox", at every step and every granularity. A column per unit was drawn and withdrawn, so there is no second role to get wrong.',
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
    purpose: 'Where the now control sits, above the list and below the consumer’s own shortcuts.',
  },
  {
    part: 'now',
    element: 'button',
    required: false,
    purpose:
      'Writes the current time. It is the zero case of the field’s relative expression, drawn as one labelled press so a reader who never discovers + still has it.',
  },
  {
    part: 'presets',
    element: 'div',
    required: false,
    purpose:
      'The consumer’s own shortcuts, in a column beside the list. This family ships no list of them: "start of the shift" is a business clock, and a library guessing at one would be guessing at an industry.',
  },
  {
    part: 'list',
    element: 'div',
    required: false,
    purpose:
      'The rows, and the only thing that scrolls. Capped at eight and a half row pitches, so the half-row says the list continues; data-truncated says the list stops short of what the configuration asked for.',
  },
  {
    part: 'option',
    element: 'div',
    required: false,
    purpose:
      'One whole time, as role="option" with aria-selected. data-selected is the chosen row, data-current is where a key will act, and data-disabled is a time a bound or the predicate refuses.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'Drawn when no time is available at all — min above max, or a predicate that refuses every step. It is a sentence rather than an empty box, which is what MUI and Ant both leave behind.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose: 'The consumer’s own actions, under the list.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One picker with every axis on it, driven by the controls below the canvas. Open it with the clock, type into the field, and press Alt+ArrowDown to open the panel without leaving the segments.',
    snippet: defineSnippet({
      id: 'time-picker-react-playground',
      label: 'Usage',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Start time</FieldLabel>
  <TimePicker clearable locale="pt-BR" name="start" step={900} />
</Field>;`,
    }),
  },
  {
    id: 'panel',
    title: 'One panel shape',
    note: 'A listbox of whole times, at every step. 09:15 is legible at a glance where a 15 in a column of minutes is legible only beside the column next to it — and one axis is what makes Home, End, type-ahead and the arrows all mean something.',
    snippet: defineSnippet({
      id: 'time-picker-react-panel',
      label: 'The panel',
      language: 'tsx',
      source: `<TimePicker defaultOpen locale="pt-BR" step={1800} />;`,
    }),
  },
  {
    id: 'explicit',
    title: 'The times a consumer states',
    note: 'No step describes a clinic open at 09:00, 09:20, 11:40 and 13:45, and a predicate only subtracts from times that fall on one. options hands the panel exactly the times it should offer, in the order it should offer them — and it is half the answer to why this family needs no column panel.',
    snippet: defineSnippet({
      id: 'time-picker-react-explicit',
      label: 'An irregular list',
      language: 'tsx',
      source: `<TimePicker
  locale="pt-BR"
  options={[
    { hour: 9, minute: 0, second: 0 },
    { hour: 9, minute: 20, second: 0 },
    { hour: 13, minute: 45, second: 0 },
  ]}
/>;`,
    }),
  },
  {
    id: 'seconds',
    title: 'Seconds, chosen from a surface',
    note: 'The other half of the same answer. A day at a one-second step is 86 400 rows and not a list; a stated set of marks is four. The field beside the panel types any second the list does not offer.',
    snippet: defineSnippet({
      id: 'time-picker-react-seconds',
      label: 'A set of marks',
      language: 'tsx',
      source: `<TimePicker
  granularity="second"
  locale="pt-BR"
  options={[
    { hour: 0, minute: 0, second: 15 },
    { hour: 0, minute: 0, second: 30 },
    { hour: 0, minute: 0, second: 45 },
  ]}
/>;`,
    }),
  },
  {
    id: 'step',
    title: 'The step, and where it counts from',
    note: 'A step in seconds, counting from min when it is stated and from midnight when it is not — the platform’s own rule for input[type=time], and one no surveyed panel states. A value off the step is not invalid: the field still types 09:15 when the panel offers 09:07.',
    snippet: defineSnippet({
      id: 'time-picker-react-step',
      label: 'Three steps, and a base',
      language: 'tsx',
      source: `<>
  <TimePicker step={3600} />
  <TimePicker step={1800} />
  <TimePicker min={{ hour: 9, minute: 7, second: 0 }} step={900} />
</>;`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'min and max fence both the list and the value. The panel offers nothing outside them, and a value outside them is invalid whatever the field around the picker says.',
    snippet: defineSnippet({
      id: 'time-picker-react-range-bounds',
      label: 'Opening hours',
      language: 'tsx',
      source: `<TimePicker max={{ hour: 18, minute: 0, second: 0 }} min={{ hour: 9, minute: 0, second: 0 }} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Times the product refuses',
    note: 'isTimeUnavailable answers a lunch break or a booked slot. By default the row stays and is disabled — a list that drops rows is a list whose step nobody can infer — and unavailableOptions="hide" is the consumer’s choice to drop it anyway.',
    snippet: defineSnippet({
      id: 'time-picker-react-unavailable',
      label: 'Disabled, or hidden',
      language: 'tsx',
      source: `<>
  <TimePicker isTimeUnavailable={(time) => time.hour === 12} />
  <TimePicker isTimeUnavailable={(time) => time.hour === 12} unavailableOptions="hide" />
</>;`,
    }),
  },
  {
    id: 'now',
    title: 'The current time, in one press',
    note: 'The control at the head of the panel writes the time it is now. It is the zero case of the field’s relative expression, drawn as a labelled press so a reader who never discovers + still has it.',
    snippet: defineSnippet({
      id: 'time-picker-react-now',
      label: 'Now',
      language: 'tsx',
      source: `<TimePicker messages={{ now: 'Agora' }} referenceTime={{ hour: 9, minute: 47, second: 0 }} />;`,
    }),
  },
  {
    id: 'relative',
    title: 'The field keeps every key it had',
    note: 'The panel complements the typing and never replaces it, which is what docs/component-features.md §6 asks for. Alt+ArrowDown opens the panel and leaves focus in the segments; + still opens a duration; and the highlight follows what is typed.',
    snippet: defineSnippet({
      id: 'time-picker-react-relative',
      label: 'Typing, with the panel open',
      language: 'tsx',
      source: `<TimePicker defaultOpen referenceTime={{ hour: 14, minute: 40, second: 0 }} />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts and actions',
    note: 'Two slots the family ships empty: a column of the consumer’s own shortcuts beside the list, and a row of their own actions under it. The surface stops being the anchor’s width when the shortcuts are there, so the times keep a column worth reading.',
    snippet: defineSnippet({
      id: 'time-picker-react-presets',
      label: 'Both slots',
      language: 'tsx',
      source: `<TimePicker
  footer={<Button size="sm">Apply</Button>}
  presets={<Button size="sm">Start of shift</Button>}
/>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps the control can be, and the panel answers each: the row height and the eight-and-a-half-row cap are counted in the same unit, so a dense panel shows the same number of times in less room.',
    snippet: defineSnippet({
      id: 'time-picker-react-sizes',
      label: 'The three steps',
      language: 'tsx',
      source: `<>
  <TimePicker size="sm" />
  <TimePicker size="md" />
  <TimePicker size="lg" />
</>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows at rest. The panel does not change with it: a surface floating over the page has its own ground whatever the control below it looks like.',
    snippet: defineSnippet({
      id: 'time-picker-react-variants',
      label: 'The three frames',
      language: 'tsx',
      source: `<>
  <TimePicker variant="outline" />
  <TimePicker variant="subtle" />
  <TimePicker variant="plain" />
</>;`,
    }),
  },
  {
    id: 'placement',
    title: 'Where it opens',
    note: 'The side and alignment the surface starts from, before the positioner reads the room and moves it. What the engine resolved is written back as data-placement, so a stylesheet can answer the side it actually landed on.',
    snippet: defineSnippet({
      id: 'time-picker-react-placement',
      label: 'Six starting points',
      language: 'tsx',
      source: `<>
  <TimePicker placement="bottom-start" />
  <TimePicker placement="top-end" />
</>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only keeps the value readable and the panel shut; disabled answers no press at all; invalid retargets the ring on the control and on the trigger together. The row of options has its own four, and the chosen row answers the pointer in its own tone rather than turning grey.',
    snippet: defineSnippet({
      id: 'time-picker-react-states',
      label: 'The four states',
      language: 'tsx',
      source: `<>
  <TimePicker readOnly />
  <TimePicker invalid />
  <TimePicker disabled />
  <TimePicker required />
</>;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'The value reaches a plain form post as an HH:mm:ss string through the field’s hidden input, so a server reads it without any JavaScript touching the control.',
    snippet: defineSnippet({
      id: 'time-picker-react-forms',
      label: 'A plain post',
      language: 'tsx',
      source: `<form action="/schedule" method="post">
  <Field>
    <FieldLabel>Start time</FieldLabel>
    <TimePicker name="start" required />
  </Field>
</form>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'Narrow',
    note: 'The panel takes the anchor’s width, floored so a narrow field never produces a column too tight to read a time in and capped so a wide form never stretches one column of times across a page. Below 480 pixels on a finger it becomes a sheet, and the DOM says which it is.',
    snippet: defineSnippet({
      id: 'time-picker-react-narrow',
      label: 'In a narrow column',
      language: 'tsx',
      source: `<div className="slotted-demo-measure">
  <TimePicker locale="pt-BR" />
</div>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The provider sets the step and the labels once; renderOption draws the row without owning it; render substitutes the frame; and the ref carries focus(), open() and close().',
    snippet: defineSnippet({
      id: 'time-picker-react-composition',
      label: 'The four surfaces',
      language: 'tsx',
      source: `<TimePickerDefaultsProvider step={1200}>
  <TimePicker ref={handle} renderOption={(option) => <span>{option.label}</span>} />
</TimePickerDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Alt+ArrowDown opens the panel from the field and leaves focus there; the trigger’s ArrowDown moves focus into the list; inside it the arrows walk, Home and End reach the ends, PageUp and PageDown cross one hour boundary each, digits jump, and Enter chooses. Escape closes and puts focus back on the trigger.',
    snippet: defineSnippet({
      id: 'time-picker-react-keyboard',
      label: 'Composing with your own handler',
      language: 'tsx',
      source: `<TimePicker
  onKeyDown={(event) => {
    if (event.key === 'Escape') clearSelection();
  }}
/>;`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainTime | null',
    '—',
    'TimePicker',
    'Present means the consumer owns the value. The picker asks and waits rather than moving it.',
  ],
  [
    'defaultValue',
    'PlainTime | null',
    '—',
    'TimePicker',
    'The value the picker starts from when nobody else writes one.',
  ],
  [
    'open',
    'boolean',
    '—',
    'TimePicker',
    'Present means the consumer owns whether the surface is showing.',
  ],
  ['defaultOpen', 'boolean', 'false', 'TimePicker', 'Whether the surface starts open.'],
  [
    'highlightedValue',
    'PlainTime | null',
    '—',
    'TimePicker',
    'Where the reader is in the list. Present means the consumer owns it; the highlight is not the value, and moving it moves nothing.',
  ],
  [
    'defaultHighlightedValue',
    'PlainTime | null',
    '—',
    'TimePicker',
    'Where the highlight starts, before the panel places it on the chosen time.',
  ],
  [
    'min',
    'PlainTime',
    '—',
    'TimePicker',
    'The earliest time the list offers and the value accepts.',
  ],
  ['max', 'PlainTime', '—', 'TimePicker', 'The latest time the list offers and the value accepts.'],
  [
    'isTimeUnavailable',
    '(time: PlainTime) => boolean',
    '—',
    'TimePicker',
    'Refuses particular times. A refused row is disabled by default rather than dropped.',
  ],
  [
    'step',
    'number',
    '900',
    'TimePicker',
    'Seconds between two offered times, counting from min when it is stated and from midnight when it is not. Ignored when options states the list.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'TimePicker',
    'The times to offer, stated rather than stepped, in the consumer’s own order. It is what makes an irregular list and a second-level set expressible, and why this family needs no column panel.',
  ],
  [
    'maxOptions',
    'number',
    '1440',
    'TimePicker',
    'How many rows the list may reach — a whole day at a one-minute step. Beyond it the list is cut, data-truncated says so, and the rest is typed into the field.',
  ],
  [
    'unavailableOptions',
    "'disable' | 'hide'",
    'disable',
    'TimePicker',
    'What a refused row looks like. Disabling is the default because a list that drops rows is a list whose step nobody can infer.',
  ],
  [
    'locale',
    'string',
    'SlottedProvider',
    'TimePicker',
    'BCP 47. Decides how every row is written. Unset, the language in force decides.',
  ],
  [
    'timeZone',
    'string',
    'runtime',
    'TimePicker',
    'Which zone answers "what time is it now", for the opening position and the now control.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'locale',
    'TimePicker',
    'The question a consumer asks about the clock, passed through to the field and the rows.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'TimePicker',
    'The smallest unit the field draws and the rows carry.',
  ],
  [
    'referenceTime',
    'PlainTime',
    'now',
    'TimePicker',
    'What "now" means for the opening position, the now control and the field’s durations.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'TimePicker',
    'The type step, matching the field around it.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'TimePicker',
    'How much frame the control shows at rest.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'TimePicker',
    'Where the surface starts, before the positioner reads the room.',
  ],
  [
    'closeOnSelect',
    "'auto' | 'always' | 'never'",
    'auto',
    'TimePicker',
    'Whether choosing closes the surface. auto closes, because one press chooses a whole time.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'TimePicker',
    'Unstated rather than false, so the picker defers to the field around it.',
  ],
  ['readOnly', 'boolean', '—', 'TimePicker', 'Readable and focusable, and not changeable.'],
  [
    'invalid',
    'boolean',
    '—',
    'TimePicker',
    'Unstated rather than false. Retargets the focus ring.',
  ],
  ['required', 'boolean', '—', 'TimePicker', 'Unstated rather than false.'],
  ['clearable', 'boolean', 'false', 'TimePicker', 'Draws the field’s own clear button.'],
  [
    'name',
    'string',
    '—',
    'TimePicker',
    'The name the hidden input carries the HH:mm:ss string under.',
  ],
  [
    'messages',
    'Partial<TimePickerMessages>',
    '—',
    'TimePicker',
    'Words laid over the language in force, key by key: the trigger’s name while nothing is chosen (choose) and once a time is (change, with a {time} slot), the now control (now), the empty panel (empty) and the description of a list cut short (truncated).',
  ],
  ['presets', 'ReactNode', '—', 'TimePicker', 'The consumer’s own shortcuts, beside the list.'],
  ['footer', 'ReactNode', '—', 'TimePicker', 'The consumer’s own actions, under the list.'],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: PlainTime | null, request: TimeFieldChangeRequest)',
    when: 'Before the value moves, and cancellable. It arrives from the field when a typed run ends, and from the panel when a row is chosen — with reason "select" there. The request carries the segments and whether a duration crossed midnight.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the surface opens or closes, and cancellable. The reason says which of pointer, keyboard, escape, outsidePress or select moved it — a boolean cannot, and a consumer who has to guess writes the wrong handler.',
  },
  {
    name: 'onHighlightedValueChange',
    payload: '(value: PlainTime | null, request: ChangeRequest<PlainTime | null>)',
    when: 'Before the highlight moves. Selection does not follow focus here: the highlight is where a key will act and the value is what was chosen, and a reader arrowing through ninety-six quarter-hours would otherwise emit ninety-six value requests.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'TimePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets step, maxOptions, unavailableOptions, placement, closeOnSelect, timeZone, hourCycle, granularity, size and variant once for everything under it. The locale and the words come from SlottedProvider.',
  ],
  [
    'renderOption',
    '(state: TimePickerOptionState) => ReactNode',
    '—',
    'TimePicker',
    'Draws what is inside one row. The row itself — its role, its states, its keyboard and its target size — stays the family’s.',
  ],
  [
    'render',
    '(props: TimePickerRootProps) => ReactNode',
    '—',
    'TimePicker',
    'Substitutes the element the frame renders, carrying the ref the positioner measures against.',
  ],
  [
    'ref',
    'Ref<TimePickerHandle>',
    '—',
    'TimePicker',
    'focus() puts the reader on the first segment of the field; open() and close() move the surface without a pointer.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'TimePicker',
    'Runs before the family acts, on the control and on the list alike, and calling preventDefault stops it acting at all.',
  ],
]);

const accessibility: string[] = [
  'The panel is one role="listbox" in every configuration the family has, so the trigger says aria-haspopup="listbox" everywhere and there is no second role a reader has to learn. A column per unit was drawn and withdrawn, and with it the dialog role a popup of several listboxes would have needed.',
  'Focus is real inside the list — a roving tabindex, not aria-activedescendant — because the reader is inside the list rather than typing into a control that must keep focus. The pattern’s own rule for where focus lands is taken whole: the selected option, or the first when none is selected.',
  'Selection does not follow focus. The listbox pattern lists it as optional and warns it can degrade accessibility, and here it would emit one value request per option as a reader arrows through ninety-six quarter-hours.',
  'The trigger’s accessible name carries the chosen time, because focus returns to it when the surface closes — which is where a reader is told what was chosen, and what the APG names as an accessibility feature of its own example.',
  'A list cut at maxOptions says so twice: data-truncated in the DOM for a stylesheet, and the panel’s accessible description for a reader, naming that the remaining times are typed into the field rather than listed.',
];

export const REACT_TIME_PICKER_DOCS = {
  timePicker: {
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
