import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import dateTimeFieldTokens from '@slotted/styles/datetime-field/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DATE_TIME_FIELD_TOKENS = dateTimeFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned DateTime Field decision',
}));

const imports: ReferenceImport = {
  source: "import { DateTimeField, DateTimeFieldDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame. Carries data-ui="datetime-field", the axes, data-cycle, data-granularity, data-incomplete and the state attributes. It has no role of its own: the group inside is what a screen reader meets. className, style and every native attribute reach this element.',
  },
  {
    part: 'segments',
    element: 'div',
    required: true,
    purpose:
      'role="group", whose accessible name is the whole datetime in words. One group for both halves — not a date group beside a time group — because the reader is writing one value, and two groups would make "the reader is typing" two questions with two answers.',
  },
  {
    part: 'half',
    element: 'span',
    required: true,
    purpose:
      'One half of the value, carrying data-half="date" or "time". It is one box so a date and a clock time each read left to right in every document, and so the row — one line, clipped at the frame — is cut between the halves or inside the time and never inside a segment.',
  },
  {
    part: 'segment',
    element: 'div',
    required: true,
    purpose:
      'One field of the value, as role="spinbutton" with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext. There is one per field the locale writes, in the locale’s own order, and exactly one is in the tab sequence. data-field says which of the seven it holds, data-half says which side of the value it is on, and data-placeholder says it holds nothing yet.',
  },
  {
    part: 'literal',
    element: 'span',
    required: true,
    purpose:
      'The separator the locale writes — a slash between date fields, a colon between time fields, the comma between the two halves. It is aria-hidden: the group already carries the value in words, and a screen reader reading "slash" between two numbers is reading punctuation aloud. The one between the halves carries data-boundary.',
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
      'What the expression resolves to, drawn before anything commits. role="status" with aria-live="polite", so a reader who cannot see it hears the resolved value as well. data-rolls-day says the duration landed on a different day.',
  },
  {
    part: 'preview-date',
    element: 'span',
    required: false,
    purpose:
      'The date half of the preview, drawn when the expression moved the day. It is lifted out of the time beside it so the eye lands on the part that moved — where time-field has to raise a warning instead, because a PlainTime has no day to put the crossing in.',
  },
  {
    part: 'value-text',
    element: 'span',
    required: true,
    purpose:
      'The whole datetime in words, hidden from sight and referenced by the group’s own aria-labelledby. It is what makes the group’s accessible name the value rather than a label alone.',
  },
  {
    part: 'start',
    element: 'span',
    required: false,
    purpose:
      'The consumer’s own slot before the value in the reading direction: a calendar mark, a zone name, a label. Any icon inside it is sized from the control’s glyph scale.',
  },
  {
    part: 'end',
    element: 'span',
    required: false,
    purpose:
      'The consumer’s own slot after the value. It is where datetime-picker puts its trigger, which is how the picker composes this family without redrawing any of it.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Empties both halves at once and returns focus to the first segment, with the clear reason on the request. Half a value is not a value this family holds, so there is no control that clears one side.',
  },
  {
    part: 'hidden-input',
    element: 'input',
    required: true,
    purpose:
      'type="hidden", carrying the value as YYYY-MM-DDTHH:mm:ss under the name prop — which is input[type=datetime-local]’s own value format. It is what makes the control work in a plain form post without JavaScript reading it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Type into it: the run walks the whole row and crosses from the year into the hour without a key that moves focus, and pressing + turns it into a duration from now.',
    snippet: defineSnippet({
      id: 'datetime-field-react-playground',
      label: 'Usage',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Appointment start</FieldLabel>
  <DateTimeField clearable locale="pt-BR" name="start" />
  <FieldDescription>The appointment starts at this date and time.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'locale',
    title: 'One pattern, both halves',
    note: 'The same component in four locales. Not a date format beside a time format: one Intl.DateTimeFormat over both halves, which is the only way to learn the order of the two, the literal between them, and where the day period lands. pt-BR and en-US write a comma there; fr-FR and ja-JP write a bare space and nothing is drawn.',
    snippet: defineSnippet({
      id: 'datetime-field-react-locale',
      label: 'Four locales',
      language: 'tsx',
      source: `<>
  <DateTimeField locale="pt-BR" />
  <DateTimeField locale="en-US" />
  <DateTimeField locale="ja-JP" />
  <DateTimeField locale="fr-FR" />
</>;`,
    }),
  },
  {
    id: 'hour-cycle',
    title: 'Four hour cycles, not a boolean',
    note: 'Intl resolves h11, h12, h23 and h24, and a boolean can say two of them. Ask for 12 in ja-JP and the hour runs from zero with 午前 written before it, because that is what the locale does. The public axis stays 12 | 24, because that is the question a consumer asks.',
    snippet: defineSnippet({
      id: 'datetime-field-react-hour-cycle',
      label: 'The axis, and what the locale does with it',
      language: 'tsx',
      source: `<>
  <DateTimeField hourCycle={12} locale="en-US" />
  <DateTimeField hourCycle={12} locale="ja-JP" />
  <DateTimeField hourCycle={24} locale="en-US" />
</>;`,
    }),
  },
  {
    id: 'granularity',
    title: 'Granularity governs the time half',
    note: 'How much of the time is drawn, and how much of it is typed. The date half is always whole: a datetime without a day is a date, and date-field is that family. Seconds exist only when the value has them.',
    snippet: defineSnippet({
      id: 'datetime-field-react-granularity',
      label: 'Three depths',
      language: 'tsx',
      source: `<>
  <DateTimeField granularity="hour" locale="pt-BR" />
  <DateTimeField granularity="minute" locale="pt-BR" />
  <DateTimeField granularity="second" locale="pt-BR" />
</>;`,
    }),
  },
  {
    id: 'incomplete',
    title: 'The half that is missing',
    note: 'A reader who wrote a day and walked away is not an empty control. value is null — which every surveyed implementation reports — and which half is missing is what none of them can say: it is on the root as data-incomplete, on the request as incomplete, and in Angular as a dateTimeIncomplete validation error. The frame warns only once focus has left, because while a segment still holds it the reader is mid-entry.',
    snippet: defineSnippet({
      id: 'datetime-field-react-incomplete',
      label: 'Saving a draft that is not whole',
      language: 'tsx',
      source: `<DateTimeField
  locale="pt-BR"
  onValueChange={(value, request) => {
    if (value === null) saveDraft(request.segments, request.incomplete);
    else commit(value);
  }}
/>;`,
    }),
  },
  {
    id: 'relative',
    title: 'A datetime written as a duration',
    note: 'Press +, - or = on any segment and the field takes an expression instead: +40m, 1h30, +2d, +1w, -15, 0. The anchor is always now, never the value the field holds, and what it resolves to is drawn beside it before Enter commits anything. Escape puts the segments back untouched. No surveyed implementation parses a duration at all.',
    snippet: defineSnippet({
      id: 'datetime-field-react-relative',
      label: 'The expression',
      language: 'tsx',
      source: `<DateTimeField
  locale="pt-BR"
  referenceDateTime={{
    date: { year: 2026, month: 9, day: 10 },
    time: { hour: 14, minute: 40, second: 0 },
  }}
/>;`,
    }),
  },
  {
    id: 'rolls-day',
    title: 'A duration that moves the day',
    note: 'This is where time-field’s crossesMidnight flag is spent. There, +90m at 23:00 can only raise a flag, because a PlainTime has no day beside it; here the day exists, so +2d simply moves it and the preview writes the new date out and lifts it from the time beside it. The request carries no crossing at all, because the crossing is already the value.',
    snippet: defineSnippet({
      id: 'datetime-field-react-rolls-day',
      label: 'Two days from now',
      language: 'tsx',
      source: `<DateTimeField
  locale="pt-BR"
  referenceDateTime={{
    date: { year: 2026, month: 9, day: 30 },
    time: { hour: 23, minute: 0, second: 0 },
  }}
/>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps a field can be, each in a row of its own so the height and the type move together. A control inside a field takes the field’s step, so a form cannot end up with a small field holding a medium control on one row.',
    snippet: defineSnippet({
      id: 'datetime-field-react-sizes',
      label: 'The three steps',
      language: 'tsx',
      source: `<>
  <DateTimeField size="sm" />
  <DateTimeField size="md" />
  <DateTimeField size="lg" />
</>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows. outline takes the ground it is on, subtle sinks into the page, and plain shows nothing until it is used — which is what a dense table of appointments needs, where a frame on every row would be a grid of boxes.',
    snippet: defineSnippet({
      id: 'datetime-field-react-variants',
      label: 'The three frames',
      language: 'tsx',
      source: `<>
  <DateTimeField variant="outline" />
  <DateTimeField variant="subtle" />
  <DateTimeField variant="plain" />
</>;`,
    }),
  },
  {
    id: 'range',
    title: 'Two pairs of bounds, at the same time',
    note: 'min and max fence the whole value; minTime and maxTime fence every day inside the range. Both apply — which MUI’s own validation page records that it cannot do: "you cannot use maxDateTime and maxTime together". A booking flow says both: no earlier than tomorrow at 09:00, and never outside 09:00 to 18:00 on any day.',
    snippet: defineSnippet({
      id: 'datetime-field-react-range',
      label: 'A booking window',
      language: 'tsx',
      source: `<DateTimeField
  max={{ date: { year: 2026, month: 12, day: 20 }, time: { hour: 12, minute: 0, second: 0 } }}
  maxTime={{ hour: 18, minute: 0, second: 0 }}
  min={{ date: { year: 2026, month: 9, day: 11 }, time: { hour: 14, minute: 0, second: 0 } }}
  minTime={{ hour: 9, minute: 0, second: 0 }}
/>;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Two predicates, because a grid asks a different question',
    note: 'isDateUnavailable answers a whole day — a holiday, a closed clinic — and isTimeUnavailable answers one time on one day, taking the date so a Saturday can close earlier. A day-level answer cannot be derived from a datetime-level predicate without probing every step of that day, and a calendar needs one answer per cell.',
    snippet: defineSnippet({
      id: 'datetime-field-react-unavailable',
      label: 'A closed Sunday and a lunch break',
      language: 'tsx',
      source: `<DateTimeField
  isDateUnavailable={(date) => dayOfWeek(date) === 0}
  isTimeUnavailable={(time, date) => date.day !== 24 && time.hour === 12}
  locale="pt-BR"
/>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'Seven fields in a narrow column',
    note: 'The row is one line at every width and is clipped at the frame, the way a text input clips a value longer than itself: a control two lines tall broke every row it stood in. Nothing is removed — the value is whole in the field and in what a screen reader hears — and the half the reader steps into is scrolled into view.',
    snippet: defineSnippet({
      id: 'datetime-field-react-narrow',
      label: 'A 200-pixel column',
      language: 'tsx',
      source: `<DateTimeField granularity="second" locale="pt-BR" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only stays focusable and copyable and never looks disabled; disabled answers no key and no pointer; invalid keeps its focus ring and retargets its colour; and incomplete is its own quieter state, one tone short of the refused value. Tab through the row to see each one answer.',
    snippet: defineSnippet({
      id: 'datetime-field-react-states',
      label: 'The five states',
      language: 'tsx',
      source: `<>
  <DateTimeField readOnly />
  <DateTimeField disabled />
  <DateTimeField required />
  <DateTimeField invalid />
</>;`,
    }),
  },
  {
    id: 'clear',
    title: 'Clearing both halves',
    note: 'One button, and it empties the whole value — there is no control that clears one side, because half a value is not a value this family holds. It appears only when something is written and the control is editable, and focus goes back to the first segment so the reader can start again without reaching for the mouse.',
    snippet: defineSnippet({
      id: 'datetime-field-react-clear',
      label: 'The clear control',
      language: 'tsx',
      source: `<DateTimeField clearable locale="pt-BR" messages={{ clear: 'Limpar' }} />;`,
    }),
  },
  {
    id: 'adornments',
    title: 'Adornments',
    note: 'The two slots are named for the reading direction rather than for a side, so the same markup puts the mark before the value in both directions. The end slot is where datetime-picker puts its trigger — which is how the picker composes this family without redrawing any of it.',
    snippet: defineSnippet({
      id: 'datetime-field-react-adornments',
      label: 'A mark and a zone',
      language: 'tsx',
      source: `<DateTimeField
  end={<span>UTC−3</span>}
  locale="pt-BR"
  start={
    <Icon>
      <CalendarClock aria-hidden />
    </Icon>
  }
/>;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'The value reaches a plain form post as YYYY-MM-DDTHH:mm:ss, which is input[type=datetime-local]’s own value format — no adapter, no serializer, nothing reading the control. The field around it supplies the label, the description and the error, and the control takes its size, its disabled state and its validity from that field unless it states its own.',
    snippet: defineSnippet({
      id: 'datetime-field-react-forms',
      label: 'A real form row',
      language: 'tsx',
      source: `<form action="/agendamentos" method="post">
  <Field invalid>
    <FieldLabel>Appointment start</FieldLabel>
    <DateTimeField name="start" required />
    <FieldError>Choose a time within business hours.</FieldError>
  </Field>
</form>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A long day-period name, a right-to-left document, and a locale whose numbering system is not Latin. Each half is its own bidi run, so the digits read left to right inside a mirrored page — the alternative was a right-to-left capture reading 30:14, a time nobody wrote.',
    snippet: defineSnippet({
      id: 'datetime-field-react-content',
      label: 'Three hostile shapes',
      language: 'tsx',
      source: `<>
  <DateTimeField hourCycle={12} locale="es-MX" />
  <DateTimeField locale="ar-EG" />
  <DateTimeField granularity="second" locale="ja-JP" />
</>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The provider sets the clock and the zone once for the whole application, SlottedProvider the language; render substitutes the frame’s element and hands the ref back; and the handle reaches focus(), clear() and the segment the reader is on. A control that states any default itself still wins over the provider.',
    snippet: defineSnippet({
      id: 'datetime-field-react-composition',
      label: 'Defaults once, and a handle',
      language: 'tsx',
      source: `<DateTimeFieldDefaultsProvider hourCycle={24} timeZone="America/Sao_Paulo">
  <DateTimeField ref={handle} />
</DateTimeFieldDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Every key the spin-button pattern lists, and three it does not. The arrows across walk the whole row — from the year into the hour — which two nested fields could not do. A key the field acts on is stopped rather than only defaulted, because a div with role="spinbutton" is invisible to every "is the target editable" guard an application writes.',
    snippet: defineSnippet({
      id: 'datetime-field-react-keyboard',
      label: 'Composing with the consumer’s own handler',
      language: 'tsx',
      source: `<DateTimeField
  locale="pt-BR"
  onKeyDown={(event) => {
    if (event.key === 'Enter') submit();
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
    'DateTimeField',
    'Present means the consumer owns the value. The segments still commit on every keystroke; the value waits for the consumer’s answer.',
  ],
  [
    'defaultValue',
    'PlainDateTime | null',
    '—',
    'DateTimeField',
    'The value the control starts from when nobody else writes one. A later change to it does not silently become new state.',
  ],
  [
    'min',
    'PlainDateTime',
    '—',
    'DateTimeField',
    'The earliest whole value: where the range starts. Applies beside minTime rather than instead of it.',
  ],
  ['max', 'PlainDateTime', '—', 'DateTimeField', 'The latest whole value: where the range ends.'],
  [
    'minTime',
    'PlainTime',
    '—',
    'DateTimeField',
    'The earliest time of every day inside the range. On min’s own day the window starts at min’s time instead.',
  ],
  [
    'maxTime',
    'PlainTime',
    '—',
    'DateTimeField',
    'The latest time of every day inside the range. On max’s own day the window ends at max’s time instead.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'DateTimeField',
    'Refuses a whole day — a holiday, a closed shop, a booked room.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime, date: PlainDate) => boolean',
    '—',
    'DateTimeField',
    'Refuses one time on one day. It takes the date so a Saturday can close earlier than a Tuesday.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'DateTimeField',
    'BCP 47. Decides the order of both halves, the separators, the boundary literal and the placeholders.',
  ],
  [
    'timeZone',
    'string',
    'the runtime’s',
    'DateTimeField',
    'Which zone answers "what is the datetime now", and nothing else. The value itself is never zoned.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'the locale’s',
    'DateTimeField',
    'The question a consumer asks. Which variant of each — h11 or h12, h23 or h24 — is the locale’s own.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'DateTimeField',
    'How much of the time half is written. The date half is always whole.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'DateTimeField',
    'One value today. The axis exists so a second calendar can arrive without breaking the contract.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'DateTimeField',
    '0 is Sunday. It reaches the date arithmetic rather than anything this control draws.',
  ],
  [
    'yearPivot',
    'number',
    '20',
    'DateTimeField',
    'Two typed digits below this many years ahead are read as this century: 30 is 2030 and 80 is 1980 in 2026.',
  ],
  [
    'referenceDateTime',
    'PlainDateTime',
    'now',
    'DateTimeField',
    'What an empty segment steps from, and what a duration resolves against. Stating it is what makes a story and a test deterministic.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'DateTimeField',
    'The type step, matching the field around it. A field outranks this.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'DateTimeField',
    'How much frame the control shows.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'DateTimeField',
    'Unstated rather than false, so an unset value defers to the surrounding field.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'DateTimeField',
    'Focusable, readable and copyable, and never mistakable for disabled.',
  ],
  [
    'invalid',
    'boolean',
    '—',
    'DateTimeField',
    'Beside the validity the family owns: a value outside either pair of bounds, or refused by either predicate, is invalid whatever this says.',
  ],
  ['required', 'boolean', '—', 'DateTimeField', 'Reaches the group as aria-required.'],
  [
    'clearable',
    'boolean',
    'false',
    'DateTimeField',
    'Draws a button that empties both halves and returns focus to the first segment.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'DateTimeField',
    'Whether +, - and = open the duration expression. Every value it can write is reachable by typing and by the arrows.',
  ],
  [
    'messages',
    'Partial<DatetimeFieldMessages>',
    '—',
    'DateTimeField',
    'Words laid over the language in force, key by key: the clear button’s accessible name (clear) and the expression region’s (duration).',
  ],
  [
    'name',
    'string',
    '—',
    'DateTimeField',
    'The name a plain form post carries the YYYY-MM-DDTHH:mm:ss string under.',
  ],
  [
    'start',
    'ReactNode',
    '—',
    'DateTimeField',
    'An adornment before the value in the reading direction.',
  ],
  [
    'end',
    'ReactNode',
    '—',
    'DateTimeField',
    'An adornment after the value in the reading direction.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: PlainDateTime | null, request: DateTimeFieldChangeRequest)',
    when: 'Before the value moves, and cancellable. The request carries the new value, the value it replaces, the segments, which half is still missing, the reason and the originating event. It arrives when a run of typed digits ends — on the digit that fills a field, on the key that leaves it, or on blur — never on every keystroke inside one, because typing 23 into an hour passes through 2 on the way. A value that has not moved emits nothing, which is what docs/state-and-events.md states, so a run that leaves the value null says nothing here and says it on the root instead. There is no crossesMidnight: the day exists in this family, so a duration that crossed one is already in the value.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'DateTimeFieldDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets timeZone, hourCycle, granularity, calendar, firstDayOfWeek, yearPivot, relative, size and variant once for everything under it. A control that states any of them itself still wins.',
  ],
  [
    'render',
    '(props: DateTimeFieldRootProps) => ReactNode',
    '—',
    'DateTimeField',
    'Substitutes the element the frame renders. The props carry the ref: a substituted frame has to hand its element back, because focus() reaches the segments through it.',
  ],
  [
    'ref',
    'Ref<DateTimeFieldHandle>',
    '—',
    'DateTimeField',
    'focus() puts the reader on the first segment, clear() empties both halves with the clear reason, and activeField says which of the seven holds focus.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'DateTimeField',
    'Runs before the family acts, and calling preventDefault stops it acting at all. The family composes with the consumer’s handler rather than replacing it.',
  ],
  [
    'onPaste',
    'ClipboardEventHandler',
    '—',
    'DateTimeField',
    'Runs before the family parses. Left alone, a pasted value is read in the locale’s shape first, ISO 8601 second, and as a duration third — so pasting +2d does what typing it does.',
  ],
]);

const accessibility: string[] = [
  'The seven fields are one role="group" whose accessible name is the whole datetime in words, which is what the APG’s spin-button example names as the thing that lets a screen-reader user perceive a value without visiting every button and remembering each. Two nested groups — a date one and a time one — would make the reader hear two controls where there is one value.',
  'Each field is a role="spinbutton" carrying aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext. A month is announced by its own name rather than as a number, and the day period is why aria-valuetext is not optional at all: aria-valuenow there is 0 or 1, which is not a name in any language.',
  'Exactly one field is in the tab sequence at a time; the arrows walk between them across the boundary between the halves, and they mirror in a right-to-left document because the keys are physical and the order they walk is the writing order.',
  'The half that is missing is said in three places rather than implied by an empty value: data-incomplete on the root, incomplete on the request, and a dateTimeIncomplete validation error in a Reactive Form. A reader who wrote a day and left is not an empty control, and a form that says "required" there is answering a different question.',
  'The expression region is a real input with its own accessible name, and its preview is a polite live region: a reader is being asked to accept a value they did not write, so the resolved datetime has to be perceivable before Enter — including to a reader who cannot see it.',
];

export const REACT_DATE_TIME_FIELD_DOCS = {
  dateTimeField: {
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
