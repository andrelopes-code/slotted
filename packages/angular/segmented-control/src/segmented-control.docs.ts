import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import segmentedControlTokens from '@slotted/styles/segmented-control/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_SEGMENTED_CONTROL_TOKENS = segmentedControlTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Segmented Control decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideSegmentedControlDefaults,\n  SlSegment,\n  SlSegmentedControl,\n  SlSegmentIcon,\n} from '@slotted/angular/segmented-control';",
  selector: '[slSegmentedControl]',
  exportAs: 'slSegmentedControl',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element, with slSegmentedControl on it',
    required: true,
    purpose:
      'The track. It carries role="radiogroup", data-ui="segmented-control", the axes, and the two numbers the thumb is made of — the count of segments and the index of the checked one. It is exactly one control tall, so it lines up beside a field in a form.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The thumb. One column wide, moved by its own width times the checked index, so nothing is read from layout. It is absent while nothing is checked, so the first selection fades it in rather than sliding it from an edge the reader never saw.',
  },
  {
    part: 'item',
    element: 'label, with slSegment on it',
    required: true,
    purpose:
      'One segment, and the whole hit area of its radio. It carries data-checked and data-disabled, and a rule on its leading edge that gives way around the thumb.',
  },
  {
    part: 'control',
    element: 'input type="radio"',
    required: true,
    purpose:
      'The radio the segment renders. Visually hidden and left where it is, covering the segment and reaching the track’s own edge so the target is the control’s height. Sharing one name is what buys the platform’s whole keyboard model.',
  },
  {
    part: 'icon',
    element: 'the consumer’s own element, with slSegmentIcon on it',
    required: false,
    purpose:
      'The mark a segment was given, projected into it and hidden from the reading order. It is what stays when the control condenses.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The words the segment projects. Present at every width — under data-condense="icons" they are hidden visually and kept in the DOM, so the accessible name does not change with the width of the container.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Tab into it once, then use the arrows: they move focus and the choice together, because the segments are radios.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-playground',
      language: 'angular',
      label: 'One choice out of a few, applied at once',
      source: `<div slSegmentedControl aria-label="Chart period" defaultValue="week">
  <label slSegment value="day">Day</label>
  <label slSegment value="week">Week</label>
  <label slSegment value="month">Month</label>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The three control steps',
    note: 'Each step reads the control scale and the track measures its segments back from it, so the whole control is as tall as the text field and the button beside it at every size.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-sizes',
      language: 'angular',
      label: 'sm, md and lg',
      source: `<div slSegmentedControl aria-label="View" size="sm" defaultValue="grid">
  <label slSegment value="grid">Grid</label>
  <label slSegment value="list">List</label>
</div>`,
    }),
  },
  {
    id: 'orientation',
    title: 'Along the line, or down the page',
    note: 'The thumb travels on whichever axis the segments do, and the platform moves the choice with both pairs of arrows because the set is radios sharing one name.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-orientation',
      language: 'angular',
      label: 'A column of segments',
      source: `<div slSegmentedControl aria-label="Payment" orientation="vertical" defaultValue="invoice">
  <label slSegment value="card">Card</label>
  <label slSegment value="invoice">ACH transfer</label>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Hover, focus, one segment unavailable, the whole control unavailable, read-only and invalid. Read-only keeps its colours and refuses the change; only disabled loses them.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-states',
      language: 'angular',
      label: 'A segment out of action inside a live control',
      source: `<div slSegmentedControl aria-label="Plano" defaultValue="starter">
  <label slSegment value="starter">Inicial</label>
  <label slSegment value="enterprise" disabled>Corporativo</label>
</div>`,
    }),
  },
  {
    id: 'iconOnly',
    title: 'Marks without words',
    note: 'A segment with only a mark draws square and takes its accessible name from an aria-label, which the family reads from the host and writes onto the radio that holds the focus.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-icon-only',
      language: 'angular',
      label: 'An alignment control',
      source: `<div slSegmentedControl aria-label="Alignment" defaultValue="center">
  <label slSegment value="start" aria-label="Start">
    <ng-icon slSegmentIcon name="lucideAlignLeft" />
  </label>
</div>`,
    }),
  },
  {
    id: 'variants',
    title: 'A track, or the words alone',
    note: 'underline draws the same radio group as words: each as wide as itself, the chosen one in the text colour and underlined, the others muted. One tab stop, the arrows move the value, and inside a field the label names the set.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-variants',
      language: 'angular',
      label: 'The underline variant',
      source: `<div slSegmentedControl aria-label="Period" defaultValue="month" variant="underline">
  <label slSegment value="day">Day</label>
  <label slSegment value="week">Week</label>
  <label slSegment value="month">Month</label>
</div>`,
    }),
  },
  {
    id: 'condense',
    title: 'Narrower than its words',
    note: 'Below the width its labels need, a control told to condense keeps its marks and hides its words — hidden, never removed, so every segment is announced the same at every width.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-condense',
      language: 'angular',
      label: 'Labels that give way to their marks',
      source: `<div slSegmentedControl aria-label="Report" condense="icons" defaultValue="table">
  <label slSegment value="table">
    <ng-icon slSegmentIcon name="lucideTable" />
    Tabela
  </label>
</div>`,
    }),
  },
  {
    id: 'width',
    title: 'Content width, or the whole line',
    note: 'Left alone every column is the widest label’s, which is the rule Carbon states; fullWidth spreads the same equal columns across the line it is given.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-width',
      language: 'angular',
      label: 'A control that fills its column',
      source: `<div slSegmentedControl aria-label="Delivery" fullWidth defaultValue="afternoon">
  <label slSegment value="morning">Morning</label>
  <label slSegment value="afternoon">Afternoon</label>
</div>`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a field',
    note: 'The control takes its step, its unavailable state and its description from the field around it, and gives the field back a control to name — the label points at the set, not at one segment.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-field',
      language: 'angular',
      label: 'A labelled, described control',
      source: `<div slField>
  <label slFieldLabel>Invoice currency</label>
  <div slSegmentedControl name="currency" defaultValue="brl">
    <label slSegment value="brl">BRL</label>
    <label slSegment value="usd">USD</label>
  </div>
  <p slFieldDescription>The conversion uses the exchange rate on the issue date.</p>
</div>`,
    }),
  },
  {
    id: 'form',
    title: 'In a reactive form, and validated',
    note: 'The control is a ControlValueAccessor and a Validator: the form holds the value, and “choose one” is answered by the set rather than by any single segment that cannot see it.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-form',
      language: 'angular',
      label: 'A control a reactive form owns',
      source: `<div slSegmentedControl aria-label="Moeda" required [formControl]="currency">
  <label slSegment value="brl">BRL</label>
  <label slSegment value="usd">USD</label>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A label longer than its column, a five-segment set in a narrow frame, and a right-to-left string inside a left-to-right page. Each clips at the ellipsis and keeps its whole text.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-content',
      language: 'angular',
      label: 'Long and mirrored labels',
      source: `<div slSegmentedControl aria-label="Frequency" fullWidth defaultValue="now">
  <label slSegment value="now">Immediately</label>
  <label slSegment value="digest">Once a day, in the evening digest</label>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'The directive on the consumer’s own element, and the defaults once',
    note: 'Every part is a directive, so the element is always the consumer’s; provideSegmentedControlDefaults states the axes once for a whole application or one route.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-composition',
      language: 'ts',
      label: 'An application states its axes once',
      source: `providers: [provideSegmentedControlDefaults({ size: 'sm', fullWidth: true })];`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab lands on the checked segment; both pairs of arrows move focus and the choice together and wrap at the ends; Space checks the focused one. Every row of it is the platform’s.',
    snippet: defineSnippet({
      id: 'segmented-control-angular-keyboard',
      language: 'angular',
      label: 'Nothing checked yet: Tab lands on the first segment',
      source: `<div slSegmentedControl aria-label="Shipping">
  <label slSegment value="standard">Standard</label>
  <label slSegment value="express">Express</label>
</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<string | undefined>',
    when: 'Before the value moves. The request carries the new value, the value it replaces — undefined while nothing has been chosen — the reason, the originating event, and cancel(), which refuses the move before anything commits and puts every element back.',
  },
  {
    name: 'click, focus, blur, on each segment',
    payload: 'the element’s own events',
    when: 'Whenever that segment’s label fires them. The segment is a directive on the consumer’s own element, so every listener the consumer bound is on the element itself; blur also marks the form control touched.',
  },
];

export const ANGULAR_SEGMENTED_CONTROL_DOCS = {
  segmentedControl: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'slSegmentedControl',
        'Present means the consumer owns the choice, for the life of the component. Absent, the control owns it and starts from defaultValue',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'slSegmentedControl',
        'What an uncontrolled control starts from, read once in ngOnInit. A later change to it does not silently become new state',
      ],
      [
        'name',
        'string',
        '—',
        'slSegmentedControl',
        'The submission name the segments share, and the reason the platform treats them as one radio group. Generated when none is written, from an application-scoped factory so the server and the client agree',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slSegmentedControl',
        'The control step. The track measures its segments back from it, so the whole control is exactly as tall as the field beside it',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slSegmentedControl',
        'How the segments flow and which way the thumb travels. A horizontal set writes aria-orientation, because radiogroup already implies vertical',
      ],
      [
        'variant',
        "'track' | 'underline'",
        'track',
        'slSegmentedControl',
        'How the choice is drawn: a track with a thumb, or the words alone with the chosen one underlined',
      ],
      [
        'condense',
        "'none' | 'icons'",
        'none',
        'slSegmentedControl',
        'What the control does when it is narrower than its labels need. icons keeps the marks and hides the words, and makes the control take its parent’s width so there is a width to ask a question about',
      ],
      [
        'fullWidth',
        'boolean',
        'false',
        'slSegmentedControl',
        'Whether the equal columns spread across the whole line. Left alone every column is the widest label’s',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slSegmentedControl',
        'Unstated rather than false, so the control defers to the field around it and to a form that disables it. Stated, it reaches every radio as the native attribute',
      ],
      [
        'readOnly',
        'boolean',
        '—',
        'slSegmentedControl',
        'Enforced by the family, because a radio ignores readonly: the change is refused on the click a pointer and Space share, and the control keeps its colours and its tab stops',
      ],
      [
        'invalid',
        'boolean',
        '—',
        'slSegmentedControl',
        'Writes aria-invalid and data-invalid, and points the focus ring at the danger step so the outline and its shadow move together',
      ],
      [
        'required',
        'boolean',
        '—',
        'slSegmentedControl',
        'Writes aria-required on the control, and is what validate() answers for the set: “choose one” is a fact about the group and not about any one segment',
      ],
      [
        'value, on slSegment',
        'string',
        '—',
        'slSegment',
        'What this segment selects, and what the control’s value holds. It is required: a segment with no value is a choice a reader cannot make',
      ],
      [
        'disabled, on slSegment',
        'boolean',
        '—',
        'slSegment',
        'One segment out of action while the rest of the control stays live',
      ],
    ]),
    composition: apiRows([
      [
        'slSegment',
        'directive on a label',
        '—',
        'the consumer’s element',
        'The segment is a directive, so the label is the consumer’s own: every attribute, every listener and every structural directive around it stay exactly as they were written. The radio inside it is the family’s and is not substitutable',
      ],
      [
        'slSegmentIcon',
        'directive on any element',
        '—',
        'inside a segment',
        'The mark, projected into the segment and hidden from the reading order. An ng-icon, an inline svg or a span all work and none of them loses its own semantics',
      ],
      [
        'exportAs',
        "'slSegmentedControl' | 'slSegment'",
        '—',
        'a template reference',
        'Reaches the instance, so a template can read selection(), checkedIndex() or a segment’s checked() without the component owning a second copy of the state',
      ],
      [
        'provideSegmentedControlDefaults()',
        '(defaults: Partial<SegmentedControlDefaults>) => Provider',
        '—',
        'an injector',
        'The four decisions an application takes once, at the root or on one route. size is outranked by the field around the control',
      ],
      [
        'formControl, ngModel',
        'ControlValueAccessor, Validator',
        '—',
        'slSegmentedControl',
        'The control belongs in a reactive form and in a template form: it writes the value, reports touched on blur, answers setDisabledState, and validates required over the set',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Radio Group (w3.org/WAI/ARIA/apg/patterns/radio/), and its entire keyboard table is the platform’s: Tab lands on the checked segment or on the first when none is checked, Space checks the focused one, both pairs of arrows move focus and the choice together, the set wraps, and disabled segments are skipped — including the arrow directions of a right-to-left document.',
      'A segment is a real input type="radio" and not a button. Primer builds the row of buttons and pays one tab stop per segment where the pattern gives one for the set; Angular Material writes radiogroup around children carrying aria-pressed, which is a group whose role and children disagree. The family whose items are buttons is toggle-group, and the difference a reader feels is the arrows.',
      'The role is withdrawn inside a field group, whose fieldset and legend already name the set, and a role the consumer wrote on the host survives both — it is read with HostAttributeToken before the host bindings write.',
      'The ring is drawn on the segment and put out on the radio that holds the focus, so the family never paints two rings in two colours. It sits on the segment’s own edge, because the segments are flush inside the track and an offset ring would be drawn across the neighbour beside it.',
      'Read-only has no platform answer for a radio, so it is enforced: the change is refused on the click a pointer and Space share, aria-readonly announces it, and the control keeps its tab stops and its full contrast. A refused change also puts the neighbour back, because the platform restores only the element that was clicked.',
      'The thumb is shorter than the control it lives in, so the radio reaches the track’s own edge and the target is the control’s height rather than the thumb’s. With the segment never narrower than 24 CSS pixels, WCAG 2.2 SC 2.5.8 holds at the smallest step and the tightest density.',
    ],
    snippets: [
      defineSnippet({
        id: 'segmented-control-angular-anatomy',
        language: 'angular',
        label: 'The anatomy as it reaches the DOM',
        source: `<div
  slSegmentedControl
  role="radiogroup"
  aria-label="Chart period"
  data-ui="segmented-control"
  data-part="root"
  data-size="md"
  data-condense="none"
>
  <span data-part="indicator" aria-hidden="true"></span>
  <label slSegment data-part="item" data-checked>
    <input data-part="control" type="radio" name="range" value="week" />
    <span data-part="label">Week</span>
  </label>
</div>`,
      }),
      defineSnippet({
        id: 'segmented-control-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='segmented-control'] {
  --slotted-segmented-control-radius: var(--slotted-radius-full);
  --slotted-segmented-control-inset: var(--slotted-space-2);
  --slotted-segmented-control-indicator-background: var(--slotted-surface);
  --slotted-segmented-control-indicator-border-color: var(--slotted-border-subtle);
  --slotted-segmented-control-checked-color: var(--slotted-text);
}`,
      }),
    ],
  },
} as const;
