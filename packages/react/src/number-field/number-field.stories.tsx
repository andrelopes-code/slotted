import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Package, Percent } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Icon } from '../icon';
import { NumberField, NumberFieldScrub } from './number-field';
import { NumberFieldDefaultsProvider } from './number-field-defaults';
import { Grid, Measure, Scene } from './number-field-demo';
import { REACT_NUMBER_FIELD_DOCS, REACT_NUMBER_FIELD_TOKENS } from './number-field.docs';
import type { NumberFieldHandle } from './number-field.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_NUMBER_FIELD_DOCS.numberField.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    stepper: Stepper,
    range: Range,
    format: Format,
    formatOn: FormatOn,
    locale: Locale,
    adornments: Adornments,
    scrub: Scrub,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/NumberField',
  component: NumberField,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Number Field',
        description:
          'One numeric value, written for a locale by Intl.NumberFormat, moved by the arrows or by two buttons, in a frame around a text input that carries the APG’s spinbutton role.',
        framework: 'React',
        ...REACT_NUMBER_FIELD_DOCS.numberField,
        tokens: REACT_NUMBER_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    clamp: 'blur',
    max: 99,
    min: 1,
    size: 'md',
    snapToStep: false,
    step: 1,
    stepper: 'stacked',
    variant: 'outline',
    wheel: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Quantity</FieldLabel>
        <NumberField {...args} defaultValue={3} />
        <FieldDescription>Maximum of 99 units per order.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The three steps on their own"
        layout="stack"
        note="Height, inline padding, type, glyph and the stepper column all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts."
      >
        <NumberField defaultValue={8} size="sm" />
        <NumberField defaultValue={12} size="md" />
        <NumberField defaultValue={24} size="lg" />
      </Scene>
      <Scene
        label="Inside a field, the field decides"
        layout="stack"
        note="A small field holding a medium control is a field and a control disagreeing about one row, so the control reads the field’s step before its own provider’s."
      >
        <Field size="sm">
          <FieldLabel>Parcelas</FieldLabel>
          <NumberField defaultValue={12} max={24} min={1} />
        </Field>
        <Field size="lg">
          <FieldLabel>Valor da parcela</FieldLabel>
          <NumberField
            defaultValue={1480}
            format={{ currency: 'BRL', style: 'currency' }}
            locale="pt-BR"
          />
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
        label="A frame that takes the ground it is placed on"
        layout="stack"
        note="outline paints no ground of its own, so the same amount looks right on a page, inside a card and inside a sunken panel without a second token."
      >
        <NumberField defaultValue={1480} locale="pt-BR" />
        <NumberField defaultValue={1480} locale="pt-BR" variant="subtle" />
      </Scene>
      <Scene
        label="A cell that is only a control while it is used"
        layout="stack"
        note="plain shows no border at rest and keeps exactly the same box, so a table row does not reflow when the pointer crosses it. Hover one and the edge arrives."
      >
        <NumberField defaultValue={240} stepper="none" variant="plain" />
        <NumberField defaultValue={1480} locale="pt-BR" stepper="none" variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const Stepper: Story = {
  parameters: scenario('stepper'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A column at the end, and a button at each end"
        layout="stack"
        note="Hold either button: it steps once, waits, and then repeats until you let go. The split arrangement is the only one whose targets clear 24 pixels in both axes, which is what a thumb needs."
      >
        <NumberField defaultValue={12} stepper="stacked" />
        <NumberField defaultValue={3} max={99} min={1} stepper="split" />
      </Scene>
      <Scene
        label="No buttons at all, and the field that keeps them"
        layout="stack"
        note="An amount in a dense table is typed and never spun, so two buttons in that cell are two things to hit by mistake. The arrows still work in both."
      >
        <NumberField
          defaultValue={1480}
          format={{ currency: 'BRL', style: 'currency' }}
          locale="pt-BR"
          stepper="none"
        />
        <NumberField defaultValue={1480} locale="pt-BR" stepper="stacked" />
      </Scene>
    </Grid>
  ),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The bound, and the button that stops at it"
        layout="stack"
        note="The first control is already at its maximum and the second at its minimum: the stepper that would leave the range is disabled rather than silently inert, so its name still announces and it looks unavailable."
      >
        <NumberField defaultValue={10} max={10} min={0} />
        <NumberField defaultValue={0} max={10} min={0} />
      </Scene>
      <Scene
        label="Three answers to a value outside the range"
        layout="stack"
        note="Type 400 into each and tab away. blur returns it to 100, strict refused the keystroke that would have left the range, and none keeps what you typed and reports it as invalid."
      >
        <NumberField clamp="blur" max={100} min={0} placeholder="clamp=blur" />
        <NumberField clamp="strict" max={100} min={0} placeholder="clamp=strict" />
        <NumberField clamp="none" max={100} min={0} placeholder="clamp=none" />
      </Scene>
    </Grid>
  ),
};

export const Format: Story = {
  parameters: scenario('format'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Currency, percent and unit"
        layout="stack"
        note="One numeric type, written three ways. The percent control holds 0.125 and shows 12,5%: what a reader types and what a server receives are the same number in both directions."
      >
        <NumberField
          defaultValue={1480}
          format={{ currency: 'BRL', style: 'currency' }}
          locale="pt-BR"
        />
        <NumberField
          defaultValue={0.125}
          format={{ style: 'percent' }}
          locale="pt-BR"
          step={0.01}
        />
        <NumberField
          defaultValue={240}
          format={{ style: 'unit', unit: 'kilogram', unitDisplay: 'short' }}
          locale="pt-BR"
        />
      </Scene>
      <Scene
        label="Precision, and the symbol that is not part of the value"
        layout="stack"
        note="maximumFractionDigits is where precision is stated, and it also decides which keys the filter admits: the integer control below refuses a decimal separator outright."
      >
        <NumberField defaultValue={1.5} format={{ maximumFractionDigits: 0 }} min={0} />
        <NumberField
          defaultValue={12.5}
          end={
            <Icon>
              <Percent />
            </Icon>
          }
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

export const FormatOn: Story = {
  parameters: scenario('formatOn'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="change — regrouped as it is typed"
        layout="stack"
        note="Select the value and type 1234567 back into each. The separators arrive with the digits, so the magnitude is checkable at the moment it is being got wrong, and the caret stays on the character it was on because it is counted in the reader’s own characters rather than in string indices."
      >
        <NumberField defaultValue={1234567} locale="pt-BR" />
        <NumberField
          defaultValue={1234567}
          format={{ currency: 'BRL', style: 'currency' }}
          locale="pt-BR"
        />
      </Scene>
      <Scene
        label="commit — held until the field is left"
        layout="stack"
        note="The same two amounts, and the same two at rest: the axis changes nothing until a key is pressed. Retype them and the text stays 1234567 until blur, Enter, a stepper press or a key step — the model React Aria, Base UI, Zag, Carbon and Fluent ship, and what an amount pasted and audited rather than typed wants. The number moves on every keystroke that parses under both."
      >
        <NumberField defaultValue={1234567} formatOn="commit" locale="pt-BR" />
        <NumberField
          defaultValue={1234567}
          format={{ currency: 'BRL', style: 'currency' }}
          formatOn="commit"
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One number, three ways of writing it"
        layout="stack"
        note="Paste “R$ 1.480,00” into the first and “١٬٤٨٠” into the third: both parse, because the parser is built from the same Intl parts the formatter writes with."
      >
        <NumberField defaultValue={1480.5} locale="pt-BR" />
        <NumberField defaultValue={1480.5} locale="en-US" />
        <NumberField defaultValue={1480.5} locale="ar-EG" />
      </Scene>
      <Scene
        label="Set once for the application"
        layout="stack"
        note="A form where one amount reads 1.234 as a thousand and another as one point two three four is a form that loses money, so the locale is the application's decision (SlottedProvider) rather than a per-field one."
      >
        <SlottedProvider locale="pt-BR">
          <NumberField defaultValue={1480.5} />
          <NumberField defaultValue={98765.43} format={{ currency: 'BRL', style: 'currency' }} />
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A mark before the value and a unit after it"
        layout="stack"
        note="Neither is ever squeezed: the value gives up width first, because the value is the part that can scroll. Switch the toolbar to rtl and R$ stays before the amount."
      >
        <NumberField defaultValue={1480} end="BRL" locale="pt-BR" start="R$" />
        <NumberField defaultValue={240} end="un" min={0} />
      </Scene>
      <Scene
        label="Inside the value, or beside it"
        layout="stack"
        note="The first control’s symbol comes from format and is part of what a reader copies; the second’s is an adornment, never selected and never parsed. Both look alike and only one travels with the number."
      >
        <NumberField
          defaultValue={1480}
          format={{ currency: 'BRL', style: 'currency' }}
          locale="pt-BR"
        />
        <NumberField
          defaultValue={240}
          locale="pt-BR"
          start={
            <Icon>
              <Package />
            </Icon>
          }
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
        label="A layer’s geometry, as a design tool edits it"
        layout="stack"
        note="Press a mark and drag sideways: two pixels per step, Shift for ten. The mark lifts to the value’s ink under the pointer, and the frame carries data-scrubbing while the drag lasts."
      >
        <NumberField
          aria-label="Largura"
          defaultValue={320}
          end="px"
          min={0}
          start={<NumberFieldScrub>L</NumberFieldScrub>}
        />
        <NumberField
          aria-label="Altura"
          defaultValue={180}
          end="px"
          min={0}
          start={<NumberFieldScrub>H</NumberFieldScrub>}
        />
      </Scene>
      <Scene
        label="A coarser and a finer drag"
        layout="stack"
        note="sensitivity is pixels per step: the angle takes four, so a full turn is a long but steady drag; the opacity stops at its bounds whatever the pointer does."
      >
        <NumberField
          aria-label="Angle"
          defaultValue={45}
          end="°"
          max={360}
          min={0}
          start={<NumberFieldScrub sensitivity={4}>A</NumberFieldScrub>}
        />
        <NumberField
          aria-label="Opacidade"
          defaultValue={100}
          end="%"
          max={100}
          min={0}
          start={<NumberFieldScrub>O</NumberFieldScrub>}
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
        label="Invalid, and what says so besides the border"
        layout="stack"
        note="The border is the quietest part of it: aria-invalid announces the state and the field’s error says it in words, because in the high-contrast scheme the border cannot carry it at all."
      >
        <Field invalid>
          <FieldLabel>Discount</FieldLabel>
          <NumberField clamp="none" defaultValue={120} format={{ style: 'percent' }} max={1} />
          <FieldError>The discount cannot exceed 100%.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Read-only is not disabled"
        layout="stack"
        note="Read-only keeps full-strength ink and softens its edge, stays focusable and copyable and is still submitted; disabled is muted to a measured color rather than faded. Both disable the steppers instead of removing them."
      >
        <NumberField defaultValue={12} readOnly />
        <NumberField defaultValue={12} disabled />
        <NumberField defaultValue={1480} disabled locale="pt-BR" start="R$" />
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Longer than the box, and negative"
        layout="stack"
        note="The value ellipsises rather than clipping mid-glyph, the digits are tabular so nothing shifts as they are typed over, and the minus sign stays in front of the amount in a right-to-left document."
      >
        <NumberField defaultValue={1480320559774.25} locale="pt-BR" />
        <NumberField defaultValue={-1480} end="BRL" locale="pt-BR" start="R$" />
      </Scene>
      <Scene
        label="At 240 pixels, and in another numbering system"
        layout="stack"
        note="The value surrenders width first while the stepper keeps its target size, so the buttons stay hittable in a drawer as narrow as a phone."
      >
        <Measure>
          <NumberField defaultValue={1480320559} locale="pt-BR" start="R$" />
        </Measure>
        <Measure>
          <NumberField defaultValue={1480} locale="ar-EG" stepper="split" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => <CompositionScenes />,
};

function CompositionScenes() {
  const handle = useRef<NumberFieldHandle>(null);
  const [submitted, setSubmitted] = useState('');

  return (
    <Grid columns={2}>
      <Scene
        label="Five decisions an application takes once"
        layout="stack"
        note="The provider carries the appearance, the stepper, the format timing and the clamp policy, so a form of twenty amounts repeats none of them. A control that states one itself still wins."
      >
        <NumberFieldDefaultsProvider stepper="split" variant="subtle">
          <NumberField defaultValue={3} max={99} min={1} />
          <NumberField defaultValue={12} stepper="stacked" />
        </NumberFieldDefaultsProvider>
      </Scene>
      <Scene
        label="Reaching the two actions, and submitting the raw number"
        layout="stack"
        note="handle is increment() and decrement() — what a keyboard shortcut elsewhere on the page would call. Submit the form: the hidden input carries 1480, never the formatted string."
      >
        <div className="slotted-demo-row">
          <NumberField defaultValue={3} handle={handle} max={99} min={1} />
          <Button onClick={() => handle.current?.increment()} variant="outline">
            Mais um
          </Button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(new FormData(event.currentTarget).get('amount')?.toString() ?? '');
          }}
        >
          <NumberField
            defaultValue={1480}
            format={{ currency: 'BRL', style: 'currency' }}
            locale="pt-BR"
            name="amount"
          />
          <FieldDescription>
            {submitted === '' ? 'Nothing sent.' : `Sent: ${submitted}`}
          </FieldDescription>
        </form>
      </Scene>
    </Grid>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Every key the pattern lists"
        layout="stack"
        note="Arrows step by 5, Shift and the page keys by 25, Alt by 0.5, Home reaches 0 and End reaches 100. Tab never lands on a stepper: twenty amounts in a form would be forty extra stops."
      >
        <NumberField defaultValue={50} largeStep={25} max={100} min={0} smallStep={0.5} step={5} />
        <NumberField defaultValue={4} min={2} snapToStep step={3} />
      </Scene>
      <Scene
        label="The wheel, and the key that is left alone"
        layout="stack"
        note="Focus the first control and turn the wheel over it; do the same on the second and nothing moves. Nothing is bound to Escape, and Enter commits the value and then submits the form."
      >
        <NumberField defaultValue={50} max={100} min={0} wheel />
        <NumberField defaultValue={50} max={100} min={0} />
      </Scene>
    </Grid>
  ),
};
