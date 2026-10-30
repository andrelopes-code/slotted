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

export const REACT_CURRENCY_FIELD_TOKENS = currencyFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Currency Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import { CurrencyField, CurrencyFieldDefaultsProvider, CurrencyFieldScrub } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame. Carries data-ui="currency-field", the five axes — data-size, data-variant, data-entry, data-align, data-stepper — and data-disabled, data-invalid and data-readonly. It has no role: a spinbutton may hold only non-interactive children, so the two steppers are the control’s siblings. className and style reach this element.',
  },
  {
    part: 'input',
    element: 'input[type=text][role=spinbutton]',
    required: true,
    purpose:
      'The control. Holds the formatted amount, the identifier, aria-valuenow in major units and aria-valuetext as the reader sees it. It is type="text" because type="number" empties itself whenever the text is not a valid floating-point number, so no grouping separator and no currency symbol survives it. ref reaches it.',
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
    element: 'span',
    required: false,
    purpose:
      'An adornment before the amount in the reading direction, and a sibling of it rather than part of it. A symbol here is never selected, never copied and never parsed; a symbol that belongs inside the amount is what currency and currencyDisplay write.',
  },
  {
    part: 'end',
    element: 'span',
    required: false,
    purpose:
      'An adornment after the amount: a currency code, a period, or a consumer’s own currency picker until the select family exists.',
  },
  {
    part: 'scrub',
    element: 'span (CurrencyFieldScrub)',
    required: false,
    purpose:
      'A mark in start or end that moves the amount when it is dragged sideways: one step per sensitivity pixels towards the inline end, largeStep with Shift, smallStep with Alt. It carries data-scrubbing while dragged, as the frame does, and is hidden from assistive technology because the arrow keys on the input are the same movement.',
  },
  {
    part: 'stepper',
    element: 'span',
    required: false,
    purpose:
      'The column the two buttons share under stepper="stacked". It is not rendered at all under stepper="none", which is this family’s default, nor under split, where the buttons are direct children of the frame.',
  },
  {
    part: 'decrement',
    element: 'button[type=button][tabindex=-1]',
    required: false,
    purpose:
      'Steps down by step — one major unit by default, not one cent — by largeStep with Shift and by smallStep with Alt. Held, it repeats. Disabled at min, and out of the tab order because the arrow keys reach the same behavior from the control.',
  },
  {
    part: 'increment',
    element: 'button[type=button][tabindex=-1]',
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
      id: 'currency-field-react-playground',
      language: 'tsx',
      label: 'An amount, its label and its help',
      source: `<Field>
  <FieldLabel>Order total</FieldLabel>
  <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" min={0} />
  <FieldDescription>Type digits only: 1234 becomes R$ 12,34.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'entry',
    title: 'The two ways an amount is typed',
    note: 'Type 1234 into each. On the left the digits shift left from the cent, as a cash register does; on the right the text is yours until you leave the field, as a spreadsheet is — regrouped as it arrives, which is what formatOn decides and what cents-first entry has always done.',
    snippet: defineSnippet({
      id: 'currency-field-react-entry',
      language: 'tsx',
      label: 'The cash register and the spreadsheet',
      source: `// The default. 1234 is R$ 12,34, the separator is never typed,
// and the caret has one legal position: after the last digit.
<CurrencyField currency="BRL" entry="cents" locale="pt-BR" />;

// The model number-field uses: the text is the reader's until a commit.
<CurrencyField currency="BRL" entry="natural" locale="pt-BR" />;`,
    }),
  },
  {
    id: 'currency',
    title: 'The currency decides how far a digit shifts',
    note: 'Type 1234 into each of the four. A real has two minor digits, a yen none and a dinar three, so the same four keystrokes are R$ 12,34, ¥1.234 and KWD 1,234.',
    snippet: defineSnippet({
      id: 'currency-field-react-currency',
      language: 'tsx',
      label: 'Four currencies, three shifts',
      source: `<CurrencyField currency="BRL" locale="pt-BR" />;
<CurrencyField currency="JPY" locale="pt-BR" />;
<CurrencyField currency="KWD" locale="pt-BR" />;

// The display is an axis of its own: the symbol, the narrow symbol,
// the ISO code, or the currency written out.
<CurrencyField currency="USD" currencyDisplay="code" locale="pt-BR" />;`,
    }),
  },
  {
    id: 'locale',
    title: 'The currency governs; the locale writes',
    note: 'A Brazilian back office paying a US invoice: Brazilian separators around an American currency. The numbering system comes from the locale too, so an Arabic field reads back its own digits.',
    snippet: defineSnippet({
      id: 'currency-field-react-locale',
      language: 'tsx',
      label: 'Two inputs that answer two different questions',
      source: `// US$ 1.480,00 — the symbol from the currency, the separators from the locale.
<CurrencyField currency="USD" defaultValue={1480} locale="pt-BR" />;

// The same amount, written where the symbol goes last.
<CurrencyField currency="EUR" defaultValue={1480} locale="fr-FR" />;

// Set once for an application, rather than on every amount in a form.
<SlottedProvider locale="pt-BR">
  <CurrencyFieldDefaultsProvider currency="BRL">
    <CurrencyField defaultValue={1480} />
  </CurrencyFieldDefaultsProvider>
</SlottedProvider>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the control takes the field’s rather than its own: a small field holding a medium control is a field and a control disagreeing about one row.',
    snippet: defineSnippet({
      id: 'currency-field-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<CurrencyField currency="BRL" defaultValue={89.9} locale="pt-BR" size="sm" />;
<CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" size="md" />;
<CurrencyField currency="BRL" defaultValue={24900} locale="pt-BR" size="lg" />;

// Inside a field the field decides, and the control follows.
<Field size="sm">
  <CurrencyField currency="BRL" defaultValue={12} locale="pt-BR" />
</Field>;`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame the control shows',
    note: 'outline takes the ground it is placed on, subtle sinks into the page, and plain shows nothing at rest — which is what a table of amounts needs, where the border of every row would be the loudest thing on the page.',
    snippet: defineSnippet({
      id: 'currency-field-react-variants',
      language: 'tsx',
      label: 'Three frames, one box',
      source: `<CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" variant="outline" />;
<CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" variant="subtle" />;

// A cell that is only a control while it is being used.
<CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" variant="plain" />;`,
    }),
  },
  {
    id: 'alignment',
    title: 'Which edge the amount is set against',
    note: 'Read the two columns down rather than across: aligned to the end, the cents of every row line up and a magnitude is one glance; aligned to the start, they do not.',
    snippet: defineSnippet({
      id: 'currency-field-react-alignment',
      language: 'tsx',
      label: 'A column of amounts, and a sentence with one in it',
      source: `// The default: a column of amounts is compared on its last digit.
<CurrencyField align="end" currency="BRL" defaultValue={12} locale="pt-BR" />;
<CurrencyField align="end" currency="BRL" defaultValue={1480} locale="pt-BR" />;

// One amount inside a form that reads as a sentence.
<CurrencyField align="start" currency="BRL" defaultValue={1480} locale="pt-BR" />;`,
    }),
  },
  {
    id: 'range',
    title: 'The bounds, and what happens at them',
    note: 'blur returns the amount to the range when you leave the field; strict refuses the keystroke that would leave it; none keeps what you typed and says so with aria-invalid. min={0} is also what refuses a debit.',
    snippet: defineSnippet({
      id: 'currency-field-react-range',
      language: 'tsx',
      label: 'Three policies over one range',
      source: `<CurrencyField clamp="blur" currency="BRL" locale="pt-BR" max={1000} min={0} />;
<CurrencyField clamp="strict" currency="BRL" locale="pt-BR" max={1000} min={0} />;
<CurrencyField clamp="none" currency="BRL" locale="pt-BR" max={1000} min={0} />;

// A refund, where a debit is the point. There is no allowNegative:
// the range already says it, and two ways to say it can disagree.
<CurrencyField currency="BRL" locale="pt-BR" min={-1000} />;`,
    }),
  },
  {
    id: 'stepper',
    title: 'Two buttons, when an amount is nudged rather than typed',
    note: 'Withdrawn by default: an invoice total is typed, and two buttons that move it by one real invite a mis-click that costs money. A price a reader adjusts is the case they are for.',
    snippet: defineSnippet({
      id: 'currency-field-react-stepper',
      language: 'tsx',
      label: 'The default, a column, and a pair at either end',
      source: `<CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />;

// step is one major unit, not one cent. Shift and the page keys move by
// largeStep, Alt by smallStep.
<CurrencyField currency="BRL" defaultValue={25} locale="pt-BR" step={1} stepper="stacked" />;
<CurrencyField currency="BRL" defaultValue={25} locale="pt-BR" stepper="split" />;`,
    }),
  },
  {
    id: 'adornments',
    title: 'The symbol inside the amount, and the symbol beside it',
    note: 'Both are here because choosing wrongly is the mistake: the symbol from currency is selected, copied and parsed with the amount, and the one in start is none of those things.',
    snippet: defineSnippet({
      id: 'currency-field-react-adornments',
      language: 'tsx',
      label: 'Inside the value, and beside it',
      source: `// Inside: R$ moves with the locale, is copied with the amount and is
// what aria-valuetext announces.
<CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />;

// Beside: a label rather than part of the number. The amount is written
// without a symbol, and the adornment is never parsed.
<CurrencyField
  currency="BRL"
  currencyDisplay="none"
  defaultValue={1480}
  end="per month"
  locale="pt-BR"
  start="R$"
/>;`,
    }),
  },
  {
    id: 'scrub',
    title: 'Drag the symbol to move the amount',
    note: 'The sibling’s gesture on a currency mark. Press R$ and drag sideways: two pixels per step of one real, Shift for ten, Alt for ten centavos. A right-to-left document steps up towards the left, the inline end.',
    snippet: defineSnippet({
      id: 'currency-field-react-scrub',
      language: 'tsx',
      label: 'The symbol beside the amount, as the drag mark',
      source: `<CurrencyField
  currency="BRL"
  currencyDisplay="none"
  defaultValue={1480}
  locale="pt-BR"
  min={0}
  start={<CurrencyFieldScrub>R$</CurrencyFieldScrub>}
/>;

<CurrencyField
  currency="BRL"
  currencyDisplay="none"
  defaultValue={250}
  locale="pt-BR"
  max={1000}
  min={0}
  start={<CurrencyFieldScrub sensitivity={4}>R$</CurrencyFieldScrub>}
  step={10}
/>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the frame paints',
    note: 'Hover the first, tab into the second, then compare read-only with disabled: one keeps its ink because the amount is real and still submitted, the other mutes it because nobody can reach it.',
    snippet: defineSnippet({
      id: 'currency-field-react-states',
      language: 'tsx',
      label: 'The four states, and where each comes from',
      source: `<CurrencyField currency="BRL" defaultValue={1480} invalid locale="pt-BR" />;
<CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" readOnly />;
<CurrencyField currency="BRL" defaultValue={1480} disabled locale="pt-BR" />;

// Unstated means "ask the field": the control defers rather than
// overriding a field that is already disabled.
<Field disabled>
  <FieldLabel>Total</FieldLabel>
  <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />
</Field>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'The ceiling amount, a currency written as a name, and a debit in accounting parentheses — each in a 320-pixel column, where the frame scrolls its own text and keeps the leading digits.',
    snippet: defineSnippet({
      id: 'currency-field-react-content',
      language: 'tsx',
      label: 'The longest amount, the longest name, and a debit',
      source: `// Fifteen digits is where a double stops holding a cent, and the
// keystroke past it is refused rather than rounded.
<CurrencyField currency="BRL" defaultValue={9999999999999.99} locale="pt-BR" />;

<CurrencyField currency="BRL" currencyDisplay="name" defaultValue={1480} locale="pt-BR" />;

// Intl writes ($1,234.56) and the parser reads it back as a debit.
<CurrencyField
  currency="USD"
  defaultValue={-1234.56}
  format={{ currencySign: 'accounting' }}
  locale="en-US"
  min={-100000}
/>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, reaching past it, and putting it in a form',
    note: 'The provider carries the decisions an application takes once; the hidden input submits 1480.5 rather than "R$ 1.480,50"; the request carries the integer a payment API is charged in.',
    snippet: defineSnippet({
      id: 'currency-field-react-composition',
      language: 'tsx',
      label: 'A provider, a form, and the integer a gateway wants',
      source: `<CurrencyFieldDefaultsProvider currency="BRL">
  <CurrencyField defaultValue={1480} name="total" />
</CurrencyFieldDefaultsProvider>;

// The request carries the exact minor-unit integer, so nobody writes
// Math.round(value * 100) — the line where a half cent is lost.
<CurrencyField
  currency="BRL"
  locale="pt-BR"
  onValueChange={(value, request) => charge(request.minorUnits, request.currency)}
/>;

// A currency picker beside the amount, until the select family exists.
<CurrencyField currency={currency} end={<CurrencyPicker onChange={setCurrency} />} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and what it deliberately does not',
    note: 'Digits shift left, Backspace shifts right, the minus key sets the sign without entering the digits, and the arrows step. Tab never lands on a stepper.',
    snippet: defineSnippet({
      id: 'currency-field-react-keyboard',
      language: 'tsx',
      label: 'Every key the pattern lists, and the two this family adds',
      source: `// ArrowUp/ArrowDown: step. Shift or PageUp/PageDown: largeStep.
// Alt: smallStep. Home: min. End: max. Enter: commits, then submits.
// "-" and "+": the sign, never a digit. A separator is refused outright.
<CurrencyField currency="BRL" locale="pt-BR" max={100000} min={-100000} step={1} />;

// The wheel is not bound unless it is asked for, and even then only
// while the control has focus.
<CurrencyField currency="BRL" defaultValue={50} locale="pt-BR" wheel />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: number | null, request: CurrencyChangeRequest)',
    when: 'Before the amount moves. The request carries the new amount in major units, the amount it replaces, the currency, minorUnits — the exact integer a payment API is charged in — the reason ("keyboard" for typing, an arrow, a page key, Home or End; "pointer" for a stepper press or a wheel turn; "blur" for the commit that formats and clamps; "programmatic" for handle.increment()), the originating event, and cancel(), which refuses the move before anything commits. A request for the amount the family already holds is not emitted.',
  },
  {
    name: 'onChange, onBlur, onKeyDown, onFocus',
    payload: 'the element’s own events',
    when: 'Whenever the element fires them. The family composes with a consumer’s handler rather than replacing it: the consumer’s runs first, always runs, and calling preventDefault() on a key stops the family from acting on it.',
  },
];

export const REACT_CURRENCY_FIELD_DOCS = {
  currencyField: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'currency',
        'string',
        'from the provider',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'An ISO 4217 code. It decides the symbol, the minor units and therefore how far a digit shifts under cents-first entry. Required here or on the provider: a field that guessed two minor digits would write ¥12,34',
      ],
      [
        'currencyDisplay',
        "'symbol' | 'narrowSymbol' | 'code' | 'name'",
        'symbol',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'How the currency is written beside the amount, and none writes nothing at all: the amount becomes a plain decimal with the currency’s own fraction digits, so the symbol can live in a start adornment instead of inside the value. It is the one arrangement Intl has no option for',
      ],
      [
        'value',
        'number | null',
        '—',
        'CurrencyField',
        'Present means the consumer owns the amount, for the life of the component. It is in major units — reais, not centavos — and null is empty: a required total left blank and a total of nought are different facts',
      ],
      [
        'defaultValue',
        'number | null',
        '—',
        'CurrencyField',
        'What an uncontrolled control starts from, read once. A native form reset returns to it',
      ],
      [
        'entry',
        "'cents' | 'natural'",
        'cents',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'How the reader types. cents is the cash register: digits enter at the minor unit and shift left, the separator is never typed and the caret has one legal position. natural is the spreadsheet, and the model number-field uses',
      ],
      [
        'formatOn',
        "'change' | 'commit'",
        'change',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'When the text takes the locale’s shape under entry="natural". change regroups on every keystroke; commit holds the reader’s own text until blur, Enter or a step. Cents-first entry generates the text after every edit, so it decides nothing there',
      ],
      [
        'appearance',
        "'control' | 'display'",
        'control',
        'CurrencyField',
        'A field among fields, or the headline amount of an entry sheet: the 4xl step, the mark apart and muted, a rule under the amount instead of a box. size and variant do not apply to display',
      ],
      [
        'align',
        "'end' | 'start'",
        'end',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'Which edge the amount is set against. end by default: a column of amounts is compared on its last digit, and the cents-first caret already lives there',
      ],
      [
        'locale',
        'string',
        'the language in force',
        'CurrencyField',
        'BCP 47. It decides the separators, where the symbol goes and the numbering system — never the symbol itself, which is the currency’s',
      ],
      [
        'format',
        'Intl.NumberFormatOptions',
        '—',
        'CurrencyField',
        'Any other Intl option: currencySign for accounting parentheses, signDisplay, useGrouping, roundingMode. Every key here wins over the family’s own; style and currency are the family’s',
      ],
      [
        'fractionDigits',
        'number',
        'the currency’s minor units',
        'CurrencyField',
        'Overrides how many fraction digits the amount is written with, for a unit price quoted finer than the currency’s cent',
      ],
      [
        'unit',
        "'major' | 'minor'",
        'major',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'The unit value, defaultValue, min, max, the steps, stepFrom, onValueChange and the submitted amount are in: major is 12.34, minor the integer 1234 of the currency’s minor unit, which fractionDigits decides when set',
      ],
      [
        'min',
        'number',
        '—',
        'CurrencyField',
        'The smallest amount the control holds, in major units. It disables the decrement button at the bound, gives Home somewhere to go, and is the one thing that refuses a debit: min={0} is why there is no allowNegative',
      ],
      [
        'max',
        'number',
        '—',
        'CurrencyField',
        'The largest amount the control holds. It disables the increment button at the bound and gives End somewhere to go',
      ],
      [
        'step',
        'number',
        '1',
        'CurrencyField',
        'What the arrows and the two buttons move by, in major units: one real, not one centavo',
      ],
      ['largeStep', 'number', 'step * 10', 'CurrencyField', 'What Shift and the page keys move by'],
      ['smallStep', 'number', 'step / 10', 'CurrencyField', 'What Alt moves by'],
      [
        'stepFrom',
        'number',
        'min, or 0',
        'CurrencyField',
        'Where an empty control starts stepping from. Pressing increment on a blank amount produces the amount named here rather than that amount plus a step',
      ],
      [
        'clamp',
        "'blur' | 'strict' | 'none'",
        'blur',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'Where an amount outside the range goes, and when. blur returns it at the commit, strict refuses the keystroke that would leave the range, none keeps it and reports aria-invalid',
      ],
      [
        'allowEmpty',
        'boolean',
        'false',
        'CurrencyField',
        'Lets the control hold nothing. Off by default, because an amount is not an optional number: cleared, the control shows 0,00 and emits 0, and every consumer is spared writing value ?? 0. On, an emptied control stays empty and emits null',
      ],
      [
        'wheel',
        'boolean',
        'false',
        'CurrencyField',
        'Lets the wheel move the amount while the control has focus and the pointer is over it. Off by default: a reader scrolling a form must not change a total by passing over it',
      ],
      [
        'stepper',
        "'stacked' | 'split' | 'none'",
        'none',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'Where the two buttons sit, and whether they sit at all. none by default, where number-field ships them: an invoice total is typed rather than nudged',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'The type step, read from the field first when there is one, then from the provider. Height, padding, type and glyph all come from the control scales the theme restates per density',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'CurrencyField, CurrencyFieldDefaultsProvider',
        'How much frame the control shows. plain paints no border at rest and keeps the same box, which is what a table of amounts needs',
      ],
      [
        'start',
        'ReactNode',
        '—',
        'CurrencyField',
        'An adornment before the amount in the reading direction. It is a sibling of the number: never selected, never copied and never parsed',
      ],
      [
        'end',
        'ReactNode',
        '—',
        'CurrencyField',
        'An adornment after the amount: a currency code, a period, or a consumer’s own currency picker',
      ],
      [
        'CurrencyFieldScrub sensitivity',
        'number',
        '2',
        'CurrencyFieldScrub',
        'Pixels of horizontal travel per step. A wide range wants fewer pixels per step; a fine one, more',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'CurrencyField',
        'Unstated rather than false, so the control defers to the field around it. Stated, it wins, and it is the native attribute: out of the tab order and out of submission',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'CurrencyField',
        'Unstated rather than false. The native readonly, which stays focusable, selectable and submitted, and which disables both steppers',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'CurrencyField',
        'Unstated rather than false. Writes aria-invalid on the control and data-invalid on the frame',
      ],
      [
        'required',
        'boolean',
        '—',
        'CurrencyField',
        'The element’s own attribute, passed straight through and never written by the family. A field marks necessity with aria-required instead, because the native attribute engages browser constraint validation',
      ],
      [
        'name / form',
        'string',
        '—',
        'CurrencyField',
        'Reach a hidden input beside the visible one, which carries the raw number in major units. Submitting "R$ 1.480,00" to a server expecting 1480 is the defect this avoids',
      ],
      [
        'autoComplete',
        'string',
        'off',
        'CurrencyField',
        'The element’s own attribute. transaction-amount is the standard autofill field name for a payment amount, and transaction-currency for the currency beside it; the default is off, because a browser offering to fill an invoice total is worse than no help at all',
      ],
      [
        'messages',
        'Partial<CurrencyFieldMessages>',
        '—',
        'CurrencyField',
        'Words laid over the language in force, key by key: increment and decrement are what the two buttons announce',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: CurrencyFieldRootProps) => ReactNode',
        '—',
        'CurrencyField',
        'Substitutes the frame and hands it every attribute. The props are typed against HTMLAttributes<HTMLElement>, so they can be spread onto a label or a fieldset. The control and the two buttons are fixed: substituting the element that holds the amount and the role would leave the family with nothing to be',
      ],
      [
        'ref',
        'Ref<HTMLInputElement>',
        '—',
        'CurrencyField',
        'Reaches the input. focus(), select() and setSelectionRange() are the element’s own, so no imperative handle is invented for what the platform already ships',
      ],
      [
        'handle',
        'Ref<CurrencyFieldHandle>',
        '—',
        'CurrencyField',
        'increment() and decrement(), the two actions a consumer cannot express by passing a value. Both report reason "programmatic"',
      ],
      [
        'className / style',
        'string / CSSProperties',
        '—',
        'CurrencyField',
        'Reach the frame, because the frame is what a consumer sees. Every other native prop reaches the input',
      ],
      [
        'CurrencyFieldDefaultsProvider',
        '{ currency, currencyDisplay, entry, align, size, variant, stepper, clamp }',
        '—',
        'a subtree',
        'The decisions an application takes once. currency is the one worth setting first, and the only one a field cannot be built without: a product has one currency in nine screens out of ten, and the tenth states its own',
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
      'The pattern is the WAI-ARIA APG’s Spinbutton (w3.org/WAI/ARIA/apg/patterns/spinbutton/), taken whole: role="spinbutton" on the focusable element with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext, Up and Down stepping, Home and End reaching the bounds, and Page Up and Page Down as the larger step the pattern lists as optional.',
      'aria-valuenow is the amount in major units and aria-valuetext is the string the reader sees, because aria-valuenow alone announces 1480 for a control showing R$ 1.480,00. When the control is empty neither property is set: no amount is not an amount of nought.',
      'The frame carries no role. WAI-ARIA requires the children of a spinbutton to be non-interactive and presentational, so the two steppers are the control’s siblings inside a box that announces nothing.',
      'Under cents-first entry the caret is put back after the last digit on every edit, and it decides nothing while it is anywhere else: a digit typed against the front of R$ 0,00 is two cents, not twenty reais, because the digits that changed are read from the difference between the text before the edit and the text after it. That is legal here and forbidden in number-field for one reason: the text is generated rather than typed, so there is no reader’s caret to preserve and exactly one position where the next keystroke means something. A separator keystroke is refused outright rather than silently swallowed, and the sign is a key of its own so it never enters the digit run.',
      'inputMode is numeric under cents-first entry — the separator is never typed and the sign is a single key, so the numeric keypad is complete for the task — and derived from the format under natural entry. It is never derived from the user agent, which would be a hydration mismatch.',
      'aria-required, never the native required. The native attribute engages browser constraint validation and changes submit behavior, which the library must not impose as a side effect of describing a field. disabled and readonly are native, because that is what those two words mean.',
      'transaction-amount and transaction-currency are the standard autofill field names for a payment amount, and naming a field’s purpose is what WCAG 2.2 SC 1.3.5 asks for. The family leaves autoComplete off by default and documents the token, because most amounts in a back office are not payment amounts.',
      'The invalid state is never color alone: aria-invalid announces it and the field’s error says it in words. In the high-contrast scheme the border cannot carry it at all, which is why it never has to.',
    ],
    snippets: [
      defineSnippet({
        id: 'currency-field-react-anatomy',
        language: 'tsx',
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
    inputMode="numeric"
    id="total-control"
    aria-valuenow="1480"
    aria-valuetext="R$ 1.480,00"
    aria-valuemin="0"
  />
  <span data-part="end">BRL</span>
  <input type="hidden" name="total" value="1480" />
</div>;`,
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
