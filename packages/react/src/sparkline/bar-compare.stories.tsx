import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BarCompare } from './bar-compare';
import { REACT_SPARKLINE_DOCS, REACT_SPARKLINE_TOKENS } from './sparkline.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SPARKLINE_DOCS.barCompare.scenes, {
    playground: Playground,
    'shared-domain': SharedDomain,
    texture: Texture,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Sparkline/BarCompare',
  component: BarCompare,
  args: { data: [] },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'BarCompare',
        description:
          'Two or three values compared as bars on one signed axis, each written at its bar’s end, with a zero line and ticks shared across roots.',
        framework: 'React',
        ...REACT_SPARKLINE_DOCS.barCompare,
        tokens: REACT_SPARKLINE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof BarCompare>;

export default meta;
type Story = StoryObj<typeof meta>;

const PAIR = [
  { label: 'Result', value: -1000 },
  { label: 'Benchmark', texture: true, value: 33 },
];
const DOMAIN = { max: 800, min: -1600, step: 800 };

export const Playground: Story = {
  args: { data: PAIR, ...DOMAIN },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <div className="slotted-demo-measure">
        <BarCompare {...args} />
      </div>
    </div>
  ),
};

export const SharedDomain: Story = {
  parameters: scenario('shared-domain'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="stack">
      <BarCompare data={PAIR} {...DOMAIN} />
      <BarCompare
        data={[
          { label: 'Result', value: 420 },
          { label: 'Benchmark', texture: true, value: 180 },
        ]}
        {...DOMAIN}
      />
    </div>
  ),
};

export const Texture: Story = {
  parameters: scenario('texture'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="stack">
      <BarCompare
        data={[
          { label: 'Portfolio', value: 640 },
          { label: 'Index', texture: true, value: 410 },
        ]}
      />
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="stack">
      <BarCompare
        data={PAIR}
        formatOptions={{ currency: 'BRL', style: 'currency' }}
        locale="pt-BR"
      />
    </div>
  ),
};
