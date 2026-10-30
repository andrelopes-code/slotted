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

export const REACT_SEGMENTED_CONTROL_TOKENS = segmentedControlTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Segmented Control decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Segment, SegmentedControl, SegmentedControlDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The track. It carries role="radiogroup", data-ui="segmented-control", the axes, and the two numbers the thumb is made of — the count of segments and the index of the checked one. It is exactly one control tall, so it lines up beside a field in a form.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The thumb. One column wide, moved by its own width times the checked index, so nothing is read from layout and the first server-rendered paint is already right. It is absent while nothing is checked, so the first selection fades it in rather than sliding it from an edge.',
  },
  {
    part: 'item',
    element: 'label, or the element Segment’s render returns',
    required: true,
    purpose:
      'One segment, and the whole hit area of its radio. It carries data-checked and data-disabled, and a rule on its leading edge that gives way around the thumb.',
  },
  {
    part: 'control',
    element: 'input type="radio"',
    required: true,
    purpose:
      'The radio. Visually hidden and left where it is, covering the segment and reaching the track’s own edge so the target is the control’s height. Sharing one name is what buys the platform’s whole keyboard model; it is deliberately not substitutable.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The mark a segment was given, sized from the control glyph scale and hidden from the reading order. It is what stays when the control condenses.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The words. Present at every width — under data-condense="icons" they are hidden visually and kept in the DOM, so the accessible name of a segment does not change with the width of its container.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Tab into it once, then use the arrows: they move focus and the choice together, because the segments are radios.',
    snippet: defineSnippet({
      id: 'segmented-control-react-playground',
      language: 'tsx',
      label: 'One choice out of a few, applied at once',
      source: `<SegmentedControl aria-label="Chart period" defaultValue="week">
  <Segment value="day">Day</Segment>
  <Segment value="week">Week</Segment>
  <Segment value="month">Month</Segment>
</SegmentedControl>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The three control steps',
    note: 'Each step reads the control scale and the track measures its segments back from it, so the whole control is as tall as the text field and the button beside it at every size.',
    snippet: defineSnippet({
      id: 'segmented-control-react-sizes',
      language: 'tsx',
      label: 'sm, md and lg',
      source: `<SegmentedControl aria-label="View" defaultValue="grid" size="sm">
  <Segment value="grid">Grid</Segment>
  <Segment value="list">List</Segment>
</SegmentedControl>;`,
    }),
  },
  {
    id: 'orientation',
    title: 'Along the line, or down the page',
    note: 'The thumb travels on whichever axis the segments do, and the platform moves the choice with both pairs of arrows because the set is radios sharing one name.',
    snippet: defineSnippet({
      id: 'segmented-control-react-orientation',
      language: 'tsx',
      label: 'A column of segments',
      source: `<SegmentedControl aria-label="Payment" defaultValue="invoice" orientation="vertical">
  <Segment value="card">Card</Segment>
  <Segment value="transfer">Wire transfer</Segment>
  <Segment value="invoice">ACH transfer</Segment>
</SegmentedControl>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Hover, focus, one segment unavailable, the whole control unavailable, read-only and invalid. Read-only keeps its colours and refuses the change; only disabled loses them.',
    snippet: defineSnippet({
      id: 'segmented-control-react-states',
      language: 'tsx',
      label: 'A segment out of action inside a live control',
      source: `<SegmentedControl aria-label="Plano" defaultValue="starter">
  <Segment value="starter">Inicial</Segment>
  <Segment value="team">Equipe</Segment>
  <Segment disabled value="enterprise">
    Corporativo
  </Segment>
</SegmentedControl>;`,
    }),
  },
  {
    id: 'iconOnly',
    title: 'Marks without words',
    note: 'A segment with only a mark draws square and takes its accessible name from an aria-label on its radio, which is the one thing the family cannot supply for a consumer’s own artwork.',
    snippet: defineSnippet({
      id: 'segmented-control-react-icon-only',
      language: 'tsx',
      label: 'An alignment control',
      source: `<SegmentedControl aria-label="Alignment" defaultValue="center">
  <Segment aria-label="Start" icon={<AlignStartIcon />} value="start" />
  <Segment aria-label="Center" icon={<AlignCenterIcon />} value="center" />
</SegmentedControl>;`,
    }),
  },
  {
    id: 'variants',
    title: 'A track, or the words alone',
    note: 'underline draws the same radio group as words: each as wide as itself, the chosen one in the text colour and underlined, the others muted. One tab stop, the arrows move the value, and inside a field the label names the set.',
    snippet: defineSnippet({
      id: 'segmented-control-react-variants',
      language: 'tsx',
      label: 'The underline variant',
      source: `<SegmentedControl aria-label="Period" defaultValue="month" variant="underline">
  <Segment value="day">Day</Segment>
  <Segment value="week">Week</Segment>
  <Segment value="month">Month</Segment>
</SegmentedControl>;`,
    }),
  },
  {
    id: 'condense',
    title: 'Narrower than its words',
    note: 'Below the width its labels need, a control told to condense keeps its marks and hides its words — hidden, never removed, so every segment is announced the same at every width.',
    snippet: defineSnippet({
      id: 'segmented-control-react-condense',
      language: 'tsx',
      label: 'Labels that give way to their marks',
      source: `<SegmentedControl aria-label="Report" condense="icons" defaultValue="table">
  <Segment icon={<TableIcon />} value="table">
    Table
  </Segment>
  <Segment icon={<ChartIcon />} value="chart">
    Chart
  </Segment>
</SegmentedControl>;`,
    }),
  },
  {
    id: 'width',
    title: 'Content width, or the whole line',
    note: 'Left alone every column is the widest label’s, which is the rule Carbon states; fullWidth spreads the same equal columns across the line it is given.',
    snippet: defineSnippet({
      id: 'segmented-control-react-width',
      language: 'tsx',
      label: 'A control that fills its column',
      source: `<SegmentedControl aria-label="Delivery" defaultValue="afternoon" fullWidth>
  <Segment value="morning">Morning</Segment>
  <Segment value="afternoon">Afternoon</Segment>
  <Segment value="evening">Evening</Segment>
</SegmentedControl>;`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a field',
    note: 'The control takes its step, its unavailable state and its description from the field around it, and gives the field back a control to name — the label points at the set, not at one segment.',
    snippet: defineSnippet({
      id: 'segmented-control-react-field',
      language: 'tsx',
      label: 'A labelled, described control',
      source: `<Field>
  <FieldLabel>Invoice currency</FieldLabel>
  <SegmentedControl defaultValue="brl" name="currency">
    <Segment value="brl">BRL</Segment>
    <Segment value="usd">USD</Segment>
  </SegmentedControl>
  <FieldDescription>The conversion uses the exchange rate of the issue date.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'form',
    title: 'In a form, and submitted',
    note: 'The segments are real radios sharing one name, so the value reaches FormData with no wiring at all — and required puts the browser’s own constraint validation behind it.',
    snippet: defineSnippet({
      id: 'segmented-control-react-form',
      language: 'tsx',
      label: 'A control a form submits',
      source: `<form
  onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log(data.get('currency'));
  }}
>
  <SegmentedControl aria-label="Moeda" defaultValue="brl" name="currency">
    <Segment value="brl">BRL</Segment>
    <Segment value="usd">USD</Segment>
  </SegmentedControl>
</form>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A label longer than its column, a five-segment set in a narrow frame, and a right-to-left string inside a left-to-right page. Each clips at the ellipsis and keeps its whole text.',
    snippet: defineSnippet({
      id: 'segmented-control-react-content',
      language: 'tsx',
      label: 'Long and mirrored labels',
      source: `<SegmentedControl aria-label="Frequency" defaultValue="now" fullWidth>
  <Segment value="now">Immediately</Segment>
  <Segment value="digest">Once a day, in the evening digest</Segment>
</SegmentedControl>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Substituting a root, and setting the defaults once',
    note: 'render hands the track every attribute it was going to write; the provider states the axes once for a whole application. The radio itself is fixed, and the page says why.',
    snippet: defineSnippet({
      id: 'segmented-control-react-composition',
      language: 'tsx',
      label: 'A provider over a substituted root',
      source: `<SegmentedControlDefaultsProvider fullWidth size="sm">
  <SegmentedControl aria-label="View" render={(props) => <nav {...props} />}>
    <Segment value="grid">Grid</Segment>
  </SegmentedControl>
</SegmentedControlDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab lands on the checked segment; both pairs of arrows move focus and the choice together and wrap at the ends; Space checks the focused one. Every row of it is the platform’s.',
    snippet: defineSnippet({
      id: 'segmented-control-react-keyboard',
      language: 'tsx',
      label: 'Nothing checked yet: Tab lands on the first segment',
      source: `<SegmentedControl aria-label="Shipping">
  <Segment value="standard">Standard</Segment>
  <Segment value="express">Express</Segment>
</SegmentedControl>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: ChangeRequest<string | undefined>)',
    when: 'Before the value moves. The request carries the new value, the value it replaces — undefined while nothing has been chosen — the reason, the originating event, and cancel(), which refuses the move before anything commits, including the platform’s own selection.',
  },
  {
    name: 'onChange, onClick, onFocus, onBlur, on each segment',
    payload: 'the element’s own events',
    when: 'Whenever that segment’s radio fires them. The family composes with a consumer’s handler rather than replacing it: the consumer’s runs first, and always runs. Calling preventDefault() in onClick stops the change as well.',
  },
];

export const REACT_SEGMENTED_CONTROL_DOCS = {
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
        'SegmentedControl',
        'Present means the consumer owns the choice, for the life of the component. Absent, the control owns it and starts from defaultValue',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'SegmentedControl',
        'What an uncontrolled control starts from, read once. A later change to it does not silently become new state',
      ],
      [
        'name',
        'string',
        '—',
        'SegmentedControl',
        'The submission name the segments share, and the reason the platform treats them as one radio group. Generated when none is written, and the cost is that such a control submits under a generated key',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'SegmentedControl',
        'The control step. The track measures its segments back from it, so the whole control is exactly as tall as the field beside it',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'SegmentedControl',
        'How the segments flow and which way the thumb travels. A horizontal set writes aria-orientation, because radiogroup already implies vertical',
      ],
      [
        'variant',
        "'track' | 'underline'",
        'track',
        'SegmentedControl',
        'How the choice is drawn: a track with a thumb, or the words alone with the chosen one underlined',
      ],
      [
        'condense',
        "'none' | 'icons'",
        'none',
        'SegmentedControl',
        'What the control does when it is narrower than its labels need. icons keeps the marks and hides the words, and makes the control take its parent’s width so there is a width to ask a question about',
      ],
      [
        'fullWidth',
        'boolean',
        'false',
        'SegmentedControl',
        'Whether the equal columns spread across the whole line. Left alone every column is the widest label’s',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'SegmentedControl',
        'Unstated rather than false, so the control defers to the field around it. Stated, it reaches every radio as the native attribute, which is also what makes the browser skip it with the arrows',
      ],
      [
        'readOnly',
        'boolean',
        '—',
        'SegmentedControl',
        'Enforced by the family, because a radio ignores readonly: the change is refused on the click a pointer and Space share, and the control keeps its colours and its tab stops',
      ],
      [
        'invalid',
        'boolean',
        '—',
        'SegmentedControl',
        'Writes aria-invalid and data-invalid, and points the focus ring at the danger step so the outline and its shadow move together',
      ],
      [
        'required',
        'boolean',
        '—',
        'SegmentedControl',
        'Writes aria-required on the control rather than the native attribute on a radio, so describing a field does not change what submitting the form does',
      ],
      [
        'value, on Segment',
        'string',
        '—',
        'Segment',
        'What this segment selects, and what the control’s value holds. It is required: a segment with no value is a choice a reader cannot make',
      ],
      [
        'icon, on Segment',
        'ReactNode',
        '—',
        'Segment',
        'The mark drawn before the words, and what stays when the control condenses',
      ],
      [
        'disabled, on Segment',
        'boolean',
        '—',
        'Segment',
        'One segment out of action while the rest of the control stays live',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: SegmentedControlRootProps | SegmentRootProps) => ReactNode',
        '—',
        'SegmentedControl, Segment',
        'Substitutes either root and hands it every attribute. The radio is fixed: a segment that became a button or a link would lose the semantics this family exists to have, and a row that navigates is tabs',
      ],
      [
        'ref',
        'Ref<HTMLDivElement> | Ref<HTMLInputElement>',
        '—',
        'SegmentedControl, Segment',
        'Reaches the element — the track, or that segment’s radio. focus() and click() are the element’s own, so no imperative handle is invented',
      ],
      [
        'useSegmentedControl()',
        '() => SegmentedControlContextValue',
        '—',
        'inside a SegmentedControl',
        'What a segment reads to know whether it is checked and how to ask for a change. It throws outside a control rather than rendering something that behaves like nothing',
      ],
      [
        'SegmentedControlDefaultsProvider',
        '{ condense, fullWidth, orientation, size }',
        '—',
        'a subtree',
        'The four decisions an application takes once. size is outranked by the field around the control',
      ],
      [
        'role',
        'string',
        'radiogroup, or none inside a field group',
        'SegmentedControl',
        'A consumer’s own wins over both. The role is withdrawn inside a field group, whose fieldset and legend already name the set',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Radio Group (w3.org/WAI/ARIA/apg/patterns/radio/), and its entire keyboard table is the platform’s: Tab lands on the checked segment or on the first when none is checked, Space checks the focused one, both pairs of arrows move focus and the choice together, the set wraps, and disabled segments are skipped — including the arrow directions of a right-to-left document.',
      'A segment is a real input type="radio" and not a button. Primer builds the row of buttons and pays one tab stop per segment where the pattern gives one for the set; Angular Material writes radiogroup around children carrying aria-pressed, which is a group whose role and children disagree. The family whose items are buttons is toggle-group, and the difference a reader feels is the arrows.',
      'That is why the segments share a name, and why one is generated when none is written: grouping is by name within the form owner, so an unnamed set is not a set. The value reaches FormData with no wiring, which is what makes this the family for a choice a form submits.',
      'The ring is drawn on the segment and put out on the radio that holds the focus, so the family never paints two rings in two colours. It sits on the segment’s own edge rather than off it, because the segments are flush inside the track and an offset ring would be drawn across the neighbour beside it.',
      'Read-only has no platform answer for a radio, so it is enforced: the change is refused on the click a pointer and Space share, aria-readonly announces it, and the control keeps its tab stops and its full contrast — it must not be mistaken for an unavailable one.',
      'The thumb is shorter than the control it lives in, so the radio reaches the track’s own edge and the target is the control’s height rather than the thumb’s. With the segment never narrower than 24 CSS pixels, WCAG 2.2 SC 2.5.8 holds at the smallest step and the tightest density.',
      'Condensing hides the words and keeps them: the accessible name of every segment is the same whether the control has room for its labels or not.',
    ],
    snippets: [
      defineSnippet({
        id: 'segmented-control-react-anatomy',
        language: 'tsx',
        label: 'The anatomy as it reaches the DOM',
        source: `<div
  data-ui="segmented-control"
  data-part="root"
  data-size="md"
  data-orientation="horizontal"
  data-condense="none"
  role="radiogroup"
  aria-label="Chart period"
  style="--slotted-segmented-control-count: 3; --slotted-segmented-control-index: 1"
>
  <span data-part="indicator" aria-hidden="true"></span>
  <label data-part="item" data-checked>
    <input data-part="control" type="radio" name="range" value="week" checked />
    <span data-part="icon" aria-hidden="true"></span>
    <span data-part="label">Week</span>
  </label>
</div>;`,
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
