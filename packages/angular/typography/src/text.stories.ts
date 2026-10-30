import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlText } from './text';
import { ANGULAR_TYPOGRAPHY_DOCS, ANGULAR_TYPOGRAPHY_TOKENS } from './typography.docs';
import type { TypographySize, TypographyWeight } from './typography';

interface TextStoryArgs {
  content: string;
  size: TypographySize;
  weight: TypographyWeight;
}

const SIZES: readonly TypographySize[] = ['3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
const TONES = [
  'inherit',
  'default',
  'muted',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
] as const;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Scale as never,
});

const meta: Meta<TextStoryArgs> = {
  title: 'Components/Text',
  component: SlText,
  decorators: [moduleMetadata({ imports: [SlText] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Text',
        description: 'The library’s type, on the element the content actually is.',
        framework: 'Angular',
        ...ANGULAR_TYPOGRAPHY_DOCS.text,
        tokens: ANGULAR_TYPOGRAPHY_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TextStoryArgs>;

export const Playground: Story = {
  args: {
    content: 'Invoices are issued on the first working day of each month.',
    size: 'md',
    weight: 'regular',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <span slText [size]="size" [weight]="weight">{{ content }}</span>
</div>`,
  }),
};

export const Scale: Story = {
  parameters: scenario('scale'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Seven steps</span>
      <span class="slotted-demo-scene__note">
        Each step carries the line height the scale pairs it with. Nothing here changes with
        density: how tightly controls are packed is not a reading decision.
      </span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        ${SIZES.map(
          (size) =>
            `<span slText size="${size}">${size} — the quick brown fox jumps over the lazy dog</span>`,
        ).join('\n        ')}
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Tone and emphasis</span>
      <span class="slotted-demo-scene__note">
        The default tone is inherit, so text on a tinted surface reads that surface instead of
        arguing with it.
      </span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        ${TONES.map((tone) => `<span slText tone="${tone}">${tone}</span>`).join('\n        ')}
        <span slText size="xs" tone="muted" transform="uppercase" weight="semibold">
          Section label
        </span>
        <span slText align="end" numeric="tabular">1,204.50</span>
        <span slText align="end" numeric="tabular">88,111.09</span>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Truncation: Story = {
  parameters: scenario('truncation'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <span slText [truncate]="true">
      A single line that runs past the edge of its container and is cut with an ellipsis rather than
      wrapped.
    </span>
    <span slText [truncate]="3">
      Three lines are kept and the rest is clipped. The whole string stays in the document, so a
      screen reader still reads it, a page search still finds it, and a selection still copies it.
      Only the picture is shorter.
    </span>
    <span slText size="sm" tone="muted">
      f4c2b9a7e1d05836af9c74b21e0d8a5639bc17e408fa26d3915cb7420ed83fa1
    </span>
    <span slText size="sm" tone="muted">
      Select the clipped lines and copy them: the whole string is still there. A token longer than
      its container breaks instead of widening the layout.
    </span>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <p slText wrap="pretty">
      The directive sits on the element the consumer wrote, so the document says what it means.
    </p>
    <span slText lang="ar" dir="rtl">
      تصدر الفواتير في أول يوم عمل من كل شهر، وتسدد من وسيلة الدفع المسجلة.
    </span>
    <span slText size="sm" tone="muted">
      Alignment is logical, so a right-to-left document is the same component mirrored. The tracking
      that capitals need is undone for scripts whose letters join.
    </span>
  </div>
</div>`,
  }),
};
