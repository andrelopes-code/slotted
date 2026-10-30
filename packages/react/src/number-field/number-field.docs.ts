import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import numberFieldTokens from '@slotted/styles/number-field/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_NUMBER_FIELD_TOKENS = numberFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Number Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import { NumberField, NumberFieldDefaultsProvider, NumberFieldScrub } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame. It carries data-ui="number-field", data-size, data-variant and data-stepper, and data-disabled, data-invalid, data-readonly and data-scrubbing while they apply. It has no role: a spinbutton may hold only non-interactive children, so the two buttons are siblings of the input inside a box that announces nothing. className and style reach this element.',
  },
  {
    part: 'input',
    element: 'input[type=text][role=spinbutton]',
    required: true,
    purpose:
      'The control. It holds the formatted text, the id, and aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext. It is type="text" because type="number" empties itself whenever the text is not a plain decimal number, so no grouping separator or currency symbol would survive it. ref reaches this element.',
  },
  {
    part: 'start',
    element: 'span',
    required: false,
    purpose:
      'Content before the value in the reading direction. It sits beside the number and is never selected, copied or parsed with it. A symbol that belongs inside the value comes from format instead.',
  },
  {
    part: 'end',
    element: 'span',
    required: false,
    purpose: 'Content after the value in the reading direction, such as a unit or a currency code.',
  },
  {
    part: 'scrub',
    element: 'span (NumberFieldScrub)',
    required: false,
    purpose:
      'A mark in start or end that moves the value when it is dragged sideways: one step per sensitivity pixels towards the inline end, largeStep with Shift and smallStep with Alt. The mark and the frame carry data-scrubbing while it is dragged. It is hidden from assistive technology, because the arrow keys in the input make the same change.',
  },
  {
    part: 'stepper',
    element: 'span',
    required: false,
    purpose:
      'The column that holds both buttons under stepper="stacked", inset from the frame and drawn without a border of its own; each button takes the inset back as hit area. It is not rendered under split, where the buttons are direct children of the frame.',
  },
  {
    part: 'decrement',
    element: 'button[type=button][tabindex=-1]',
    required: false,
    purpose:
      'Steps down by step, by largeStep with Shift and by smallStep with Alt, and repeats while it is held. It is disabled at min, and it is out of the tab order because the arrow keys in the input make the same change.',
  },
  {
    part: 'increment',
    element: 'button[type=button][tabindex=-1]',
    required: false,
    purpose:
      'Steps up by the same amounts and is disabled at max. Both buttons carry a translatable accessible name and aria-controls pointing at the input.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Type a number, then hold the increment button: it steps once, waits, and then repeats.',
    snippet: defineSnippet({
      id: 'number-field-react-playground',
      language: 'tsx',
      label: 'A quantity, its label and its help',
      source: `<Field>
  <FieldLabel>Quantity</FieldLabel>
  <NumberField defaultValue={3} max={99} min={1} />
  <FieldDescription>Maximum of 99 units per order.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the control takes the field’s rather than its own: a small field holding a medium control is a field and a control disagreeing about one row.',
    snippet: defineSnippet({
      id: 'number-field-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<NumberField defaultValue={8} size="sm" />;
<NumberField defaultValue={12} size="md" />;
<NumberField defaultValue={24} size="lg" />;

// Inside a field the field decides, and the control follows.
<Field size="sm">
  <NumberField defaultValue={4} />
</Field>;`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame the control shows',
    note: 'outline takes the ground it is placed on, subtle sinks into the page, and plain shows nothing until the pointer or the caret arrives — which is what a dense table cell of amounts needs.',
    snippet: defineSnippet({
      id: 'number-field-react-variants',
      language: 'tsx',
      label: 'Three frames, one box',
      source: `<NumberField defaultValue={1480} variant="outline" />;
<NumberField defaultValue={1480} variant="subtle" />;

// A cell that is only a control while it is being used. The box never
// changes, so the row does not reflow when the pointer crosses it.
<NumberField defaultValue={1480} stepper="none" variant="plain" />;`,
    }),
  },
  {
    id: 'stepper',
    title: 'Where the two buttons sit, and whether they sit at all',
    note: 'stacked is one column at the inline end; split puts decrement and increment at either end of the frame with the value centerd between them, which is the only arrangement whose targets clear 24 pixels in both axes.',
    snippet: defineSnippet({
      id: 'number-field-react-stepper',
      language: 'tsx',
      label: 'A form field, a quantity picker, and a table cell',
      source: `<NumberField defaultValue={12} stepper="stacked" />;

// The arrangement a thumb can hit, and the one a quantity wants.
<NumberField defaultValue={3} max={99} min={1} stepper="split" />;

// Typed and never spun, which is what a dense table asks for.
<NumberField defaultValue={1480} stepper="none" />;`,
    }),
  },
  {
    id: 'range',
    title: 'The bounds, the step, and what happens at the edge',
    note: 'The stepper that would leave the range is disabled rather than silently inert. Type 400 into the first control and tab away: clamp="blur" brings it back, while clamp="none" leaves it where you put it and says so.',
    snippet: defineSnippet({
      id: 'number-field-react-range',
      language: 'tsx',
      label: 'Bounds, steps and the three clamp policies',
      source: `<NumberField defaultValue={5} max={10} min={0} step={1} />;

// Shift and the page keys move by largeStep, Alt by smallStep.
<NumberField defaultValue={0} largeStep={25} smallStep={0.5} step={5} />;

// strict refuses the keystroke; none keeps the value and reports it.
<NumberField clamp="strict" max={100} min={0} />;
<NumberField clamp="none" max={100} min={0} />;`,
    }),
  },
  {
    id: 'format',
    title: 'Currency, percent and unit are formattings, not types',
    note: 'One numeric value, written by Intl.NumberFormat. The symbol inside the value comes from format and is part of what a reader copies; a symbol beside the value is an adornment instead, and the two sit side by side below.',
    snippet: defineSnippet({
      id: 'number-field-react-format',
      language: 'tsx',
      label: 'The same number, written four ways',
      source: `<NumberField defaultValue={1480} format={{ currency: 'BRL', style: 'currency' }} />;
<NumberField defaultValue={0.125} format={{ style: 'percent' }} />;
<NumberField
  defaultValue={240}
  format={{ style: 'unit', unit: 'kilogram', unitDisplay: 'short' }}
/>;

// Precision is maximumFractionDigits, not a prop of its own.
<NumberField defaultValue={1.5} format={{ maximumFractionDigits: 0 }} />;`,
    }),
  },
  {
    id: 'formatOn',
    title: 'When the grouping appears',
    note: 'The two amounts below are the same under both settings; the axis decides only what the field shows between two keystrokes. The number itself moves on every keystroke that parses either way.',
    snippet: defineSnippet({
      id: 'number-field-react-format-on',
      language: 'tsx',
      label: 'Regrouped as it is typed, or held until the commit',
      source: `// The default. The caret stays on the character it was on, because it is
// counted in the reader's own characters rather than in string indices.
<NumberField locale="pt-BR" />;

// The reader's own text until blur, Enter, a stepper press or a key step.
// For an amount that is pasted and audited rather than typed.
<NumberField formatOn="commit" locale="pt-BR" />;

// Rounding and padding belong to the commit under both: 1,50 keeps its
// nought while it is being typed, and 1, keeps its separator.`,
    }),
  },
  {
    id: 'locale',
    title: 'The separator, the grouping and the numerals',
    note: 'Paste “R$ 1.480,00” into the Brazilian control and “١٬٤٨٠” into the Arabic one: both parse, because the parser is built from the same Intl parts the formatter writes with.',
    snippet: defineSnippet({
      id: 'number-field-react-locale',
      language: 'tsx',
      label: 'One number, three locales, one application decision',
      source: `<NumberField defaultValue={1480.5} locale="pt-BR" />; // 1.480,5
<NumberField defaultValue={1480.5} locale="en-US" />; // 1,480.5
<NumberField defaultValue={1480.5} locale="ar-EG" />; // ١٬٤٨٠٫٥

// Set once for the application rather than per amount.
<SlottedProvider locale="pt-BR">
  <OrderForm />
</SlottedProvider>;`,
    }),
  },
  {
    id: 'adornments',
    title: 'What sits beside the number',
    note: 'start and end name the reading direction rather than a side, and neither is ever squeezed: the value gives up width first. Switch the toolbar to rtl and the mark stays before the amount.',
    snippet: defineSnippet({
      id: 'number-field-react-adornments',
      language: 'tsx',
      label: 'A mark before the value and a unit after it',
      source: `<NumberField defaultValue={1480} end="BRL" start="R$" />;

// Anything renders: an icon, a kbd, a select.
<NumberField
  defaultValue={240}
  end="un"
  start={
    <Icon>
      <Package />
    </Icon>
  }
/>;`,
    }),
  },
  {
    id: 'scrub',
    title: 'Drag the mark to move the number',
    note: 'The design tools’ gesture. Press the mark and drag sideways: two pixels per step, Shift for the large step, Alt for the small one. A right-to-left document steps up towards the left, the inline end.',
    snippet: defineSnippet({
      id: 'number-field-react-scrub',
      language: 'tsx',
      label: 'A width, an angle and an opacity, each with its mark',
      source: `<NumberField defaultValue={320} end="px" min={0} start={<NumberFieldScrub>L</NumberFieldScrub>} />;

<NumberField
  defaultValue={45}
  end="°"
  max={360}
  min={0}
  start={<NumberFieldScrub sensitivity={4}>A</NumberFieldScrub>}
/>;`,
    }),
  },
  {
    id: 'states',
    title: 'The states the frame paints',
    note: 'Read-only keeps full-strength ink and softens its edge, because the value is real and still submitted; disabled is muted to a measured color rather than faded, and both withdraw the steppers by disabling them rather than removing them.',
    snippet: defineSnippet({
      id: 'number-field-react-states',
      language: 'tsx',
      label: 'Every state unset by default, and native where the word means native',
      source: `// Unstated rather than false, so the control defers to its field.
<NumberField defaultValue={120} invalid />;
<NumberField defaultValue={12} readOnly />;
<NumberField defaultValue={12} disabled />;

// A control inside a disabled fieldset is painted too, because the
// stylesheet matches :disabled beside the attribute.`,
    }),
  },
  {
    id: 'content',
    title: 'Numbers the family did not choose',
    note: 'A value longer than the control ellipsises rather than clipping mid-glyph; a negative keeps its sign in front of the digits in both directions; and at 240 pixels the value surrenders width while the steppers keep their target size.',
    snippet: defineSnippet({
      id: 'number-field-react-content',
      language: 'tsx',
      label: 'Long, negative and right-to-left',
      source: `<NumberField defaultValue={1480320559774.25} locale="pt-BR" />;

// The digits are tabular, so nothing shifts as they are typed over,
// and the minus stays in front of the amount in an Arabic document.
<NumberField defaultValue={-1480} end="BRL" locale="pt-BR" start="R$" />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, reaching past it, and putting it in a form',
    note: 'The provider carries the five decisions an application takes once; ref reaches the element and handle reaches the two actions a value cannot express; name submits the raw number through a hidden input rather than the formatted string.',
    snippet: defineSnippet({
      id: 'number-field-react-composition',
      language: 'tsx',
      label: 'A provider, a handle, and a form',
      source: `<NumberFieldDefaultsProvider stepper="split">
  <NumberField defaultValue={3} />
</NumberFieldDefaultsProvider>;

const handle = useRef<NumberFieldHandle>(null);
<NumberField handle={handle} />;
<Button onClick={() => handle.current?.increment()}>Mais um</Button>;

// The hidden input carries 1480, never "R$ 1.480,00".
<NumberField format={{ currency: 'BRL', style: 'currency' }} name="amount" />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and what it deliberately does not',
    note: 'Arrows step, Shift and the page keys move by the large amount, Alt by the small one, Home and End reach the bounds. Tab never lands on a stepper: twenty amounts in a form would be forty extra stops.',
    snippet: defineSnippet({
      id: 'number-field-react-keyboard',
      language: 'tsx',
      label: 'Every key the pattern lists, and the wheel that is not bound',
      source: `// ArrowUp/ArrowDown: step. Shift or PageUp/PageDown: largeStep.
// Alt: smallStep. Home: min. End: max. Enter: commits, then submits.
<NumberField defaultValue={0} largeStep={10} max={100} min={0} smallStep={0.1} />;

// The wheel is not bound unless it is asked for, and even then only
// while the control has focus.
<NumberField defaultValue={50} wheel />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: number | null, request: ChangeRequest<number | null>)',
    when: 'Before the value changes. request.value is the new number and request.previous the number it replaces. request.reason is keyboard for typing, an arrow, a page key, Home, End or Enter; pointer for a stepper press, a wheel turn or a scrub; blur for the commit that formats, rounds and clamps on blur; programmatic for handle.increment() and handle.decrement(). request.source is the originating event, and request.cancel() refuses the change before it is applied. A request for the number NumberField already holds is not emitted.',
  },
  {
    name: 'onChange, onBlur, onKeyDown, onFocus',
    payload: 'the element’s own events',
    when: 'Whenever the input fires them. NumberField composes your handler with its own instead of replacing it: yours runs first and always runs, and calling preventDefault() on a key stops NumberField from acting on it.',
  },
];

export const REACT_NUMBER_FIELD_DOCS = {
  numberField: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'number | null',
        '—',
        'NumberField',
        'Makes the value controlled for the life of the component. null is empty, and empty is not zero: a required amount left blank and an amount of zero are different values.',
      ],
      [
        'defaultValue',
        'number | null',
        '—',
        'NumberField',
        'The value an uncontrolled number field starts from. It is read once, and a native form reset returns to it.',
      ],
      [
        'min',
        'number',
        '—',
        'NumberField',
        'The smallest value. The decrement button is disabled at it, Home moves to it, and the snapToStep grid is counted from it.',
      ],
      [
        'max',
        'number',
        '—',
        'NumberField',
        'The largest value. The increment button is disabled at it, and End moves to it.',
      ],
      [
        'step',
        'number',
        '1',
        'NumberField',
        'What the arrow keys and the two buttons add or subtract.',
      ],
      [
        'largeStep',
        'number',
        'step × 10',
        'NumberField',
        'What Shift with an arrow, Page Up and Page Down add or subtract, so a wide range is crossed without holding a key.',
      ],
      [
        'smallStep',
        'number',
        'step ÷ 10',
        'NumberField',
        'What Alt with an arrow adds or subtracts.',
      ],
      [
        'stepFrom',
        'number',
        'min, or 0',
        'NumberField',
        'The value the first step produces when the number field is empty.',
      ],
      [
        'snapToStep',
        'boolean',
        'false',
        'NumberField',
        'Steps to multiples of step counted from min, so with min 2 and step 3 the values are 2, 5, 8 and 11. A typed value moves to the nearest multiple when the number field commits.',
      ],
      [
        'clamp',
        "'blur' | 'strict' | 'none'",
        'blur',
        'NumberField, NumberFieldDefaultsProvider',
        'What happens to a value outside min and max. blur returns it to the range when the number field commits, strict refuses the keystroke that would leave the range, and none keeps the value and sets aria-invalid and data-invalid while it is out of range.',
      ],
      [
        'format',
        'Intl.NumberFormatOptions',
        '—',
        'NumberField',
        'How the value is written and read back. Currency, percent and unit are formats of one number, and precision is set with minimumFractionDigits and maximumFractionDigits. When the number field commits, the number is rounded to the precision the input shows.',
      ],
      [
        'formatOn',
        "'change' | 'commit'",
        'change',
        'NumberField, NumberFieldDefaultsProvider',
        'When the text takes the format. change regroups it on every keystroke; commit keeps the typed text until blur, Enter, a stepper press or an arrow key. Under both, the number changes on every keystroke that parses.',
      ],
      [
        'locale',
        'string',
        'the locale of SlottedProvider, then en-US',
        'NumberField',
        'A BCP 47 tag. It sets the decimal separator, the grouping and the digits, for the text written and the text read back.',
      ],
      [
        'stepper',
        "'stacked' | 'split' | 'none'",
        'stacked',
        'NumberField, NumberFieldDefaultsProvider',
        'Where the two buttons sit. split places them at either end of the frame, and its targets are at least 24 CSS pixels in both directions; none removes them.',
      ],
      [
        'wheel',
        'boolean',
        'false',
        'NumberField',
        'Lets the mouse wheel step the value while the input has focus and the pointer is over it. It is off by default, so scrolling a form never changes an amount.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'NumberField, NumberFieldDefaultsProvider',
        'The step of the control scale. When unset, the number field takes the size of its field, then of the provider. Height, padding, type and glyphs come from the control scale the theme sets per density.',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'NumberField, NumberFieldDefaultsProvider',
        'How much frame the number field draws. plain draws no border at rest and keeps the same box, for a dense table cell.',
      ],
      [
        'start',
        'ReactNode',
        '—',
        'NumberField',
        'Content before the value in the reading direction. It is never selected, copied or parsed with the number.',
      ],
      ['end', 'ReactNode', '—', 'NumberField', 'Content after the value in the reading direction.'],
      [
        'NumberFieldScrub sensitivity',
        'number',
        '2',
        'NumberFieldScrub',
        'Pixels of horizontal drag per step. Use fewer pixels for a wide range and more for a fine one.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'NumberField',
        'Unset rather than false, so the number field follows the field around it. When set, it wins over the field and writes the native disabled, which removes the input from the tab order and from form submission.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'NumberField',
        'Unset rather than false, so the number field follows the field around it. Writes the native readonly: the input stays focusable, selectable and submitted, and both buttons are disabled.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'NumberField',
        'Unset rather than false, so the number field follows the field around it. Writes aria-invalid on the input and data-invalid on the frame.',
      ],
      [
        'required',
        'boolean',
        '—',
        'NumberField',
        'The element’s own attribute, passed through unchanged; NumberField never writes it. Inside a required field, the input receives aria-required instead, because the native attribute turns on the browser’s constraint validation.',
      ],
      [
        'name / form',
        'string',
        '—',
        'NumberField',
        'Reach a hidden input beside the visible one, which submits the raw number: 1480, not "$1,480.00".',
      ],
      [
        'messages',
        'Partial<NumberFieldMessages>',
        '—',
        'NumberField',
        'Replaces words of the active language, key by key: increment and decrement are the accessible names of the two buttons.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: NumberFieldRootProps) => ReactNode',
        '—',
        'NumberField',
        'Renders another element in place of the frame and passes it every attribute. The props are typed as HTMLAttributes<HTMLElement>, so they spread onto any element. The input and the two buttons cannot be replaced.',
      ],
      [
        'ref',
        'Ref<HTMLInputElement>',
        '—',
        'NumberField',
        'Reaches the input element. focus(), select() and setSelectionRange() are the element’s own.',
      ],
      [
        'handle',
        'Ref<NumberFieldHandle>',
        '—',
        'NumberField',
        'Reaches increment() and decrement(), for a shortcut or a button elsewhere on the page. Both move by one step within the bounds and report the reason programmatic.',
      ],
      [
        'className / style',
        'string / CSSProperties',
        '—',
        'NumberField',
        'Reach the frame. Every other native prop reaches the input.',
      ],
      [
        'NumberFieldDefaultsProvider',
        '{ size, variant, stepper, formatOn, clamp }',
        '—',
        'a subtree',
        'Sets size, variant, stepper, formatOn and clamp once for every number field under it. A number field that states a value keeps it. The locale comes from SlottedProvider, so every amount in the application is written and read the same way.',
      ],
      [
        'useField()',
        '() => FieldContextValue | undefined',
        '—',
        'inside a Field',
        'What the number field reads to wire itself: the id, the description and the four shared states.',
      ],
    ]),
    accessibility: [
      'NumberField follows the WAI-ARIA APG Spinbutton pattern: role="spinbutton" on the input with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext, ArrowUp and ArrowDown to step, Home and End to reach the bounds, and Page Up and Page Down for the larger step.',
      'aria-valuetext carries the formatted text, so a screen reader announces "$1,480.00" rather than 1480. When the number field is empty, neither aria-valuenow nor aria-valuetext is set: no value is not the value zero.',
      'The frame has no role. WAI-ARIA requires the children of a spinbutton to be non-interactive, so the two buttons are siblings of the input inside a box that announces nothing.',
      'The buttons are out of the tab order, as the APG pattern recommends, and stay in the accessibility tree with translatable names and aria-controls pointing at the input. A form of twenty amounts keeps twenty tab stops instead of sixty. A button at a bound is disabled, so its name is still announced and its appearance shows why it does nothing.',
      'Inside a required field the input receives aria-required, never the native required, which would turn on the browser’s constraint validation. disabled and readonly are the native attributes.',
      'The input is type="text", and its inputMode comes from the props: numeric for a whole number at or above zero, decimal when the format allows a fraction, and text when min allows a negative, because neither numeric keypad offers a minus sign on every platform.',
      'The mouse wheel is not bound unless wheel is set, and Escape is not bound at all, so scrolling a form never changes an amount.',
      'The invalid state is never conveyed by color alone: aria-invalid announces it and the field’s error states it in words. In the high-contrast scheme the border does not carry it.',
    ],
    snippets: [
      defineSnippet({
        id: 'number-field-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="number-field" data-part="root" data-size="md" data-stepper="stacked">
  <span data-part="start">$</span>
  <input
    data-part="input"
    type="text"
    role="spinbutton"
    id="amount-control"
    aria-valuenow="1480"
    aria-valuetext="$1,480.00"
    aria-valuemin="0"
  />
  <span data-part="end">USD</span>
  <span data-part="stepper">
    <button data-part="increment" type="button" tabIndex={-1} aria-label="Increase">
      <span data-ui="icon" data-part="root" aria-hidden="true">
        <svg data-part="glyph" data-glyph="chevron-down" aria-hidden="true"></svg>
      </span>
    </button>
    <button data-part="decrement" type="button" tabIndex={-1} aria-label="Decrease">
      <span data-ui="icon" data-part="root" aria-hidden="true">
        <svg data-part="glyph" data-glyph="chevron-down" aria-hidden="true"></svg>
      </span>
    </button>
  </span>
  <input type="hidden" name="amount" value="1480" />
</div>;`,
      }),
      defineSnippet({
        id: 'number-field-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='number-field'] {
  --slotted-number-field-border-color: var(--slotted-tone-secondary-border);
  --slotted-number-field-hover-border-color: var(--slotted-tone-accent-solid);
  --slotted-number-field-scrub-active-color: var(--slotted-tone-accent-text);
  --slotted-number-field-radius: var(--slotted-radius-md);
}`,
      }),
    ],
  },
} as const;
