import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';

import { Button } from '../button';
import { Link } from '../link';
import { InlineMessage } from './inline-message';
import { InlineMessageDefaultsProvider } from './inline-message-defaults';
import { Grid, LabelledInput, Scene, ShieldGlyph } from './inline-message-demo';
import { REACT_INLINE_MESSAGE_DOCS, REACT_INLINE_MESSAGE_TOKENS } from './inline-message.docs';
import type { InlineMessageTone } from './inline-message.types';

const TONES: readonly { tone: InlineMessageTone; message: string }[] = [
  { tone: 'secondary', message: 'Between 8 and 64 characters, with at least one number.' },
  { tone: 'accent', message: 'This address will also be used for billing.' },
  { tone: 'success', message: 'Username available.' },
  { tone: 'warning', message: 'The password is valid, but easy to guess.' },
  { tone: 'danger', message: 'This email is already registered.' },
];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_INLINE_MESSAGE_DOCS.inlineMessage.scenes, {
    playground: Playground,
    tones: Tones,
    sizes: Sizes,
    pending: Pending,
    wiring: Wiring,
    live: Live,
    reserve: Reserve,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Inline Message',
  component: InlineMessage,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Inline Message',
        description:
          'One sentence about one field or one control — with a mark saying how serious it is, and the same severity in a word a screen reader reads before the message.',
        framework: 'React',
        ...REACT_INLINE_MESSAGE_DOCS.inlineMessage,
        tokens: REACT_INLINE_MESSAGE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof InlineMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: 'Enter a valid EIN to continue.',
    hideIcon: false,
    live: 'off',
    loading: false,
    reserve: false,
    size: 'sm',
    tone: 'danger',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <InlineMessage {...args} />
    </div>
  ),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Four severities and one absence of one"
        note="secondary is help: no mark, no severity word, and the neutral muted ink rather than a tone’s label color, which under a field reads as loud as the label above it."
      >
        {TONES.map(({ message, tone }) => (
          <InlineMessage key={tone} tone={tone}>
            {message}
          </InlineMessage>
        ))}
      </Scene>
      <Scene
        label="The same five with no color at all"
        note="Switch the toolbar to high-contrast, or read this in grayscale: the silhouette is what is left telling an error from a note, and the hidden word is what a reader hears."
      >
        {TONES.map(({ tone }) => (
          <InlineMessage key={tone} tone={tone}>
            {`tone="${tone}"`}
          </InlineMessage>
        ))}
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A compact field and a large field"
        note="sm sits under a compact control and stays quieter than it; md sits under a large control. A message about a whole section is an alert."
      >
        <InlineMessage size="sm" tone="danger">
          sm — a mensagem de um campo.
        </InlineMessage>
        <InlineMessage size="md" tone="danger">
          md — a mensagem de um campo grande.
        </InlineMessage>
      </Scene>
      <Scene
        label="Both answer the density switch"
        note="Set the toolbar to dense: type and mark step down together, because both read the control scales, which are the only ones the theme restates per density."
      >
        <InlineMessage size="md" tone="success">
          The March invoice has been paid.
        </InlineMessage>
        <InlineMessage size="sm">
          The amount includes taxes from the destination state.
        </InlineMessage>
      </Scene>
    </Grid>
  ),
};

function Availability() {
  const [state, setState] = useState<'checking' | 'free' | 'taken'>('checking');

  return (
    <>
      <InlineMessage
        live="polite"
        loading={state === 'checking'}
        tone={state === 'free' ? 'success' : state === 'taken' ? 'danger' : 'secondary'}
      >
        {state === 'checking'
          ? 'Checking availability…'
          : state === 'free'
            ? 'Name available.'
            : 'This name is already in use.'}
      </InlineMessage>
      <Button onClick={() => setState('free')} size="sm" variant="outline">
        Answer available
      </Button>
      <Button onClick={() => setState('checking')} size="sm" variant="ghost">
        Verificar de novo
      </Button>
    </>
  );
}

export const Pending: Story = {
  parameters: scenario('pending'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The check, and the answer it becomes"
        note="Press the buttons: the ring is replaced by a mark and the tone changes, and nothing else moves — the box was the same size while it was waiting."
      >
        <Availability />
      </Scene>
      <Scene
        label="A wait at either step"
        note="The ring takes the mark’s box at both sizes and both tones, so a pending message under a dense table is the same shape as the answer that replaces it."
      >
        <InlineMessage loading size="sm">
          Verificando disponibilidade…
        </InlineMessage>
        <InlineMessage loading size="md" tone="accent">
          Enviando o arquivo para o servidor…
        </InlineMessage>
      </Scene>
    </Grid>
  ),
};

function WiredField() {
  const messageId = useId();

  return (
    <LabelledInput defaultValue="12-34567" invalid label="EIN" messageId={messageId}>
      <InlineMessage id={messageId} tone="danger">
        Two digits are missing.
      </InlineMessage>
    </LabelledInput>
  );
}

function HintedField() {
  const messageId = useId();

  return (
    <LabelledInput label="Legal name" messageId={messageId}>
      <InlineMessage id={messageId}>As shown on the EIN letter.</InlineMessage>
    </LabelledInput>
  );
}

export const Wiring: Story = {
  parameters: scenario('wiring'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="An error the control points at"
        note="aria-invalid on the control and aria-errormessage at the message’s id are what carry the message to a screen reader; without them a red sentence is decoration."
      >
        <WiredField />
      </Scene>
      <Scene
        label="A hint the control is described by"
        note="The same wiring with aria-describedby instead, because a hint is not an error — and the family generates the id either way when the page states none."
      >
        <HintedField />
      </Scene>
    </Grid>
  ),
};

function Announced() {
  const [saves, setSaves] = useState(0);

  return (
    <>
      <Button onClick={() => setSaves((count) => count + 1)} size="sm">
        Save
      </Button>
      {saves === 0 ? null : (
        <InlineMessage live="polite" tone="success">
          Changes saved. Attempt {saves}.
        </InlineMessage>
      )}
    </>
  );
}

export const Live: Story = {
  parameters: scenario('live'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Already on the page"
        note="live is off, and the APG says why: a screen reader does not inform anyone of a message that was present before the page finished loading."
      >
        <InlineMessage>We use the EIN only to issue the invoice.</InlineMessage>
      </Scene>
      <Scene
        label="Arriving while the reader is elsewhere"
        note="Press Save with a screen reader running: role=status is on the message itself, because there is no control inside it to keep out of the region."
      >
        <Announced />
      </Scene>
    </Grid>
  ),
};

function ReservedField({ error }: { error?: string }) {
  const messageId = useId();

  return (
    <LabelledInput
      defaultValue={error === undefined ? '12.345.678/0001-90' : '12.345.678/0001-9'}
      invalid={error !== undefined}
      label="CNPJ"
      messageId={messageId}
    >
      <InlineMessage id={messageId} reserve tone="danger">
        {error}
      </InlineMessage>
    </LabelledInput>
  );
}

export const Reserve: Story = {
  parameters: scenario('reserve'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Nothing to say, and the line still there"
        note="Both fields render the message unconditionally; only the right one has an error. Compare the two Legal name labels — they sit at the same height, which is the whole point."
      >
        <ReservedField />
        <LabelledInput defaultValue="Acme Inc." label="Legal name" messageId="reserve-empty-next">
          <InlineMessage>As shown on the EIN letter.</InlineMessage>
        </LabelledInput>
      </Scene>
      <Scene
        label="The same two with the error present"
        note="The mark and the hidden severity word appear with the sentence and withdraw with it, so an empty reserved message is a held line rather than a stranded icon."
      >
        <ReservedField error="Two digits are missing." />
        <LabelledInput defaultValue="Acme Inc." label="Legal name" messageId="reserve-full-next">
          <InlineMessage>As shown on the EIN letter.</InlineMessage>
        </LabelledInput>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="Long, and in another language"
        note="A German compound wraps to three lines and the mark stays on the first, because the mark’s box is one line box tall rather than centerd on the whole message."
      >
        <InlineMessage tone="warning">
          Die Zahlungsbestätigung konnte nicht zugestellt werden, weil die hinterlegte
          Rechnungsadresse nicht mit der Adresse der Bank übereinstimmt.
        </InlineMessage>
      </Scene>
      <Scene
        label="A string no language can break"
        note="A container digest breaks inside itself rather than running out of the message, and nothing is removed: the whole string stays in the DOM and a page search still finds it."
      >
        <div className="slotted-demo-measure">
          <InlineMessage tone="danger">
            sha256:9f2c4ab1de77c0d5e8b3a6f41c9d0e72b58a4437cc61de09f2a3b7d1e40c5a86
          </InlineMessage>
        </div>
      </Scene>
      <Scene
        label="A link inside the sentence, and the page’s own mark"
        note="The message is one grid item rather than two, so a link in the middle of it wraps with the words around it instead of being placed in a column of its own."
      >
        <InlineMessage>
          We accept credit card, ACH transfer and Zelle. <Link href="#tarifas">View fees</Link>
        </InlineMessage>
        <InlineMessage icon={<ShieldGlyph />} tone="accent">
          Two-step verification protects this account.
        </InlineMessage>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="One decision for the application"
        note="The provider replaces the severity words once and merges over the shipped table, so writing danger alone leaves warning and success exactly where they were."
      >
        <InlineMessageDefaultsProvider prefixes={{ danger: 'Error:', warning: 'Attention:' }}>
          <InlineMessage tone="danger">Heard as “Error: this email already exists.”</InlineMessage>
          <InlineMessage tone="warning">Heard as “Attention: the password is weak.”</InlineMessage>
          <InlineMessage tone="success">
            Heard as “Success: …”, because only two words were swapped.
          </InlineMessage>
        </InlineMessageDefaultsProvider>
      </Scene>
      <Scene
        label="Another element for the message"
        note="render substitutes the element and hands it every data attribute, which is how one message carries a list of failures instead of a sentence."
      >
        <InlineMessage render={(props) => <div {...props} />} tone="danger">
          The box is a div; everything else is the same.
        </InlineMessage>
      </Scene>
      <Scene
        label="The page’s own mark, and none at all"
        note="icon keeps the box, the color and the place on the first line; hideIcon removes the box and leaves the severity word, because that is what a reader hears."
      >
        <InlineMessage icon={<ShieldGlyph />} tone="accent">
          The art belongs to the application; the box belongs to the family.
        </InlineMessage>
        <InlineMessage hideIcon tone="danger">
          No mark at all, and still announced as an error.
        </InlineMessage>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="What a screen reader reads"
        note="Each of these announces its severity as a word before the sentence — “Error: …”, “Warning: …” — which is the only part of the severity that reaches a reader who cannot see it."
      >
        <InlineMessage tone="danger">Enter a valid EIN.</InlineMessage>
        <InlineMessage tone="warning">The password is valid, but easy to guess.</InlineMessage>
        <InlineMessage tone="success">Username available.</InlineMessage>
      </Scene>
      <Scene
        label="Two ways to change the word"
        note="One message can say its own, and the empty string removes it — for a sentence like the last one here, which already names the severity in its first word."
      >
        <InlineMessage prefix="Error:" tone="danger">
          Announced as “Error: enter a valid EIN.”
        </InlineMessage>
        <InlineMessage prefix="" tone="danger">
          Error: enter a valid EIN.
        </InlineMessage>
        <InlineMessage disabled tone="danger">
          Disabled: the ink is measured, not an opacity.
        </InlineMessage>
      </Scene>
    </Grid>
  ),
};
