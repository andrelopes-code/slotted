import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tokens from '@slotted/styles/time-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TIME_PICKER_TOKENS = tokens.map((name) => ({
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
      'The frame of the picker. Carries data-ui="time-picker", data-size, data-variant, data-granularity, data-open and the state attributes.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose: 'The box the panel hangs from, around the field and the trigger.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'The button that opens the panel. It says aria-haspopup="dialog", and its name carries the time written.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A field that types every time, and a panel that keeps a draft of it. The controls of the story answer the axes a product sets.',
    snippet: defineSnippet({
      id: 'time-picker-react-playground',
      label: 'Playground',
      language: 'tsx',
      source: `<TimePicker defaultValue={HALF_PAST_TWO} />;`,
    }),
  },
  {
    id: 'panel',
    title: 'The clock and its shortcuts',
    note: 'The hours of the day by its parts, and the minutes of the step. The rail holds Now, the consumer’s own shortcuts, and steps from now.',
    snippet: defineSnippet({
      id: 'time-picker-react-panel',
      label: 'The clock and its shortcuts',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'explicit',
    title: 'The times a consumer states',
    note: 'A clinic open at 08:40, 09:20 and 13:45 has no step. The times are drawn whole, one press chooses, and there is no Now.',
    snippet: defineSnippet({
      id: 'time-picker-react-explicit',
      label: 'The times a consumer states',
      language: 'tsx',
      source: `<TimePicker {...BASE} options={CLINIC} />;`,
    }),
  },
  {
    id: 'seconds',
    title: 'Seconds',
    note: 'granularity is the finest unit written, in the field and in the clock.',
    snippet: defineSnippet({
      id: 'time-picker-react-seconds',
      label: 'Seconds',
      language: 'tsx',
      source: `<TimePicker {...BASE} granularity="second" step={5} />;`,
    }),
  },
  {
    id: 'step',
    title: 'The step, and where it counts from',
    note: 'Seconds between two offered times, counted from min, or from midnight. The field still accepts a time between two of them.',
    snippet: defineSnippet({
      id: 'time-picker-react-step',
      label: 'The step, and where it counts from',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} step={300} />;`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'An hour outside the bounds is struck through and keeps its focus. A typed time outside them is invalid.',
    snippet: defineSnippet({
      id: 'time-picker-react-range-bounds',
      label: 'Bounds',
      language: 'tsx',
      source: `<TimePicker {...BASE} max={plainTime(18)} min={plainTime(8, 10)} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Times the product refuses',
    note: 'A predicate refuses particular times. An hour with every time refused is refused whole.',
    snippet: defineSnippet({
      id: 'time-picker-react-unavailable',
      label: 'Times the product refuses',
      language: 'tsx',
      source: `<TimePicker {...BASE} isTimeUnavailable={isLunch} />;`,
    }),
  },
  {
    id: 'offsets',
    title: 'Steps from now',
    note: 'Seconds from the present. A step past midnight, or to a refused time, is off. An empty list draws none.',
    snippet: defineSnippet({
      id: 'time-picker-react-offsets',
      label: 'Steps from now',
      language: 'tsx',
      source: `<TimePicker {...BASE} offsets={[900, 3600]} />;`,
    }),
  },
  {
    id: 'relative',
    title: 'The field keeps every key it had',
    note: 'A + or a − in the field opens an expression, and the clock follows the time it resolves to.',
    snippet: defineSnippet({
      id: 'time-picker-react-relative',
      label: 'The field keeps every key it had',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} relative />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a value, or a function that resolves one when it is pressed. A shortcut the rules refuse is off.',
    snippet: defineSnippet({
      id: 'time-picker-react-presets',
      label: 'Shortcuts',
      language: 'tsx',
      source: `<TimePicker {...BASE} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'The panel keeps a draft until Apply. confirm={false} writes the value on the press that completes the time, and closes.',
    snippet: defineSnippet({
      id: 'time-picker-react-confirm',
      label: 'With and without a confirmation',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'time-picker-react-sizes',
      label: 'Size',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} size="sm" />;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'time-picker-react-variants',
      label: 'Variant',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} variant="outline" />;`,
    }),
  },
  {
    id: 'placement',
    title: 'Where it opens',
    note: 'A side and an alignment. The positioner turns the panel when there is no room for it.',
    snippet: defineSnippet({
      id: 'time-picker-react-placement',
      label: 'Where it opens',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} placement="bottom-end" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the field’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'time-picker-react-states',
      label: 'States',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} disabled />;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'name posts the time, a reset returns to the first one, and a Field names the control and not the panel.',
    snippet: defineSnippet({
      id: 'time-picker-react-forms',
      label: 'In a form',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Departure</FieldLabel>
  <TimePicker name="departure" />
</Field>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the shortcuts become a strip over the footer, and on a finger the panel is a sheet.',
    snippet: defineSnippet({
      id: 'time-picker-react-narrow',
      label: 'One column',
      language: 'tsx',
      source: `<TimePicker {...BASE} defaultValue={HALF_PAST_TWO} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value and the open state, a provider states the step once, and footer writes what the panel says when nothing is wrong.',
    snippet: defineSnippet({
      id: 'time-picker-react-composition',
      label: 'Composition and escape hatches',
      language: 'tsx',
      source: `<TimePicker footer="Gate B" onValueChange={setTime} value={time} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The field keeps its keys, and the panel adds the clock’s.',
    snippet: defineSnippet({
      id: 'time-picker-react-keyboard',
      label: 'The keyboard',
      language: 'tsx',
      source: `// Alt + ArrowDown         opens, with focus in the field
// ArrowDown / ArrowUp     on the trigger, opens on the chosen hour
// Arrows, Home, End       move in the clock
// Enter / Space           chooses
// Ctrl + Enter            applies
// Escape                  discards and closes`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainTime | null',
    '—',
    'TimePicker',
    'The time held. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'PlainTime | null',
    'null',
    'TimePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  [
    'step',
    'number',
    '900',
    'TimePicker',
    'Seconds between two offered times, counted from min or from midnight.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'TimePicker',
    'The times to offer, stated rather than stepped.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'TimePicker',
    'The finest unit written.',
  ],
  ['hourCycle', '12 | 24', 'the locale’s', 'TimePicker', 'Twelve hours or twenty-four.'],
  ['min', 'PlainTime', '—', 'TimePicker', 'The earliest accepted time.'],
  ['max', 'PlainTime', '—', 'TimePicker', 'The latest accepted time.'],
  [
    'isTimeUnavailable',
    '(time: PlainTime) => boolean',
    '—',
    'TimePicker',
    'Refuses particular times.',
  ],
  [
    'presets',
    'readonly PickerPreset<PlainTime>[]',
    '—',
    'TimePicker',
    'The consumer’s own shortcuts, after Now.',
  ],
  ['offsets', 'readonly number[]', '15 min to 8 h', 'TimePicker', 'Steps from now, in seconds.'],
  ['confirm', 'boolean', 'true', 'TimePicker', 'Whether the panel keeps a draft until Apply.'],
  ['referenceTime', 'PlainTime', 'the clock', 'TimePicker', 'What now is.'],
  ['relative', 'boolean', '—', 'TimePicker', 'Whether + and − open an expression in the field.'],
  ['name', 'string', '—', 'TimePicker', 'The name a form posts the time under.'],
  [
    'invalid',
    'boolean',
    '—',
    'TimePicker',
    'Stated by the consumer; a refused time is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'TimePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'TimePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'TimePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'TimePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'TimePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'TimePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'TimePicker', 'Which zone answers "what is now".'],
  ['disabled', 'boolean', '—', 'TimePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'TimePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'TimePicker', 'The form needs a value.'],
  ['clearable', 'boolean', 'false', 'TimePicker', 'Draws a clear on the control.'],
  [
    'messages',
    'Partial<TimePickerMessages>',
    '—',
    'TimePicker',
    'Words laid over the language in force: the trigger’s two names, and what is said of a refused time.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: PlainTime | null, request: ChangeRequest<PlainTime | null>)',
    when: 'Before the value moves, and cancellable: from a key in the field, from Apply, from Clear.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the panel opens or closes, with the reason.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'TimePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets confirm, granularity, hourCycle, placement, size, step, timeZone and variant once.',
  ],
  [
    'renderSlot',
    '(state: ClockSlotState) => ReactNode',
    '—',
    'TimePicker',
    'What one whole time of options draws.',
  ],
  ['footer', 'ReactNode', 'the step', 'TimePicker', 'What the footer says when nothing is wrong.'],
  [
    'render',
    '(props: TimePickerRootProps) => ReactNode',
    '—',
    'TimePicker',
    'Substitutes the element the root renders.',
  ],
  ['ref', 'Ref<TimePickerHandle>', '—', 'TimePicker', 'focus(), open() and close().'],
]);

const accessibility: string[] = [
  'The trigger says aria-haspopup="dialog" and its name carries the value written, which is where focus returns when the panel closes.',
  'The panel is a dialog with its Tab wrapped, and each grid inside it is one stop.',
  'Escape discards the draft and returns focus to the trigger. Ctrl+Enter applies from anywhere in the panel.',
  'The footer’s hint is a status region, so the reason Apply is off is spoken as well as drawn.',
  'Alt+ArrowDown opens the panel and leaves focus in the field, so the segments keep every key they had.',
];

export const REACT_TIME_PICKER_DOCS = {
  timePicker: { accessibility, anatomy, api, composition, events, imports, scenes, snippets: [] },
};
