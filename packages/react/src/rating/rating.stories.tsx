import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Checkbox } from '../checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Rating } from './rating';
import { REACT_RATING_DOCS, REACT_RATING_TOKENS } from './rating.docs';

const WORDS = ['Terrible', 'Poor', 'Fair', 'Good', 'Excellent'];

/** The word for a value on a five-point whole scale, or the fallback for none. */
function word(value: number | null, empty = 'No rating') {
  return value === null ? empty : (WORDS[Math.ceil(value) - 1] ?? empty);
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_RATING_DOCS.rating.scenes, {
    playground: Playground,
    half: Half,
    states: States,
    field: InsideAField,
    labels: Labels,
    keyboard: Keyboard,
    touch: Touch,
  }) as never;

const meta = {
  title: 'Components/Rating/Rating',
  component: Rating,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Rating',
        description:
          'An ordinal value chosen by lighting symbols in order: native radios that share a name, arrows that stop at both ends, a press on the lit star that empties it, and a finger that scrubs along the row.',
        framework: 'React',
        ...REACT_RATING_DOCS.rating,
        tokens: REACT_RATING_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'aria-label': 'Your rating of the Studio Pro Headphones',
    clearable: true,
    defaultValue: 4,
    disabled: false,
    invalid: false,
    max: 5,
    readOnly: false,
    size: 'md',
    step: 1,
    tone: 'warning',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    step: { control: 'inline-radio', options: [1, 0.5] },
    tone: { control: 'inline-radio', options: ['accent', 'info', 'success', 'warning', 'danger'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="stack">
      <Rating
        {...args}
        caption={({ preview, value }) =>
          args.step === 0.5 ? String(preview ?? value ?? '') : word(preview ?? value)
        }
        locale="pt-BR"
      />
    </div>
  ),
};

export const Half: Story = {
  parameters: scenario('half'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Two radios in every star"
        note="Point at the left half of the fourth star and the row previews 3,5; press it and the caption says so. The half radio sits above the whole one, so a press on the inline-start half is the half value."
        layout="stack"
      >
        <Rating
          aria-label="Conforto, por meios pontos"
          caption={({ preview, value }) =>
            new Intl.NumberFormat('pt-BR').format(preview ?? value ?? 0)
          }
          defaultValue={3.5}
          locale="pt-BR"
          step={0.5}
        />
      </Scene>
      <Scene
        label="The arrows step by halves"
        note="Ten stops for five stars: focus the row and hold the right arrow. Home is half a star and End is five; nothing wraps."
        layout="stack"
      >
        <Rating aria-label="Bateria, por meios pontos" defaultValue={2} locale="pt-BR" step={0.5} />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="Read-only keeps the value"
        note="Every star keeps its tab stop and its light, and nothing moves: no preview, no press, no key. aria-readonly says why."
        layout="stack"
      >
        <Rating
          aria-label="Your rating on the previous purchase"
          caption={word(4)}
          defaultValue={4}
          readOnly
        />
      </Scene>
      <Scene
        label="Disabled dims the row"
        note="Every radio is disabled natively, so none is a tab stop; the two lit stars still read as the value that was given."
        layout="stack"
      >
        <Rating aria-label="Closed rating" caption={word(2)} defaultValue={2} disabled />
      </Scene>
      <Scene
        label="Invalid and required"
        note="aria-invalid and aria-required are written on the group, never on a radio; the focus ring turns to the danger color."
        layout="stack"
      >
        <Rating aria-label="Required rating" invalid required />
      </Scene>
    </Grid>
  ),
};

function NotApplicable() {
  const [skipped, setSkipped] = useState(false);
  return (
    <Field disabled={skipped} required={!skipped}>
      <FieldLabel>In-store service</FieldLabel>
      <Rating caption={({ preview, value }) => word(preview ?? value)} />
      <FieldDescription>Only if you picked up the order at one of our stores.</FieldDescription>
      <Checkbox checked={skipped} onCheckedChange={setSkipped}>
        Not applicable
      </Checkbox>
    </Field>
  );
}

export const InsideAField: Story = {
  parameters: scenario('field'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Named and described by the field"
        note="The group takes its name from the label through aria-labelledby and hears the description and the error through aria-describedby. The field hands down required, invalid and size."
        layout="stack"
      >
        <Field invalid required size="lg">
          <FieldLabel>Qualidade do som</FieldLabel>
          <Rating />
          <FieldDescription>From one to five stars.</FieldDescription>
          <FieldError>Give a rating to submit the review.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="A question that may not apply"
        note="A critical form never forces a rating on someone who has no opinion: the checkbox disables the rating and lifts the requirement, instead of a zero-star option the scale does not have."
        layout="stack"
      >
        <NotApplicable />
      </Scene>
    </Grid>
  ),
};

function Following() {
  const [preview, setPreview] = useState<number | null>(null);
  return (
    <Rating
      aria-label="Delivery"
      caption={({ value }) =>
        preview === null ? `Your rating: ${word(value)}` : `Preview: ${word(preview)}`
      }
      defaultValue={3}
      onPreviewChange={setPreview}
    />
  );
}

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A word that follows the pointer"
        note="caption as a function receives the value held and the value under the pointer. The word is hidden from assistive technology: each radio is already named 1 de 5 to 5 de 5 by itemLabel."
        layout="stack"
      >
        <Rating
          aria-label="Atendimento"
          caption={({ preview, value }) => word(preview ?? value)}
          defaultValue={4}
        />
      </Scene>
      <Scene
        label="The preview as an event"
        note="onPreviewChange reports the value under the pointer and null when it leaves; the page decides what to do with it, and nothing it owns has moved."
        layout="stack"
      >
        <Following />
      </Scene>
      <Scene
        label="Messages in another language"
        note="Every string is a message of the language in force, laid over per instance. itemLabel names each radio, and the locale writes its digits."
        layout="stack"
      >
        <Rating
          aria-label="Your rating"
          defaultValue={4}
          locale="en-US"
          messages={{ itemLabel: '{value} of {max} stars' }}
        />
      </Scene>
      <Scene
        label="A long word wraps inside the row"
        note="The caption breaks within the row rather than pushing the stars off it, which is where a translated word goes."
        layout="block"
      >
        <Measure>
          <Rating
            aria-label="Would recommend"
            caption="Would recommend without hesitation to friends and family"
            defaultValue={5}
          />
        </Measure>
      </Scene>
    </Grid>
  ),
};

function KeyLog() {
  const [log, setLog] = useState('No key yet');
  return (
    <Rating
      aria-label="Embalagem"
      caption={log}
      defaultValue={3}
      onValueChange={(value, request) =>
        setLog(`${value === null ? 'vazio' : value} · ${request.reason}`)
      }
    />
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Arrows that stop, Home, End and clear"
        note="Tab in, then press the arrows: the value stops at one and at five. Home and End reach the ends; Backspace or Delete empty it. The caption shows the value and the reason each request carried."
        layout="stack"
      >
        <KeyLog />
      </Scene>
      <Scene
        label="Right to left"
        note="In a right-to-left document the left arrow raises the value and the right arrow lowers it; up and down keep their meaning in every script."
        layout="stack"
      >
        <div dir="rtl">
          <Rating aria-label="تقييم" defaultValue={2} />
        </div>
      </Scene>
    </Grid>
  ),
};

export const Touch: Story = {
  parameters: scenario('touch'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Scrub with a finger"
        note="On a touch screen, drag along the row: the value follows the finger and is asked for only when it changes, and the fill tracks without easing while data-dragging is on the root. The page still scrolls vertically."
        layout="stack"
      >
        <Rating
          aria-label="Arraste para avaliar de um a dez"
          caption={({ value }) => (value === null ? 'Arraste' : `${value} de 10`)}
          max={10}
          size="lg"
        />
      </Scene>
    </Grid>
  ),
};
