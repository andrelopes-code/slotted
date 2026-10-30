import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import sliderTokens from '@slotted/styles/slider/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_SLIDER_TOKENS = sliderTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Slider decision',
}));

const imports: ReferenceImport = {
  source: "import { Slider, SliderDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame. Carries data-ui="slider", the three axes, data-marks, and data-disabled, data-invalid, data-readonly and data-dragging. It has no role: the role belongs to the input under each thumb. className and style reach this element.',
  },
  {
    part: 'output',
    element: 'output',
    required: false,
    purpose:
      'The read-out, at the inline end of its own row. It shows every thumb’s formatted value, joined by an en dash, and it is withdrawn under valueLabel="none" only when the consumer asks for that.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose:
      'The band the pointer aims at, floored at 24 CSS pixels in the cross axis so the target clears WCAG 2.2 SC 2.5.8. It owns the press, the drag and the pointer capture, and it is touch-action: none because a drag along the scale and a scroll of the page are the same gesture.',
  },
  {
    part: 'track',
    element: 'div',
    required: true,
    purpose:
      'The rail, drawn as a channel with an edge and an interior, and inset by half a thumb at each end so a thumb at either bound stays inside the band. It is the containing block for everything with a position on the scale.',
  },
  {
    part: 'indicator',
    element: 'div',
    required: true,
    purpose:
      'The filled portion, between the origin and the value — or between the two thumbs of a range. Positioned by --_start and --_end, two percentages the binding writes.',
  },
  {
    part: 'mark',
    element: 'span',
    required: false,
    purpose:
      'A ruler tick beside the rail, one per mark. It carries data-edge="start" or "end" at the two ends of the scale, which is what keeps the first and last labels inside the control.',
  },
  {
    part: 'mark-label',
    element: 'span',
    required: false,
    purpose:
      'The words under a tick. They wrap rather than overlap, a label longer than the space between two ticks overflows its own box rather than being clipped, and a label at that value becomes the thumb’s aria-valuetext.',
  },
  {
    part: 'thumb',
    element: 'div',
    required: true,
    purpose:
      'What a reader sees and grabs, one per value, carrying data-index and data-active while it is the thumb being dragged. It draws the focus ring for the input inside it.',
  },
  {
    part: 'input',
    element: 'input[type=range]',
    required: true,
    purpose:
      'The control. It carries the slider role, aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext, the name it submits under, and disabled — all from the platform. It is opacity: 0 and pointer-events: none, so it keeps focus and the accessibility tree and nothing else. ref reaches the first one.',
  },
  {
    part: 'bubble',
    element: 'span',
    required: false,
    purpose:
      'The same number, on the thumb, while it is dragged or focused. It is aria-hidden: the input beneath it already announces the value, and a second copy would announce it twice.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One scale with every axis on it, driven by the controls below the canvas. Press anywhere on the band: the nearest thumb moves there and keeps following the pointer.',
    snippet: defineSnippet({
      id: 'slider-react-playground',
      language: 'tsx',
      label: 'A volume, its label and its help',
      source: `<Field>
  <FieldLabel>Volume</FieldLabel>
  <Slider defaultValue={40} format={{ style: 'percent' }} max={1} step={0.01} />
  <FieldDescription>Applies to all app alerts.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the control takes the field’s rather than its own. Only the thumb, the type and the target grow: the rail keeps its weight, because a rail is a line and not a control.',
    snippet: defineSnippet({
      id: 'slider-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<Slider defaultValue={25} size="sm" />;
<Slider defaultValue={50} size="md" />;
<Slider defaultValue={75} size="lg" />;

// Inside a field the field decides, and the control follows.
<Field size="sm">
  <Slider defaultValue={40} />
</Field>;`,
    }),
  },
  {
    id: 'orientation',
    title: 'Which axis the scale runs along',
    note: 'A vertical scale puts its minimum at the bottom, where the browser’s own vertical range input puts it. The arrows follow: Up increases in both orientations, and only the inline pair mirrors in a right-to-left document.',
    snippet: defineSnippet({
      id: 'slider-react-orientation',
      language: 'tsx',
      label: 'A mixing desk, three faders',
      source: `<Slider aria-label="Treble" defaultValue={70} orientation="vertical" />;
<Slider aria-label="Mids" defaultValue={35} orientation="vertical" />;
<Slider aria-label="Bass" defaultValue={50} orientation="vertical" />;`,
    }),
  },
  {
    id: 'range',
    title: 'Two thumbs, and the distance between them',
    note: 'An array of values makes a range. Each thumb’s own min and max follow its neighbour, so the two cannot cross and a screen reader is told the range each one actually has — which is what the multi-thumb pattern requires and what clamping in script leaves wrong.',
    snippet: defineSnippet({
      id: 'slider-react-range',
      language: 'tsx',
      label: 'A price band that cannot invert',
      source: `<Slider
  defaultValue={[240, 780]}
  max={1000}
  minStepsBetween={2}
  name="price"
  step={10}
  thumbLabels={['Minimum price', 'Maximum price']}
/>;`,
    }),
  },
  {
    id: 'marks',
    title: 'A scale a reader can read',
    note: 'Marks are ruler ticks beside the rail rather than dots on it, so a tick never has to be legible against the fill and against the empty channel at once. A label of two words wraps rather than running into its neighbour, and one long word overflows its box rather than being clipped: nothing on this scale leaves the DOM.',
    snippet: defineSnippet({
      id: 'slider-react-marks',
      language: 'tsx',
      label: 'A five-step scale, and a bare ruler',
      source: `<Slider
  defaultValue={50}
  marks={[
    { value: 0, label: 'Low' },
    { value: 25, label: 'Reduced' },
    { value: 50, label: 'Medium' },
    { value: 75, label: 'High' },
    { value: 100, label: 'Maximum' },
  ]}
  step={25}
/>;

// Numbers alone draw ticks and reserve no room for labels.
<Slider defaultValue={6} marks={[2, 4, 6, 8]} max={10} />;`,
    }),
  },
  {
    id: 'origin',
    title: 'Where the fill starts',
    note: 'A gain control is not a volume: nought is in the middle and the fill runs outward from it in whichever direction the value went. origin takes a point on the scale as well as either of its ends.',
    snippet: defineSnippet({
      id: 'slider-react-origin',
      language: 'tsx',
      label: 'A balance that fills from the center',
      source: `<Slider defaultValue={3} marks={[{ value: 0, label: '0' }]} max={10} min={-10} origin={0} />;`,
    }),
  },
  {
    id: 'format',
    title: 'What the value is written as',
    note: 'The number is a domain value and the string is a formatting of it, through the same Intl.NumberFormat the number field uses — so a currency on a slider and a currency in a field beside it cannot disagree about a decimal comma.',
    snippet: defineSnippet({
      id: 'slider-react-format',
      language: 'tsx',
      label: 'A currency, a percentage and a unit',
      source: `<Slider
  defaultValue={1480}
  format={{ currency: 'BRL', style: 'currency' }}
  locale="pt-BR"
  max={4000}
  step={20}
/>;

<Slider defaultValue={0.4} format={{ style: 'percent' }} max={1} step={0.01} />;`,
    }),
  },
  {
    id: 'valueLabel',
    title: 'Where the number stands',
    note: 'auto shows the bubble while a thumb is dragged or focused, always keeps it there, and none withdraws both the bubble and the read-out. The room the bubble stands in is reserved either way, so nothing moves when a drag begins.',
    snippet: defineSnippet({
      id: 'slider-react-value-label',
      language: 'tsx',
      label: 'The three ways a value is shown',
      source: `<Slider defaultValue={40} valueLabel="auto" />;
<Slider defaultValue={40} valueLabel="always" />;

// A value that is a sentence belongs in a label of the consumer’s own.
<Slider defaultValue={2} marks={DELIVERY} max={2} valueLabel="none" />;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the family paints',
    note: 'Hover lifts the thumb’s fill, press grows it, focus rings it. Invalid reddens the fill and the thumb and retargets the ring; read-only steps the scale onto a neutral ink and keeps every value legible; disabled mutes all of it and answers nothing.',
    snippet: defineSnippet({
      id: 'slider-react-states',
      language: 'tsx',
      label: 'The four states a consumer sets',
      source: `<Slider defaultValue={62} />;
<Slider defaultValue={92} invalid />;
<Slider defaultValue={30} readOnly />;
<Slider defaultValue={30} disabled />;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A five-label scale at 240 pixels, a mark label of four words, a negative range and a value written in a locale that groups with a full stop. Nothing is truncated and nothing is taken out of the DOM.',
    snippet: defineSnippet({
      id: 'slider-react-content',
      language: 'tsx',
      label: 'Long labels, a negative scale and a narrow column',
      source: `<Slider
  defaultValue={[-1480, 2960]}
  format={{ maximumFractionDigits: 2, minimumFractionDigits: 2 }}
  locale="pt-BR"
  max={4000}
  min={-4000}
  step={20}
  thumbLabels={['Minimum balance', 'Maximum balance']}
/>;`,
    }),
  },
  {
    id: 'composition',
    title: 'In a field, in a form, and beside a number',
    note: 'The label, the description, the error and the identifier arrive from the field with nothing written. name submits one value per thumb, and a number field beside the scale is the pairing the guide recommends when precision matters.',
    snippet: defineSnippet({
      id: 'slider-react-composition',
      language: 'tsx',
      label: 'A field, a provider, a form and a handle',
      source: `<SliderDefaultsProvider valueLabel="always">
  <Field invalid>
    <FieldLabel>Stake</FieldLabel>
    <Slider defaultValue={96} name="stake" />
    <FieldError>The stake cannot exceed ninety percent.</FieldError>
  </Field>
</SliderDefaultsProvider>;

const handle = useRef<SliderHandle>(null);
<Slider handle={handle} />;
<Button onClick={() => handle.current?.focusThumb(1)}>Go to maximum</Button>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and which arrows mirror',
    note: 'Arrows step, Shift and the page keys move by the large amount, Home and End reach this thumb’s own bounds rather than the scale’s. The family binds the table itself because browsers disagree about Page Up on a range input.',
    snippet: defineSnippet({
      id: 'slider-react-keyboard',
      language: 'tsx',
      label: 'Every key the pattern lists, and the two that mirror',
      source: `// ArrowRight/ArrowLeft follow the reading direction; ArrowUp/ArrowDown do not.
// Shift or PageUp/PageDown: largeStep. Home: this thumb's min. End: its max.
<Slider defaultValue={[20, 80]} largeStep={10} step={1} />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: number | number[], request: ChangeRequest<number[]>)',
    when: 'Before the value moves, once per step and once per pointer sample. The request carries the new value, the value it replaces, the reason — "pointer" for a press or a drag, "keyboard" for any key in the table, "programmatic" otherwise — the originating event, and cancel(), which refuses the move before anything commits. A request for the value the family already holds is not emitted.',
  },
  {
    name: 'onValueCommit',
    payload: '(value: number | number[], reason: "pointer" | "keyboard" | "programmatic")',
    when: 'Once, when a drag ends or a key settles the value. A drag emits a hundred changes and one commit, and this is the one to save on, to fetch on, and to put in a history entry.',
  },
  {
    name: 'onKeyDown, onFocus, onBlur',
    payload: 'the element’s own events',
    when: 'Whenever a thumb’s input fires them. The family composes with a consumer’s handler rather than replacing it: the consumer’s runs first, always runs, and calling preventDefault() on a key stops the family from acting on it.',
  },
];

export const REACT_SLIDER_DOCS = {
  slider: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'number | number[]',
        '—',
        'Slider',
        'Present means the consumer owns the value, for the life of the component. An array makes a range, and the shape handed in is the shape every request carries back',
      ],
      [
        'defaultValue',
        'number | number[]',
        '0',
        'Slider',
        'What an uncontrolled slider starts from, read once. A native form reset returns to it',
      ],
      [
        'min',
        'number',
        '0',
        'Slider',
        'The smallest value the scale holds, and where the step grid starts',
      ],
      ['max', 'number', '100', 'Slider', 'The largest value the scale holds'],
      [
        'step',
        'number',
        '1',
        'Slider',
        'The amount the arrows move by, and the grid a track press snaps to. A step of nought or less makes the scale continuous',
      ],
      [
        'largeStep',
        'number',
        'step * 10',
        'Slider',
        'The amount Shift and the page keys move by. It is the family’s rather than the browser’s, because Chrome moves Page Up by a tenth of the range and Firefox by one step',
      ],
      [
        'minStepsBetween',
        'number',
        '0',
        'Slider',
        'How many steps must stay between two neighbouring thumbs. It becomes each input’s own min and max, so the clamping is the platform’s and the announced range is right',
      ],
      [
        'origin',
        "'min' | 'max' | number",
        'min',
        'Slider',
        'Where the filled portion starts. A point on the scale makes a balance control that fills outward from it',
      ],
      [
        'marks',
        'number[] | { value, label? }[]',
        '—',
        'Slider',
        'The ticks beside the rail. A mark that carries a label reserves the room for it and becomes the thumb’s aria-valuetext at that value',
      ],
      [
        'format',
        'Intl.NumberFormatOptions',
        '—',
        'Slider',
        'How the value is written, in the read-out, in the bubble and in aria-valuetext. Currency and percent are formattings of one numeric type, not types of their own',
      ],
      [
        'locale',
        'string',
        'the language in force',
        'Slider',
        'BCP 47. It decides the decimal separator, the grouping and the numbering system',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Slider, SliderDefaultsProvider',
        'Which axis the scale runs along. A vertical scale puts its minimum at the bottom',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Slider, SliderDefaultsProvider',
        'The type step, read from the field first when there is one, then from the provider. The thumb, the type and the target grow with it and the rail does not',
      ],
      [
        'valueLabel',
        "'auto' | 'always' | 'none'",
        'auto',
        'Slider, SliderDefaultsProvider',
        'When the value stands on the thumb. none withdraws the read-out as well, which is what a scale whose values are words needs',
      ],
      [
        'thumbLabels',
        'string[]',
        '—',
        'Slider',
        'The accessible name of each thumb, in order. A range whose two thumbs share one name gives a reader two sliders called the same thing',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'Slider',
        'Unstated rather than false, so the control defers to the field around it. Stated, it wins, and it is the native attribute on every thumb: out of the tab order and out of submission',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'Slider',
        'Unstated rather than false. input[type=range] has no readonly, so the family refuses every pointer and key change and writes aria-readonly instead. The value stays focusable and stays submitted',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'Slider',
        'Unstated rather than false. Writes aria-invalid on every thumb and data-invalid on the root',
      ],
      [
        'required',
        'boolean',
        '—',
        'Slider',
        'The element’s own attribute, passed through and never written by the family. A field marks necessity with aria-required instead, because the native attribute engages browser constraint validation',
      ],
      [
        'name / form',
        'string',
        '—',
        'Slider',
        'Reach every thumb’s input. A range therefore submits two values under one name, which is what a server reading a band expects',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: SliderRootProps) => ReactNode',
        '—',
        'Slider',
        'Substitutes the root and hands it every attribute. The props are typed against HTMLAttributes<HTMLElement>, so they can be spread onto any element. The track, the thumbs and the inputs are fixed: substituting the element that carries the role and the value would leave the family with nothing to be',
      ],
      [
        'ref',
        'Ref<HTMLInputElement>',
        '—',
        'Slider',
        'Reaches the first thumb’s input. focus() and the value set are the element’s own, so nothing is invented for what the platform already ships',
      ],
      [
        'handle',
        'Ref<SliderHandle>',
        '—',
        'Slider',
        'focusThumb(index), the one action a consumer cannot express by passing a value — a keyboard shortcut elsewhere on the page that jumps to the upper thumb of a range',
      ],
      [
        'className / style',
        'string / CSSProperties',
        '—',
        'Slider',
        'Reach the root, because the root is what a consumer sees. Every other native prop reaches every thumb’s input',
      ],
      [
        'SliderDefaultsProvider',
        '{ size, orientation, valueLabel }',
        '—',
        'a subtree',
        'The three decisions an application takes once. The locale comes from the language in force (SlottedProvider)',
      ],
      [
        'useField()',
        '() => FieldContextValue | undefined',
        '—',
        'inside a Field',
        'What the control reads to wire itself: the identifier, the description and the four shared states. A control that wires itself cannot be written wrong',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Slider and Slider (Multi-Thumb) (w3.org/WAI/ARIA/apg/patterns/slider/), and the role comes from the platform: every thumb is an input[type=range], so role="slider", aria-valuenow, aria-valuemin and aria-valuemax are the element’s own and cannot drift from it. The element is opacity: 0 and pointer-events: none — invisible and unhittable, never hidden: it keeps focus, the tab order and its place in the accessibility tree.',
      'Each thumb’s own min and max follow its neighbour, which is the multi-thumb pattern’s requirement that the announced range of a dependent slider be updated when the value changes. Radix and Ark clamp in script and leave the announced range as the scale’s, so a reader is told a thumb may reach a value it cannot. The tab order stays the array’s order however the thumbs move, which is the pattern’s second requirement.',
      'The whole keyboard table is the family’s: arrows by step, Shift and the page keys by largeStep, Home and End to this thumb’s own bounds. The inline arrows follow the reading direction and the block arrows do not — a scale has a direction and bidi is not it — which is what the pattern’s note about reversing the direction means in a mirrored document.',
      'aria-valuetext carries the formatted string, because aria-valuenow alone announces 1480 for a scale showing R$ 1.480,00. A mark that carries a label becomes that string at its own value, which is exactly the case the pattern names for the property and the one Ark and Mantine make a consumer write a function for.',
      'aria-required, never the native required. The native attribute engages browser constraint validation and changes submit behavior, which the library must not impose as a side effect of describing a field. disabled is native, because that is what the word means; readonly is not, because input[type=range] does not answer it, so the family refuses the change itself and writes aria-readonly.',
      'The target is the band rather than the thumb: it is floored at 24 CSS pixels in the cross axis, which is WCAG 2.2 SC 2.5.8, and a press anywhere on it moves the nearest thumb and starts a drag. The APG’s own warning about touch-based assistive technologies is why the keyboard reaches every value the pointer can.',
      'Nothing is said by color alone. Invalid is announced by aria-invalid and said in words by the field’s error; the fill and the thumb change tone as well as color, and in the high-contrast scheme the rail is a white channel with a black edge so the fill is still visible inside it.',
      'The bubble is aria-hidden. The input beneath it already announces the value, and a second copy would announce it twice.',
    ],
    snippets: [
      defineSnippet({
        id: 'slider-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="slider"
  data-part="root"
  data-size="md"
  data-orientation="horizontal"
  data-value-label="auto"
>
  <output data-part="output">40%</output>
  <div data-part="control">
    <div data-part="track">
      <div data-part="indicator" style={{ '--_start': 0, '--_end': 40 }} />
      <span data-part="mark" data-edge="start" style={{ '--_position': 0 }}>
        <span data-part="mark-label">Baixo</span>
      </span>
      <div data-part="thumb" data-index="0" style={{ '--_position': 40 }}>
        <input data-part="input" type="range" min="0" max="100" value="40" />
        <span data-part="bubble" aria-hidden="true">
          40%
        </span>
      </div>
    </div>
  </div>
</div>;`,
      }),
      defineSnippet({
        id: 'slider-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='slider'] {
  --slotted-slider-indicator-color: var(--slotted-tone-success-solid);
  --slotted-slider-thumb-border-color: var(--slotted-tone-success-solid);
  --slotted-slider-track-size: var(--slotted-space-4);
  --slotted-slider-thumb-size: var(--slotted-space-7);
}`,
      }),
    ],
  },
} as const;
