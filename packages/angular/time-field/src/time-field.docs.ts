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

export const ANGULAR_TIME_FIELD_TOKENS = timeFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Time Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlTimeField, SlTimeFieldStart, SlTimeFieldEnd } from '@slotted/angular/time-field';",
  selector: '[slTimeField]',
  exportAs: 'slTimeField',
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
      id: 'time-field-angular-playground',
      label: 'Usage',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Start time</label>
  <div slTimeField clearable locale="pt-BR" name="start"></div>
  <span slFieldDescription>The meeting starts at this time.</span>
</div>`,
    }),
  },
  {
    id: 'locale',
    title: 'The locale writes the time',
    note: 'The same component in four locales. The field order, the separators, the placeholder and whether a day period exists all come from Intl — nobody writes a format string.',
    snippet: defineSnippet({
      id: 'time-field-angular-locale',
      label: 'Four locales',
      language: 'angular',
      source: `<div slTimeField locale="pt-BR"></div>
<div slTimeField locale="en-US"></div>
<div slTimeField locale="ja-JP"></div>
<div slTimeField locale="ar-EG"></div>`,
    }),
  },
  {
    id: 'hour-cycle',
    title: 'Four hour cycles, not a boolean',
    note: 'Intl resolves h11, h12, h23 and h24, and a boolean can say two of them. Ask for 12 in ja-JP and the hour runs from zero beside 午前, because that is what the locale writes. The public axis stays 12 | 24.',
    snippet: defineSnippet({
      id: 'time-field-angular-hour-cycle',
      label: 'The axis, and what the locale does with it',
      language: 'angular',
      source: `<div slTimeField locale="en-US" [hourCycle]="12"></div>
<div slTimeField locale="ja-JP" [hourCycle]="12"></div>
<div slTimeField locale="en-US" [hourCycle]="24"></div>`,
    }),
  },
  {
    id: 'granularity',
    title: 'Granularity',
    note: 'How much of the time is drawn, and how much of it is typed. Seconds exist only when the value has them; an hour-granularity field is one spin button and one value.',
    snippet: defineSnippet({
      id: 'time-field-angular-granularity',
      label: 'Three depths',
      language: 'angular',
      source: `<div slTimeField granularity="hour" locale="pt-BR"></div>
<div slTimeField granularity="minute" locale="pt-BR"></div>
<div slTimeField granularity="second" locale="pt-BR"></div>`,
    }),
  },
  {
    id: 'relative',
    title: 'A time written as a duration',
    note: 'Press +, - or = on any segment and the field takes an expression instead: +40m, 1h30, -15, 0. What it resolves to is drawn beside it before Enter commits anything, and Escape puts the segments back untouched. No surveyed implementation offers it.',
    snippet: defineSnippet({
      id: 'time-field-angular-relative',
      label: 'The expression',
      language: 'angular',
      source: `<div slTimeField locale="pt-BR" [referenceTime]="afternoon"></div>`,
    }),
  },
  {
    id: 'midnight',
    title: 'A duration that crosses midnight',
    note: '+90m at 23:00 is 00:30 the next day, and this library holds no day beside a time. The preview changes tone, says so in words, and the request carries crossesMidnight — so a consumer holding a PlainDateTime knows to add one. Nothing else surveyed says anything at all.',
    snippet: defineSnippet({
      id: 'time-field-angular-midnight',
      label: 'The crossing, in the request',
      language: 'angular',
      source: `<div
  slTimeField
  locale="pt-BR"
  [messages]="{ nextDay: '{time} no dia seguinte' }"
  [referenceTime]="late"
  (valueChange)="save($event.value, $event.crossesMidnight)"
></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three steps a field can be. A control inside a field takes the field’s step, so a form cannot end up with a small field holding a medium control on one row.',
    snippet: defineSnippet({
      id: 'time-field-angular-sizes',
      label: 'The three steps',
      language: 'angular',
      source: `<div slTimeField size="sm"></div>
<div slTimeField size="md"></div>
<div slTimeField size="lg"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'How much frame the control shows. outline takes the ground it is on, subtle sinks into the page, and plain shows nothing until it is used — which is what a dense table needs.',
    snippet: defineSnippet({
      id: 'time-field-angular-variants',
      label: 'The three frames',
      language: 'angular',
      source: `<div slTimeField variant="outline"></div>
<div slTimeField variant="subtle"></div>
<div slTimeField variant="plain"></div>`,
    }),
  },
  {
    id: 'range',
    title: 'Bounds',
    note: 'min and max fence the value and reach the spin buttons as aria-valuemin and aria-valuemax. A time outside them is invalid whatever the field around it says, because the control is the only thing that knows.',
    snippet: defineSnippet({
      id: 'time-field-angular-range',
      label: 'Opening hours',
      language: 'angular',
      source: `<div slTimeField [min]="opens" [max]="closes"></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Times the product refuses',
    note: 'isTimeUnavailable answers a lunch break, a booked slot, a closed shop — anything a pair of bounds cannot say. A predicate reaches every time; three lists of numbers reach only the ones on a unit boundary.',
    snippet: defineSnippet({
      id: 'time-field-angular-unavailable',
      label: 'A lunch break',
      language: 'angular',
      source: `<div slTimeField locale="pt-BR" [isTimeUnavailable]="isLunch"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only stays focusable and copyable and never looks disabled; disabled answers no key and no pointer; invalid keeps its focus ring and retargets its color. Tab through the row to see each one answer.',
    snippet: defineSnippet({
      id: 'time-field-angular-states',
      label: 'The four states',
      language: 'angular',
      source: `<div slTimeField readOnly></div>
<div slTimeField invalid></div>
<div slTimeField disabled></div>
<div slTimeField required></div>`,
    }),
  },
  {
    id: 'clear',
    title: 'Clearing',
    note: 'The button appears only once a segment holds something, and pressing it empties every field, emits the clear reason and puts focus back on the first segment rather than leaving it nowhere.',
    snippet: defineSnippet({
      id: 'time-field-angular-clear',
      label: 'Clearing',
      language: 'angular',
      source: `<div slTimeField clearable [messages]="{ clear: 'Limpar a hora' }"></div>`,
    }),
  },
  {
    id: 'adornments',
    title: 'Adornments',
    note: 'The two slots take an icon, a mark or a word, and both are named for the reading direction rather than for a side, so the same markup reads correctly in a right-to-left document. A time zone label belongs here: the value itself is a wall-clock time and carries no zone.',
    snippet: defineSnippet({
      id: 'time-field-angular-adornments',
      label: 'Both slots',
      language: 'angular',
      source: `<div slTimeField>
  <span slTimeFieldStart><span slIcon></span></span>
  <span slTimeFieldEnd>BRT</span>
</div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'The value reaches a plain form post as an HH:mm:ss string through a hidden input, so a server reads it without any JavaScript touching the control. A half-typed time posts nothing at all, because it is not a time.',
    snippet: defineSnippet({
      id: 'time-field-angular-forms',
      label: 'A plain post',
      language: 'angular',
      source: `<form [formGroup]="form" (ngSubmit)="save()">
  <div slField>
    <label slFieldLabel>Start time</label>
    <div slTimeField formControlName="start" required></div>
  </div>
</form>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A day period written as a word rather than as two letters, a second granularity in a narrow column, and a right-to-left document — where the sequence still reads 14:30 rather than 30:14, because a clock time is a numeric run and bidi renders one left to right.',
    snippet: defineSnippet({
      id: 'time-field-angular-content',
      label: 'A long day period',
      language: 'angular',
      source: `<div slTimeField granularity="second" locale="es-MX" [hourCycle]="12"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The provider sets the clock once for everything under it, provideSlotted the language; render substitutes the frame’s element; and the ref carries focus(), clear() and which field holds focus.',
    snippet: defineSnippet({
      id: 'time-field-angular-composition',
      label: 'The three surfaces',
      language: 'angular',
      source: `<div slTimeField #hora="slTimeField" locale="pt-BR"></div>
<button type="button" (click)="hora.focus()">Focar</button>
<button type="button" (click)="hora.clear()">Limpar</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Every key the spin-button pattern lists, plus the two the pattern has no example for: the arrows across, which are logical rather than physical, and the three characters that open a duration. Put focus in the field and try them.',
    snippet: defineSnippet({
      id: 'time-field-angular-keyboard',
      label: 'Composing with your own handler',
      language: 'angular',
      source: `<div slTimeField (keydown)="onKeyDown($event)"></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainTime | null',
    '—',
    'SlTimeField',
    'Present means the consumer owns the value. The control asks and waits rather than moving it.',
  ],
  [
    'defaultValue',
    'PlainTime | null',
    '—',
    'SlTimeField',
    'The value the control starts from when nobody else writes one. Read once, in ngOnInit.',
  ],
  [
    'min',
    'PlainTime',
    '—',
    'SlTimeField',
    'The earliest time the control accepts. Reported through aria-valuemin, and as slottedTimeRange to a reactive form.',
  ],
  [
    'max',
    'PlainTime',
    '—',
    'SlTimeField',
    'The latest time the control accepts. Reported through aria-valuemax, and as slottedTimeRange to a reactive form.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime) => boolean',
    '—',
    'SlTimeField',
    'Refuses particular times — a lunch break, a booked slot, a closed shop. Reported as slottedTimeUnavailable to a reactive form.',
  ],
  [
    'locale',
    'string',
    'provideSlotted',
    'SlTimeField',
    'BCP 47. Decides the field order, the separators, the placeholder and whether a day period is drawn at all. Unset, the language in force decides.',
  ],
  [
    'timeZone',
    'string',
    'runtime',
    'SlTimeField',
    'Which zone answers "what time is it now", and nothing else. The value itself is a wall-clock time and carries no zone.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'locale',
    'SlTimeField',
    'The question a consumer asks about the clock. Which variant of each — h11 or h12, h23 or h24 — is the locale’s own.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'SlTimeField',
    'The smallest unit the field draws and takes. Seconds exist only when the value has them.',
  ],
  [
    'referenceTime',
    'PlainTime',
    'now',
    'SlTimeField',
    'What an empty segment steps from and what a duration resolves against. Stating it is what makes a story and a spec deterministic.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlTimeField',
    'The type step, matching the field around it.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlTimeField',
    'How much frame the control shows at rest.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'SlTimeField',
    'Unstated rather than false, so the control defers to the field — and to the form, which sets it through setDisabledState.',
  ],
  [
    'readOnly',
    'boolean',
    '—',
    'SlTimeField',
    'Readable, copyable and focusable, and not changeable. Arrow keys still walk between fields; nothing steps.',
  ],
  [
    'invalid',
    'boolean',
    '—',
    'SlTimeField',
    'Unstated rather than false. Retargets the focus ring.',
  ],
  [
    'required',
    'boolean',
    '—',
    'SlTimeField',
    'Unstated rather than false. Reaches the group as aria-required; the form’s own Validators.required states the rule.',
  ],
  [
    'clearable',
    'boolean',
    'false',
    'SlTimeField',
    'Draws a button that empties the value and returns focus to the first segment.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'SlTimeField',
    'Whether +, - and = open the duration expression. Set it false and the three keys do nothing.',
  ],
  [
    'messages',
    'Partial<TimeFieldMessages>',
    '—',
    'SlTimeField',
    'Words laid over the language in force, key by key: the clear button’s name (clear), the expression region’s name (duration) and the preview of a time past midnight (nextDay, with a {time} slot).',
  ],
  [
    'name',
    'string',
    '—',
    'SlTimeField',
    'The name the hidden input carries the HH:mm:ss string under, for a plain form post.',
  ],
  [
    'slTimeFieldStart',
    'directive',
    '—',
    'SlTimeFieldStart',
    'An adornment before the time in the reading direction, on the consumer’s own element.',
  ],
  [
    'slTimeFieldEnd',
    'directive',
    '—',
    'SlTimeFieldEnd',
    'An adornment after the time in the reading direction, on the consumer’s own element.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'TimeFieldChangeRequest',
    when: 'Before the value moves, and cancellable. The request carries the new value, the value it replaces, the segments, whether a duration crossed midnight, the reason and the originating event. It arrives when a run of typed digits ends — never on every keystroke inside one, because typing 23 into an hour passes through 2 on the way. There is no two-way [(value)]: one slot could carry none of that, and a form gets the same movement through ControlValueAccessor.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideTimeFieldDefaults',
    'provider',
    '—',
    'application',
    'Sets timeZone, hourCycle, granularity, relative, size and variant once for everything under it. A control that states any of them itself still wins. The locale and the words come from provideSlotted.',
  ],
  [
    'ControlValueAccessor',
    'interface',
    '—',
    'SlTimeField',
    'The control belongs in a reactive form and in a template form. It is the integration point React has no equivalent of, and the asymmetry is recorded rather than levelled away.',
  ],
  [
    'Validator',
    'interface',
    '—',
    'SlTimeField',
    'slottedTimeRange and slottedTimeUnavailable are validity this control owns and no other validator can see. required is left to Angular’s own, because a form already has a word for it.',
  ],
  [
    'exportAs',
    'slTimeField',
    '—',
    'SlTimeField',
    'A template reaches the instance for focus(), focusEntry() and clear(), and reads the derived time() signal.',
  ],
  [
    '(keydown)',
    'EventListener',
    '—',
    'SlTimeField',
    'The family handles the keys on the host, so a consumer’s own listener on the same element runs first — which is the composition React gets by calling the consumer’s handler before acting.',
  ],
]);

const accessibility: string[] = [
  'The fields are a role="group" whose accessible name is the whole time in words, which is what the APG’s spin-button example names as the thing that lets a screen-reader user perceive a time without visiting every button and remembering each.',
  'Each field is a role="spinbutton" carrying aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext — and the day period is why aria-valuetext is not optional: aria-valuenow there is 0 or 1, which is not a name in any language.',
  'Exactly one field is in the tab sequence at a time; the arrows walk between them and mirror in a right-to-left document, because the keys are physical and the order they walk is the writing order.',
  'The expression region is a real input with its own accessible name, and its preview is a polite live region: a reader is being asked to accept a value they did not write, so the resolved time has to be perceivable before Enter — including to a reader who cannot see it.',
  'A step wraps inside its own field and never carries: 23:59 stepping the minute up reaches 23:00 rather than midnight, which is the example’s stated rule and the difference between one arrow press changing one field and changing two.',
];

export const ANGULAR_TIME_FIELD_DOCS = {
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
