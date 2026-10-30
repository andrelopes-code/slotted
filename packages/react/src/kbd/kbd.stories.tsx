import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { Heading, Text } from '../typography';
import { Kbd } from './kbd';
import { KbdDefaultsProvider } from './kbd-defaults';
import { REACT_KBD_DOCS, REACT_KBD_TOKENS } from './kbd.docs';
import { Shortcut } from './shortcut';
import type { KbdSize, KbdVariant } from './kbd.types';

const VARIANTS: readonly KbdVariant[] = ['raised', 'outline', 'soft', 'plain'];
const SIZES: readonly KbdSize[] = ['xs', 'sm', 'md', 'lg'];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_KBD_DOCS.kbd.scenes, {
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

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Kbd',
        description:
          'A key, or a whole combination, drawn for the reader’s keyboard and named for the reader’s screen reader.',
        framework: 'React',
        ...REACT_KBD_DOCS.kbd,
        tokens: REACT_KBD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

function Scene({
  children,
  label,
  layout = 'row',
  note,
}: {
  children: ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: ReactNode;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

/** A menu row: the label takes the room and the shortcut takes the end of it. */
function Row({
  children,
  disabled = false,
  label,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
}) {
  return (
    <>
      <Text {...(disabled ? { 'data-disabled': '' } : {})}>{label}</Text>
      <div>{children}</div>
    </>
  );
}

export const Playground: Story = {
  args: {
    disabled: false,
    keyName: 'mod',
    platform: 'mac',
    size: 'md',
    variant: 'raised',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="prose">
      <Text>
        Press <Kbd {...args} /> to open the palette, or hold it with{' '}
        <Kbd {...args} keyName="shift" /> to open it in a new pane. A key is only ever as legible as
        the sentence it interrupts, which is why this one is here.
      </Text>
    </div>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="On the page’s own ground"
        note="raised carries a thicker bottom edge, so it reads as an object rather than as a box drawn round a word. outline is the same key without it."
      >
        <div className="slotted-demo-rows">
          {VARIANTS.map((variant) => (
            <Row key={variant} label={variant}>
              <Shortcut keys="mod+b" platform="windows" variant={variant} />
            </Row>
          ))}
        </div>
      </Scene>
      <Scene
        label="On a surface the family did not choose"
        note="raised and soft bring their own ground with them; outline and plain take the surface underneath, which is what they exist for."
      >
        <div className="slotted-demo-surface" data-surface="inverse">
          {VARIANTS.map((variant) => (
            <Shortcut key={variant} keys="mod+b" platform="windows" variant={variant} />
          ))}
        </div>
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="The three absolute steps"
        note="Type and glyph come from the control type scale, the only scale the theme restates per density, so a key shrinks beside the controls it sits with."
      >
        {SIZES.map((size) => (
          <Kbd key={size} keyName="escape" size={size} />
        ))}
      </Scene>
      <Scene
        label='size="inherit"'
        layout="stack"
        note="The step no other library ships. The cap is a proportion of the text it interrupts, so it is right in a heading and right in fine print."
      >
        <Heading level={3}>
          Press <Kbd keyName="escape" size="inherit" /> to close
        </Heading>
        <Text>
          Press <Kbd keyName="escape" size="inherit" /> to close
        </Text>
        <Text size="sm" tone="muted">
          Press <Kbd keyName="escape" size="inherit" /> to close
        </Text>
      </Scene>
    </div>
  ),
};

export const OneShortcut: Story = {
  parameters: scenario('shortcut'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Written once"
        layout="stack"
        note="One string, and the family draws the caps, the order and the joining. The markup is a kbd inside a kbd, which is what the HTML Standard says a combination is."
      >
        <Shortcut keys="mod+shift+p" platform="windows" />
        <Shortcut keys="mod+k" platform="windows" />
        <Shortcut keys="alt+f4" platform="windows" />
      </Scene>
      <Scene
        label="Keys the vocabulary does not hold"
        layout="stack"
        note="A token it does not recognise is the page’s own word, rendered verbatim; a single letter is upper-cased, which is what Apple and Microsoft both write."
      >
        <Shortcut keys="mod+plus" platform="windows" />
        <Shortcut keys="mod+/" platform="windows" />
        <Shortcut keys="mod+F6" platform="windows" />
      </Scene>
    </div>
  ),
};

export const Platform: Story = {
  parameters: scenario('platform'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="mac"
        layout="stack"
        note="Apple Style Guide order: Fn, Control, Option, Shift, Command. Nothing is drawn between the caps, because a Mac joins with nothing."
      >
        <Shortcut keys="mod+shift+alt+p" platform="mac" />
        <Shortcut keys="meta+backspace" platform="mac" />
      </Scene>
      <Scene
        label="windows"
        layout="stack"
        note="The Windows key ahead of Ctrl, Alt and Shift, and a plus between every pair. The authored string is the same one the Mac column rendered."
      >
        <Shortcut keys="mod+shift+alt+p" platform="windows" />
        <Shortcut keys="meta+backspace" platform="windows" />
      </Scene>
      <Scene
        label="linux"
        layout="stack"
        note="mod is still Ctrl and meta becomes Super, which is the distinction Nuxt’s single meta entry cannot make."
      >
        <Shortcut keys="mod+shift+alt+p" platform="linux" />
        <Shortcut keys="meta+backspace" platform="linux" />
      </Scene>
    </div>
  ),
};

export const Sequence: Story = {
  parameters: scenario('sequence'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Two keys, one after the other"
        layout="stack"
        note="Whitespace is the step break. “G then I” is how Gmail, Linear and GitHub write a sequence, and no surveyed implementation can express it at all."
      >
        <Shortcut keys="g i" platform="mac" />
        <Shortcut keys="g p" platform="mac" />
      </Scene>
      <Scene
        label="Two chords, one after the other"
        layout="stack"
        note="A step may hold a whole combination, so the VS Code style of chorded shortcut reads as one thing rather than as four caps in a row."
      >
        <Shortcut keys="mod+k mod+s" platform="windows" />
        <Shortcut keys="mod+k mod+s" platform="mac" />
      </Scene>
    </div>
  ),
};

export const Context: Story = {
  parameters: scenario('context'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="A menu"
        note="plain takes the colour of the text it sits in, so a row that dims dims its shortcut with no state to set on the key at all."
      >
        <div className="slotted-demo-rows">
          <Row label="Open command palette">
            <Shortcut keys="mod+k" platform="mac" variant="plain" />
          </Row>
          <Row label="Toggle the sidebar">
            <Shortcut keys="mod+b" platform="mac" variant="plain" />
          </Row>
          <Row label="Go to file">
            <Shortcut keys="mod+p" platform="mac" variant="plain" />
          </Row>
        </div>
      </Scene>
      <Scene
        label="A sentence"
        layout="prose"
        note="Inline is where a kbd element spends most of its life. The cap sits on the text’s centre and takes no more of the line than the words around it."
      >
        <Text>
          Press <Shortcut keys="mod+k" platform="mac" size="inherit" /> to search, or{' '}
          <Kbd keyName="escape" size="inherit" /> to close the field and get the cursor back.
        </Text>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Available, then not"
        layout="stack"
        note="disabled dims the ground, the rim, the ink and the separator together, so nothing is left bright at the end of a grey row."
      >
        {VARIANTS.map((variant) => (
          <div className="slotted-demo-row" key={variant}>
            <Shortcut keys="mod+z" platform="windows" variant={variant} />
            <Shortcut disabled keys="mod+z" platform="windows" variant={variant} />
          </div>
        ))}
      </Scene>
      <Scene
        label="Inside a row that dims itself"
        note="The usual case needs no state at all: plain inherits, so an unavailable item takes its shortcut down with it."
      >
        <div className="slotted-demo-rows">
          <Row label="Undo">
            <Shortcut keys="mod+z" platform="mac" variant="plain" />
          </Row>
          <Row disabled label="Redo">
            <Shortcut disabled keys="mod+shift+z" platform="mac" variant="plain" />
          </Row>
        </div>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="The longest key names"
        layout="stack"
        note="A key label is never truncated: half a key name is a wrong instruction, so the cap grows and the row around it makes room."
      >
        <Kbd keyName="capslock" platform="windows" />
        <Kbd keyName="backspace" platform="windows" />
        <Kbd keyName="pagedown" platform="windows" />
      </Scene>
      <Scene
        label="Translated legends"
        layout="stack"
        note="Both the mark and the spoken word are replaced through the provider, so Strg is seen and Steuerung is heard without touching either binding."
      >
        <KbdDefaultsProvider
          legends={{ ctrl: 'Strg', shift: 'Umschalt', delete: 'Entf' }}
          names={{ ctrl: 'Steuerung', shift: 'Umschalt', delete: 'Entfernen' }}
          platform="windows"
        >
          <Shortcut keys="mod+shift+delete" />
          <Shortcut keys="mod+k mod+s" messages={{ then: 'dann' }} />
        </KbdDefaultsProvider>
      </Scene>
      <Scene
        label="Wider than its column"
        note="It wraps between caps and never inside one. The trailing plus stays with the line it broke from, the way an operator does in a formula."
      >
        <div className="slotted-demo-measure">
          <Shortcut keys="fn+meta+mod+alt+shift+backspace" platform="windows" />
        </div>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="Keys written by hand"
        layout="stack"
        note="They are rendered in the order written, which is the way out of the platform reordering — and the group still hands its painting to each of them."
      >
        <Shortcut platform="mac" variant="soft">
          <Kbd keyName="mod" />
          <Kbd>K</Kbd>
        </Shortcut>
        <Shortcut platform="mac" variant="soft">
          <Kbd>Any</Kbd>
          <Kbd keyName="shift" />
        </Shortcut>
      </Scene>
      <Scene
        label="Another element"
        layout="stack"
        note="render substitutes the rendered element and hands it every data attribute, so a key can be an abbr or a page’s own component without losing its parts."
      >
        <Kbd keyName="escape" render={(props) => <abbr {...props} />} />
        <Kbd keyName="mod" platform="mac" render={(props) => <var {...props} />} />
      </Scene>
      <Scene
        label="One decision for the application"
        layout="stack"
        note="The provider sets the platform, the painting and the wording once. A key that states any of them itself still wins over it."
      >
        <KbdDefaultsProvider platform="mac" size="sm" variant="soft">
          <Shortcut keys="mod+k" />
          <Shortcut keys="mod+k" variant="raised" />
        </KbdDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="What is heard, not what is seen"
        layout="stack"
        note="Every mark and every abbreviation hides its legend and carries the word: ⌘ announces “Command” rather than “place of interest sign”, and Ctrl is not left to a pronunciation dictionary."
      >
        <Shortcut keys="mod+shift+k" platform="mac" />
        <Shortcut keys="mod+shift+k" platform="windows" />
        <Shortcut keys="up down left right" platform="mac" />
      </Scene>
      <Scene
        label="Punctuation, and the word that is not"
        layout="stack"
        note="The plus is hidden — “Command Shift K” is what the platforms announce — and the word between two steps is read, because it is the only thing that tells a sequence from a chord."
      >
        <Shortcut keys="mod+k" platform="windows" />
        <Shortcut keys="mod+k mod+s" platform="windows" />
        <Kbd>Any key</Kbd>
      </Scene>
    </div>
  ),
};
