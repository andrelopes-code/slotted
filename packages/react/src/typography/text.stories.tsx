import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from './text';
import { REACT_TYPOGRAPHY_DOCS, REACT_TYPOGRAPHY_TOKENS } from './typography.docs';
import type { TypographySize, TypographyTone } from './typography.types';

const SIZES: readonly TypographySize[] = ['3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
const TONES: readonly TypographyTone[] = [
  'inherit',
  'default',
  'muted',
  'accent',
  'success',
  'warning',
  'danger',
];

const NOTE =
  'Three lines are kept and the rest is clipped. The whole string stays in the document, so a screen reader still reads it, a page search still finds it, and a selection still copies it. Only the picture is shorter.';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Scale as never,
});

const meta = {
  title: 'Components/Text',
  component: Text,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Text',
        description: 'The library’s type, on the element the content actually is.',
        framework: 'React',
        ...REACT_TYPOGRAPHY_DOCS.text,
        tokens: REACT_TYPOGRAPHY_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: 'Invoices are issued on the first working day of each month.',
    size: 'md',
    weight: 'regular',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Text {...args} />
    </div>
  ),
};

export const Scale: Story = {
  parameters: scenario('scale'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Seven steps</span>
          <span className="slotted-demo-scene__note">
            Each step carries the line height the scale pairs it with. Nothing here changes with
            density: how tightly controls are packed is not a reading decision.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            {SIZES.map((size) => (
              <Text key={size} size={size}>
                {size} — the quick brown fox jumps over the lazy dog
              </Text>
            ))}
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
          <span className="slotted-demo-scene__label">Tone and emphasis</span>
          <span className="slotted-demo-scene__note">
            The default tone is inherit, so text on a tinted surface reads that surface instead of
            arguing with it.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            {TONES.map((tone) => (
              <Text key={tone} tone={tone}>
                {tone}
              </Text>
            ))}
            <Text size="xs" tone="muted" transform="uppercase" weight="semibold">
              Section label
            </Text>
            <Text align="end" numeric="tabular">
              1,204.50
            </Text>
            <Text align="end" numeric="tabular">
              88,111.09
            </Text>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Truncation: Story = {
  parameters: scenario('truncation'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Text truncate>
          A single line that runs past the edge of its container and is cut with an ellipsis rather
          than wrapped.
        </Text>
        <Text truncate={3}>{NOTE}</Text>
        <Text size="sm" tone="muted">
          f4c2b9a7e1d05836af9c74b21e0d8a5639bc17e408fa26d3915cb7420ed83fa1
        </Text>
        <Text size="sm" tone="muted">
          Select the clipped lines and copy them: the whole string is still there. A token longer
          than its container breaks instead of widening the layout.
        </Text>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Text render={(props) => <p {...props} />} wrap="pretty">
          A span claims nothing. Render the element the content is — a paragraph here — so the
          document says what it means.
        </Text>
        <Text dir="rtl" lang="ar">
          تصدر الفواتير في أول يوم عمل من كل شهر، وتسدد من وسيلة الدفع المسجلة.
        </Text>
        <Text size="sm" tone="muted">
          Alignment is logical, so a right-to-left document is the same component mirrored. The
          tracking that capitals need is undone for scripts whose letters join.
        </Text>
      </div>
    </div>
  ),
};
