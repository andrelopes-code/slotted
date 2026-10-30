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

export const ANGULAR_SLIDER_TOKENS = sliderTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Slider decision',
}));

const imports: ReferenceImport = {
  source: "import { provideSliderDefaults, SlSlider } from '@slotted/angular/slider';",
  selector: '[slSlider]',
  exportAs: 'slSlider',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slSlider',
    required: true,
    purpose:
      'The frame. Carries data-ui="slider", the three axes, data-marks, and data-disabled, data-invalid, data-readonly and data-dragging. It has no role: the role belongs to the input under each thumb.',
  },
  {
    part: 'output',
    element: 'output',
    required: false,
    purpose:
      'The read-out, at the inline end of its own row. It shows every thumb’s formatted value, joined by an en dash, and it is withdrawn under valueLabel="none".',
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
      'The filled portion, between the origin and the value — or between the two thumbs of a range. Positioned by --_start and --_end, two percentages the component writes as style bindings.',
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
      'The control. It carries the slider role, aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext, the name it submits under, and disabled — all from the platform, exactly as Angular Material’s own matSliderThumb does. It is opacity: 0 and pointer-events: none, so it keeps focus and the accessibility tree and nothing else.',
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
    note: 'One scale with every input on it, driven by the controls below the canvas. Press anywhere on the band: the nearest thumb moves there and keeps following the pointer.',
    snippet: defineSnippet({
      id: 'slider-angular-playground',
      language: 'angular',
      label: 'A volume, its label and its help',
      source: `<div slField>
  <label slFieldLabel>Volume</label>
  <div slSlider [defaultValue]="40" [max]="1" [step]="0.01" [format]="percent"></div>
  <p slFieldDescription>Applies to all alerts in the app.</p>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the control takes the field’s rather than its own. Only the thumb, the type and the target grow: the rail keeps its weight, because a rail is a line and not a control.',
    snippet: defineSnippet({
      id: 'slider-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<div slSlider size="sm" [defaultValue]="25"></div>
<div slSlider size="md" [defaultValue]="50"></div>
<div slSlider size="lg" [defaultValue]="75"></div>

<!-- Inside a field the field decides, and the control follows. -->
<div slField size="sm">
  <div slSlider [defaultValue]="40"></div>
</div>`,
    }),
  },
  {
    id: 'orientation',
    title: 'Which axis the scale runs along',
    note: 'A vertical scale puts its minimum at the bottom, where the browser’s own vertical range input puts it. The arrows follow: Up increases in both orientations, and only the inline pair mirrors in a right-to-left document.',
    snippet: defineSnippet({
      id: 'slider-angular-orientation',
      language: 'angular',
      label: 'A mixing desk, three faders',
      source: `<div slSlider orientation="vertical" aria-label="Treble" [defaultValue]="70"></div>
<div slSlider orientation="vertical" aria-label="Mid" [defaultValue]="35"></div>
<div slSlider orientation="vertical" aria-label="Bass" [defaultValue]="50"></div>`,
    }),
  },
  {
    id: 'range',
    title: 'Two thumbs, and the distance between them',
    note: 'An array of values makes a range. Each thumb’s own min and max follow its neighbour, so the two cannot cross and a screen reader is told the range each one actually has — which is what the multi-thumb pattern requires and what clamping in script leaves wrong.',
    snippet: defineSnippet({
      id: 'slider-angular-range',
      language: 'angular',
      label: 'A price band that cannot invert',
      source: `<div
  slSlider
  name="preco"
  [defaultValue]="[240, 780]"
  [max]="1000"
  [step]="10"
  [minStepsBetween]="2"
  [thumbLabels]="['Minimum price', 'Maximum price']"
></div>`,
    }),
  },
  {
    id: 'marks',
    title: 'A scale a reader can read',
    note: 'Marks are ruler ticks beside the rail rather than dots on it, so a tick never has to be legible against the fill and against the empty channel at once. A label of two words wraps rather than running into its neighbour, and one long word overflows its box rather than being clipped: nothing on this scale leaves the DOM.',
    snippet: defineSnippet({
      id: 'slider-angular-marks',
      language: 'angular',
      label: 'A five-step scale, and a bare ruler',
      source: `<div slSlider [defaultValue]="50" [step]="25" [marks]="quality"></div>

<!-- Numbers alone draw ticks and reserve no room for labels. -->
<div slSlider [defaultValue]="6" [max]="10" [marks]="[2, 4, 6, 8]"></div>`,
    }),
  },
  {
    id: 'origin',
    title: 'Where the fill starts',
    note: 'A gain control is not a volume: nought is in the middle and the fill runs outward from it in whichever direction the value went. origin takes a point on the scale as well as either of its ends.',
    snippet: defineSnippet({
      id: 'slider-angular-origin',
      language: 'angular',
      label: 'A balance that fills from the center',
      source: `<div slSlider [defaultValue]="3" [min]="-10" [max]="10" [origin]="0" [marks]="zero"></div>`,
    }),
  },
  {
    id: 'format',
    title: 'What the value is written as',
    note: 'The number is a domain value and the string is a formatting of it, through the same Intl.NumberFormat the number field uses — so a currency on a slider and a currency in a field beside it cannot disagree about a decimal comma.',
    snippet: defineSnippet({
      id: 'slider-angular-format',
      language: 'angular',
      label: 'A currency, a percentage and a unit',
      source: `<div
  slSlider
  locale="pt-BR"
  [defaultValue]="1480"
  [max]="4000"
  [step]="20"
  [format]="{ currency: 'BRL', style: 'currency' }"
></div>`,
    }),
  },
  {
    id: 'valueLabel',
    title: 'Where the number stands',
    note: 'auto shows the bubble while a thumb is dragged or focused, always keeps it there, and none withdraws both the bubble and the read-out. The room the bubble stands in is reserved either way, so nothing moves when a drag begins.',
    snippet: defineSnippet({
      id: 'slider-angular-value-label',
      language: 'angular',
      label: 'The three ways a value is shown',
      source: `<div slSlider valueLabel="auto" [defaultValue]="40"></div>
<div slSlider valueLabel="always" [defaultValue]="40"></div>

<!-- A value that is a sentence belongs in a label of the consumer's own. -->
<div slSlider valueLabel="none" [defaultValue]="2" [max]="2" [marks]="deliveries"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the family paints',
    note: 'Hover lifts the thumb’s fill, press grows it, focus rings it. Invalid reddens the fill and the thumb and retargets the ring; read-only steps the scale onto a neutral ink and keeps every value legible; disabled mutes all of it and answers nothing.',
    snippet: defineSnippet({
      id: 'slider-angular-states',
      language: 'angular',
      label: 'The four states a consumer sets',
      source: `<div slSlider [defaultValue]="62"></div>
<div slSlider invalid [defaultValue]="92"></div>
<div slSlider readOnly [defaultValue]="30"></div>
<div slSlider disabled [defaultValue]="30"></div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A five-label scale at 240 pixels, a mark label of four words, a negative range and a value written in a locale that groups with a full stop. Nothing is truncated and nothing is taken out of the DOM.',
    snippet: defineSnippet({
      id: 'slider-angular-content',
      language: 'angular',
      label: 'Long labels, a negative scale and a narrow column',
      source: `<div
  slSlider
  locale="pt-BR"
  [defaultValue]="[-1480, 2960]"
  [min]="-4000"
  [max]="4000"
  [step]="20"
  [thumbLabels]="['Minimum balance', 'Maximum balance']"
></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'In a field, in a reactive form, and beside a number',
    note: 'The label, the description, the error and the identifier arrive from the field with nothing written. formControl puts the value in a reactive form, name submits one value per thumb, and a number field beside the scale is the pairing the guide recommends when precision matters.',
    snippet: defineSnippet({
      id: 'slider-angular-composition',
      language: 'angular',
      label: 'A field, a reactive form and the template reaching the instance',
      source: `<div slField [invalid]="true">
  <label slFieldLabel>Share</label>
  <div slSlider name="share" [formControl]="share" #scale="slSlider"></div>
  <p slFieldError>The share cannot exceed ninety percent.</p>
</div>

<button slButton type="button" (click)="scale.focusThumb(0)">Ir ao valor</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and which arrows mirror',
    note: 'Arrows step, Shift and the page keys move by the large amount, Home and End reach this thumb’s own bounds rather than the scale’s. The family binds the table itself because browsers disagree about Page Up on a range input.',
    snippet: defineSnippet({
      id: 'slider-angular-keyboard',
      language: 'angular',
      label: 'Every key the pattern lists, and the two that mirror',
      source: `<!-- ArrowRight/ArrowLeft follow the reading direction; ArrowUp/ArrowDown do not. -->
<!-- Shift or PageUp/PageDown: largeStep. Home: this thumb's min. End: its max. -->
<div slSlider [defaultValue]="[20, 80]" [step]="1" [largeStep]="10"></div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<number | number[]>',
    when: 'Before the value moves, once per step and once per pointer sample. The request carries the new value, the value it replaces, the reason — "pointer", "keyboard" or "programmatic" — the originating event, and cancel(), which refuses the move before anything commits. There is no [(value)]: a two-way binding has one slot and can carry none of those, and a form gets the same movement through ControlValueAccessor.',
  },
  {
    name: 'valueCommit',
    payload: 'number | number[]',
    when: 'Once, when a drag ends or a key settles the value. A drag emits a hundred changes and one commit, and this is the one to save on, to fetch on, and to put in a history entry.',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'the control’s own value',
    when: 'Whenever the value moves under formControl, formControlName or ngModel. setDisabledState is answered as well, so a form that disables the control disables the whole scale.',
  },
];

export const ANGULAR_SLIDER_DOCS = {
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
        'slSlider',
        'Present means the consumer owns the value, for the life of the component. An array makes a range, and the shape handed in is the shape every request carries back',
      ],
      [
        'defaultValue',
        'number | number[]',
        '0',
        'slSlider',
        'What an uncontrolled slider starts from, read once. A native form reset returns to it',
      ],
      [
        'min',
        'number',
        '0',
        'slSlider',
        'The smallest value the scale holds, and where the step grid starts',
      ],
      ['max', 'number', '100', 'slSlider', 'The largest value the scale holds'],
      [
        'step',
        'number',
        '1',
        'slSlider',
        'The amount the arrows move by, and the grid a track press snaps to. A step of nought or less makes the scale continuous',
      ],
      [
        'largeStep',
        'number',
        'step * 10',
        'slSlider',
        'The amount Shift and the page keys move by. It is the family’s rather than the browser’s, because Chrome moves Page Up by a tenth of the range and Firefox by one step',
      ],
      [
        'minStepsBetween',
        'number',
        '0',
        'slSlider',
        'How many steps must stay between two neighbouring thumbs. It becomes each input’s own min and max, so the clamping is the platform’s and the announced range is right',
      ],
      [
        'origin',
        "'min' | 'max' | number",
        'min',
        'slSlider',
        'Where the filled portion starts. A point on the scale makes a balance control that fills outward from it',
      ],
      [
        'marks',
        'number[] | { value, label? }[]',
        '—',
        'slSlider',
        'The ticks beside the rail. A mark that carries a label reserves the room for it and becomes the thumb’s aria-valuetext at that value',
      ],
      [
        'format',
        'Intl.NumberFormatOptions',
        '—',
        'slSlider',
        'How the value is written, in the read-out, in the bubble and in aria-valuetext. Currency and percent are formattings of one numeric type, not types of their own',
      ],
      [
        'locale',
        'string',
        'the language in force',
        'slSlider',
        'BCP 47. It decides the decimal separator, the grouping and the numbering system',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slSlider, provideSliderDefaults',
        'Which axis the scale runs along. A vertical scale puts its minimum at the bottom',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slSlider, provideSliderDefaults',
        'The type step, read from the field first when there is one, then from the token. The thumb, the type and the target grow with it and the rail does not',
      ],
      [
        'valueLabel',
        "'auto' | 'always' | 'none'",
        'auto',
        'slSlider, provideSliderDefaults',
        'When the value stands on the thumb. none withdraws the read-out as well, which is what a scale whose values are words needs',
      ],
      [
        'thumbLabels',
        'string[]',
        '—',
        'slSlider',
        'The accessible name of each thumb, in order. A range whose two thumbs share one name gives a reader two sliders called the same thing',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'slSlider',
        'Unstated rather than false, so the control defers to the field around it. Stated, it wins, and it is the native attribute on every thumb. A reactive form’s own disable() answers it too',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'slSlider',
        'Unstated rather than false. input[type=range] has no readonly, so the family refuses every pointer and key change and writes aria-readonly instead. The value stays focusable and stays submitted',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'slSlider',
        'Unstated rather than false. Writes aria-invalid on every thumb and data-invalid on the root',
      ],
      [
        'required',
        'boolean',
        '—',
        'slSlider',
        'The element’s own attribute, passed through and never written by the family. A field marks necessity with aria-required instead, because the native attribute engages browser constraint validation',
      ],
      [
        'name / form / id / aria-label',
        'attribute',
        '—',
        'slSlider',
        'Read with HostAttributeToken before any binding computes, so a static attribute a consumer wrote survives. name and form reach every thumb’s input, so a range submits two values under one name',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        "'slSlider'",
        '—',
        'the template',
        'Reaches the instance, and through it focusThumb(index) and sliderElement — the one action a value cannot express and the element it acts on',
      ],
      [
        'ControlValueAccessor',
        'formControl, formControlName, ngModel',
        '—',
        'slSlider',
        'The component is the control. A reactive form owns the value, disable() reaches the whole scale, and Angular 22’s Signal Forms bind through the same accessor, so [field] works with no second integration',
      ],
      [
        'provideSliderDefaults',
        '{ size, orientation, valueLabel }',
        '—',
        'an injector',
        'The three decisions an application takes once. The locale comes from the language in force (provideSlotted)',
      ],
      [
        'slField',
        'the field around it',
        '—',
        'an ancestor',
        'What the control reads to wire itself: the identifier, the description and the four shared states. A control that wires itself cannot be written wrong',
      ],
      [
        'styleUrl',
        'the one authored stylesheet',
        '—',
        'slSlider',
        'ViewEncapsulation.None over packages/styles/src/slider/slider.css — the same file React imports, so the two bindings cannot drift apart visually',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Slider and Slider (Multi-Thumb) (w3.org/WAI/ARIA/apg/patterns/slider/), and the role comes from the platform: every thumb is an input[type=range], the element Angular Material’s own slider uses, so role="slider", aria-valuenow, aria-valuemin and aria-valuemax are the element’s own and cannot drift from it. The element is opacity: 0 and pointer-events: none — invisible and unhittable, never hidden: it keeps focus, the tab order and its place in the accessibility tree.',
      'Each thumb’s own min and max follow its neighbour, which is the multi-thumb pattern’s requirement that the announced range of a dependent slider be updated when the value changes. The tab order stays the array’s order however the thumbs move, which is the pattern’s second requirement.',
      'The whole keyboard table is the family’s: arrows by step, Shift and the page keys by largeStep, Home and End to this thumb’s own bounds. The inline arrows follow the reading direction and the block arrows do not — a scale has a direction and bidi is not it — which is what the pattern’s note about reversing the direction means in a mirrored document.',
      'aria-valuetext carries the formatted string, because aria-valuenow alone announces 1480 for a scale showing R$ 1.480,00. A mark that carries a label becomes that string at its own value, which is exactly the case the pattern names for the property.',
      'aria-required, never the native required. The native attribute engages browser constraint validation and changes submit behavior, which the library must not impose as a side effect of describing a field. disabled is native, because that is what the word means; readonly is not, because input[type=range] does not answer it.',
      'The target is the band rather than the thumb: it is floored at 24 CSS pixels in the cross axis, which is WCAG 2.2 SC 2.5.8, and a press anywhere on it moves the nearest thumb and starts a drag.',
      'Nothing is said by color alone. Invalid is announced by aria-invalid and said in words by the field’s error, and in the high-contrast scheme the rail is a white channel with a black edge so the fill is still visible inside it.',
    ],
    snippets: [
      defineSnippet({
        id: 'slider-angular-anatomy',
        language: 'angular',
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
      <div data-part="indicator" style="--_start: 0; --_end: 40"></div>
      <span data-part="mark" data-edge="start" style="--_position: 0">
        <span data-part="mark-label">Baixo</span>
      </span>
      <div data-part="thumb" data-index="0" style="--_position: 40">
        <input data-part="input" type="range" min="0" max="100" value="40" />
        <span data-part="bubble" aria-hidden="true">40%</span>
      </div>
    </div>
  </div>
</div>`,
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
