import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  Clock,
  Download,
  Info,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { GLYPHS } from '@slotted/core/glyph';
import type { GlyphName } from '@slotted/core/glyph';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Glyph } from './glyph';
import { Icon } from './icon';
import { REACT_ICON_DOCS, REACT_ICON_TOKENS } from './icon.docs';
import type { IconSize, IconTone } from './icon.types';

const SIZES: readonly IconSize[] = ['sm', 'md', 'lg'];
const TONES: readonly IconTone[] = [
  'inherit',
  'default',
  'muted',
  'accent',
  'success',
  'warning',
  'danger',
];

/**
 * `inherit` paints nothing, so listing it as a swatch beside `default` produces
 * two identical rows and proves nothing. It gets a scene of its own instead.
 */
const PAINTED_TONES = TONES.filter((tone) => tone !== 'inherit');

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta = {
  title: 'Components/Icon',
  component: Icon,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Icon',
        description: 'The box a glyph is drawn in. The artwork stays yours.',
        framework: 'React',
        ...REACT_ICON_DOCS.icon,
        tokens: REACT_ICON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: <Search />,
    size: 'md',
    tone: 'inherit',
    directional: false,
  },
  argTypes: {
    size: { control: 'select', options: ['text', 'sm', 'md', 'lg'] },
    tone: { control: 'select', options: [...TONES, 'inverse'] },
    children: { control: false },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <span className="slotted-demo-row">
        <Icon {...args} />
        Search the ledger
      </span>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Four steps</span>
          <span className="slotted-demo-scene__note">
            Three read the control icon scale, so they shrink with density exactly as the control
            beside them does. The fourth follows the type, because a control-sized glyph inside a
            display heading is not an icon. Change the density in the toolbar to see the first three
            move and the fourth stay.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <span className="slotted-demo-row">
              {SIZES.map((size) => (
                <span key={size} className="slotted-demo-row">
                  <Icon size={size}>
                    <CircleCheck />
                  </Icon>
                  {size}
                </span>
              ))}
            </span>
            <span style={{ fontSize: 'var(--slotted-font-size-3xl)', fontWeight: 600 }}>
              <Icon size="text">
                <CircleCheck />
              </Icon>{' '}
              text — follows the type
            </span>
            <span style={{ fontSize: 'var(--slotted-font-size-xs)' }}>
              <Icon size="text">
                <CircleCheck />
              </Icon>{' '}
              text — and follows it down again
            </span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Baseline: Story = {
  parameters: scenario('baseline'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Sitting on the line</span>
          <span className="slotted-demo-scene__note">
            Every other scene here lays its icons out with flexbox, where the parent decides
            alignment and the family’s optical shift is inert. This one is running text, which is
            the only place the shift does anything: the box would otherwise sit with its bottom edge
            on the baseline and read high beside lower-case letters.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div className="slotted-demo-measure">
            <p style={{ margin: 0 }}>
              Running text with an icon{' '}
              <Icon size="text">
                <Info />
              </Icon>{' '}
              set at the size of the type, and one{' '}
              <Icon>
                <Info />
              </Icon>{' '}
              set from the control scale, so the shift can be judged against a real line rather than
              against a single word.
            </p>
            <p style={{ marginBlockEnd: 0 }}>
              The same at the smallest step{' '}
              <Icon size="sm">
                <Info />
              </Icon>{' '}
              where half a pixel is visible.
            </p>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Colour</span>
          <span className="slotted-demo-scene__note">
            The default is inherit, so an icon beside a label is the colour of that label without
            anyone deciding it. The family sets colour and never fill or stroke: stroked and filled
            artwork both read currentColor, and imposing either would break the other.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            {PAINTED_TONES.map((tone) => (
              <span key={tone} className="slotted-demo-row">
                <Icon tone={tone}>
                  <Info />
                </Icon>
                {tone}
              </span>
            ))}
            <span
              className="slotted-demo-row"
              style={{
                background: 'var(--slotted-tone-warning-surface)',
                borderRadius: 'var(--slotted-radius-md)',
                color: 'var(--slotted-tone-warning-text)',
                padding: 'var(--slotted-space-4)',
              }}
            >
              <Icon>
                <Info />
              </Icon>
              inherit — no tone asked for, and the callout’s colour taken
            </span>
            <span
              className="slotted-demo-row"
              style={{
                background: 'var(--slotted-surface-inverse)',
                borderRadius: 'var(--slotted-radius-md)',
                color: 'var(--slotted-text-inverse)',
                padding: 'var(--slotted-space-4)',
              }}
            >
              <Icon tone="inverse">
                <Info />
              </Icon>
              inverse, on an inverted surface
            </span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const InContext: Story = {
  parameters: scenario('in-context'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Sized by what contains it</span>
          <span className="slotted-demo-scene__note">
            A container sets --slotted-icon-size once and every icon inside it follows, which is how
            a rebuilt Button will size its icons without knowing this family’s API. An instance that
            states its own size wins over the container.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div
            className="slotted-demo-stack"
            style={
              { '--slotted-icon-size': 'var(--slotted-control-icon-size-sm)' } as CSSProperties
            }
          >
            <span className="slotted-demo-row">
              <Icon tone="muted">
                <Clock />
              </Icon>
              A row whose container set the icon size once
            </span>
            <span className="slotted-demo-row">
              <Icon tone="accent" size="lg">
                <Clock />
              </Icon>
              And one instance that overrode it
            </span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Direction: Story = {
  parameters: scenario('direction'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Mirroring</span>
          <span className="slotted-demo-scene__note">
            Turn direction to rtl in the toolbar. The arrow and the chevron mirror because they were
            declared directional; the clock does not, because a mirrored clock runs backwards.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <span className="slotted-demo-row">
              <Icon directional>
                <ArrowRight />
              </Icon>
              directional — an arrow points at the next thing, whichever way reading runs
            </span>
            <span className="slotted-demo-row">
              <Icon directional>
                <ChevronRight />
              </Icon>
              directional — a chevron opens the same way
            </span>
            <span className="slotted-demo-row">
              <Icon>
                <Clock />
              </Icon>
              neutral — a clock mirrored is a clock that runs backwards
            </span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Named, or hidden</span>
          <span className="slotted-demo-scene__note">
            There is no decorative prop: an icon with no name is hidden from the accessibility tree,
            and an icon with one takes role=img and carries it. Run the a11y panel on this story.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <span className="slotted-demo-row">
              <Icon tone="success">
                <CircleCheck />
              </Icon>
              Paid — the icon repeats the word, so it stays out of the tree
            </span>
            <span className="slotted-demo-row">
              Invoice 4021
              <Icon label="Payment failed" tone="danger">
                <TriangleAlert />
              </Icon>
              nothing beside it says the payment failed, so the icon says it
            </span>
            <span className="slotted-demo-row">
              Export 4021
              <Icon aria-label="Export ready" tone="accent">
                <Download />
              </Icon>
              a name written as aria-label counts the same, and is not hidden
            </span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const LibraryGlyphs: Story = {
  parameters: scenario('library-glyphs'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The library’s own icons</span>
          <span className="slotted-demo-scene__note">
            Every icon a family draws for itself — a close button’s cross, a pager’s chevrons — is
            one of these, a real svg inside the Icon box.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-grid" data-columns="4">
            {(Object.keys(GLYPHS) as GlyphName[]).map((name) => (
              <span className="slotted-demo-row" key={name}>
                <Icon>
                  <Glyph name={name} />
                </Icon>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  ),
};
