import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import timeFieldTokens from '@slotted/styles/time-field/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TIME_FIELD_TOKENS = timeFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Time Field decision',
}));

const imports: ReferenceImport = {
  source: "import { SlottedProvider, TimeField, TimeFieldDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame. Carries data-ui="time-field", the axes, data-cycle, data-granularity and the state attributes. It has no role of its own: the group inside is what a screen reader meets. className, style and every native attribute reach this element.',
  },
  {
    part: 'segments',
    element: 'div',
    required: true,
    purpose:
      'role="group", whose accessible name is the whole time in words. The APG’s spin-button example names the group as the thing that tells a screen-reader user that the buttons are one time, so a reader hears "14:30" without visiting every field and remembering each.',
  },
  {
    part: 'segment',
    element: 'div',
    required: true,
    purpose:
      'One field of the time, as role="spinbutton" with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext. There is one per field the locale writes, in the locale’s own order, and exactly one of them is in the tab sequence. data-field says which field it holds and data-placeholder says it holds nothing yet.',
  },
  {
    part: 'literal',
    element: 'span',
    required: true,
    purpose:
      'The separator the locale writes between two fields — a colon, a space before the day period. It is aria-hidden: the group already carries the time in words, and a screen reader reading "colon" between two numbers is reading punctuation aloud.',
  },
  {
    part: 'duration',
    element: 'input',
    required: false,
    purpose:
      'The relative expression, in place of the segments. A real text input, so a mobile keyboard opens and the platform supplies every editing key the reader knows. It appears when +, - or = is pressed on a segment, and leaves on Enter or Escape.',
  },
  {
    part: 'preview',
    element: 'span',
    required: false,
    purpose:
      'What the expression resolves to, drawn before anything commits. role="status" with aria-live="polite", so a reader who cannot see it hears the resolved time as well. data-crosses-midnight says the duration ran into the next day.',
  },
  {
    part: 'value-text',
    element: 'span',
    required: true,
    purpose:
      'The whole time in words, hidden from sight and referenced by the group’s own aria-labelledby. It is what makes the group’s accessible name the value rather than a label alone.',
  },
  {
    part: 'start',
    element: 'span',
    required: false,
    purpose:
      'An adornment before the time in the reading direction: a clock mark, a label, an icon. It is its own bidi run, and any icon inside it is sized from the control’s own glyph scale.',
  },
  {
    part: 'end',
    element: 'span',
    required: false,
    purpose: 'An adornment after the time in the reading direction: a zone abbreviation, a note.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Empties every segment with reason "clear" and returns focus to the first one. Drawn only when there is something to clear and the reader may change it, and never smaller than 24 CSS pixels.',
  },
  {
    part: 'hidden-input',
    element: 'input',
    required: true,
    purpose:
      'type="hidden", carrying the value as an ISO 8601 HH:mm:ss string under the name prop. It is what makes the control work in a plain form post without JavaScript reading it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Type into it: each field takes digits, the arrows step it, and pressing + turns it into a duration from now.',
    snippet: defineSnippet({
      id: 'time-field-react-playground',
      label: 'Usage',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Start time</FieldLabel>
  <TimeField clearable locale="pt-BR" name="start" />
  <FieldDescription>The meeting starts at this time.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'locale',
    title: 'The locale writes the time',
    note: 'The same component in four locales. The field order, the separators, the placeholder and whether a day period exists all come from Intl — nobody writes a format string.',
    snippet: defineSnippet({
      id: 'time-field-react-locale',
      label: 'Four locales',
      language: 'tsx',
      source: `<>
  <TimeField locale="pt-BR" />
  <TimeField locale="en-US" />
  <TimeField locale="ja-JP" />
  <TimeField locale="ar-EG" />
</>;`,
    }),
  },
  {
    id: 'hour-cycle',
    title: 'Four hour cycles, not a boolean',
    note: 'Intl resolves h11, h12, h23 and h24, and a boolean can say two of them. Ask for 12 in ja-JP and the hour runs from zero beside 午前, because that is what the locale writes. The public axis stays 12 | 24.',
    snippet: defineSnippet({
      id: 'time-field-react-hour-cycle',
      label: 'The axis, and what the locale does with it',
      language: 'tsx',
      source: `<>
  <TimeField hourCycle={12} locale="en-US" />
  <TimeField hourCycle={12} locale="ja-JP" />
  <TimeField hourCycle={24} locale="en-US" />
</>;`,
    }),
  },
  {
    id: 'granularity',
    title: 'Granularity',
    note: 'How much of the time is drawn, and how much of it is typed. Seconds exist only when the value has them; an hour-granularity field is one spin button and one value.',
    snippet: defineSnippet({
      id: 'time-field-react-granularity',
      label: 'Three depths',
      language: 'tsx',
      source: `<>
  <TimeField granularity="hour" locale="pt-BR" />
  <TimeField granularity="minute" locale="pt-BR" />
  <TimeField granularity="second" locale="pt-BR" />
</>;`,
    }),
  },
  {
    id: 'relative',
    title: 'A time written as a duration',
    note: 'Press +, - or = on any segment and the field takes an expression instead: +40m, 1h30, -15, 0. What it resolves to is drawn beside it before Enter commits anything, and Escape puts the segments back untouched. No surveyed implementation offers it.',
    snippet: defineSnippet({
      id: 'time-field-react-relative',
      label: 'The expression',
      language: 'tsx',
      source: `<TimeField locale="pt-BR" referenceTime={{ hour: 14, minute: 40, second: 0 }} />;`,
    }),
  },
  {
    id: 'midnight',
    title: 'A duration that crosses midnight',
    note: '+90m at 23:00 is 00:30 the next day, and this library holds no day beside a time. The preview changes tone, says so in words, and the request carries crossesMidnight — so a consumer holding a PlainDateTime knows to add one. Nothing else surveyed says anything at all.',
    snippet: defineSnippet({
      id: 'time-field-react-midnight',
      label: 'The crossing, in the request',
      language: 'tsx',
      source: `<TimeField
  locale="pt-BR"
  messages={{ nextDay: '{time} no dia seguinte' }}
  onValueChange={(value, request) => save(value, request.crossesMidnight)}
  referenceTime={{ hour: 23, minute: 0, second: 0 }}
/>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps a field can be. A control inside a field takes the field’s step, so a form cannot end up with a small field holding a medium control on one row.',
    snippet: defineSnippet({
      id: 'time-field-react-sizes',
      label: 'The three steps',
      language: 'tsx',
      source: `<>
  <TimeField size="sm" />
  <TimeField size="md" />
  <TimeField size="lg" />
</>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows. outline takes the ground it is on, subtle sinks into the page, and plain shows nothing until it is used — which is what a dense table needs.',
    snippet: defineSnippet({
      id: 'time-field-react-variants',
      label: 'The three frames',
      language: 'tsx',
      source: `<>
  <TimeField variant="outline" />
  <TimeField variant="subtle" />
  <TimeField variant="plain" />
</>;`,
    }),
  },
  {
    id: 'range',
    title: 'Bounds',
    note: 'min and max fence the value and reach the spin buttons as aria-valuemin and aria-valuemax. A time outside them is invalid whatever the field around it says, because the control is the only thing that knows.',
    snippet: defineSnippet({
      id: 'time-field-react-range',
      label: 'Opening hours',
      language: 'tsx',
      source: `<TimeField max={{ hour: 18, minute: 0, second: 0 }} min={{ hour: 9, minute: 0, second: 0 }} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Times the product refuses',
    note: 'isTimeUnavailable answers a lunch break, a booked slot, a closed shop — anything a pair of bounds cannot say. A predicate reaches every time; three lists of numbers reach only the ones on a unit boundary.',
    snippet: defineSnippet({
      id: 'time-field-react-unavailable',
      label: 'A lunch break',
      language: 'tsx',
      source: `<TimeField isTimeUnavailable={(time) => time.hour === 12} locale="pt-BR" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only stays focusable and copyable and never looks disabled; disabled answers no key and no pointer; invalid keeps its focus ring and retargets its color. Tab through the row to see each one answer.',
    snippet: defineSnippet({
      id: 'time-field-react-states',
      label: 'The four states',
      language: 'tsx',
      source: `<>
  <TimeField readOnly />
  <TimeField invalid />
  <TimeField disabled />
  <TimeField required />
</>;`,
    }),
  },
  {
    id: 'clear',
    title: 'Clearing',
    note: 'The button appears only once a segment holds something, and pressing it empties every field, emits the clear reason and puts focus back on the first segment rather than leaving it nowhere.',
    snippet: defineSnippet({
      id: 'time-field-react-clear',
      label: 'Clearing',
      language: 'tsx',
      source: `<TimeField clearable messages={{ clear: 'Limpar a hora' }} />;`,
    }),
  },
  {
    id: 'adornments',
    title: 'Adornments',
    note: 'The two slots take an icon, a mark or a word, and both are named for the reading direction rather than for a side, so the same markup reads correctly in a right-to-left document. A time zone label belongs here: the value itself is a wall-clock time and carries no zone.',
    snippet: defineSnippet({
      id: 'time-field-react-adornments',
      label: 'Both slots',
      language: 'tsx',
      source: `<TimeField
  end={<span>BRT</span>}
  start={
    <Icon>
      <Clock />
    </Icon>
  }
/>;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'The value reaches a plain form post as an HH:mm:ss string through a hidden input, so a server reads it without any JavaScript touching the control. A half-typed time posts nothing at all, because it is not a time.',
    snippet: defineSnippet({
      id: 'time-field-react-forms',
      label: 'A plain post',
      language: 'tsx',
      source: `<form action="/schedule" method="post">
  <Field>
    <FieldLabel>Start time</FieldLabel>
    <TimeField name="start" required />
  </Field>
</form>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A day period written as a word rather than as two letters, a second granularity in a narrow column, and a right-to-left document — where the sequence still reads 14:30 rather than 30:14, because a clock time is a numeric run and bidi renders one left to right.',
    snippet: defineSnippet({
      id: 'time-field-react-content',
      label: 'A long day period',
      language: 'tsx',
      source: `<TimeField granularity="second" hourCycle={12} locale="es-MX" />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The provider sets the clock once for everything under it, SlottedProvider the language; render substitutes the frame’s element; and the ref carries focus(), clear() and which field holds focus.',
    snippet: defineSnippet({
      id: 'time-field-react-composition',
      label: 'The three surfaces',
      language: 'tsx',
      source: `<SlottedProvider locale="pt-BR">
  <TimeFieldDefaultsProvider hourCycle={24}>
    <TimeField ref={handle} render={(props) => <section {...props} />} />
  </TimeFieldDefaultsProvider>
</SlottedProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Every key the spin-button pattern lists, plus the two the pattern has no example for: the arrows across, which are logical rather than physical, and the three characters that open a duration. Put focus in the field and try them.',
    snippet: defineSnippet({
      id: 'time-field-react-keyboard',
      label: 'Composing with your own handler',
      language: 'tsx',
      source: `<TimeField
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
    'TimeField',
    'Present means the consumer owns the value. The control asks and waits rather than moving it.',
  ],
  [
    'defaultValue',
    'PlainTime | null',
    '—',
    'TimeField',
    'The value the control starts from when nobody else writes one. Read once; a later change does not silently become new state.',
  ],
  [
    'min',
    'PlainTime',
    '—',
    'TimeField',
    'The earliest time the control accepts. Reported through aria-valuemin on the field the bound applies to.',
  ],
  [
    'max',
    'PlainTime',
    '—',
    'TimeField',
    'The latest time the control accepts. Reported through aria-valuemax.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime) => boolean',
    '—',
    'TimeField',
    'Refuses particular times — a lunch break, a booked slot, a closed shop. A time it refuses is invalid whatever the field around the control says.',
  ],
  [
    'locale',
    'string',
    'SlottedProvider',
    'TimeField',
    'BCP 47. Decides the field order, the separators, the placeholder and whether a day period is drawn at all. Unset, the language in force decides.',
  ],
  [
    'timeZone',
    'string',
    'runtime',
    'TimeField',
    'Which zone answers "what time is it now", and nothing else. The value itself is a wall-clock time and carries no zone.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'locale',
    'TimeField',
    'The question a consumer asks about the clock. Which variant of each — h11 or h12, h23 or h24 — is the locale’s own.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'TimeField',
    'The smallest unit the field draws and takes. Seconds exist only when the value has them.',
  ],
  [
    'referenceTime',
    'PlainTime',
    'now',
    'TimeField',
    'What an empty segment steps from and what a duration resolves against. Stating it is what makes a story and a test deterministic.',
  ],
  ['size', "'sm' | 'md' | 'lg'", 'md', 'TimeField', 'The type step, matching the field around it.'],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'TimeField',
    'How much frame the control shows at rest.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'TimeField',
    'Unstated rather than false, so the control defers to the field. Takes every segment out of the tab sequence.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'TimeField',
    'Readable, copyable and focusable, and not changeable. Arrow keys still walk between fields; nothing steps.',
  ],
  ['invalid', 'boolean', '—', 'TimeField', 'Unstated rather than false. Retargets the focus ring.'],
  [
    'required',
    'boolean',
    '—',
    'TimeField',
    'Unstated rather than false. Reaches the group as aria-required.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'TimeField',
    'Draws a button that empties the value and returns focus to the first segment.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'TimeField',
    'Whether +, - and = open the duration expression. Set it false and the three keys do nothing, which is the whole of removing the mode.',
  ],
  [
    'messages',
    'Partial<TimeFieldMessages>',
    '—',
    'TimeField',
    'Words laid over the language in force, key by key: the clear button’s name (clear), the expression region’s name (duration) and the preview of a time past midnight (nextDay, with a {time} slot).',
  ],
  [
    'name',
    'string',
    '—',
    'TimeField',
    'The name the hidden input carries the HH:mm:ss string under, for a plain form post.',
  ],
  [
    'start',
    'ReactNode',
    '—',
    'TimeField',
    'An adornment before the time in the reading direction.',
  ],
  ['end', 'ReactNode', '—', 'TimeField', 'An adornment after the time in the reading direction.'],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: PlainTime | null, request: TimeFieldChangeRequest)',
    when: 'Before the value moves, and cancellable. The request carries the new value, the value it replaces, the segments, whether a duration crossed midnight, the reason and the originating event. It arrives when a run of typed digits ends — on the digit that fills a field, on the key that leaves it, or on blur — never on every keystroke inside one, because typing 23 into an hour passes through 2 on the way. A value that has not moved emits nothing, which is what docs/state-and-events.md states: a request for the value already held has nothing to decide and nothing to cancel.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'TimeFieldDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets timeZone, hourCycle, granularity, relative, size and variant once for everything under it. A control that states any of them itself still wins. The locale and the words come from SlottedProvider.',
  ],
  [
    'render',
    '(props: TimeFieldRootProps) => ReactNode',
    '—',
    'TimeField',
    'Substitutes the element the frame renders. The props carry the ref: a substituted frame has to hand its element back, because focus() reaches the segments through it.',
  ],
  [
    'ref',
    'Ref<TimeFieldHandle>',
    '—',
    'TimeField',
    'focus() puts the reader on the first segment, clear() empties the value with the clear reason, and activeField says which segment holds focus.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'TimeField',
    'Runs before the family acts, and calling preventDefault stops it acting at all. The family composes with the consumer’s handler rather than replacing it.',
  ],
  [
    'onPaste',
    'ClipboardEventHandler',
    '—',
    'TimeField',
    'Runs before the family parses. Left alone, a pasted time is read in the locale’s shape first, ISO 8601 second, and as a duration third — so pasting +40m does what typing it does.',
  ],
]);

const accessibility: string[] = [
  'The fields are a role="group" whose accessible name is the whole time in words, which is what the APG’s spin-button example names as the thing that lets a screen-reader user perceive a time without visiting every button and remembering each.',
  'Each field is a role="spinbutton" carrying aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext — and the day period is why aria-valuetext is not optional: aria-valuenow there is 0 or 1, which is not a name in any language.',
  'Exactly one field is in the tab sequence at a time; the arrows walk between them and mirror in a right-to-left document, because the keys are physical and the order they walk is the writing order.',
  'The expression region is a real input with its own accessible name, and its preview is a polite live region: a reader is being asked to accept a value they did not write, so the resolved time has to be perceivable before Enter — including to a reader who cannot see it.',
  'A step wraps inside its own field and never carries: 23:59 stepping the minute up reaches 23:00 rather than midnight, which is the example’s stated rule and the difference between one arrow press changing one field and changing two.',
];

export const REACT_TIME_FIELD_DOCS = {
  timeField: {
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
