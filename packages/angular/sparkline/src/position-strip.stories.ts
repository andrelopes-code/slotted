import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlPositionStrip } from './position-strip';
import { ANGULAR_SPARKLINE_DOCS, ANGULAR_SPARKLINE_TOKENS } from './sparkline.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SPARKLINE_DOCS.positionStrip.scenes, {
    playground: Playground,
    stacked: Stacked,
    pending: Pending,
    accessibility: Accessibility,
  }) as never;

/* Eight months of a household's savings and debt service, in reais. */
const DATA = {
  savings: [1000, -500, 2000, 0, 1500, 500, 2500, 1000],
  rows: [
    { label: 'Savings', value: 800, values: [1000, -500, 2000, 0, 1500, 500, 2500, 1000] },
    {
      label: 'Debt service',
      value: 2200,
      values: [1800, 1900, 2100, 2000, 2300, 2250, 2400, 2350],
    },
    { label: 'Investments', value: -300, values: [200, 400, -200, 600, 300, 0, 500, 100] },
  ],
  currency: { currency: 'BRL', style: 'currency' } as Intl.NumberFormatOptions,
};

const meta: Meta = {
  title: 'Components/Sparkline/PositionStrip',
  component: SlPositionStrip,
  decorators: [moduleMetadata({ imports: [SlPositionStrip] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'PositionStrip',
        description:
          'Where one value stands among its own recent values, on one axis: a dot per period, their span as a band, the value as a larger dot.',
        framework: 'Angular',
        ...ANGULAR_SPARKLINE_DOCS.positionStrip,
        tokens: ANGULAR_SPARKLINE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

const stage = (body: string) =>
  `<div class="slotted-demo-stage" data-align="start" data-layout="stack">${body}</div>`;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => ({
    props: DATA,
    template: stage(
      `<span slPositionStrip label="Savings rate" [reference]="1200" [value]="800" [values]="savings"></span>`,
    ),
  }),
};

export const Stacked: Story = {
  parameters: scenario('stacked'),
  render: () => ({
    props: DATA,
    template: stage(`@for (row of rows; track row.label) {
      <span slPositionStrip [label]="row.label" [max]="3000" [min]="-1000" [value]="row.value" [values]="row.values"></span>
    }`),
  }),
};

export const Pending: Story = {
  parameters: scenario('pending'),
  render: () => ({
    props: DATA,
    template: stage(
      `<span slPositionStrip hideValue label="Savings rate" [values]="savings"></span>`,
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: DATA,
    template: stage(
      `<span slPositionStrip label="Savings" locale="pt-BR" [formatOptions]="currency" [reference]="1200" [value]="800" [values]="savings"></span>`,
    ),
  }),
};
