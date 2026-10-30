import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlCurrencyField } from './currency-field';
import type {
  CurrencyFieldAlign,
  CurrencyFieldClamp,
  CurrencyFieldEntry,
  CurrencyFieldSize,
  CurrencyFieldStepper,
  CurrencyFieldVariant,
} from './currency-field-defaults';
import { SlCurrencyFieldInput } from './currency-field-input';
import {
  SlCurrencyFieldEnd,
  SlCurrencyFieldScrub,
  SlCurrencyFieldStart,
} from './currency-field-parts';
import { ANGULAR_CURRENCY_FIELD_DOCS, ANGULAR_CURRENCY_FIELD_TOKENS } from './currency-field.docs';

interface CurrencyFieldStoryArgs {
  align: CurrencyFieldAlign;
  clamp: CurrencyFieldClamp;
  entry: CurrencyFieldEntry;
  size: CurrencyFieldSize;
  stepper: CurrencyFieldStepper;
  variant: CurrencyFieldVariant;
  wheel: boolean;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CURRENCY_FIELD_DOCS.currencyField.scenes, {
    playground: Playground,
    entry: Entry,
    currency: Currency,
    locale: Locale,
    sizes: Sizes,
    variants: Variants,
    alignment: Alignment,
    range: Range,
    stepper: Stepper,
    adornments: Adornments,
    scrub: Scrub,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlCurrencyField,
  SlCurrencyFieldEnd,
  SlCurrencyFieldInput,
  SlCurrencyFieldScrub,
  SlCurrencyFieldStart,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
];

const meta: Meta<CurrencyFieldStoryArgs> = {
  title: 'Components/CurrencyField',
  component: SlCurrencyField,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Currency Field',
        description:
          'One monetary amount, in one currency, typed the way a cash register is typed: the digits enter at the cent and shift left, no separator is ever pressed, and the request carries the exact integer a payment API is charged in.',
        framework: 'Angular',
        ...ANGULAR_CURRENCY_FIELD_DOCS.currencyField,
        tokens: ANGULAR_CURRENCY_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CurrencyFieldStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/** A narrow column, for showing what an amount does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    align: 'end',
    clamp: 'blur',
    entry: 'cents',
    size: 'md',
    stepper: 'none',
    variant: 'outline',
    wheel: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Order total</label>
          <div slCurrencyField [size]="size" [variant]="variant" [align]="align" [stepper]="stepper">
            <input
              slCurrencyFieldInput
              currency="BRL"
              locale="pt-BR"
              defaultValue="1480"
              min="0"
              [entry]="entry"
              [clamp]="clamp"
              [wheel]="wheel"
            />
          </div>
          <span slFieldDescription>Type only the digits: 1234 becomes $12.34.</span>
        </div>
      </div>`,
  }),
};

export const Entry: Story = {
  parameters: scenario('entry'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Cents first, the cash register',
        'Type 1, 2, 3, 4 without touching a separator: the digits enter at the cent and shift left, and the caret stays after the last one.',
        `<div slField>
           <label slFieldLabel>Amount received</label>
           <div slCurrencyField>
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" entry="cents" />
           </div>
         </div>`,
      ) +
        scene(
          'Natural, the spreadsheet',
          'Type 1234,5 and leave the field: the text is yours until the commit, and the separator is typed like any other character.',
          `<div slField>
             <label slFieldLabel>Amount received</label>
             <div slCurrencyField>
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" entry="natural" />
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Currency: Story = {
  parameters: scenario('currency'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Four keystrokes, three shifts',
        'Type 1234 into each. A real has two minor digits, a yen none and a dinar three, so the same four keys mean three different amounts.',
        `<div slCurrencyField><input slCurrencyFieldInput currency="BRL" locale="pt-BR" /></div>
         <div slCurrencyField><input slCurrencyFieldInput currency="JPY" locale="pt-BR" /></div>
         <div slCurrencyField><input slCurrencyFieldInput currency="KWD" locale="pt-BR" /></div>`,
      ) +
        scene(
          'How the currency is written',
          'The same amount under the four displays: the symbol, the narrow symbol a domestic screen uses, the ISO code a back office prefers, and the name.',
          `<div slCurrencyField>
             <input slCurrencyFieldInput currency="USD" locale="pt-BR" defaultValue="1480" />
           </div>
           <div slCurrencyField>
             <input
               slCurrencyFieldInput
               currency="USD"
               locale="pt-BR"
               defaultValue="1480"
               currencyDisplay="narrowSymbol"
             />
           </div>
           <div slCurrencyField>
             <input
               slCurrencyFieldInput
               currency="USD"
               locale="pt-BR"
               defaultValue="1480"
               currencyDisplay="code"
             />
           </div>
           <div slCurrencyField>
             <input
               slCurrencyFieldInput
               currency="USD"
               locale="pt-BR"
               defaultValue="1480"
               currencyDisplay="name"
             />
           </div>`,
        ),
    ),
  }),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The currency governs; the locale writes',
        'A Brazilian back office paying a US invoice: the symbol comes from USD and the separators from pt-BR, which is the combination a hand-configured mask gets wrong.',
        `<div slCurrencyField>
           <input slCurrencyFieldInput currency="USD" locale="pt-BR" defaultValue="1480" />
         </div>
         <div slCurrencyField>
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>`,
      ) +
        scene(
          'Where the symbol goes is the locale’s decision',
          'French writes the symbol last and separates its thousands with a narrow space; German swaps the two separators; Arabic writes its own digits and reads them back.',
          `<div slCurrencyField>
             <input slCurrencyFieldInput currency="EUR" locale="fr-FR" defaultValue="1480" />
           </div>
           <div slCurrencyField>
             <input slCurrencyFieldInput currency="EUR" locale="de-DE" defaultValue="1480" />
           </div>
           <div slCurrencyField>
             <input slCurrencyFieldInput currency="EGP" locale="ar-EG" defaultValue="1480" />
           </div>`,
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The three steps on their own',
        'Height, inline padding, type and glyph all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts.',
        `<div slCurrencyField size="sm">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="89.9" />
         </div>
         <div slCurrencyField size="md">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>
         <div slCurrencyField size="lg">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="24900" />
         </div>`,
      ) +
        scene(
          'Inside a field, the field decides',
          'The control reads the field’s step before the token’s: a small field holding a medium control is a field and a control disagreeing about one row.',
          `<div slField size="sm">
             <label slFieldLabel>Frete</label>
             <div slCurrencyField>
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="24.9" />
             </div>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Total</label>
             <div slCurrencyField>
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Three frames, one box',
        'outline takes the ground it is placed on, subtle sinks into the page, and plain shows nothing at rest. The box never changes, so nothing reflows when the pointer crosses it.',
        `<div slCurrencyField variant="outline">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>
         <div slCurrencyField variant="subtle">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>
         <div slCurrencyField variant="plain">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>`,
      ) +
        scene(
          'A table of amounts, where a border on every row would shout',
          'plain is the variant a dense table needs: the amounts read as a column of figures, and the frame appears only under the pointer or the caret.',
          `<div class="slotted-demo-rows">
             <span>Assinatura</span>
             <div slCurrencyField variant="plain">
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="89.9" />
             </div>
             <span>Setup</span>
             <div slCurrencyField variant="plain">
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
             </div>
             <span>Suporte</span>
             <div slCurrencyField variant="plain">
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="240" />
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Set against the reading end',
        'Read the column down: the cents of every row line up, so a magnitude is one glance rather than three. It is the default, and it is where the cents-first caret already lives.',
        `<div slCurrencyField align="end">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="12" />
         </div>
         <div slCurrencyField align="end">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>
         <div slCurrencyField align="end">
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="987654.32" />
         </div>`,
      ) +
        scene(
          'Set against the reading start',
          'The same three amounts, and no column to read: it is the right answer for one amount inside a form that reads as a sentence, and the wrong one for a ledger.',
          `<div slCurrencyField align="start">
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="12" />
           </div>
           <div slCurrencyField align="start">
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
           </div>
           <div slCurrencyField align="start">
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="987654.32" />
           </div>`,
        ),
    ),
  }),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Three policies over one range',
        'Type 99999 into each. blur returns the amount to the range when you leave; strict refuses the keystroke that would leave it; none keeps what you typed and says so.',
        `<div slField>
           <label slFieldLabel>Blur</label>
           <div slCurrencyField>
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" clamp="blur" min="0" max="1000" />
           </div>
         </div>
         <div slField>
           <label slFieldLabel>Strict</label>
           <div slCurrencyField>
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" clamp="strict" min="0" max="1000" />
           </div>
         </div>
         <div slField>
           <label slFieldLabel>None</label>
           <div slCurrencyField>
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" clamp="none" min="0" max="1000" />
           </div>
         </div>`,
      ) +
        scene(
          'A debit, and a field that refuses one',
          'min is the only thing that says whether an amount may be negative. Press the minus key in each: the refund takes it, and the total below it does not.',
          `<div slField>
             <label slFieldLabel>Estorno</label>
             <div slCurrencyField>
               <input
                 slCurrencyFieldInput
                 currency="BRL"
                 locale="pt-BR"
                 defaultValue="-1234.56"
                 min="-100000"
               />
             </div>
           </div>
           <div slField>
             <label slFieldLabel>Order total</label>
             <div slCurrencyField>
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" min="0" />
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Stepper: Story = {
  parameters: scenario('stepper'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Withdrawn, which is the default',
        'An invoice total is typed, not nudged, and two buttons that move it by one real invite a mis-click that costs money. PrimeNG leaves its own buttons off for the same reason.',
        `<div slCurrencyField>
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>`,
      ) +
        scene(
          'A price a reader adjusts',
          'Hold either button: it steps once, waits, then repeats. step is one major unit — one real, not one centavo — and Shift moves by ten of them.',
          `<div slCurrencyField stepper="stacked">
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="25" min="0" />
           </div>
           <div slCurrencyField stepper="split">
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="25" min="0" />
           </div>`,
        ),
    ),
  }),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Inside the amount',
        'Select the whole field and copy it: the symbol comes with the amount, because it is part of the string the control holds and part of what aria-valuetext announces.',
        `<div slCurrencyField>
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>
         <div slCurrencyField>
           <input
             slCurrencyFieldInput
             currency="USD"
             locale="pt-BR"
             defaultValue="1480"
             currencyDisplay="code"
           />
         </div>`,
      ) +
        scene(
          'Beside the amount',
          'The same two marks as siblings: never selected, never copied, never parsed. It is the right answer when the symbol is a label rather than part of the number.',
          `<div slCurrencyField>
             <span slCurrencyFieldStart>R$</span>
             <input
               slCurrencyFieldInput
               currency="BRL"
               locale="pt-BR"
               defaultValue="1480"
               currencyDisplay="none"
             />
           </div>
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
        ),
    ),
  }),
};

export const Scrub: Story = {
  parameters: scenario('scrub'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The symbol as the drag mark',
        'Press R$ and drag sideways: two pixels per real, Shift for ten. The mark lifts to the amount’s ink under the pointer, and the frame carries data-scrubbing while the drag lasts.',
        `<div slCurrencyField>
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
         </div>`,
      ) +
        scene(
          'A coarser step, a bounded range',
          'step is ten reais and sensitivity four pixels, so the drag is slow and lands on round amounts; the budget stops at its bounds whatever the pointer does.',
          `<div slCurrencyField>
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
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      2,
      scene(
        'What the frame paints',
        'Hover the first and tab into it, then compare the last two: read-only keeps its ink because the amount is real and still submitted, and disabled mutes it because nobody can reach it.',
        `<div slCurrencyField>
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
         </div>
         <div slCurrencyField>
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" invalid />
         </div>
         <div slCurrencyField>
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" readonly />
         </div>
         <div slCurrencyField>
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" disabled />
         </div>`,
      ) +
        scene(
          'Where the state comes from',
          'Unstated means ask the field: the control defers rather than overriding, and the error the field draws is what the reader hears through aria-describedby.',
          `<div slField invalid>
             <label slFieldLabel>Total</label>
             <div slCurrencyField>
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="0" min="1" />
             </div>
             <p slFieldError>Informe um valor maior que zero.</p>
           </div>
           <div slField disabled>
             <label slFieldLabel>Total pago</label>
             <div slCurrencyField>
               <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The longest amounts the family can hold',
        'Fifteen digits is where a double stops holding a cent, and the keystroke past it is refused rather than rounded. The currency written as a name is the longest string of all.',
        `<div slCurrencyField>
           <input
             slCurrencyFieldInput
             currency="BRL"
             locale="pt-BR"
             defaultValue="9999999999999.99"
           />
         </div>
         <div slCurrencyField>
           <input
             slCurrencyFieldInput
             currency="BRL"
             locale="pt-BR"
             defaultValue="1480"
             currencyDisplay="name"
           />
         </div>
         <div slCurrencyField>
           <input
             slCurrencyFieldInput
             currency="USD"
             locale="en-US"
             defaultValue="-1234.56"
             min="-1000000"
             [format]="{ currencySign: 'accounting' }"
           />
         </div>`,
      ) +
        scene(
          'At 320 pixels',
          'The frame scrolls its own text rather than wrapping, and the truncation falls at the end: the leading digits — the ones that carry the magnitude — are the ones that stay.',
          measure(
            `<div slCurrencyField>
               <input
                 slCurrencyFieldInput
                 currency="BRL"
                 locale="pt-BR"
                 defaultValue="9999999999999.99"
               />
             </div>`,
          ) +
            measure(
              `<div slCurrencyField>
                 <input
                   slCurrencyFieldInput
                   currency="USD"
                   locale="pt-BR"
                   defaultValue="1480"
                   currencyDisplay="name"
                 />
               </div>`,
            ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { total: new FormControl<number | null>(1480) },
    template: grid(
      2,
      scene(
        'An amount inside a Reactive Form',
        'The control is a ControlValueAccessor, so the form owns the amount in major units and the line below it is the form’s own value rather than the element’s text.',
        `<div slField>
           <label slFieldLabel>Order total</label>
           <div slCurrencyField>
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" [formControl]="total" />
           </div>
           <span slFieldDescription>total.value = {{ total.value }}</span>
         </div>`,
      ) +
        scene(
          'A hidden input carries the raw number',
          'name reaches a hidden input beside the visible one, so a form submits 1480.5 rather than the formatted string a server would have to parse back.',
          `<div slCurrencyField>
             <input
               slCurrencyFieldInput
               name="total"
               currency="BRL"
               locale="pt-BR"
               defaultValue="1480.5"
             />
           </div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Typing, and the two keys that are not digits',
        'Digits shift left and Backspace shifts right. Press the minus key: it sets the sign without entering the digit run, and pressing it twice does not produce two signs.',
        `<div slCurrencyField>
           <input slCurrencyFieldInput currency="BRL" locale="pt-BR" min="-100000" />
         </div>`,
      ) +
        scene(
          'Stepping, and the wheel that is not bound',
          'Arrows step by step, Shift and the page keys by largeStep, Alt by smallStep, Home and End reach the bounds. The wheel moves the second field only while it has focus.',
          `<div slCurrencyField stepper="stacked">
             <input
               slCurrencyFieldInput
               currency="BRL"
               locale="pt-BR"
               defaultValue="100"
               min="0"
               max="1000"
             />
           </div>
           <div slCurrencyField>
             <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="50" wheel />
           </div>`,
        ),
    ),
  }),
};
