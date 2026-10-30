import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import currencyFieldTokens from '@slotted/styles/currency-field/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_CURRENCY_FIELD_TOKENS = currencyFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Currency Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideCurrencyFieldDefaults,\n  SlCurrencyField,\n  SlCurrencyFieldEnd,\n  SlCurrencyFieldInput,\n  SlCurrencyFieldScrub,\n  SlCurrencyFieldStart,\n} from '@slotted/angular/currency-field';",
  selector: '[slCurrencyField]',
  exportAs: 'slCurrencyField',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slCurrencyField',
    required: true,
    purpose:
      'The frame. Carries data-ui="currency-field", the five axes — data-size, data-variant, data-entry, data-align, data-stepper — and data-disabled, data-invalid and data-readonly. It has no role: a spinbutton may hold only non-interactive children, so the two steppers are the control’s siblings.',
  },
  {
    part: 'input',
    element: 'input[slCurrencyFieldInput], as text with role="spinbutton"',
    required: true,
    purpose:
      'The control. Holds the formatted amount, the identifier, aria-valuenow in major units and aria-valuetext as the reader sees it. It is type="text" because type="number" empties itself whenever the text is not a valid floating-point number. exportAs="slCurrencyFieldInput" reaches inputElement, increment() and decrement().',
  },
  {
    part: 'symbol',
    element: 'span',
    required: false,
    purpose:
      'The currency mark at the display appearance, drawn apart from the digits on the side the locale writes it, muted at the xl step. The input then holds the amount alone and its aria-valuetext carries the mark. Absent under currencyDisplay none and at the control appearance.',
  },
  {
    part: 'start',
    element: 'the element carrying slCurrencyFieldStart',
    required: false,
    purpose:
      'An adornment before the amount in the reading direction, and a sibling of it rather than part of it. A symbol here is never selected, never copied and never parsed; a symbol that belongs inside the amount is what currency and currencyDisplay write.',
  },
  {
    part: 'end',
    element: 'the element carrying slCurrencyFieldEnd',
    required: false,
    purpose:
      'An adornment after the amount: a currency code, a period, or a consumer’s own currency picker until the select family exists.',
  },
  {
    part: 'scrub',
    element: 'any element carrying slCurrencyFieldScrub, inside an adornment',
    required: false,
    purpose:
      'A mark that moves the amount when it is dragged sideways: one step per sensitivity pixels towards the inline end, the large step with Shift, the small one with Alt. It carries data-scrubbing while dragged, as the frame does, and is hidden from assistive technology because the arrow keys on the input are the same movement.',
  },
  {
    part: 'stepper',
    element: 'span, rendered by the frame under stepper="stacked"',
    required: false,
    purpose:
      'The column the two buttons share. It is not rendered at all under stepper="none", which is this family’s default, nor under split, where the buttons are direct children of the frame.',
  },
  {
    part: 'decrement',
    element: 'button[type=button][tabindex=-1], rendered by the frame',
    required: false,
    purpose:
      'Steps down by step — one major unit by default, not one cent — by largeStep with Shift and by smallStep with Alt. Held, it repeats. Disabled at min, and out of the tab order because the arrow keys reach the same behavior from the control.',
  },
  {
    part: 'increment',
    element: 'button[type=button][tabindex=-1], rendered by the frame',
    required: false,
    purpose:
      'Steps up by the same three amounts, disabled at max. Both buttons carry a translatable name and aria-controls pointing at the amount they move.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Type 1, 2, 3, 4 without touching a separator: the digits enter at the cent and shift left.',
    snippet: defineSnippet({
      id: 'currency-field-angular-playground',
      language: 'angular',
      label: 'An amount, its label and its help',
      source: `<div slField>
  <label slFieldLabel>Order total</label>
  <div slCurrencyField>
    <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" min="0" />
  </div>
  <span slFieldDescription>Type only the digits: 1234 becomes $12.34.</span>
</div>`,
    }),
  },
  {
    id: 'entry',
    title: 'The two ways an amount is typed',
    note: 'Type 1234 into each. On the left the digits shift left from the cent, as a cash register does; on the right the text is yours until you leave the field, as a spreadsheet is — regrouped as it arrives, which is what formatOn decides and what cents-first entry has always done.',
    snippet: defineSnippet({
      id: 'currency-field-angular-entry',
      language: 'angular',
      label: 'The cash register and the spreadsheet',
      source: `<!-- The default. 1234 is R$ 12,34, the separator is never typed, and the
     caret has one legal position: after the last digit. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" entry="cents" />
</div>

<!-- The model number-field uses: the text is the reader's until a commit. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" entry="natural" />
</div>`,
    }),
  },
  {
    id: 'currency',
    title: 'The currency decides how far a digit shifts',
    note: 'Type 1234 into each of the three. A real has two minor digits, a yen none and a dinar three, so the same four keystrokes are R$ 12,34, ¥1.234 and KWD 1,234.',
    snippet: defineSnippet({
      id: 'currency-field-angular-currency',
      language: 'angular',
      label: 'Three currencies, three shifts',
      source: `<div slCurrencyField><input slCurrencyFieldInput currency="BRL" locale="pt-BR" /></div>
<div slCurrencyField><input slCurrencyFieldInput currency="JPY" locale="pt-BR" /></div>
<div slCurrencyField><input slCurrencyFieldInput currency="KWD" locale="pt-BR" /></div>

<!-- The display is an axis of its own: symbol, narrowSymbol, code or name. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="USD" locale="pt-BR" currencyDisplay="code" />
</div>`,
    }),
  },
  {
    id: 'locale',
    title: 'The currency governs; the locale writes',
    note: 'A Brazilian back office paying a US invoice: Brazilian separators around an American currency. The numbering system comes from the locale too, so an Arabic field reads back its own digits.',
    snippet: defineSnippet({
      id: 'currency-field-angular-locale',
      language: 'angular',
      label: 'Two inputs that answer two different questions',
      source: `<!-- US$ 1.480,00 — the symbol from the currency, the separators from the locale. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="USD" locale="pt-BR" defaultValue="1480" />
</div>

<!-- The same amount, written where the symbol goes last. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="EUR" locale="fr-FR" defaultValue="1480" />
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the control takes the field’s rather than its own: a small field holding a medium control is a field and a control disagreeing about one row.',
    snippet: defineSnippet({
      id: 'currency-field-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<div slCurrencyField size="sm">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="89.9" />
</div>
<div slCurrencyField size="lg">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="24900" />
</div>

<!-- Inside a field the field decides, and the control follows. -->
<div slField size="sm">
  <div slCurrencyField>
    <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="12" />
  </div>
</div>`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame the control shows',
    note: 'outline takes the ground it is placed on, subtle sinks into the page, and plain shows nothing at rest — which is what a table of amounts needs, where a border on every row would be the loudest thing on the page.',
    snippet: defineSnippet({
      id: 'currency-field-angular-variants',
      language: 'angular',
      label: 'Three frames, one box',
      source: `<div slCurrencyField variant="outline">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
</div>
<div slCurrencyField variant="subtle">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
</div>

<!-- A cell that is only a control while it is being used. -->
<div slCurrencyField variant="plain">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
</div>`,
    }),
  },
  {
    id: 'alignment',
    title: 'Which edge the amount is set against',
    note: 'Read the two columns down rather than across: aligned to the end, the cents of every row line up and a magnitude is one glance; aligned to the start, they do not.',
    snippet: defineSnippet({
      id: 'currency-field-angular-alignment',
      language: 'angular',
      label: 'A column of amounts, and a sentence with one in it',
      source: `<!-- The default: a column of amounts is compared on its last digit. -->
<div slCurrencyField align="end">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="12" />
</div>

<!-- One amount inside a form that reads as a sentence. -->
<div slCurrencyField align="start">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
</div>`,
    }),
  },
  {
    id: 'range',
    title: 'The bounds, and what happens at them',
    note: 'blur returns the amount to the range when you leave the field; strict refuses the keystroke that would leave it; none keeps what you typed and says so with aria-invalid. min="0" is also what refuses a debit.',
    snippet: defineSnippet({
      id: 'currency-field-angular-range',
      language: 'angular',
      label: 'Three policies over one range',
      source: `<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" clamp="strict" min="0" max="1000" />
</div>

<!-- A refund, where a debit is the point. There is no allowNegative: the
     range already says it, and two ways to say it can disagree. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" min="-1000" />
</div>`,
    }),
  },
  {
    id: 'stepper',
    title: 'Two buttons, when an amount is nudged rather than typed',
    note: 'Withdrawn by default: an invoice total is typed, and two buttons that move it by one real invite a mis-click that costs money. A price a reader adjusts is the case they are for.',
    snippet: defineSnippet({
      id: 'currency-field-angular-stepper',
      language: 'angular',
      label: 'The default, a column, and a pair at either end',
      source: `<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
</div>

<!-- step is one major unit, not one cent. -->
<div slCurrencyField stepper="stacked">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="25" step="1" min="0" />
</div>
<div slCurrencyField stepper="split">
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="25" min="0" />
</div>`,
    }),
  },
  {
    id: 'adornments',
    title: 'The symbol inside the amount, and the symbol beside it',
    note: 'Both are here because choosing wrongly is the mistake: the symbol from currency is selected, copied and parsed with the amount, and the one in slCurrencyFieldStart is none of those things.',
    snippet: defineSnippet({
      id: 'currency-field-angular-adornments',
      language: 'angular',
      label: 'Inside the value, and beside it',
      source: `<!-- Inside: R$ moves with the locale and is copied with the amount. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
</div>

<!-- Beside: a label rather than part of the number, never parsed. -->
<div slCurrencyField>
  <span slCurrencyFieldStart>R$</span>
  <input
    slCurrencyFieldInput
    currency="BRL"
    locale="pt-BR"
    defaultValue="1480"
    currencyDisplay="none"
  />
  <span slCurrencyFieldEnd>per month</span>
</div>`,
    }),
  },
  {
    id: 'scrub',
    title: 'Drag the symbol to move the amount',
    note: 'The sibling’s gesture on a currency mark. Press R$ and drag sideways: two pixels per step of one real, Shift for ten, Alt for ten centavos. A right-to-left document steps up towards the left, the inline end.',
    snippet: defineSnippet({
      id: 'currency-field-angular-scrub',
      language: 'angular',
      label: 'The symbol beside the amount, as the drag mark',
      source: `<div slCurrencyField>
  <span slCurrencyFieldStart><span slCurrencyFieldScrub>R$</span></span>
  <input
    slCurrencyFieldInput
    aria-label="Price"
    currency="BRL"
    currencyDisplay="none"
    locale="pt-BR"
    defaultValue="1480"
    min="0"
  />
</div>

<div slCurrencyField>
  <span slCurrencyFieldStart><span slCurrencyFieldScrub [sensitivity]="4">R$</span></span>
  <input
    slCurrencyFieldInput
    aria-label="Budget"
    currency="BRL"
    currencyDisplay="none"
    locale="pt-BR"
    defaultValue="250"
    min="0"
    max="1000"
    step="10"
  />
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the frame paints',
    note: 'Hover the first, tab into the second, then compare read-only with disabled: one keeps its ink because the amount is real and still submitted, the other mutes it because nobody can reach it.',
    snippet: defineSnippet({
      id: 'currency-field-angular-states',
      language: 'angular',
      label: 'The four states, and where each comes from',
      source: `<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" invalid />
</div>
<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" readonly />
</div>

<!-- Unstated means "ask the field": the control defers rather than
     overriding a field that is already disabled. -->
<div slField disabled>
  <label slFieldLabel>Total</label>
  <div slCurrencyField>
    <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
  </div>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'The ceiling amount, a currency written as a name, and a debit in accounting parentheses — each in a 320-pixel column, where the frame scrolls its own text and keeps the leading digits.',
    snippet: defineSnippet({
      id: 'currency-field-angular-content',
      language: 'angular',
      label: 'The longest amount, the longest name, and a debit',
      source: `<!-- Fifteen digits is where a double stops holding a cent, and the
     keystroke past it is refused rather than rounded. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="9999999999999.99" />
</div>

<!-- Intl writes ($1,234.56) and the parser reads it back as a debit. -->
<div slCurrencyField>
  <input
    slCurrencyFieldInput
    currency="USD"
    locale="en-US"
    defaultValue="-1234.56"
    min="-100000"
    [format]="{ currencySign: 'accounting' }"
  />
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, reaching past it, and putting it in a form',
    note: 'The token carries the decisions an application takes once; ControlValueAccessor puts the amount in a Reactive Form; the hidden input submits 1480.5 rather than "R$ 1.480,50".',
    snippet: defineSnippet({
      id: 'currency-field-angular-composition',
      language: 'ts',
      label: 'A provider, a form, and the integer a gateway wants',
      source: `bootstrapApplication(App, {
  providers: [
    provideSlotted({ locale: 'pt-BR' }),
    provideCurrencyFieldDefaults({ currency: 'BRL' }),
  ],
});

@Component({
  template: \`<div slCurrencyField>
    <input slCurrencyFieldInput name="total" [formControl]="total" (valueChange)="charge($event)" />
  </div>\`,
})
export class Checkout {
  readonly total = new FormControl<number | null>(1480);

  // The request carries the exact minor-unit integer, so nobody writes
  // Math.round(value * 100) — the line where a half cent is lost.
  charge(request: CurrencyChangeRequest) {
    this.gateway.charge(request.minorUnits, request.currency);
  }
}`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and what it deliberately does not',
    note: 'Digits shift left, Backspace shifts right, the minus key sets the sign without entering the digits, and the arrows step. Tab never lands on a stepper.',
    snippet: defineSnippet({
      id: 'currency-field-angular-keyboard',
      language: 'angular',
      label: 'Every key the pattern lists, and the two this family adds',
      source: `<!-- ArrowUp/ArrowDown: step. Shift or PageUp/PageDown: largeStep.
     Alt: smallStep. Home: min. End: max. Enter: commits, then submits.
     "-" and "+": the sign, never a digit. A separator is refused outright. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" min="-100000" max="100000" step="1" />
</div>

<!-- The wheel is not bound unless it is asked for, and even then only
     while the control has focus. -->
<div slCurrencyField>
  <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="50" wheel />
</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'CurrencyChangeRequest',
    when: 'Before the amount moves. The request carries the new amount in major units, the amount it replaces, the currency, minorUnits — the exact integer a payment API is charged in — the reason ("keyboard" for typing, an arrow, a page key, Home or End; "pointer" for a stepper press or a wheel turn; "blur" for the commit that formats and clamps; "programmatic" for increment()), the originating event, and cancel(), which refuses the move before anything commits. A request for the amount the family already holds is not emitted.',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'number | null',
    when: 'Whenever the amount moves, so [formControl], [(ngModel)] and a template form all receive it. setDisabledState answers a form that disables the control, and the frame paints data-disabled from it. There is no [(value)]: a two-way binding has one slot and can carry neither a reason nor cancel().',
  },
  {
    name: 'the element’s own events',
    payload: '(input), (blur), (keydown), (focus)',
    when: 'Whenever the element fires them. The directive listens on the host rather than replacing them, and a consumer’s handler that calls preventDefault() on a key stops the family from acting on it.',
  },
];

export const ANGULAR_CURRENCY_FIELD_DOCS = {
  currencyField: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'currency',
        'string',
        'from the token',
        'slCurrencyFieldInput, provideCurrencyFieldDefaults',
        'An ISO 4217 code. It decides the symbol, the minor units and therefore how far a digit shifts under cents-first entry. Required here or on the token: a field that guessed two minor digits would write ¥12,34',
      ],
      [
        'currencyDisplay',
        "'symbol' | 'narrowSymbol' | 'code' | 'name'",
        'symbol',
        'slCurrencyFieldInput, provideCurrencyFieldDefaults',
        'How the currency is written beside the amount, and none writes nothing at all: the amount becomes a plain decimal with the currency’s own fraction digits, so the symbol can live in a slCurrencyFieldStart adornment instead of inside the value. It is the one arrangement Intl has no option for',
      ],
      [
        'value',
        'number | null',
        '—',
        'slCurrencyFieldInput',
        'Present means the consumer owns the amount, for the life of the component. It is in major units — reais, not centavos — and null is empty: a required total left blank and a total of nought are different facts',
      ],
      [
        'defaultValue',
        'number | null',
        '—',
        'slCurrencyFieldInput',
        'What an uncontrolled control starts from, read once. A Reactive Form writes over it through ControlValueAccessor',
      ],
      [
        'entry',
        "'cents' | 'natural'",
        'cents',
        'slCurrencyFieldInput, provideCurrencyFieldDefaults',
        'How the reader types. cents is the cash register: digits enter at the minor unit and shift left, the separator is never typed and the caret has one legal position. natural is the spreadsheet, and the model number-field uses. The frame paints what the control resolved',
      ],
      [
        'formatOn',
        "'change' | 'commit'",
        'change',
        'slCurrencyField, provideCurrencyFieldDefaults',
        'When the text takes the locale’s shape under entry="natural". change regroups on every keystroke; commit holds the reader’s own text until blur, Enter or a step. Cents-first entry generates the text after every edit, so it decides nothing there',
      ],
      [
        'appearance',
        "'control' | 'display'",
        'control',
        'slCurrencyField',
        'A field among fields, or the headline amount of an entry sheet: the 4xl step, the mark apart and muted, a rule under the amount instead of a box. size and variant do not apply to display',
      ],
      [
        'align',
        "'end' | 'start'",
        'end',
        'slCurrencyField, provideCurrencyFieldDefaults',
        'Which edge the amount is set against. end by default: a column of amounts is compared on its last digit, and the cents-first caret already lives there',
      ],
      [
        'locale',
        'string',
        'the language in force',
        'slCurrencyFieldInput',
        'BCP 47. It decides the separators, where the symbol goes and the numbering system — never the symbol itself, which is the currency’s',
      ],
      [
        'format',
        'Intl.NumberFormatOptions',
        '—',
        'slCurrencyFieldInput',
        'Any other Intl option: currencySign for accounting parentheses, signDisplay, useGrouping, roundingMode. Every key here wins over the family’s own; style and currency are the family’s',
      ],
      [
        'fractionDigits',
        'number',
        'the currency’s minor units',
        'slCurrencyFieldInput',
        'Overrides how many fraction digits the amount is written with, for a unit price quoted finer than the currency’s cent',
      ],
      [
        'unit',
        "'major' | 'minor'",
        'major',
        'slCurrencyFieldInput, provideCurrencyFieldDefaults',
        'The unit value, defaultValue, min, max, the steps, stepFrom, (valueChange), the form model and the submitted amount are in: major is 12.34, minor the integer 1234 of the currency’s minor unit, which fractionDigits decides when set',
      ],
      [
        'min',
        'number',
        '—',
        'slCurrencyFieldInput',
        'The smallest amount the control holds, in major units. It disables the decrement button at the bound, gives Home somewhere to go, and is the one thing that refuses a debit: min="0" is why there is no allowNegative',
      ],
      [
        'max',
        'number',
        '—',
        'slCurrencyFieldInput',
        'The largest amount the control holds. It disables the increment button at the bound and gives End somewhere to go',
      ],
      [
        'step',
        'number',
        '1',
        'slCurrencyFieldInput',
        'What the arrows and the two buttons move by, in major units: one real, not one centavo',
      ],
      [
        'largeStep',
        'number',
        'step * 10',
        'slCurrencyFieldInput',
        'What Shift and the page keys move by',
      ],
      ['smallStep', 'number', 'step / 10', 'slCurrencyFieldInput', 'What Alt moves by'],
      [
        'stepFrom',
        'number',
        'min, or 0',
        'slCurrencyFieldInput',
        'Where an empty control starts stepping from. Pressing increment on a blank amount produces the amount named here rather than that amount plus a step',
      ],
      [
        'clamp',
        "'blur' | 'strict' | 'none'",
        'blur',
        'slCurrencyFieldInput, provideCurrencyFieldDefaults',
        'Where an amount outside the range goes, and when. blur returns it at the commit, strict refuses the keystroke that would leave the range, none keeps it and reports aria-invalid',
      ],
      [
        'allowEmpty',
        'boolean',
        'false',
        'slCurrencyFieldInput',
        'Lets the control hold nothing. Off by default, because an amount is not an optional number: cleared, the control shows 0,00 and emits 0, and every consumer is spared writing value ?? 0. On, an emptied control stays empty and emits null',
      ],
      [
        'wheel',
        'boolean',
        'false',
        'slCurrencyFieldInput',
        'Lets the wheel move the amount while the control has focus and the pointer is over it. Off by default: a reader scrolling a form must not change a total by passing over it',
      ],
      [
        'stepper',
        "'stacked' | 'split' | 'none'",
        'none',
        'slCurrencyField, provideCurrencyFieldDefaults',
        'Where the two buttons sit, and whether they sit at all. none by default, where number-field ships them: an invoice total is typed rather than nudged',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slCurrencyField, provideCurrencyFieldDefaults',
        'The type step, read from the field first when there is one, then from the token. Height, padding, type and glyph all come from the control scales the theme restates per density',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'slCurrencyField, provideCurrencyFieldDefaults',
        'How much frame the control shows. plain paints no border at rest and keeps the same box, which is what a table of amounts needs',
      ],
      [
        'start',
        'slCurrencyFieldStart',
        '—',
        'projected content',
        'An adornment before the amount in the reading direction. It is a sibling of the number: never selected, never copied and never parsed',
      ],
      [
        'end',
        'slCurrencyFieldEnd',
        '—',
        'projected content',
        'An adornment after the amount: a currency code, a period, or a consumer’s own currency picker',
      ],
      [
        'sensitivity',
        'number',
        '2',
        'slCurrencyFieldScrub',
        'Pixels of horizontal travel per step. A wide range wants fewer pixels per step; a fine one, more',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'slCurrencyFieldInput',
        'Unstated rather than false, so the control defers to the field around it. Stated, it wins, and it is the native attribute: out of the tab order and out of submission. A Reactive Form reaches the same state through setDisabledState',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'slCurrencyFieldInput',
        'Unstated rather than false. The native readonly, which stays focusable, selectable and submitted, and which disables both steppers',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'slCurrencyFieldInput',
        'Unstated rather than false. Writes aria-invalid on the control and data-invalid on the frame',
      ],
      [
        'required',
        'boolean',
        '—',
        'slCurrencyFieldInput',
        'The element’s own attribute, passed straight through and never written by the family. A field marks necessity with aria-required instead, because the native attribute engages browser constraint validation',
      ],
      [
        'name / form',
        'string',
        '—',
        'slCurrencyFieldInput',
        'Static attributes read with HostAttributeToken and moved to a hidden input the frame renders, which carries the raw number in major units. Submitting "R$ 1.480,00" to a server expecting 1480 is the defect this avoids',
      ],
      [
        'autocomplete',
        'string',
        'off',
        'slCurrencyFieldInput',
        'The element’s own attribute, read before the host binding computes. transaction-amount is the standard autofill field name for a payment amount, and transaction-currency for the currency beside it',
      ],
      [
        'messages',
        'Partial<CurrencyFieldMessages>',
        '—',
        'slCurrencyField',
        'Words laid over the language in force, key by key: increment and decrement are what the two buttons announce',
      ],
    ]),
    composition: apiRows([
      [
        'slCurrencyField',
        'attribute directive',
        '—',
        'the consumer’s own element',
        'The frame is a directive on an element the consumer wrote, so the box is already theirs. Angular pays one element for it where React pays none: a directive cannot create a wrapper around its own host',
      ],
      [
        'exportAs',
        "'slCurrencyField' / 'slCurrencyFieldInput'",
        '—',
        'a template reference',
        'Reaches the instance from the template. The control exposes inputElement — focus(), select() and setSelectionRange() are the element’s own — plus increment() and decrement(), the two actions a consumer cannot express by passing a value',
      ],
      [
        'ng-content',
        '[slCurrencyFieldStart], [slCurrencyFieldEnd]',
        '—',
        'projected content',
        'Two named slots, projected lazily. The frame writes data-part on the consumer’s own element rather than wrapping it',
      ],
      [
        'provideCurrencyFieldDefaults',
        '{ currency, currencyDisplay, entry, align, size, variant, stepper, clamp }',
        '—',
        'an injector',
        'The decisions an application takes once. currency is the one worth setting first, and the only one a field cannot be built without: a product has one currency in nine screens out of ten, and the tenth states its own',
      ],
      [
        'NG_VALUE_ACCESSOR',
        'ControlValueAccessor',
        '—',
        'slCurrencyFieldInput',
        'Reactive Forms and template forms both reach the amount in major units. There is no Validator: min, max and step are reported, and when an error shows is the form’s policy',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Spinbutton (w3.org/WAI/ARIA/apg/patterns/spinbutton/), taken whole: role="spinbutton" on the focusable element with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext, Up and Down stepping, Home and End reaching the bounds, and Page Up and Page Down as the larger step the pattern lists as optional.',
      'aria-valuenow is the amount in major units and aria-valuetext is the string the reader sees, because aria-valuenow alone announces 1480 for a control showing R$ 1.480,00. When the control is empty neither property is set: no amount is not an amount of nought.',
      'The frame carries no role. WAI-ARIA requires the children of a spinbutton to be non-interactive and presentational, so the two steppers are the control’s siblings inside a box that announces nothing.',
      'Under cents-first entry the caret is put back after the last digit on every edit, and it decides nothing while it is anywhere else: a digit typed against the front of R$ 0,00 is two cents, not twenty reais, because the digits that changed are read from the difference between the text before the edit and the text after it. That is legal here and forbidden in number-field for one reason: the text is generated rather than typed, so there is no reader’s caret to preserve and exactly one position where the next keystroke means something. A separator keystroke is refused outright, and the sign is a key of its own so it never enters the digit run.',
      'inputmode is numeric under cents-first entry — the separator is never typed and the sign is a single key — and derived from the format under natural entry. A static inputmode the consumer wrote is read with HostAttributeToken before the binding computes, so it survives.',
      'aria-required, never the native required. The native attribute engages browser constraint validation and changes submit behavior, which the library must not impose as a side effect of describing a field. disabled and readonly are native, because that is what those two words mean.',
      'transaction-amount and transaction-currency are the standard autofill field names for a payment amount, and naming a field’s purpose is what WCAG 2.2 SC 1.3.5 asks for. The family leaves autocomplete off by default and documents the token.',
      'The invalid state is never color alone: aria-invalid announces it and the field’s error says it in words. In the high-contrast scheme the border cannot carry it at all, which is why it never has to.',
    ],
    snippets: [
      defineSnippet({
        id: 'currency-field-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="currency-field"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-entry="cents"
  data-align="end"
  data-stepper="none"
>
  <input
    data-part="input"
    type="text"
    role="spinbutton"
    inputmode="numeric"
    id="total-control"
    aria-valuenow="1480"
    aria-valuetext="R$ 1.480,00"
    aria-valuemin="0"
  />
  <span data-part="end">BRL</span>
  <input type="hidden" name="total" value="1480" />
</div>`,
      }),
      defineSnippet({
        id: 'currency-field-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='currency-field'] {
  --slotted-currency-field-border-color: var(--slotted-tone-secondary-border);
  --slotted-currency-field-hover-border-color: var(--slotted-tone-accent-solid);
  --slotted-currency-field-adornment-color: var(--slotted-text-muted);
  --slotted-currency-field-radius: var(--slotted-radius-md);
}`,
      }),
    ],
  },
} as const;
