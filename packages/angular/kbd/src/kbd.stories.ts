import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlHeading, SlText } from '@slotted/angular/typography';

import { SlKbd } from './kbd';
import { provideKbdDefaults } from './kbd-defaults';
import type { KbdPlatformInput, KbdSize, KbdVariant } from './kbd-defaults';
import { ANGULAR_KBD_DOCS, ANGULAR_KBD_TOKENS } from './kbd.docs';
import { SlShortcut } from './shortcut';

interface KbdStoryArgs {
  disabled: boolean;
  keyName: string;
  platform: KbdPlatformInput;
  size: KbdSize;
  variant: KbdVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_KBD_DOCS.kbd.scenes, {
    playground: Playground,
    variants: Variants,
    sizes: Sizes,
    shortcut: OneShortcut,
    platform: Platform,
    sequence: Sequence,
    context: Context,
    states: States,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<KbdStoryArgs> = {
  title: 'Components/Kbd',
  component: SlKbd,
  decorators: [moduleMetadata({ imports: [SlHeading, SlKbd, SlShortcut, SlText] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Kbd',
        description:
          'A key, or a whole combination, drawn for the reader’s keyboard and named for the reader’s screen reader.',
        framework: 'Angular',
        ...ANGULAR_KBD_DOCS.kbd,
        tokens: ANGULAR_KBD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<KbdStoryArgs>;

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
  layout: 'row' | 'stack' | 'block' | 'prose' = 'row',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

const VARIANTS: readonly KbdVariant[] = ['raised', 'outline', 'soft', 'plain'];

/** A menu row: the label takes the room and the shortcut takes the end of it. */
const row = (label: string, shortcut: string, disabled = false) =>
  `<span slText${disabled ? ' data-disabled' : ''}>${label}</span>` + `<div>${shortcut}</div>`;

export const Playground: Story = {
  args: {
    disabled: false,
    keyName: 'mod',
    platform: 'mac',
    size: 'md',
    variant: 'raised',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="prose">
        <p slText>Press <kbd slKbd [keyName]="keyName" [platform]="platform" [size]="size" [variant]="variant" [disabled]="disabled"></kbd> to open the palette, or hold it with <kbd slKbd keyName="shift" [platform]="platform" [size]="size" [variant]="variant" [disabled]="disabled"></kbd> to open it in a new pane. A key is only ever as legible as the sentence it interrupts, which is why this one is here.</p>
      </div>`,
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: grid(
      2,
      scene(
        'On the page’s own ground',
        'raised carries a thicker bottom edge, so it reads as an object rather than as a box drawn round a word. outline is the same key without it.',
        `<div class="slotted-demo-rows">${VARIANTS.map((variant) =>
          row(
            variant,
            `<kbd slShortcut keys="mod+b" platform="windows" variant="${variant}"></kbd>`,
          ),
        ).join('')}</div>`,
      ) +
        scene(
          'On a surface the family did not choose',
          'raised and soft bring their own ground with them; outline and plain take the surface underneath, which is what they exist for.',
          `<div class="slotted-demo-surface" data-surface="inverse">${VARIANTS.map(
            (variant) =>
              `<kbd slShortcut keys="mod+b" platform="windows" variant="${variant}"></kbd>`,
          ).join('')}</div>`,
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
        'The three absolute steps',
        'Type and glyph come from the control type scale, the only scale the theme restates per density, so a key shrinks beside the controls it sits with.',
        ['xs', 'sm', 'md', 'lg']
          .map((size) => `<kbd slKbd keyName="escape" size="${size}"></kbd>`)
          .join(''),
      ) +
        scene(
          'size="inherit"',
          'The step no other library ships. The cap is a proportion of the text it interrupts, so it is right in a heading and right in fine print.',
          `<h3 slHeading>Press <kbd slKbd keyName="escape" size="inherit"></kbd> to close</h3>` +
            `<span slText>Press <kbd slKbd keyName="escape" size="inherit"></kbd> to close</span>` +
            `<span slText size="sm" tone="muted">Press <kbd slKbd keyName="escape" size="inherit"></kbd> to close</span>`,
          'stack',
        ),
    ),
  }),
};

export const OneShortcut: Story = {
  parameters: scenario('shortcut'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Written once',
        'One string, and the family draws the caps, the order and the joining. The markup is a kbd inside a kbd, which is what the HTML Standard says a combination is.',
        `<kbd slShortcut keys="mod+shift+p" platform="windows"></kbd>` +
          `<kbd slShortcut keys="mod+k" platform="windows"></kbd>` +
          `<kbd slShortcut keys="alt+f4" platform="windows"></kbd>`,
        'stack',
      ) +
        scene(
          'Keys the vocabulary does not hold',
          'A token it does not recognize is the page’s own word, rendered verbatim; a single letter is upper-cased, which is what Apple and Microsoft both write.',
          `<kbd slShortcut keys="mod+plus" platform="windows"></kbd>` +
            `<kbd slShortcut keys="mod+/" platform="windows"></kbd>` +
            `<kbd slShortcut keys="mod+F6" platform="windows"></kbd>`,
          'stack',
        ),
    ),
  }),
};

export const Platform: Story = {
  parameters: scenario('platform'),
  render: () => ({
    template: grid(
      3,
      scene(
        'mac',
        'Apple Style Guide order: Fn, Control, Option, Shift, Command. Nothing is drawn between the caps, because a Mac joins with nothing.',
        `<kbd slShortcut keys="mod+shift+alt+p" platform="mac"></kbd>` +
          `<kbd slShortcut keys="meta+backspace" platform="mac"></kbd>`,
        'stack',
      ) +
        scene(
          'windows',
          'The Windows key ahead of Ctrl, Alt and Shift, and a plus between every pair. The authored string is the same one the Mac column rendered.',
          `<kbd slShortcut keys="mod+shift+alt+p" platform="windows"></kbd>` +
            `<kbd slShortcut keys="meta+backspace" platform="windows"></kbd>`,
          'stack',
        ) +
        scene(
          'linux',
          'mod is still Ctrl and meta becomes Super, which is the distinction Nuxt’s single meta entry cannot make.',
          `<kbd slShortcut keys="mod+shift+alt+p" platform="linux"></kbd>` +
            `<kbd slShortcut keys="meta+backspace" platform="linux"></kbd>`,
          'stack',
        ),
    ),
  }),
};

export const Sequence: Story = {
  parameters: scenario('sequence'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Two keys, one after the other',
        'Whitespace is the step break. “G then I” is how Gmail, Linear and GitHub write a sequence, and no surveyed implementation can express it at all.',
        `<kbd slShortcut keys="g i" platform="mac"></kbd><kbd slShortcut keys="g p" platform="mac"></kbd>`,
        'stack',
      ) +
        scene(
          'Two chords, one after the other',
          'A step may hold a whole combination, so the VS Code style of chorded shortcut reads as one thing rather than as four caps in a row.',
          `<kbd slShortcut keys="mod+k mod+s" platform="windows"></kbd>` +
            `<kbd slShortcut keys="mod+k mod+s" platform="mac"></kbd>`,
          'stack',
        ),
    ),
  }),
};

export const Context: Story = {
  parameters: scenario('context'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A menu',
        'plain takes the color of the text it sits in, so a row that dims dims its shortcut with no state to set on the key at all.',
        `<div class="slotted-demo-rows">${
          row(
            'Open command palette',
            '<kbd slShortcut keys="mod+k" platform="mac" variant="plain"></kbd>',
          ) +
          row(
            'Toggle the sidebar',
            '<kbd slShortcut keys="mod+b" platform="mac" variant="plain"></kbd>',
          ) +
          row('Go to file', '<kbd slShortcut keys="mod+p" platform="mac" variant="plain"></kbd>')
        }</div>`,
      ) +
        scene(
          'A sentence',
          'Inline is where a kbd element spends most of its life. The cap sits on the text’s center and takes no more of the line than the words around it.',
          `<p slText>Press <kbd slShortcut keys="mod+k" platform="mac" size="inherit"></kbd> to search, or <kbd slKbd keyName="escape" size="inherit"></kbd> to close the field and get the cursor back.</p>`,
          'prose',
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
        'Available, then not',
        'disabled dims the ground, the rim, the ink and the separator together, so nothing is left bright at the end of a grey row.',
        VARIANTS.map(
          (variant) =>
            `<div class="slotted-demo-row">` +
            `<kbd slShortcut keys="mod+z" platform="windows" variant="${variant}"></kbd>` +
            `<kbd slShortcut keys="mod+z" platform="windows" variant="${variant}" disabled></kbd>` +
            `</div>`,
        ).join(''),
        'stack',
      ) +
        scene(
          'Inside a row that dims itself',
          'The usual case needs no state at all: plain inherits, so an unavailable item takes its shortcut down with it.',
          `<div class="slotted-demo-rows">${
            row('Undo', '<kbd slShortcut keys="mod+z" platform="mac" variant="plain"></kbd>') +
            row(
              'Redo',
              '<kbd slShortcut keys="mod+shift+z" platform="mac" variant="plain" disabled></kbd>',
              true,
            )
          }</div>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  /* The provider is the demonstration: the wording is one decision, not one per key. */
  decorators: [
    applicationConfig({
      providers: [
        provideKbdDefaults({
          platform: 'windows',
          legends: { ctrl: 'Strg', shift: 'Umschalt', delete: 'Entf' },
          names: { ctrl: 'Steuerung', shift: 'Umschalt', delete: 'Entfernen' },
        }),
      ],
    }),
  ],
  render: () => ({
    template: grid(
      3,
      scene(
        'The longest key names',
        'A key label is never truncated: half a key name is a wrong instruction, so the cap grows and the row around it makes room.',
        `<kbd slKbd keyName="capslock"></kbd><kbd slKbd keyName="backspace"></kbd><kbd slKbd keyName="pagedown"></kbd>`,
        'stack',
      ) +
        scene(
          'Translated legends',
          'Both the mark and the spoken word are replaced through provideKbdDefaults, so Strg is seen and Steuerung is heard without touching either binding.',
          `<kbd slShortcut keys="mod+shift+delete"></kbd><kbd slShortcut keys="mod+k mod+s" [messages]="{ then: 'dann' }"></kbd>`,
          'stack',
        ) +
        scene(
          'Wider than its column',
          'It wraps between caps and never inside one. The trailing plus stays with the line it broke from, the way an operator does in a formula.',
          `<div class="slotted-demo-measure"><kbd slShortcut keys="fn+meta+mod+alt+shift+backspace" platform="windows"></kbd></div>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Keys written by hand',
        'They are rendered in the order written, which is the way out of the platform reordering — and the combination still hands its painting to each of them.',
        `<kbd slShortcut platform="mac" variant="soft"><kbd slKbd keyName="mod"></kbd><kbd slKbd>K</kbd></kbd>` +
          `<kbd slShortcut platform="mac" variant="soft"><kbd slKbd>Any</kbd><kbd slKbd keyName="shift"></kbd></kbd>`,
        'stack',
      ) +
        scene(
          'A key that states its own axis',
          'The combination hands on only what it was told, so a key inside it that states a size keeps that size and one that states nothing takes the group’s.',
          `<kbd slShortcut platform="mac" size="lg"><kbd slKbd keyName="mod"></kbd><kbd slKbd size="sm">K</kbd></kbd>`,
          'stack',
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
        'What is heard, not what is seen',
        'Every mark and every abbreviation hides its legend and carries the word: ⌘ announces “Command” rather than “place of interest sign”, and Ctrl is not left to a pronunciation dictionary.',
        `<kbd slShortcut keys="mod+shift+k" platform="mac"></kbd>` +
          `<kbd slShortcut keys="mod+shift+k" platform="windows"></kbd>` +
          `<kbd slShortcut keys="up down left right" platform="mac"></kbd>`,
        'stack',
      ) +
        scene(
          'Punctuation, and the word that is not',
          'The plus is hidden — “Command Shift K” is what the platforms announce — and the word between two steps is read, because it is the only thing that tells a sequence from a chord.',
          `<kbd slShortcut keys="mod+k" platform="windows"></kbd>` +
            `<kbd slShortcut keys="mod+k mod+s" platform="windows"></kbd>` +
            `<kbd slKbd>Any key</kbd>`,
          'stack',
        ),
    ),
  }),
};
