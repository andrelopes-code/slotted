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

export const ANGULAR_DATE_TIME_FIELD_TOKENS = dateTimeFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned DateTime Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlDateTimeField, SlDateTimeFieldStart, SlDateTimeFieldEnd } from '@slotted/angular/datetime-field';",
  selector: '[slDateTimeField]',
  exportAs: 'slDateTimeField',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element the directive is on',
    required: true,
    purpose:
      'The frame. Carries data-ui="datetime-field", the axes, data-cycle, data-granularity, data-incomplete and the state attributes. It has no role of its own: the group inside is what a screen reader meets. Every attribute and class a template writes stays on this element.',
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
    element: 'the consumer’s own element, marked slDateTimeFieldStart',
    required: false,
    purpose:
      'A slot before the value in the reading direction: a calendar mark, a zone name, a label. Any icon inside it is sized from the control’s glyph scale.',
  },
  {
    part: 'end',
    element: 'the consumer’s own element, marked slDateTimeFieldEnd',
    required: false,
    purpose:
      'A slot after the value. It is where datetime-picker puts its trigger, which is how the picker composes this family without redrawing any of it.',
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
      'type="hidden", carrying the value as YYYY-MM-DDTHH:mm:ss under the name input — which is input[type=datetime-local]’s own value format. It is what makes the control work in a plain form post without JavaScript reading it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Type into it: the run walks the whole row and crosses from the year into the hour without a key that moves focus, and pressing + turns it into a duration from now.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-playground',
      label: 'Usage',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Appointment start</label>
  <div slDateTimeField name="start" locale="pt-BR" [clearable]="true"></div>
  <span slFieldDescription>The appointment starts on this date and time.</span>
</div>`,
    }),
  },
  {
    id: 'locale',
    title: 'One pattern, both halves',
    note: 'The same directive in four locales. Not a date format beside a time format: one Intl.DateTimeFormat over both halves, which is the only way to learn the order of the two, the literal between them, and where the day period lands. pt-BR and en-US write a comma there; fr-FR and ja-JP write a bare space and nothing is drawn.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-locale',
      label: 'Four locales',
      language: 'angular',
      source: `<div slDateTimeField locale="pt-BR" [defaultValue]="consultation"></div>
<div slDateTimeField locale="en-US" [defaultValue]="consultation"></div>
<div slDateTimeField locale="ja-JP" [defaultValue]="consultation"></div>
<div slDateTimeField locale="fr-FR" [defaultValue]="consultation"></div>`,
    }),
  },
  {
    id: 'hour-cycle',
    title: 'Four hour cycles, not a boolean',
    note: 'Intl resolves h11, h12, h23 and h24, and a boolean can say two of them. Ask for 12 in ja-JP and the hour runs from zero with 午前 written before it, because that is what the locale does. The public axis stays 12 or 24, because that is the question a consumer asks.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-hour-cycle',
      label: 'The axis, and the four cycles under it',
      language: 'angular',
      source: `<div slDateTimeField locale="en-US" [hourCycle]="12" [defaultValue]="midnight"></div>
<div slDateTimeField locale="ja-JP" [hourCycle]="12" [defaultValue]="midnight"></div>
<div slDateTimeField locale="en-US" [hourCycle]="24" [defaultValue]="midnight"></div>`,
    }),
  },
  {
    id: 'granularity',
    title: 'Granularity governs the time half',
    note: 'How much of the time is drawn, and how much of it is typed. The date half is always whole: a datetime without a day is a date, and date-field is that family. Seconds exist only when the value has them.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-granularity',
      label: 'Three depths',
      language: 'angular',
      source: `<div slDateTimeField granularity="hour" [defaultValue]="consultation"></div>
<div slDateTimeField granularity="minute" [defaultValue]="consultation"></div>
<div slDateTimeField granularity="second" [defaultValue]="withSeconds"></div>`,
    }),
  },
  {
    id: 'incomplete',
    title: 'The half that is missing',
    note: 'A reader who wrote a day and walked away is not an empty control. The value is null — which every surveyed implementation reports — and which half is missing is what none of them can say: it is on the root as data-incomplete, on the request as incomplete, and in a reactive form as a slottedDateTimeIncomplete error carrying the missing half.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-incomplete',
      label: 'The error a form reads',
      language: 'angular',
      source: `<div slField [invalid]="control.touched && control.invalid">
  <label slFieldLabel>Start</label>
  <div slDateTimeField [formControl]="control" locale="pt-BR"></div>
  @if (control.errors?.['slottedDateTimeIncomplete']; as incomplete) {
    <span slFieldError>Falta escrever a {{ incomplete.missing }}.</span>
  }
</div>`,
    }),
  },
  {
    id: 'relative',
    title: 'A datetime written as a duration',
    note: 'Press +, - or = on any segment and the field takes an expression instead: +40m, 1h30, +2d, +1w, -15, 0. The anchor is always now, never the value the field holds, and what it resolves to is drawn beside it before Enter commits anything. Escape puts the segments back untouched. No surveyed implementation parses a duration at all.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-relative',
      label: 'Turning it off',
      language: 'angular',
      source: `<div slDateTimeField [relative]="false" [referenceDateTime]="reference"></div>`,
    }),
  },
  {
    id: 'rolls-day',
    title: 'A duration that moves the day',
    note: 'This is where time-field’s crossesMidnight flag is spent. There, +90m at 23:00 can only raise a flag, because a PlainTime has no day beside it; here the day exists, so +2d simply moves it and the preview writes the new date out and lifts it from the time beside it. The request carries no crossing at all, because the crossing is already the value.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-rolls-day',
      label: 'An anchor a story can state',
      language: 'angular',
      source: `<div slDateTimeField locale="pt-BR" [referenceDateTime]="lastNightOfTheMonth"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps a field can be, each in a row of its own so the height and the type move together. A control inside a field takes the field’s step, so a form cannot end up with a small field holding a medium control on one row.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-sizes',
      label: 'The three steps',
      language: 'angular',
      source: `<div slDateTimeField size="sm" [defaultValue]="consultation"></div>
<div slDateTimeField size="md" [defaultValue]="consultation"></div>
<div slDateTimeField size="lg" [defaultValue]="consultation"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows. outline takes the ground it is on, subtle sinks into the page, and plain shows nothing until it is used — which is what a dense table of appointments needs, where a frame on every row would be a grid of boxes.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-variants',
      label: 'The three frames',
      language: 'angular',
      source: `<div slDateTimeField variant="outline" [defaultValue]="consultation"></div>
<div slDateTimeField variant="subtle" [defaultValue]="consultation"></div>
<div slDateTimeField variant="plain" [defaultValue]="consultation"></div>`,
    }),
  },
  {
    id: 'range',
    title: 'Two pairs of bounds, at the same time',
    note: 'min and max fence the whole value; minTime and maxTime fence every day inside the range. Both apply — which MUI’s own validation page records that it cannot do: "you cannot use maxDateTime and maxTime together". A refused value reports slottedDateTimeRange or slottedDateTimeWindow, so a form can say which fence it hit.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-range',
      label: 'A booking window',
      language: 'angular',
      source: `<div
  slDateTimeField
  [min]="clinicOpens"
  [max]="clinicCloses"
  [minTime]="nine"
  [maxTime]="six"
></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Two predicates, because a grid asks a different question',
    note: 'isDateUnavailable answers a whole day — a holiday, a closed clinic — and isTimeUnavailable answers one time on one day, taking the date so a Saturday can close earlier. A day-level answer cannot be derived from a datetime-level predicate without probing every step of that day, and a calendar needs one answer per cell. Both report slottedDateTimeUnavailable.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-unavailable',
      label: 'A closed Sunday and a lunch hour',
      language: 'angular',
      source: `<div slDateTimeField [isDateUnavailable]="isSunday" [isTimeUnavailable]="isLunch"></div>`,
    }),
  },
  {
    id: 'narrow',
    title: 'Seven fields in a narrow column',
    note: 'The row is one line at every width and is clipped at the frame, the way a text input clips a value longer than itself: a control two lines tall broke every row it stood in. Nothing is removed — the value is whole in the field and in what a screen reader hears — and the half the reader steps into is scrolled into view.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-narrow',
      label: 'Below 320 pixels',
      language: 'angular',
      source: `<div slDateTimeField granularity="second" [defaultValue]="withSeconds"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only stays focusable and copyable and never looks disabled; disabled answers no key and no pointer, and a reactive form sets it through setDisabledState rather than through the input; invalid keeps its focus ring and retargets its colour; and incomplete is its own quieter state, one tone short of the refused value.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-states',
      label: 'The four states',
      language: 'angular',
      source: `<div slDateTimeField readOnly [defaultValue]="consultation"></div>
<div slDateTimeField disabled [defaultValue]="consultation"></div>
<div slDateTimeField required [defaultValue]="consultation"></div>
<div slDateTimeField invalid [defaultValue]="consultation"></div>`,
    }),
  },
  {
    id: 'clear',
    title: 'Clearing both halves',
    note: 'One button, and it empties the whole value — there is no control that clears one side, because half a value is not a value this family holds. It appears only when something is written and the control is editable, and focus goes back to the first segment so the reader can start again without reaching for the mouse.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-clear',
      label: 'The clear button',
      language: 'angular',
      source: `<div
  slDateTimeField
  [messages]="{ clear: 'Limpar' }"
  [clearable]="true"
  [defaultValue]="consultation"
></div>`,
    }),
  },
  {
    id: 'adornments',
    title: 'Adornments',
    note: 'The two directives are named for the reading direction rather than for a side, so the same template puts the mark before the value in both directions. The end slot is where datetime-picker puts its trigger — which is how the picker composes this family without redrawing any of it.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-adornments',
      label: 'A mark and a zone',
      language: 'angular',
      source: `<div slDateTimeField [defaultValue]="consultation">
  <span slDateTimeFieldStart slIcon>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#calendar-clock" /></svg>
  </span>
  <span slDateTimeFieldEnd>UTC−3</span>
</div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'The control belongs in a reactive form and in a template form, through ControlValueAccessor — the integration point React has no equivalent of. Beside it, the value still reaches a plain form post as YYYY-MM-DDTHH:mm:ss through the hidden input, which is input[type=datetime-local]’s own value format.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-forms',
      label: 'A reactive form row',
      language: 'angular',
      source: `<form [formGroup]="form">
  <div slField [invalid]="form.controls.start.touched && form.controls.start.invalid">
    <label slFieldLabel>Appointment start</label>
    <div slDateTimeField formControlName="start" locale="pt-BR"></div>
    <span slFieldError>Choose a time within business hours.</span>
  </div>
</form>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A long day-period name, a right-to-left document, and a locale whose numbering system is not Latin. Each half is its own bidi run, so the digits read left to right inside a mirrored page — the alternative was a right-to-left capture reading 30:14, a time nobody wrote.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-content',
      label: 'Three locales the layout has to hold',
      language: 'angular',
      source: `<div slDateTimeField locale="es-MX" [hourCycle]="12" [defaultValue]="consultation"></div>
<div slDateTimeField locale="ar-EG" [defaultValue]="consultation"></div>
<div slDateTimeField locale="ja-JP" granularity="second" [defaultValue]="withSeconds"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'provideDateTimeFieldDefaults sets the clock and the zone once for everything under it, provideSlotted the language; exportAs reaches focus(), focusEntry() and clear() from a template; and the two slot directives take the consumer’s own elements. A control that states any default itself still wins over the provider.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-composition',
      label: 'One decision, once',
      language: 'ts',
      source: `providers: [
  provideSlotted({ locale: 'pt-BR' }),
  provideDateTimeFieldDefaults({ hourCycle: 24, timeZone: 'America/Sao_Paulo' }),
];`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Every key the spin-button pattern lists, and three it does not. The arrows across walk the whole row — from the year into the hour — which two nested fields could not do. A key the field acts on is stopped rather than only defaulted, because a div with role="spinbutton" is invisible to every "is the target editable" guard an application writes.',
    snippet: defineSnippet({
      id: 'datetime-field-angular-keyboard',
      label: 'A listener that runs before the family',
      language: 'angular',
      source: `<div slDateTimeField (keydown)="note($event)" [defaultValue]="consultation"></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDateTime | null',
    '—',
    'SlDateTimeField',
    'Present means the consumer owns the value. The segments still commit on every run of typing; the value waits for the consumer’s answer.',
  ],
  [
    'defaultValue',
    'PlainDateTime | null',
    '—',
    'SlDateTimeField',
    'The value the control starts from when nobody else writes one. Read once, in ngOnInit.',
  ],
  [
    'min',
    'PlainDateTime',
    '—',
    'SlDateTimeField',
    'The earliest whole value: where the range starts. Reported as slottedDateTimeRange to a reactive form.',
  ],
  [
    'max',
    'PlainDateTime',
    '—',
    'SlDateTimeField',
    'The latest whole value: where the range ends. Reported as slottedDateTimeRange.',
  ],
  [
    'minTime',
    'PlainTime',
    '—',
    'SlDateTimeField',
    'The earliest time of every day inside the range. On min’s own day the window starts at min’s time instead. Reported as slottedDateTimeWindow.',
  ],
  [
    'maxTime',
    'PlainTime',
    '—',
    'SlDateTimeField',
    'The latest time of every day inside the range. On max’s own day the window ends at max’s time instead.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDateTimeField',
    'Refuses a whole day — a holiday, a closed shop, a booked room. Reported as slottedDateTimeUnavailable.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime, date: PlainDate) => boolean',
    '—',
    'SlDateTimeField',
    'Refuses one time on one day. It takes the date so a Saturday can close earlier than a Tuesday.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlDateTimeField',
    'BCP 47. Decides the order of both halves, the separators, the boundary literal and the placeholders.',
  ],
  [
    'timeZone',
    'string',
    'runtime',
    'SlDateTimeField',
    'Which zone answers "what is the datetime now", and nothing else. The value itself is never zoned.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'locale',
    'SlDateTimeField',
    'The question a consumer asks. Which variant of each — h11 or h12, h23 or h24 — is the locale’s own.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'SlDateTimeField',
    'How much of the time half is written. The date half is always whole.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'SlDateTimeField',
    'One value today. The axis exists so a second calendar can arrive without breaking the contract.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'locale',
    'SlDateTimeField',
    '0 is Sunday. It reaches the date arithmetic rather than anything this control draws.',
  ],
  [
    'yearPivot',
    'number',
    '20',
    'SlDateTimeField',
    'Two typed digits below this many years ahead are read as this century: 30 is 2030 and 80 is 1980 in 2026.',
  ],
  [
    'referenceDateTime',
    'PlainDateTime',
    'now',
    'SlDateTimeField',
    'What an empty segment steps from, and what a duration resolves against. Stating it is what makes a story and a spec deterministic.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlDateTimeField',
    'The type step, matching the field around it. A field outranks this.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDateTimeField',
    'How much frame the control shows.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'SlDateTimeField',
    'Unstated rather than false, so the control defers to the field — and to the form, which sets it through setDisabledState.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'SlDateTimeField',
    'Focusable, readable and copyable, and never mistakable for disabled.',
  ],
  [
    'invalid',
    'boolean',
    '—',
    'SlDateTimeField',
    'Beside the validity the family owns: a value outside either pair of bounds, or refused by either predicate, is invalid whatever this says.',
  ],
  [
    'required',
    'boolean',
    '—',
    'SlDateTimeField',
    'Reaches the group as aria-required; the form’s own Validators.required states the rule.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'SlDateTimeField',
    'Draws a button that empties both halves and returns focus to the first segment.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'SlDateTimeField',
    'Whether +, - and = open the duration expression. Every value it can write is reachable by typing and by the arrows.',
  ],
  [
    'messages',
    'Partial<DatetimeFieldMessages>',
    '—',
    'SlDateTimeField',
    'Words laid over the language in force, key by key: the clear button’s accessible name (clear) and the expression region’s (duration).',
  ],
  [
    'name',
    'string',
    '—',
    'SlDateTimeField',
    'The name the hidden input carries the YYYY-MM-DDTHH:mm:ss string under, for a plain form post.',
  ],
  [
    'slDateTimeFieldStart',
    'directive',
    '—',
    'SlDateTimeFieldStart',
    'An adornment before the value in the reading direction, on the consumer’s own element.',
  ],
  [
    'slDateTimeFieldEnd',
    'directive',
    '—',
    'SlDateTimeFieldEnd',
    'An adornment after the value in the reading direction, on the consumer’s own element.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'DateTimeFieldChangeRequest',
    when: 'Before the value moves, and cancellable. The request carries the new value, the value it replaces, the segments, the half that is still missing, the reason and the originating event. It arrives when a run of typed digits ends — never on every keystroke inside one, because typing 23 into an hour passes through 2 on the way. There is no two-way binding on value: one slot could carry none of that, and a form gets the same movement through ControlValueAccessor.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDateTimeFieldDefaults',
    'provider',
    '—',
    'application',
    'Sets timeZone, hourCycle, granularity, relative, size and variant once for everything under it. A control that states any of them itself still wins.',
  ],
  [
    'ControlValueAccessor',
    'interface',
    '—',
    'SlDateTimeField',
    'The control belongs in a reactive form and in a template form. It is the integration point React has no equivalent of, and the asymmetry is recorded rather than levelled away.',
  ],
  [
    'Validator',
    'interface',
    '—',
    'SlDateTimeField',
    'slottedDateTimeIncomplete, slottedDateTimeRange, slottedDateTimeWindow and slottedDateTimeUnavailable are validity this control owns and no other validator can see. The first of them names the missing half, which is what Kendo’s own dateTimeIncomplete cannot say.',
  ],
  [
    'exportAs',
    'slDateTimeField',
    '—',
    'SlDateTimeField',
    'A template reaches the instance for focus(), focusEntry() and clear(), and reads the derived dateTime() and incomplete() signals.',
  ],
  [
    '(keydown)',
    'EventListener',
    '—',
    'SlDateTimeField',
    'The family handles the keys on the host, so a consumer’s own listener on the same element runs first — which is the composition React gets by calling the consumer’s handler before acting.',
  ],
]);

const accessibility: string[] = [
  'The seven fields are one role="group" whose accessible name is the whole datetime in words. The APG’s spin-button example names the group as what lets a screen-reader user perceive a value without visiting every button and remembering each — and one group rather than two is why a reader hears one datetime instead of a date and then a time.',
  'Each field is a role="spinbutton" carrying aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext — and the day period is why aria-valuetext is not optional: aria-valuenow there is 0 or 1, which is not a name in any language.',
  'Exactly one field is in the tab sequence at a time; the arrows walk the whole row across the boundary between the halves, and mirror in a right-to-left document, because the keys are physical and the order they walk is the writing order.',
  'The half the reader has not written is announced rather than silently dropped: the group’s own words say it, the root carries data-incomplete, and a reactive form receives slottedDateTimeIncomplete with the missing half in it.',
  'The expression region is a real input with its own accessible name, and its preview is a polite live region: a reader is being asked to accept a value they did not write, so the resolved datetime has to be perceivable before Enter — including to a reader who cannot see it.',
];

export const ANGULAR_DATE_TIME_FIELD_DOCS = {
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
