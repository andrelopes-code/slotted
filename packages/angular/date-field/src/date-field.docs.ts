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

export const ANGULAR_DATE_FIELD_TOKENS = dateFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Date Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlDateField, SlDateFieldStart, SlDateFieldEnd } from '@slotted/angular/date-field';",
  selector: '[slDateField]',
  exportAs: 'slDateField',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, the consumer’s own element',
    required: true,
    purpose:
      'The frame. Carries data-ui="date-field", the axes, and data-disabled, data-invalid, data-readonly and data-required. It has no role of its own: the group inside is what a screen reader meets. The consumer writes this element, so its classes, its attributes and its own directives are its own.',
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
      'type="hidden", carrying the value as an ISO 8601 YYYY-MM-DD string under the name input. It is what makes the control work in a plain form post without JavaScript reading it — the decision currency-field already took for a number.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every input on it, driven by the controls below the canvas. Type into it: each field takes digits, the arrows step it, and the clear button appears only once there is something to clear.',
    snippet: defineSnippet({
      id: 'date-field-angular-playground',
      label: 'Usage',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Due date</label>
  <div slDateField clearable locale="pt-BR" name="due-date"></div>
  <span slFieldDescription>The invoice is due on this date.</span>
</div>`,
    }),
  },
  {
    id: 'locale',
    title: 'The locale writes the date',
    note: 'The same directive in four locales. The field order, the separators and the placeholder all come from Intl — nobody writes a format string, and a Japanese reader gets the year first.',
    snippet: defineSnippet({
      id: 'date-field-angular-locale',
      label: 'Four locales',
      language: 'angular',
      source: `<div slDateField locale="pt-BR"></div>
<div slDateField locale="en-US"></div>
<div slDateField locale="de-DE"></div>
<div slDateField locale="ja-JP"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps a field can be. A control inside a field takes the field’s step, so a form cannot end up with a small field holding a medium control on one row.',
    snippet: defineSnippet({
      id: 'date-field-angular-sizes',
      label: 'The three steps',
      language: 'angular',
      source: `<div slDateField size="sm"></div>
<div slDateField size="md"></div>
<div slDateField size="lg"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows. outline takes the ground it is on, subtle sinks into the page, and plain shows nothing until it is used — which is what a dense table needs.',
    snippet: defineSnippet({
      id: 'date-field-angular-variants',
      label: 'The three frames',
      language: 'angular',
      source: `<div slDateField variant="outline"></div>
<div slDateField variant="subtle"></div>
<div slDateField variant="plain"></div>`,
    }),
  },
  {
    id: 'range',
    title: 'Bounds and unavailable dates',
    note: 'min and max fence the value, and isDateUnavailable refuses particular days. Both are also form validity rules, so a reactive form reports them without a validator of its own.',
    snippet: defineSnippet({
      id: 'date-field-angular-range',
      label: 'Bounds and a predicate',
      language: 'angular',
      source: `<div
  slDateField
  [min]="{ year: 2026, month: 1, day: 1 }"
  [max]="{ year: 2026, month: 12, day: 31 }"
  [isDateUnavailable]="isHoliday"
></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only stays focusable and copyable and never looks disabled; disabled answers no key and no pointer; invalid keeps its focus ring and retargets its colour. Tab through the row to see each one answer.',
    snippet: defineSnippet({
      id: 'date-field-angular-states',
      label: 'The four states',
      language: 'angular',
      source: `<div slDateField readOnly></div>
<div slDateField invalid></div>
<div slDateField disabled></div>
<div slDateField required></div>`,
    }),
  },
  {
    id: 'clear',
    title: 'Clearing',
    note: 'The button appears only once a segment holds something, and pressing it empties every field, emits the clear reason and puts focus back on the first segment rather than leaving it nowhere.',
    snippet: defineSnippet({
      id: 'date-field-angular-clear',
      label: 'Clearing',
      language: 'angular',
      source: `<div slDateField clearable [messages]="{ clear: 'Limpar a data' }"></div>`,
    }),
  },
  {
    id: 'adornments',
    title: 'Adornments',
    note: 'The two slots are directives on the consumer’s own element, so an icon, a kbd or a span all work and none of them loses its own semantics.',
    snippet: defineSnippet({
      id: 'date-field-angular-adornments',
      label: 'Both slots',
      language: 'angular',
      source: `<div slDateField>
  <sl-icon slDateFieldStart name="calendar" />
  <span slDateFieldEnd>UTC-3</span>
</div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'Reactive Forms drives it through ControlValueAccessor, and min, max and isDateUnavailable report as form errors through Validator — the two integration points React has no equivalent of.',
    snippet: defineSnippet({
      id: 'date-field-angular-forms',
      label: 'A reactive form',
      language: 'angular',
      source: `<form [formGroup]="form">
  <div slField>
    <label slFieldLabel>Vencimento</label>
    <div slDateField formControlName="vencimento" [min]="today"></div>
    <span slFieldError>Escolha uma data futura.</span>
  </div>
</form>`,
    }),
  },
  {
    id: 'content',
    title: 'A date halfway through',
    note: 'A day and a month with no year is not a date, so the value is null and the hidden input is empty — and that is not the same as an empty field. The request carries the segments, which is what a draft is saved from.',
    snippet: defineSnippet({
      id: 'date-field-angular-content',
      label: 'A half-typed date',
      language: 'angular',
      source: `<div slDateField (valueChange)="onRequest($event)"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'provideDateFieldDefaults sets the zone and the pivot once, provideSlotted the language; exportAs hands a template the instance; and focus() and clear() are the two actions no input can express.',
    snippet: defineSnippet({
      id: 'date-field-angular-composition',
      label: 'Provider and exportAs',
      language: 'angular',
      source: `<div slDateField #data="slDateField" locale="pt-BR"></div>
<button type="button" (click)="data.clear()">Limpar</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Every key the spin-button pattern lists, on the field that has focus. Note two behaviours nothing else here has: a step wraps inside its own field, and a day a short month could not hold comes back when a longer one can.',
    snippet: defineSnippet({
      id: 'date-field-angular-keyboard',
      label: 'The keys',
      language: 'angular',
      source: `<!-- ArrowUp / ArrowDown  step one, wrapping inside the field -->
<!-- PageUp / PageDown    five for a day or a month, ten for a year -->
<!-- Home / End           the field's lowest and highest value -->
<!-- ArrowLeft / Right    the previous and next field, in writing order -->
<!-- 0-9                  fills the field and moves on when it is full -->
<!-- Backspace / Delete   empties one field back to its placeholder -->
<div slDateField></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDate | null',
    '—',
    'SlDateField',
    "The date the control shows. Present means the consumer owns it: the control asks and waits rather than moving it. PlainDate is exported by @slotted/core/date. parseISODate(text) returns a PlainDate or null, and toISODate(date) returns 'YYYY-MM-DD'.",
  ],
  [
    'defaultValue',
    'PlainDate | null',
    '—',
    'SlDateField',
    'The date the control starts from when nobody else writes one. Read once, in ngOnInit, because Angular binds inputs after it constructs a component.',
  ],
  [
    'granularity',
    "'day' | 'month'",
    'day',
    'SlDateField',
    'What the control holds. month shows the month and the year segments in the locale’s order, takes the first day of the month as its value, and submits YYYY-MM through name.',
  ],
  [
    'min',
    'PlainDate',
    '—',
    'SlDateField',
    'The earliest date the control accepts. Reported through each segment’s aria-valuemin, and as the slottedDateRange form error.',
  ],
  [
    'max',
    'PlainDate',
    '—',
    'SlDateField',
    'The latest date the control accepts, on the same terms as min.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDateField',
    'Refuses particular dates — a weekend, a holiday, a day already booked. Reported as the slottedDateUnavailable form error.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlDateField',
    'BCP 47. Decides the field order, the separators, the placeholder and the language a month is announced in.',
  ],
  [
    'timeZone',
    'string',
    'the runtime’s',
    'SlDateField',
    'Which zone answers "what is today", and nothing else. The value itself has no zone.',
  ],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'SlDateField',
    '0 is Sunday. Unused by the field itself; it is here so one provider configures the field and the calendar beside it.',
  ],
  [
    'yearPivot',
    'number',
    '20',
    'SlDateField',
    'How far ahead a two-digit year may land before it is read as last century. 0 sends every future year into the past, which is what a birth date wants.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'SlDateField',
    'The calendar system the value is written in. One value today, and an axis rather than a silence so a second one is not a contract break.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlDateField',
    'The type step, matching the field around it.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDateField',
    'How much frame the control shows at rest.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'SlDateField',
    'Unstated rather than false, so the control defers to the field. A form that disables the control from its model reaches the same state.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'SlDateField',
    'Readable, copyable and focusable, and not changeable. Arrow keys still walk between fields; nothing steps.',
  ],
  [
    'invalid',
    'boolean',
    '—',
    'SlDateField',
    'Unstated rather than false. Retargets the focus ring.',
  ],
  [
    'required',
    'boolean',
    '—',
    'SlDateField',
    'Unstated rather than false. Reaches the group as aria-required.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'SlDateField',
    'Draws a button that empties the value and returns focus to the first segment.',
  ],
  [
    'messages',
    'Partial<DateFieldMessages>',
    '—',
    'SlDateField',
    'Words laid over the language in force, key by key: the clear button’s accessible name (clear).',
  ],
  [
    'name',
    'string',
    '—',
    'SlDateField',
    'The name the hidden input carries the ISO string under, for a plain form post.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'DateFieldChangeRequest',
    when: 'Before the value moves, and cancellable. The request carries the new value, the value it replaces, the segments, the reason and the originating event. It arrives when a run of typed digits ends — on the digit that fills a field, on the key that leaves it, or on blur — never on every keystroke inside one, because typing 2026 into a year passes through 2, 20 and 202 on the way. There is no two-way [(value)]: one slot could carry none of that.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDateFieldDefaults',
    'Provider',
    '—',
    'application',
    'Sets timeZone, firstDayOfWeek, yearPivot, calendar, size and variant once for everything under the injector. A control that states any of them itself still wins.',
  ],
  [
    'exportAs',
    'slDateField',
    '—',
    'SlDateField',
    'Hands a template the instance, so focus(), clear() and the derived date() signal are reachable without a component of its own.',
  ],
  [
    'ControlValueAccessor',
    'implemented',
    '—',
    'SlDateField',
    'formControl, formControlName and ngModel all drive the control, and a form that disables it from its model reaches setDisabledState.',
  ],
  [
    'Validator',
    'implemented',
    '—',
    'SlDateField',
    'min, max and isDateUnavailable report as slottedDateRange and slottedDateUnavailable. required is left to Angular’s own validator, because a form already has a word for it and two would disagree.',
  ],
  [
    'slDateFieldStart / slDateFieldEnd',
    'Directive',
    '—',
    'consumer element',
    'The two adornment slots, as directives on the consumer’s own element, so an icon, a kbd or a span all keep their own semantics.',
  ],
]);

const accessibility: string[] = [
  'The three fields are a role="group" whose accessible name is the whole date in words, which is what the APG’s spin-button example names as the thing that lets a screen-reader user perceive a date without visiting all three buttons and remembering each.',
  'Each field is a role="spinbutton" carrying aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext — and the month’s valuetext is its name, because "nine" is not September in any language a reader is thinking in.',
  'Exactly one field is in the tab sequence at a time; the arrows walk between them and mirror in a right-to-left document, because the keys are physical and the order they walk is the writing order.',
  'The APG’s own example is marked deprecated for its visible arrow buttons, which duplicate keys the reader already has. This family draws none, and takes the roles, the wrapping rules and the aria-valuetext guidance whole.',
  'A step wraps inside its own field and never carries: December steps up to January without moving the year, which is the example’s stated rule and the difference between one arrow press changing one field and changing two.',
];

export const ANGULAR_DATE_FIELD_DOCS = {
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
