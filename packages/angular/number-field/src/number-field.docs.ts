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

export const ANGULAR_NUMBER_FIELD_TOKENS = numberFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Number Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideNumberFieldDefaults,\n  SlNumberField,\n  SlNumberFieldEnd,\n  SlNumberFieldInput,\n  SlNumberFieldScrub,\n  SlNumberFieldStart,\n} from '@slotted/angular/number-field';",
  selector: '[slNumberField]',
  exportAs: 'slNumberField',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slNumberField',
    required: true,
    purpose:
      'The frame. It carries data-ui="number-field", data-size, data-variant and data-stepper, and data-disabled, data-invalid, data-readonly and data-scrubbing while they apply. It has no role: a spinbutton may hold only non-interactive children, so the two buttons are siblings of the input inside a box that announces nothing.',
  },
  {
    part: 'input',
    element: 'input[slNumberFieldInput], as text with role="spinbutton"',
    required: true,
    purpose:
      'The control. It holds the formatted text, the id, and aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext, and it is a ControlValueAccessor, so it binds to a reactive or template-driven form as it stands. It is type="text" because type="number" empties itself whenever the text is not a plain decimal number, so no grouping separator or currency symbol would survive it.',
  },
  {
    part: 'start',
    element: 'any element carrying slNumberFieldStart',
    required: false,
    purpose:
      'Content before the value in the reading direction. It sits beside the number and is never selected, copied or parsed with it. A symbol that belongs inside the value comes from format instead.',
  },
  {
    part: 'end',
    element: 'any element carrying slNumberFieldEnd',
    required: false,
    purpose: 'Content after the value in the reading direction, such as a unit or a currency code.',
  },
  {
    part: 'scrub',
    element: 'any element carrying slNumberFieldScrub, inside an adornment',
    required: false,
    purpose:
      'A mark that moves the value when it is dragged sideways: one step per sensitivity pixels towards the inline end, largeStep with Shift and smallStep with Alt. The mark and the frame carry data-scrubbing while it is dragged. It is hidden from assistive technology, because the arrow keys in the input make the same change.',
  },
  {
    part: 'stepper',
    element: 'span, rendered by the frame',
    required: false,
    purpose:
      'The column that holds both buttons under stepper="stacked", inset from the frame and drawn without a border of its own; each button takes the inset back as hit area. It is not rendered under split, where the buttons are direct children of the frame.',
  },
  {
    part: 'decrement',
    element: 'button[type=button][tabindex=-1], rendered by the frame',
    required: false,
    purpose:
      'Steps down by step, by largeStep with Shift and by smallStep with Alt, and repeats while it is held. It is disabled at min, and it is out of the tab order because the arrow keys in the input make the same change.',
  },
  {
    part: 'increment',
    element: 'button[type=button][tabindex=-1], rendered by the frame',
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
      id: 'number-field-angular-playground',
      language: 'angular',
      label: 'A quantity, its label and its help',
      source: `<div slField>
  <label slFieldLabel>Quantidade</label>
  <div slNumberField>
    <input slNumberFieldInput defaultValue="3" min="1" max="99" />
  </div>
  <span slFieldDescription>Maximum of 99 units per order.</span>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the control takes the field’s rather than its own: a small field holding a medium control is a field and a control disagreeing about one row.',
    snippet: defineSnippet({
      id: 'number-field-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<div slNumberField size="sm"><input slNumberFieldInput defaultValue="8" /></div>
<div slNumberField size="md"><input slNumberFieldInput defaultValue="12" /></div>
<div slNumberField size="lg"><input slNumberFieldInput defaultValue="24" /></div>

<!-- Inside a field the field decides, and the control follows. -->
<div slField size="sm">
  <div slNumberField><input slNumberFieldInput defaultValue="4" /></div>
</div>`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame the control shows',
    note: 'outline takes the ground it is placed on, subtle sinks into the page, and plain shows nothing until the pointer or the caret arrives — which is what a dense table cell of amounts needs.',
    snippet: defineSnippet({
      id: 'number-field-angular-variants',
      language: 'angular',
      label: 'Three frames, one box',
      source: `<div slNumberField variant="outline"><input slNumberFieldInput defaultValue="1480" /></div>
<div slNumberField variant="subtle"><input slNumberFieldInput defaultValue="1480" /></div>

<!-- A cell that is only a control while it is being used. -->
<div slNumberField variant="plain" stepper="none">
  <input slNumberFieldInput defaultValue="1480" />
</div>`,
    }),
  },
  {
    id: 'stepper',
    title: 'Where the two buttons sit, and whether they sit at all',
    note: 'stacked is one column at the inline end; split puts decrement and increment at either end of the frame with the value centerd between them, which is the only arrangement whose targets clear 24 pixels in both axes.',
    snippet: defineSnippet({
      id: 'number-field-angular-stepper',
      language: 'angular',
      label: 'A form field, a quantity picker, and a table cell',
      source: `<div slNumberField stepper="stacked"><input slNumberFieldInput defaultValue="12" /></div>

<!-- The arrangement a thumb can hit, and the one a quantity wants. -->
<div slNumberField stepper="split">
  <input slNumberFieldInput defaultValue="3" min="1" max="99" />
</div>

<!-- Typed and never spun, which is what a dense table asks for. -->
<div slNumberField stepper="none"><input slNumberFieldInput defaultValue="1480" /></div>`,
    }),
  },
  {
    id: 'range',
    title: 'The bounds, the step, and what happens at the edge',
    note: 'The stepper that would leave the range is disabled rather than silently inert. Type 400 into the first control and tab away: clamp="blur" brings it back, while clamp="none" leaves it where you put it and says so.',
    snippet: defineSnippet({
      id: 'number-field-angular-range',
      language: 'angular',
      label: 'Bounds, steps and the three clamp policies',
      source: `<div slNumberField>
  <input slNumberFieldInput defaultValue="5" min="0" max="10" step="1" />
</div>

<!-- Shift and the page keys move by largeStep, Alt by smallStep. -->
<div slNumberField>
  <input slNumberFieldInput defaultValue="0" step="5" largeStep="25" smallStep="0.5" />
</div>

<!-- strict refuses the keystroke; none keeps the value and reports it. -->
<div slNumberField><input slNumberFieldInput min="0" max="100" clamp="strict" /></div>
<div slNumberField><input slNumberFieldInput min="0" max="100" clamp="none" /></div>`,
    }),
  },
  {
    id: 'format',
    title: 'Currency, percent and unit are formattings, not types',
    note: 'One numeric value, written by Intl.NumberFormat. The symbol inside the value comes from format and is part of what a reader copies; a symbol beside the value is an adornment instead, and the two sit side by side below.',
    snippet: defineSnippet({
      id: 'number-field-angular-format',
      language: 'angular',
      label: 'The same number, written three ways',
      source: `<div slNumberField>
  <input slNumberFieldInput defaultValue="1480" [format]="{ style: 'currency', currency: 'BRL' }" />
</div>
<div slNumberField>
  <input slNumberFieldInput defaultValue="0.125" [format]="{ style: 'percent' }" />
</div>

<!-- Precision is maximumFractionDigits, not an input of its own. -->
<div slNumberField>
  <input slNumberFieldInput defaultValue="1.5" [format]="{ maximumFractionDigits: 0 }" />
</div>`,
    }),
  },
  {
    id: 'formatOn',
    title: 'When the grouping appears',
    note: 'The two amounts below are the same under both settings; the axis decides only what the field shows between two keystrokes. The number itself moves on every keystroke that parses either way.',
    snippet: defineSnippet({
      id: 'number-field-angular-format-on',
      language: 'angular',
      label: 'Regrouped as it is typed, or held until the commit',
      source: `<!-- The default. The caret stays on the character it was on, because it is
     counted in the reader's own characters rather than in string indices. -->
<div slNumberField><input slNumberFieldInput locale="pt-BR" /></div>

<!-- The reader's own text until blur, Enter, a stepper press or a key step.
     For an amount that is pasted and audited rather than typed. -->
<div slNumberField>
  <input slNumberFieldInput locale="pt-BR" formatOn="commit" />
</div>

<!-- Rounding and padding belong to the commit under both: 1,50 keeps its
     nought while it is being typed, and 1, keeps its separator. -->`,
    }),
  },
  {
    id: 'locale',
    title: 'The separator, the grouping and the numerals',
    note: 'Paste “R$ 1.480,00” into the Brazilian control and “١٬٤٨٠” into the Arabic one: both parse, because the parser is built from the same Intl parts the formatter writes with.',
    snippet: defineSnippet({
      id: 'number-field-angular-locale',
      language: 'ts',
      label: 'One number, three locales, one application decision',
      source: `// Per control, when one amount really is written differently.
// <input slNumberFieldInput locale="pt-BR" defaultValue="1480.5" />

// Set once for the application rather than per amount.
bootstrapApplication(App, {
  providers: [provideSlotted({ locale: 'pt-BR' })],
});`,
    }),
  },
  {
    id: 'adornments',
    title: 'What sits beside the number',
    note: 'start and end name the reading direction rather than a side, and neither is ever squeezed: the value gives up width first. Switch the toolbar to rtl and the mark stays before the amount.',
    snippet: defineSnippet({
      id: 'number-field-angular-adornments',
      language: 'angular',
      label: 'A mark before the value and a unit after it',
      source: `<div slNumberField>
  <span slNumberFieldStart>R$</span>
  <input slNumberFieldInput defaultValue="1480" locale="pt-BR" />
  <span slNumberFieldEnd>BRL</span>
</div>

<!-- A directive on the consumer's own element, so an icon keeps its own
     semantics and its own attributes. -->
<div slNumberField>
  <input slNumberFieldInput defaultValue="240" min="0" />
  <span slNumberFieldEnd>un</span>
</div>`,
    }),
  },
  {
    id: 'scrub',
    title: 'Drag the mark to move the number',
    note: 'The design tools’ gesture. Press the mark and drag sideways: two pixels per step, Shift for the large step, Alt for the small one. A right-to-left document steps up towards the left, the inline end.',
    snippet: defineSnippet({
      id: 'number-field-angular-scrub',
      language: 'angular',
      label: 'A width and an angle, each with its mark',
      source: `<div slNumberField>
  <span slNumberFieldStart><span slNumberFieldScrub>L</span></span>
  <input slNumberFieldInput aria-label="Largura" defaultValue="320" min="0" />
  <span slNumberFieldEnd>px</span>
</div>

<div slNumberField>
  <span slNumberFieldStart><span slNumberFieldScrub [sensitivity]="4">A</span></span>
  <input slNumberFieldInput aria-label="Angle" defaultValue="45" min="0" max="360" />
  <span slNumberFieldEnd>°</span>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'The states the frame paints',
    note: 'Read-only keeps full-strength ink and softens its edge, because the value is real and still submitted; disabled is muted to a measured color rather than faded, and both withdraw the steppers by disabling them rather than removing them.',
    snippet: defineSnippet({
      id: 'number-field-angular-states',
      language: 'angular',
      label: 'Every state unset by default, and native where the word means native',
      source: `<!-- Unstated rather than false, so the control defers to its field. -->
<div slNumberField><input slNumberFieldInput defaultValue="120" invalid /></div>
<div slNumberField><input slNumberFieldInput defaultValue="12" readOnly /></div>
<div slNumberField><input slNumberFieldInput defaultValue="12" disabled /></div>

<!-- A form that disables the control disables it here too, through
     setDisabledState on the ControlValueAccessor. -->
<div slNumberField><input slNumberFieldInput [formControl]="quantity" /></div>`,
    }),
  },
  {
    id: 'content',
    title: 'Numbers the family did not choose',
    note: 'A value longer than the control ellipsises rather than clipping mid-glyph; a negative keeps its sign in front of the digits in both directions; and at 240 pixels the value surrenders width while the steppers keep their target size.',
    snippet: defineSnippet({
      id: 'number-field-angular-content',
      language: 'angular',
      label: 'Long, negative and right-to-left',
      source: `<div slNumberField>
  <input slNumberFieldInput defaultValue="1480320559774.25" locale="pt-BR" />
</div>

<!-- The digits are tabular, so nothing shifts as they are typed over,
     and the minus stays in front of the amount in an Arabic document. -->
<div slNumberField>
  <span slNumberFieldStart>R$</span>
  <input slNumberFieldInput defaultValue="-1480" locale="pt-BR" />
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, reaching past it, and putting it in a form',
    note: 'ControlValueAccessor is the two-way binding the ecosystem expects; exportAs hands the template the directive, which carries increment(), decrement() and the native element; name submits the raw number through a hidden input.',
    snippet: defineSnippet({
      id: 'number-field-angular-composition',
      language: 'angular',
      label: 'A reactive form, an instance, and a hidden input',
      source: `<div slNumberField>
  <input slNumberFieldInput [formControl]="quantity" min="1" max="99" />
</div>

<div slNumberField>
  <input slNumberFieldInput #campo="slNumberFieldInput" defaultValue="3" />
</div>
<button type="button" (click)="campo.increment()">Mais um</button>

<!-- The hidden input carries 1480, never "R$ 1.480,00". -->
<div slNumberField>
  <input
    slNumberFieldInput
    name="amount"
    defaultValue="1480"
    [format]="{ style: 'currency', currency: 'BRL' }"
  />
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and what it deliberately does not',
    note: 'Arrows step, Shift and the page keys move by the large amount, Alt by the small one, Home and End reach the bounds. Tab never lands on a stepper: twenty amounts in a form would be forty extra stops.',
    snippet: defineSnippet({
      id: 'number-field-angular-keyboard',
      language: 'angular',
      label: 'Every key the pattern lists, and the wheel that is not bound',
      source: `<!-- ArrowUp/ArrowDown: step. Shift or PageUp/PageDown: largeStep.
     Alt: smallStep. Home: min. End: max. Enter: commits, then submits. -->
<div slNumberField>
  <input
    slNumberFieldInput
    defaultValue="50"
    min="0"
    max="100"
    step="5"
    largeStep="25"
    smallStep="0.5"
  />
</div>

<!-- The wheel is not bound unless it is asked for. -->
<div slNumberField><input slNumberFieldInput defaultValue="50" wheel /></div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'ChangeRequest<number | null>',
    when: 'Before the value changes. value is the new number and previous the number it replaces. reason is keyboard for typing, an arrow, a page key, Home, End or Enter; pointer for a stepper press, a wheel turn or a scrub; blur for the commit that formats, rounds and clamps on blur; programmatic for increment() and decrement(). source is the originating event, and cancel() refuses the change before it is applied. There is no [(value)], because a two-way binding carries only the value, without the reason or cancel().',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'writeValue, registerOnChange, registerOnTouched, setDisabledState',
    when: 'Whenever a reactive or template-driven form reads or writes the input. The form receives the number, never the formatted text, and a disabled form control disables the input and both buttons.',
  },
  {
    name: 'the element’s own events',
    payload: '(input), (keydown), (blur), (focus)',
    when: 'Whenever the input fires them. Your listener runs alongside the directive’s, and calling preventDefault() on a key stops the directive from acting on it.',
  },
];

export const ANGULAR_NUMBER_FIELD_DOCS = {
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
        'input[slNumberFieldInput]',
        'Makes the value controlled for the life of the component. null is empty, and empty is not zero: a required amount left blank and an amount of zero are different values.',
      ],
      [
        'defaultValue',
        'number | null',
        '—',
        'input[slNumberFieldInput]',
        'The value an uncontrolled number field starts from. It is read once, in ngOnInit, because Angular binds inputs after it creates the directives.',
      ],
      [
        'min',
        'number',
        '—',
        'input[slNumberFieldInput]',
        'The smallest value. The decrement button is disabled at it, Home moves to it, and the snapToStep grid is counted from it.',
      ],
      [
        'max',
        'number',
        '—',
        'input[slNumberFieldInput]',
        'The largest value. The increment button is disabled at it, and End moves to it.',
      ],
      [
        'step',
        'number',
        '1',
        'input[slNumberFieldInput]',
        'What the arrow keys and the two buttons add or subtract.',
      ],
      [
        'largeStep',
        'number',
        'step × 10',
        'input[slNumberFieldInput]',
        'What Shift with an arrow, Page Up and Page Down add or subtract, so a wide range is crossed without holding a key.',
      ],
      [
        'smallStep',
        'number',
        'step ÷ 10',
        'input[slNumberFieldInput]',
        'What Alt with an arrow adds or subtracts.',
      ],
      [
        'stepFrom',
        'number',
        'min, or 0',
        'input[slNumberFieldInput]',
        'The value the first step produces when the number field is empty.',
      ],
      [
        'snapToStep',
        'boolean',
        'false',
        'input[slNumberFieldInput]',
        'Steps to multiples of step counted from min, so with min 2 and step 3 the values are 2, 5, 8 and 11. A typed value moves to the nearest multiple when the number field commits.',
      ],
      [
        'clamp',
        "'blur' | 'strict' | 'none'",
        'blur',
        'input[slNumberFieldInput], provideNumberFieldDefaults',
        'What happens to a value outside min and max. blur returns it to the range when the number field commits, strict refuses the keystroke that would leave the range, and none keeps the value and sets aria-invalid and data-invalid while it is out of range.',
      ],
      [
        'format',
        'Intl.NumberFormatOptions',
        '—',
        'input[slNumberFieldInput]',
        'How the value is written and read back. Currency, percent and unit are formats of one number, and precision is set with minimumFractionDigits and maximumFractionDigits. When the number field commits, the number is rounded to the precision the input shows.',
      ],
      [
        'formatOn',
        "'change' | 'commit'",
        'change',
        'input[slNumberFieldInput], provideNumberFieldDefaults',
        'When the text takes the format. change regroups it on every keystroke; commit keeps the typed text until blur, Enter, a stepper press or an arrow key. Under both, the number changes on every keystroke that parses.',
      ],
      [
        'locale',
        'string',
        'the locale of provideSlotted, then en-US',
        'input[slNumberFieldInput]',
        'A BCP 47 tag. It sets the decimal separator, the grouping and the digits, for the text written and the text read back.',
      ],
      [
        'stepper',
        "'stacked' | 'split' | 'none'",
        'stacked',
        '[slNumberField], provideNumberFieldDefaults',
        'Where the two buttons sit. split places them at either end of the frame, and its targets are at least 24 CSS pixels in both directions; none removes them.',
      ],
      [
        'wheel',
        'boolean',
        'false',
        'input[slNumberFieldInput]',
        'Lets the mouse wheel step the value while the input has focus and the pointer is over it. It is off by default, so scrolling a form never changes an amount.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        '[slNumberField], provideNumberFieldDefaults',
        'The step of the control scale. When unset, the number field takes the size of its field, then of provideNumberFieldDefaults. Height, padding, type and glyphs come from the control scale the theme sets per density.',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        '[slNumberField], provideNumberFieldDefaults',
        'How much frame the number field draws. plain draws no border at rest and keeps the same box, for a dense table cell.',
      ],
      [
        'start',
        'slNumberFieldStart',
        '—',
        'any projected element',
        'Content before the value in the reading direction. It is never selected, copied or parsed with the number.',
      ],
      [
        'end',
        'slNumberFieldEnd',
        '—',
        'any projected element',
        'Content after the value in the reading direction.',
      ],
      [
        'sensitivity',
        'number',
        '2',
        'slNumberFieldScrub',
        'Pixels of horizontal drag per step. Use fewer pixels for a wide range and more for a fine one.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'input[slNumberFieldInput]',
        'Unset rather than false, so the number field follows the field around it. When set, it wins over the field and writes the native disabled, which removes the input from the tab order and from form submission. A disabled form control sets it too.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'input[slNumberFieldInput]',
        'Unset rather than false, so the number field follows the field around it. Writes the native readonly: the input stays focusable, selectable and submitted, and both buttons are disabled.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'input[slNumberFieldInput]',
        'Unset rather than false, so the number field follows the field around it. Writes aria-invalid on the input and data-invalid on the frame.',
      ],
      [
        'required',
        'boolean',
        '—',
        'input[slNumberFieldInput]',
        'The element’s own attribute, written only by you. Inside a required field, the input receives aria-required instead, because the native attribute turns on the browser’s constraint validation.',
      ],
      [
        'name / form',
        'string',
        '—',
        'input[slNumberFieldInput]',
        'Read as static attributes and moved to a hidden input beside the visible one, which submits the raw number: 1480, not "$1,480.00".',
      ],
      [
        'messages',
        'Partial<NumberFieldMessages>',
        '—',
        '[slNumberField]',
        'Replaces words of the active language, key by key: increment and decrement are the accessible names of the two buttons.',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        "'slNumberField' / 'slNumberFieldInput'",
        '—',
        'both directives',
        'Hands the directive instance to the template. The input’s instance exposes inputElement, which has focus(), select() and setSelectionRange(), and increment() and decrement(), which move by one step within the bounds and report the reason programmatic.',
      ],
      [
        'ControlValueAccessor',
        'NG_VALUE_ACCESSOR',
        '—',
        'input[slNumberFieldInput]',
        'Binds the input to a reactive or template-driven form, which receives the number rather than the formatted text. The directive provides no validator: min and max are reported through aria-invalid only under clamp="none", and when an error is shown is the form’s decision.',
      ],
      [
        'ng-content',
        '[slNumberFieldStart], [slNumberFieldEnd], the input',
        '—',
        '[slNumberField]',
        'Projects your own elements into three slots, so a span, an icon or a kbd keeps its own semantics. The frame is a directive on your own element.',
      ],
      [
        'provideNumberFieldDefaults',
        '{ size, variant, stepper, formatOn, clamp }',
        '—',
        'an injector',
        'Sets size, variant, stepper, formatOn and clamp once for every number field under the injector. A number field that states a value keeps it. The locale comes from provideSlotted, so every amount in the application is written and read the same way.',
      ],
      [
        'HostAttributeToken',
        'id, name, form, inputmode, aria-describedby, aria-invalid, aria-required, readonly',
        '—',
        'input[slNumberFieldInput]',
        'Each is read before the host bindings run, so a static attribute you write is never overwritten.',
      ],
    ]),
    accessibility: [
      'SlNumberField follows the WAI-ARIA APG Spinbutton pattern: role="spinbutton" on the input with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext, ArrowUp and ArrowDown to step, Home and End to reach the bounds, and Page Up and Page Down for the larger step.',
      'aria-valuetext carries the formatted text, so a screen reader announces "$1,480.00" rather than 1480. When the number field is empty, neither aria-valuenow nor aria-valuetext is set: no value is not the value zero.',
      'The frame has no role. WAI-ARIA requires the children of a spinbutton to be non-interactive, so the two buttons are siblings of the input inside a box that announces nothing.',
      'The buttons are out of the tab order, as the APG pattern recommends, and stay in the accessibility tree with translatable names and aria-controls pointing at the input. A button at a bound is disabled, so its name is still announced and its appearance shows why it does nothing.',
      'Inside a required field the input receives aria-required, never the native required, which would turn on the browser’s constraint validation. disabled and readonly are the native attributes.',
      'The input is type="text", and its inputmode comes from the inputs: numeric for a whole number at or above zero, decimal when the format allows a fraction, and text when min allows a negative, because neither numeric keypad offers a minus sign on every platform.',
      'The mouse wheel is not bound unless wheel is set, and Escape is not bound at all, so scrolling a form never changes an amount.',
    ],
    snippets: [
      defineSnippet({
        id: 'number-field-angular-anatomy',
        language: 'angular',
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
    <button data-part="increment" type="button" tabindex="-1" aria-label="Increase">
      <span data-ui="icon" data-part="root" aria-hidden="true"
        ><svg data-part="glyph" data-glyph="chevron-down" aria-hidden="true"></svg
      ></span>
    </button>
    <button data-part="decrement" type="button" tabindex="-1" aria-label="Decrease">
      <span data-ui="icon" data-part="root" aria-hidden="true"
        ><svg data-part="glyph" data-glyph="chevron-down" aria-hidden="true"></svg
      ></span>
    </button>
  </span>
  <input type="hidden" name="amount" value="1480" />
</div>`,
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
