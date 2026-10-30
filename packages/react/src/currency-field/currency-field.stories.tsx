import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { CurrencyField, CurrencyFieldScrub } from './currency-field';
import { CurrencyFieldDefaultsProvider } from './currency-field-defaults';
import { Grid, Measure, Scene } from './currency-field-demo';
import { REACT_CURRENCY_FIELD_DOCS, REACT_CURRENCY_FIELD_TOKENS } from './currency-field.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CURRENCY_FIELD_DOCS.currencyField.scenes, {
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

const meta = {
  title: 'Components/CurrencyField',
  component: CurrencyField,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Currency Field',
        description:
          'One monetary amount, in one currency, typed the way a cash register is typed: the digits enter at the cent and shift left, no separator is ever pressed, and the request carries the exact integer a payment API is charged in.',
        framework: 'React',
        ...REACT_CURRENCY_FIELD_DOCS.currencyField,
        tokens: REACT_CURRENCY_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof CurrencyField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    align: 'end',
    clamp: 'blur',
    currency: 'BRL',
    currencyDisplay: 'symbol',
    entry: 'cents',
    locale: 'pt-BR',
    min: 0,
    size: 'md',
    step: 1,
    stepper: 'none',
    variant: 'outline',
    wheel: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Order total</FieldLabel>
        <CurrencyField {...args} defaultValue={1480} />
        <FieldDescription>Type digits only: 1234 becomes R$ 12,34.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Entry: Story = {
  parameters: scenario('entry'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Cents first, the cash register"
        layout="stack"
        note="Type 1, 2, 3, 4 without touching a separator: the digits enter at the cent and shift left, and the caret stays after the last one."
      >
        <Field>
          <FieldLabel>Amount received</FieldLabel>
          <CurrencyField currency="BRL" entry="cents" locale="pt-BR" />
        </Field>
      </Scene>
      <Scene
        label="Natural, the spreadsheet"
        layout="stack"
        note="Type 1234,5 and leave the field: the text is yours until the commit, and the separator is typed like any other character."
      >
        <Field>
          <FieldLabel>Amount received</FieldLabel>
          <CurrencyField currency="BRL" entry="natural" locale="pt-BR" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Currency: Story = {
  parameters: scenario('currency'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Four keystrokes, three shifts"
        layout="stack"
        note="Type 1234 into each. A real has two minor digits, a yen none and a dinar three, so the same four keys mean three different amounts."
      >
        <CurrencyField currency="BRL" locale="pt-BR" />
        <CurrencyField currency="JPY" locale="pt-BR" />
        <CurrencyField currency="KWD" locale="pt-BR" />
      </Scene>
      <Scene
        label="How the currency is written"
        layout="stack"
        note="The same amount under the four displays: the symbol, the narrow symbol a domestic screen uses, the ISO code a back office prefers, and the name."
      >
        <CurrencyField currency="USD" currencyDisplay="symbol" defaultValue={1480} locale="pt-BR" />
        <CurrencyField
          currency="USD"
          currencyDisplay="narrowSymbol"
          defaultValue={1480}
          locale="pt-BR"
        />
        <CurrencyField currency="USD" currencyDisplay="code" defaultValue={1480} locale="pt-BR" />
        <CurrencyField currency="USD" currencyDisplay="name" defaultValue={1480} locale="pt-BR" />
      </Scene>
    </Grid>
  ),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The currency governs; the locale writes"
        layout="stack"
        note="A Brazilian back office paying a US invoice: the symbol comes from USD and the separators from pt-BR, which is the combination a hand-configured mask gets wrong."
      >
        <CurrencyField currency="USD" defaultValue={1480} locale="pt-BR" />
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />
      </Scene>
      <Scene
        label="Where the symbol goes is the locale’s decision"
        layout="stack"
        note="French writes the symbol last and separates its thousands with a narrow space; German puts the symbol last too and swaps the two separators."
      >
        <CurrencyField currency="EUR" defaultValue={1480} locale="fr-FR" />
        <CurrencyField currency="EUR" defaultValue={1480} locale="de-DE" />
        <CurrencyField currency="EGP" defaultValue={1480} locale="ar-EG" />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The three steps on their own"
        layout="stack"
        note="Height, inline padding, type and glyph all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts."
      >
        <CurrencyField currency="BRL" defaultValue={89.9} locale="pt-BR" size="sm" />
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" size="md" />
        <CurrencyField currency="BRL" defaultValue={24900} locale="pt-BR" size="lg" />
      </Scene>
      <Scene
        label="Inside a field, the field decides"
        layout="stack"
        note="The control reads the field’s step before the provider’s: a small field holding a medium control is a field and a control disagreeing about one row."
      >
        <Field size="sm">
          <FieldLabel>Frete</FieldLabel>
          <CurrencyField currency="BRL" defaultValue={24.9} locale="pt-BR" />
        </Field>
        <Field size="lg">
          <FieldLabel>Total</FieldLabel>
          <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Three frames, one box"
        layout="stack"
        note="outline takes the ground it is placed on, subtle sinks into the page, and plain shows nothing at rest. The box never changes, so nothing reflows when the pointer crosses it."
      >
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" variant="outline" />
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" variant="subtle" />
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" variant="plain" />
      </Scene>
      <Scene
        label="A table of amounts, where a border on every row would shout"
        layout="stack"
        note="plain is the variant a dense table needs: the amounts read as a column of figures, and the frame appears only under the pointer or the caret."
      >
        <div className="slotted-demo-rows">
          <span>Subscription</span>
          <CurrencyField currency="BRL" defaultValue={89.9} locale="pt-BR" variant="plain" />
          <span>Setup</span>
          <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" variant="plain" />
          <span>Support</span>
          <CurrencyField currency="BRL" defaultValue={240} locale="pt-BR" variant="plain" />
        </div>
      </Scene>
    </Grid>
  ),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Set against the reading end"
        layout="stack"
        note="Read the column down: the cents of every row line up, so a magnitude is one glance rather than three. It is the default, and it is where the cents-first caret already lives."
      >
        <CurrencyField align="end" currency="BRL" defaultValue={12} locale="pt-BR" />
        <CurrencyField align="end" currency="BRL" defaultValue={1480} locale="pt-BR" />
        <CurrencyField align="end" currency="BRL" defaultValue={987654.32} locale="pt-BR" />
      </Scene>
      <Scene
        label="Set against the reading start"
        layout="stack"
        note="The same three amounts, and no column to read: it is the right answer for one amount inside a form that reads as a sentence, and the wrong one for a ledger."
      >
        <CurrencyField align="start" currency="BRL" defaultValue={12} locale="pt-BR" />
        <CurrencyField align="start" currency="BRL" defaultValue={1480} locale="pt-BR" />
        <CurrencyField align="start" currency="BRL" defaultValue={987654.32} locale="pt-BR" />
      </Scene>
    </Grid>
  ),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Three policies over one range"
        layout="stack"
        note="Type 99999 into each. blur returns the amount to the range when you leave; strict refuses the keystroke that would leave it; none keeps what you typed and says so."
      >
        <Field>
          <FieldLabel>Blur</FieldLabel>
          <CurrencyField clamp="blur" currency="BRL" locale="pt-BR" max={1000} min={0} />
        </Field>
        <Field>
          <FieldLabel>Strict</FieldLabel>
          <CurrencyField clamp="strict" currency="BRL" locale="pt-BR" max={1000} min={0} />
        </Field>
        <Field>
          <FieldLabel>None</FieldLabel>
          <CurrencyField clamp="none" currency="BRL" locale="pt-BR" max={1000} min={0} />
        </Field>
      </Scene>
      <Scene
        label="A debit, and a field that refuses one"
        layout="stack"
        note="min is the only thing that says whether an amount may be negative. Press the minus key in each: the refund takes it, and the total below it does not."
      >
        <Field>
          <FieldLabel>Estorno</FieldLabel>
          <CurrencyField currency="BRL" defaultValue={-1234.56} locale="pt-BR" min={-100000} />
        </Field>
        <Field>
          <FieldLabel>Order total</FieldLabel>
          <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" min={0} />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Stepper: Story = {
  parameters: scenario('stepper'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Withdrawn, which is the default"
        layout="stack"
        note="An invoice total is typed, not nudged, and two buttons that move it by one real invite a mis-click that costs money. PrimeNG leaves its own buttons off for the same reason."
      >
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />
      </Scene>
      <Scene
        label="A price a reader adjusts"
        layout="stack"
        note="Hold either button: it steps once, waits, then repeats. step is one major unit — one real, not one centavo — and Shift moves by ten of them."
      >
        <CurrencyField currency="BRL" defaultValue={25} locale="pt-BR" min={0} stepper="stacked" />
        <CurrencyField currency="BRL" defaultValue={25} locale="pt-BR" min={0} stepper="split" />
      </Scene>
    </Grid>
  ),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Inside the amount"
        layout="stack"
        note="Select the whole field and copy it: the symbol comes with the amount, because it is part of the string the control holds and part of what aria-valuetext announces."
      >
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />
        <CurrencyField currency="USD" currencyDisplay="code" defaultValue={1480} locale="pt-BR" />
      </Scene>
      <Scene
        label="Beside the amount"
        layout="stack"
        note="The same two marks as siblings: never selected, never copied, never parsed. It is the right answer when the symbol is a label rather than part of the number."
      >
        <CurrencyField
          currency="BRL"
          currencyDisplay="none"
          defaultValue={1480}
          locale="pt-BR"
          start="R$"
        />
        <CurrencyField
          currency="BRL"
          currencyDisplay="none"
          defaultValue={1480}
          end="per month"
          locale="pt-BR"
          start="R$"
        />
      </Scene>
    </Grid>
  ),
};

export const Scrub: Story = {
  parameters: scenario('scrub'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The symbol as the drag mark"
        layout="stack"
        note="Press R$ and drag sideways: two pixels per real, Shift for ten. The mark lifts to the amount’s ink under the pointer, and the frame carries data-scrubbing while the drag lasts."
      >
        <CurrencyField
          aria-label="Price"
          currency="BRL"
          currencyDisplay="none"
          defaultValue={1480}
          locale="pt-BR"
          min={0}
          start={<CurrencyFieldScrub>R$</CurrencyFieldScrub>}
        />
      </Scene>
      <Scene
        label="A coarser step, a bounded range"
        layout="stack"
        note="step is ten reais and sensitivity four pixels, so the drag is slow and lands on round amounts; the budget stops at its bounds whatever the pointer does."
      >
        <CurrencyField
          aria-label="Budget"
          currency="BRL"
          currencyDisplay="none"
          defaultValue={250}
          locale="pt-BR"
          max={1000}
          min={0}
          start={<CurrencyFieldScrub sensitivity={4}>R$</CurrencyFieldScrub>}
          step={10}
        />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="What the frame paints"
        layout="stack"
        note="Hover the first and tab into it, then compare the last two: read-only keeps its ink because the amount is real and still submitted, and disabled mutes it because nobody can reach it."
      >
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />
        <CurrencyField currency="BRL" defaultValue={1480} invalid locale="pt-BR" />
        <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" readOnly />
        <CurrencyField currency="BRL" defaultValue={1480} disabled locale="pt-BR" />
      </Scene>
      <Scene
        label="Where the state comes from"
        layout="stack"
        note="Unstated means ask the field: the control defers rather than overriding, and the error the field draws is what the reader hears through aria-describedby."
      >
        <Field invalid>
          <FieldLabel>Total</FieldLabel>
          <CurrencyField currency="BRL" defaultValue={0} locale="pt-BR" min={1} />
          <FieldError>Informe um valor maior que zero.</FieldError>
        </Field>
        <Field disabled>
          <FieldLabel>Total pago</FieldLabel>
          <CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The longest amounts the family can hold"
        layout="stack"
        note="Fifteen digits is where a double stops holding a cent, and the keystroke past it is refused rather than rounded. The currency written as a name is the longest string of all."
      >
        <CurrencyField currency="BRL" defaultValue={9999999999999.99} locale="pt-BR" />
        <CurrencyField currency="BRL" currencyDisplay="name" defaultValue={1480} locale="pt-BR" />
        <CurrencyField
          currency="USD"
          defaultValue={-1234.56}
          format={{ currencySign: 'accounting' }}
          locale="en-US"
          min={-1000000}
        />
      </Scene>
      <Scene
        label="At 320 pixels"
        layout="stack"
        note="The frame scrolls its own text rather than wrapping, and the truncation falls at the end: the leading digits — the ones that carry the magnitude — are the ones that stay."
      >
        <Measure>
          <CurrencyField currency="BRL" defaultValue={9999999999999.99} locale="pt-BR" />
        </Measure>
        <Measure>
          <CurrencyField currency="USD" currencyDisplay="name" defaultValue={1480} locale="pt-BR" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const [minorUnits, setMinorUnits] = useState<number | null>(148000);

    return (
      <Grid columns={2}>
        <Scene
          label="An application that decides once"
          layout="stack"
          note="The provider carries the currency and the axes, so a form of twenty amounts states none of them; the locale comes from the language in force. A control that states one still wins."
        >
          <CurrencyFieldDefaultsProvider currency="BRL">
            <Field>
              <FieldLabel>Assinatura</FieldLabel>
              <CurrencyField defaultValue={89.9} name="subscription" />
            </Field>
            <Field>
              <FieldLabel>Setup, in dollars</FieldLabel>
              <CurrencyField currency="USD" defaultValue={1480} name="setup" />
            </Field>
          </CurrencyFieldDefaultsProvider>
        </Scene>
        <Scene
          label="The integer a payment gateway is charged in"
          layout="stack"
          note="Type into the field and watch the line below it: the request carries the exact minor-unit integer, so nobody writes Math.round(value * 100) and loses a half cent."
        >
          <CurrencyField
            currency="BRL"
            defaultValue={1480}
            locale="pt-BR"
            onValueChange={(_value, request) => setMinorUnits(request.minorUnits)}
          />
          <output>{minorUnits === null ? 'nada a cobrar' : `${minorUnits} centavos`}</output>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Typing, and the two keys that are not digits"
        layout="stack"
        note="Digits shift left and Backspace shifts right. Press the minus key: it sets the sign without entering the digit run, and pressing it twice does not produce two signs."
      >
        <CurrencyField currency="BRL" locale="pt-BR" min={-100000} />
      </Scene>
      <Scene
        label="Stepping, and the wheel that is not bound"
        layout="stack"
        note="Arrows step by step, Shift and the page keys by largeStep, Alt by smallStep, Home and End reach the bounds. The wheel moves the second field only while it has focus."
      >
        <CurrencyField
          currency="BRL"
          defaultValue={100}
          locale="pt-BR"
          max={1000}
          min={0}
          stepper="stacked"
        />
        <CurrencyField currency="BRL" defaultValue={50} locale="pt-BR" wheel />
      </Scene>
    </Grid>
  ),
};
