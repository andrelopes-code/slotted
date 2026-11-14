import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PositionStrip } from './position-strip';
import { REACT_SPARKLINE_DOCS, REACT_SPARKLINE_TOKENS } from './sparkline.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SPARKLINE_DOCS.positionStrip.scenes, {
    playground: Playground,
    stacked: Stacked,
    pending: Pending,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Sparkline/PositionStrip',
  component: PositionStrip,
  args: { value: 800, values: [] },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'PositionStrip',
        description:
          'Where one value stands among its own recent values, on one axis: a dot per period, their span as a band, the value as a larger dot.',
        framework: 'React',
        ...REACT_SPARKLINE_DOCS.positionStrip,
        tokens: REACT_SPARKLINE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof PositionStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Eight months of a household's savings and debt service, in reais. */
const SAVINGS = [1000, -500, 2000, 0, 1500, 500, 2500, 1000];
const DEBT = [1800, 1900, 2100, 2000, 2300, 2250, 2400, 2350];
const ROWS = [
  { label: 'Savings', value: 800, values: SAVINGS },
  { label: 'Debt service', value: 2200, values: DEBT },
  { label: 'Investments', value: -300, values: [200, 400, -200, 600, 300, 0, 500, 100] },
];

export const Playground: Story = {
  args: { label: 'Savings rate', reference: 1200, size: 'md', value: 800, values: SAVINGS },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <div className="slotted-demo-measure">
        <PositionStrip {...args} />
      </div>
    </div>
  ),
};

export const Stacked: Story = {
  parameters: scenario('stacked'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="stack">
      {ROWS.map((row) => (
        <PositionStrip key={row.label} max={3000} min={-1000} {...row} />
      ))}
    </div>
  ),
};

export const Pending: Story = {
  parameters: scenario('pending'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="stack">
      <PositionStrip hideValue label="Savings rate" value={null} values={SAVINGS} />
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="stack">
      <PositionStrip
        formatOptions={{ currency: 'BRL', style: 'currency' }}
        label="Savings"
        locale="pt-BR"
        reference={1200}
        value={800}
        values={SAVINGS}
      />
    </div>
  ),
};
