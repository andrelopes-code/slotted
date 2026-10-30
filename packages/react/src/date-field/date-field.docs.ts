import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import dateFieldTokens from '@slotted/styles/date-field/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DATE_FIELD_TOKENS = dateFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Date Field decision',
}));

const imports: ReferenceImport = {
  source: "import { DateField, DateFieldDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame. Carries data-ui="date-field", the axes, and data-disabled, data-invalid, data-readonly and data-required. It has no role of its own: the group inside is what a screen reader meets. className, style and every native attribute reach this element.',
  },
  {
    part: 'segments',
    element: 'div',
    required: true,
    purpose:
      'role="group", whose accessible name is the whole date in words. The APG’s spin-button example names the group as the thing that tells a screen-reader user that three buttons are one date, so a reader hears "9 de setembro de 2026" without visiting all three and remembering each.',
  },
  {
    part: 'segment',
    element: 'div',
    required: true,
    purpose:
      'One field of the date, as role="spinbutton" with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext. There is one per field the locale writes, in the locale’s own order, and exactly one of them is in the tab sequence. data-field says which field it holds and data-placeholder says it holds nothing yet.',
  },
  {
    part: 'literal',
    element: 'span',
    required: true,
    purpose:
      'The separator the locale writes between two fields — a slash, a full stop, a hyphen. It is aria-hidden: the group already carries the date in words, and a screen reader reading "slash" between two numbers is reading punctuation aloud.',
  },
  {
    part: 'start',
    element: 'span',
    required: false,
    purpose:
      'An adornment before the date in the reading direction: a calendar mark, a label, an icon. It is its own bidi run, and any icon inside it is sized from the control’s own glyph scale.',
  },
  {
    part: 'end',
    element: 'span',
    required: false,
    purpose: 'An adornment after the date in the reading direction: a time zone, a note, a unit.',
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
      'type="hidden", carrying the value as an ISO 8601 YYYY-MM-DD string under the name prop. It is what makes the control work in a plain form post without JavaScript reading it — the decision currency-field already took for a number.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Type into it: each field takes digits, the arrows step it, and the clear button appears only once there is something to clear.',
    snippet: defineSnippet({
      id: 'date-field-react-playground',
      label: 'Usage',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Due date</FieldLabel>
  <DateField clearable locale="pt-BR" name="due-date" />
  <FieldDescription>The invoice is due on this date.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'locale',
    title: 'The locale writes the date',
    note: 'The same component in four locales. The field order, the separators and the placeholder all come from Intl — nobody writes a format string, and a Japanese reader gets the year first.',
    snippet: defineSnippet({
      id: 'date-field-react-locale',
      label: 'Four locales',
      language: 'tsx',
      source: `<>
  <DateField locale="pt-BR" />
  <DateField locale="en-US" />
  <DateField locale="de-DE" />
  <DateField locale="ja-JP" />
</>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps a field can be. A control inside a field takes the field’s step, so a form cannot end up with a small field holding a medium control on one row.',
    snippet: defineSnippet({
      id: 'date-field-react-sizes',
      label: 'The three steps',
      language: 'tsx',
      source: `<>
  <DateField size="sm" />
  <DateField size="md" />
  <DateField size="lg" />
</>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows. outline takes the ground it is on, subtle sinks into the page, and plain shows nothing until it is used — which is what a dense table needs.',
    snippet: defineSnippet({
      id: 'date-field-react-variants',
      label: 'The three frames',
      language: 'tsx',
      source: `<>
  <DateField variant="outline" />
  <DateField variant="subtle" />
  <DateField variant="plain" />
</>;`,
    }),
  },
  {
    id: 'range',
    title: 'Bounds and unavailable dates',
    note: 'min and max fence the value, and isDateUnavailable refuses particular days. A date outside either is invalid whatever the field around it says, because the control is the only thing that knows.',
    snippet: defineSnippet({
      id: 'date-field-react-range',
      label: 'Bounds and a predicate',
      language: 'tsx',
      source: `<DateField
  isDateUnavailable={(date) => date.day === 25 && date.month === 12}
  max={{ year: 2026, month: 12, day: 31 }}
  min={{ year: 2026, month: 1, day: 1 }}
/>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only stays focusable and copyable and never looks disabled; disabled answers no key and no pointer; invalid keeps its focus ring and retargets its color. Tab through the row to see each one answer.',
    snippet: defineSnippet({
      id: 'date-field-react-states',
      label: 'The four states',
      language: 'tsx',
      source: `<>
  <DateField readOnly />
  <DateField invalid />
  <DateField disabled />
  <DateField required />
</>;`,
    }),
  },
  {
    id: 'clear',
    title: 'Clearing',
    note: 'The button appears only once a segment holds something, and pressing it empties every field, emits the clear reason and puts focus back on the first segment rather than leaving it nowhere.',
    snippet: defineSnippet({
      id: 'date-field-react-clear',
      label: 'Clearing',
      language: 'tsx',
      source: `<DateField clearable messages={{ clear: 'Limpar a data' }} />;`,
    }),
  },
  {
    id: 'adornments',
    title: 'Adornments',
    note: 'The two slots take an icon, a mark or a word, and both are named for the reading direction rather than for a side, so the same markup reads correctly in a right-to-left document.',
    snippet: defineSnippet({
      id: 'date-field-react-adornments',
      label: 'Both slots',
      language: 'tsx',
      source: `<DateField
  end="UTC-3"
  start={
    <Icon>
      <CalendarDays />
    </Icon>
  }
/>;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'The hidden input carries the value as an ISO string under the name prop, so a plain form post sends 2026-09-09 with no JavaScript reading the control. Submit the form to see what it sends.',
    snippet: defineSnippet({
      id: 'date-field-react-forms',
      label: 'A plain form post',
      language: 'tsx',
      source: `<form action="/invoices" method="post">
  <Field>
    <FieldLabel>Due date</FieldLabel>
    <DateField name="due-date" required />
  </Field>
  <Button type="submit">Save</Button>
</form>;`,
    }),
  },
  {
    id: 'content',
    title: 'A date being typed',
    note: 'A day and a month with no year is not a date, so the value is null and the hidden input is empty — and that is not the same as an empty field. The request carries the segments, which is what a draft is saved from.',
    snippet: defineSnippet({
      id: 'date-field-react-content',
      label: 'A half-typed date',
      language: 'tsx',
      source: `<DateField
  onValueChange={(value, request) => {
    if (value === null) saveDraft(request.segments);
    else commit(value);
  }}
/>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'A provider sets the zone and the pivot once for the whole application, SlottedProvider the language; render substitutes the frame’s element; and the ref hands back focus() and clear() — the two actions no prop can express.',
    snippet: defineSnippet({
      id: 'date-field-react-composition',
      label: 'Provider, render and ref',
      language: 'tsx',
      source: `<DateFieldDefaultsProvider timeZone="America/Sao_Paulo">
  <DateField ref={handle} render={(props) => <section {...props} />} />
</DateFieldDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Every key the spin-button pattern lists, on the field that has focus. Note two behaviors nothing else here has: a step wraps inside its own field, and a day a short month could not hold comes back when a longer one can.',
    snippet: defineSnippet({
      id: 'date-field-react-keyboard',
      label: 'The keys',
      language: 'tsx',
      source: `// ArrowUp / ArrowDown  step one, wrapping inside the field
// PageUp / PageDown    five for a day or a month, ten for a year
// Home / End           the field's lowest and highest value
// ArrowLeft / Right    the previous and next field, in writing order
// 0-9                  fills the field and moves on when it is full
// Backspace / Delete   empties one field back to its placeholder`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDate | null',
    '—',
    'DateField',
    "The date the control shows. Present means the consumer owns it: the control asks and waits rather than moving it. PlainDate is exported by @slotted/core/date. parseISODate(text) returns a PlainDate or null, and toISODate(date) returns 'YYYY-MM-DD': value={parseISODate(iso)} onValueChange={(v) => setIso(v === null ? '' : toISODate(v))}.",
  ],
  [
    'defaultValue',
    'PlainDate | null',
    '—',
    'DateField',
    'The date the control starts from when nobody else writes one. Read once; a later change to it is not new state.',
  ],
  [
    'granularity',
    "'day' | 'month'",
    'day',
    'DateField',
    'What the control holds. month shows the month and the year segments in the locale’s order, takes the first day of the month as its value, and submits YYYY-MM through name.',
  ],
  [
    'min',
    'PlainDate',
    '—',
    'DateField',
    'The earliest date the control accepts. Reported through each segment’s aria-valuemin, and a value below it makes the control invalid.',
  ],
  [
    'max',
    'PlainDate',
    '—',
    'DateField',
    'The latest date the control accepts, on the same terms as min.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'DateField',
    'Refuses particular dates — a weekend, a holiday, a day already booked. A refused date makes the control invalid.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'DateField',
    'BCP 47. Decides the field order, the separators, the placeholder and the language a month is announced in.',
  ],
  [
    'timeZone',
    'string',
    'the runtime’s',
    'DateField',
    'Which zone answers "what is today", and nothing else. The value itself has no zone.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'DateField',
    '0 is Sunday. Unused by the field itself; it is here so one provider configures the field and the calendar beside it.',
  ],
  [
    'yearPivot',
    'number',
    '20',
    'DateField',
    'How far ahead a two-digit year may land before it is read as last century. 0 sends every future year into the past, which is what a birth date wants.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'DateField',
    'The calendar system the value is written in. One value today, and an axis rather than a silence so a second one is not a contract break.',
  ],
  ['size', "'sm' | 'md' | 'lg'", 'md', 'DateField', 'The type step, matching the field around it.'],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'DateField',
    'How much frame the control shows at rest.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'DateField',
    'Unstated rather than false, so the control defers to the field. Takes every segment out of the tab sequence.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'DateField',
    'Readable, copyable and focusable, and not changeable. Arrow keys still walk between fields; nothing steps.',
  ],
  ['invalid', 'boolean', '—', 'DateField', 'Unstated rather than false. Retargets the focus ring.'],
  [
    'required',
    'boolean',
    '—',
    'DateField',
    'Unstated rather than false. Reaches the group as aria-required.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'DateField',
    'Draws a button that empties the value and returns focus to the first segment.',
  ],
  [
    'messages',
    'Partial<DateFieldMessages>',
    '—',
    'DateField',
    'Words laid over the language in force, key by key: the clear button’s accessible name (clear).',
  ],
  [
    'name',
    'string',
    '—',
    'DateField',
    'The name the hidden input carries the ISO string under, for a plain form post.',
  ],
  [
    'start',
    'ReactNode',
    '—',
    'DateField',
    'An adornment before the date in the reading direction.',
  ],
  ['end', 'ReactNode', '—', 'DateField', 'An adornment after the date in the reading direction.'],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: PlainDate | null, request: DateFieldChangeRequest)',
    when: 'Before the value moves, and cancellable. The request carries the new value, the value it replaces, the segments, the reason and the originating event. It arrives when a run of typed digits ends — on the digit that fills a field, on the key that leaves it, or on blur — never on every keystroke inside one, because typing 2026 into a year passes through 2, 20 and 202 on the way.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'DateFieldDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets timeZone, firstDayOfWeek, yearPivot, calendar, size and variant once for everything under it. A control that states any of them itself still wins.',
  ],
  [
    'render',
    '(props: DateFieldRootProps) => ReactNode',
    '—',
    'DateField',
    'Substitutes the element the frame renders. The props carry the ref: a substituted frame has to hand its element back, because focus() reaches the segments through it.',
  ],
  [
    'ref',
    'Ref<DateFieldHandle>',
    '—',
    'DateField',
    'focus() puts the reader on the first segment, clear() empties the value with the clear reason, and activeField says which segment holds focus.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'DateField',
    'Runs before the family acts, and calling preventDefault stops it acting at all. The family composes with the consumer’s handler rather than replacing it.',
  ],
  [
    'onPaste',
    'ClipboardEventHandler',
    '—',
    'DateField',
    'Runs before the family parses. Left alone, a pasted date is read in the locale’s shape first and ISO 8601 second.',
  ],
]);

const accessibility: string[] = [
  'The three fields are a role="group" whose accessible name is the whole date in words, which is what the APG’s spin-button example names as the thing that lets a screen-reader user perceive a date without visiting all three buttons and remembering each.',
  'Each field is a role="spinbutton" carrying aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext — and the month’s valuetext is its name, because "nine" is not September in any language a reader is thinking in.',
  'Exactly one field is in the tab sequence at a time; the arrows walk between them and mirror in a right-to-left document, because the keys are physical and the order they walk is the writing order.',
  'The APG’s own example is marked deprecated for its visible arrow buttons, which duplicate keys the reader already has. This family draws none, and takes the roles, the wrapping rules and the aria-valuetext guidance whole.',
  'A step wraps inside its own field and never carries: December steps up to January without moving the year, which is the example’s stated rule and the difference between one arrow press changing one field and changing two.',
];

export const REACT_DATE_FIELD_DOCS = {
  dateField: {
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
