import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShield } from '@ng-icons/lucide';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '@slotted/angular/button';
import { SlLink } from '@slotted/angular/link';

import { SlInlineMessage } from './inline-message';
import { provideInlineMessageDefaults } from './inline-message-defaults';
import type {
  InlineMessageLive,
  InlineMessageSize,
  InlineMessageTone,
} from './inline-message-defaults';
import { SlInlineMessageIcon } from './inline-message-parts';
import { ANGULAR_INLINE_MESSAGE_DOCS, ANGULAR_INLINE_MESSAGE_TOKENS } from './inline-message.docs';

interface InlineMessageStoryArgs {
  hideIcon: boolean;
  live: InlineMessageLive;
  loading: boolean;
  reserve: boolean;
  size: InlineMessageSize;
  tone: InlineMessageTone;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_INLINE_MESSAGE_DOCS.inlineMessage.scenes, {
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

const meta: Meta<InlineMessageStoryArgs> = {
  title: 'Components/Inline Message',
  component: SlInlineMessage,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlButton, SlInlineMessage, SlInlineMessageIcon, SlLink],
      providers: [provideIcons({ lucideShield })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Inline Message',
        description:
          'One sentence about one field or one control — with a mark saying how serious it is, and the same severity in a word a screen reader reads before the message.',
        framework: 'Angular',
        ...ANGULAR_INLINE_MESSAGE_DOCS.inlineMessage,
        tokens: ANGULAR_INLINE_MESSAGE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<InlineMessageStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'block',
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

const message = (attributes: string, body: string) =>
  `<p slInlineMessage ${attributes}>${body}</p>`;

/**
 * A control with a label and a message wired to it, which is where this family
 * lives. `field` builds this in wave 3; until then the demonstrations show the
 * three attributes a consumer writes themselves, because a message nothing
 * points at is the commonest way the family is used wrong.
 */
const field = (label: string, control: string, body: string) =>
  `<div class="slotted-demo-stack">
     <span class="slotted-demo-scene__label">${label}</span>
     ${control}
     ${body}
   </div>`;

const TONES: readonly [InlineMessageTone, string][] = [
  ['secondary', 'Between 8 and 64 characters, with at least one number.'],
  ['accent', 'This address is also used for billing.'],
  ['success', 'Username available.'],
  ['warning', 'The password is valid but easy to guess.'],
  ['danger', 'This email is already registered.'],
];

export const Playground: Story = {
  args: {
    hideIcon: false,
    live: 'off',
    loading: false,
    reserve: false,
    size: 'sm',
    tone: 'danger',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <p
          slInlineMessage
          [tone]="tone"
          [size]="size"
          [live]="live"
          [loading]="loading"
          [hideIcon]="hideIcon"
          [reserve]="reserve"
        >
          Enter a valid EIN to continue.
        </p>
      </div>`,
  }),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Four severities and one absence of one',
        'secondary is help: no mark, no severity word, and the neutral muted ink rather than a tone’s label colour, which under a field reads as loud as the label above it.',
        TONES.map(([tone, body]) => message(`tone="${tone}"`, body)).join(''),
      ) +
        scene(
          'The same five with no colour at all',
          'Switch the toolbar to high-contrast, or read this in greyscale: the silhouette is what is left telling an error from a note, and the hidden word is what a reader hears.',
          TONES.map(([tone]) => message(`tone="${tone}"`, `tone="${tone}"`)).join(''),
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
        'A compact field and a large field',
        'sm sits under a compact control and stays quieter than it; md sits under a large control. A message about a whole section is an alert.',
        message('size="sm" tone="danger"', 'sm — a mensagem de um campo.') +
          message('size="md" tone="danger"', 'md — a mensagem de um campo grande.'),
      ) +
        scene(
          'Both answer the density switch',
          'Set the toolbar to dense: type and mark step down together, because both read the control scales, which are the only ones the theme restates per density.',
          message('size="md" tone="success"', 'The March invoice was paid.') +
            message('size="sm"', 'The amount includes taxes for the destination state.'),
        ),
    ),
  }),
};

export const Pending: Story = {
  parameters: scenario('pending'),
  render: () => ({
    props: { state: 'checking' as 'checking' | 'free' },
    template: grid(
      2,
      scene(
        'The check, and the answer it becomes',
        'Press the buttons: the ring is replaced by a mark and the tone changes, and nothing else moves — the box was the same size while it was waiting.',
        `<p
           slInlineMessage
           live="polite"
           [loading]="state === 'checking'"
           [tone]="state === 'free' ? 'success' : 'secondary'"
         >
           {{ state === 'checking' ? 'Checking availability…' : 'Name available.' }}
         </p>
         <button slButton size="sm" variant="outline" type="button" (click)="state = 'free'">
           Answer available
         </button>
         <button slButton size="sm" variant="ghost" type="button" (click)="state = 'checking'">
           Verificar de novo
         </button>`,
      ) +
        scene(
          'A wait at either step',
          'The ring takes the mark’s box at both sizes and both tones, so a pending message under a dense table is the same shape as the answer that replaces it.',
          message('loading size="sm"', 'Verificando disponibilidade…') +
            message('loading size="md" tone="accent"', 'Enviando o arquivo para o servidor…'),
        ),
    ),
  }),
};

export const Wiring: Story = {
  parameters: scenario('wiring'),
  render: () => ({
    template: grid(
      2,
      scene(
        'An error the control points at',
        'aria-invalid on the control and aria-errormessage at the message’s id are what carry the message to a screen reader; without them a red sentence is decoration.',
        field(
          'CNPJ',
          `<input
             id="wiring-cnpj"
             value="12.345.678/0001-9"
             aria-invalid="true"
             [attr.aria-errormessage]="error.messageId"
           />`,
          `<p slInlineMessage #error="slInlineMessage" tone="danger">Two digits are missing.</p>`,
        ),
      ) +
        scene(
          'A hint the control is described by',
          'The same wiring with aria-describedby instead, because a hint is not an error — and the family generates the id either way when the page states none.',
          field(
            'Legal name',
            `<input id="wiring-name" [attr.aria-describedby]="hint.messageId" />`,
            `<p slInlineMessage #hint="slInlineMessage">As shown on the EIN letter.</p>`,
          ),
        ),
    ),
  }),
};

export const Live: Story = {
  parameters: scenario('live'),
  render: () => ({
    props: { saves: 0 },
    template: grid(
      2,
      scene(
        'Already on the page',
        'live is off, and the APG says why: a screen reader does not inform anyone of a message that was present before the page finished loading.',
        message('', 'We use the EIN only to issue the invoice.'),
      ) +
        scene(
          'Arriving while the reader is elsewhere',
          'Press Save with a screen reader running: role=status is on the message itself, because there is no control inside it to keep out of the region.',
          `<button slButton size="sm" type="button" (click)="saves = saves + 1">Save</button>
           @if (saves > 0) {
             <p slInlineMessage live="polite" tone="success">
               Changes saved. Attempt {{ saves }}.
             </p>
           }`,
        ),
    ),
  }),
};

export const Reserve: Story = {
  parameters: scenario('reserve'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Nothing to say, and the line still there',
        'Both fields render the message unconditionally; only the right scene has an error. Compare the two Legal name labels — they sit at the same height, which is the whole point.',
        field(
          'EIN',
          `<input id="reserve-empty" value="12.345.678/0001-90" />`,
          message('reserve tone="danger"', ''),
        ) +
          field(
            'Legal name',
            `<input id="reserve-empty-next" value="Acme Inc." />`,
            message('', 'As shown on the EIN letter.'),
          ),
      ) +
        scene(
          'The same two with the error present',
          'The mark and the hidden severity word appear with the sentence and withdraw with it, so an empty reserved message is a held line rather than a stranded icon.',
          field(
            'EIN',
            `<input id="reserve-full" value="12-34567" aria-invalid="true" />`,
            message('reserve tone="danger"', 'Two digits are missing.'),
          ) +
            field(
              'Legal name',
              `<input id="reserve-full-next" value="Acme Inc." />`,
              message('', 'As shown on the EIN letter.'),
            ),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      3,
      scene(
        'Long, and in another language',
        'A German compound wraps to three lines and the mark stays on the first, because the mark’s box is one line box tall rather than centred on the whole message.',
        message(
          'tone="warning"',
          'Die Zahlungsbestätigung konnte nicht zugestellt werden, weil die hinterlegte Rechnungsadresse nicht mit der Adresse der Bank übereinstimmt.',
        ),
      ) +
        scene(
          'A string no language can break',
          'A container digest breaks inside itself rather than running out of the message, and nothing is removed: the whole string stays in the DOM and a page search still finds it.',
          `<div class="slotted-demo-measure">${message(
            'tone="danger"',
            'sha256:9f2c4ab1de77c0d5e8b3a6f41c9d0e72b58a4437cc61de09f2a3b7d1e40c5a86',
          )}</div>`,
        ) +
        scene(
          'A link inside the sentence, and the page’s own mark',
          'The message is one grid item rather than two, so a link in the middle of it wraps with the words around it instead of being placed in a column of its own.',
          `<p slInlineMessage>
             We accept card, ACH transfer and Zelle. <a slLink href="#fees">See fees</a>
           </p>
           <p slInlineMessage tone="accent">
             <ng-icon slInlineMessageIcon aria-hidden="true" name="lucideShield"></ng-icon>
             Two-step verification protects this account.
           </p>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [
        provideInlineMessageDefaults({ prefixes: { danger: 'Error:', warning: 'Warning:' } }),
      ],
    }),
  ],
  render: () => ({
    template: grid(
      3,
      scene(
        'One decision for the application',
        'provideInlineMessageDefaults replaces the severity words once and merges over the shipped table, so writing danger alone leaves warning and success where they were.',
        message('tone="danger"', 'Heard as “Error: this email already exists.”') +
          message('tone="warning"', 'Heard as “Warning: the password is weak.”') +
          message('tone="success"', 'Heard as “Success: …”, because only two were replaced.'),
      ) +
        scene(
          'The element the page wrote',
          'Angular needs no render prop: the directive sits on the consumer’s own element, so a message becomes a div — or a list of failures — without leaving the family.',
          `<div slInlineMessage tone="danger">The box is a div; everything else is the same.</div>`,
        ) +
        scene(
          'The page’s own mark, and none at all',
          'A projected slInlineMessageIcon keeps the box, the colour and the place on the first line; hideIcon removes the box and leaves the severity word a reader hears.',
          `<p slInlineMessage tone="accent">
             <ng-icon slInlineMessageIcon aria-hidden="true" name="lucideShield"></ng-icon>
             The artwork belongs to the application; the box belongs to the family.
           </p>
           ${message('hideIcon tone="danger"', 'No mark at all, and still announced as an error.')}`,
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      2,
      scene(
        'What a screen reader reads',
        'Each of these announces its severity as a word before the sentence — “Error: …”, “Warning: …” — which is the only part of the severity that reaches a reader who cannot see it.',
        message('tone="danger"', 'Enter a valid EIN.') +
          message('tone="warning"', 'The password is valid but easy to guess.') +
          message('tone="success"', 'Username available.'),
      ) +
        scene(
          'Two ways to change the word',
          'One message can say its own, and the empty string removes it — for a sentence like the last one here, which already names the severity in its first word.',
          message('tone="danger" prefix="Error:"', 'Announced as “Error: enter a valid EIN.”') +
            message('tone="danger" prefix=""', 'Error: enter a valid EIN.') +
            message('tone="danger" disabled', 'Disabled: the ink is measured, not opacity.'),
        ),
    ),
  }),
};
