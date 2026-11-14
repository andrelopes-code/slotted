import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlBarCompare } from './bar-compare';
import { ANGULAR_SPARKLINE_DOCS, ANGULAR_SPARKLINE_TOKENS } from './sparkline.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SPARKLINE_DOCS.barCompare.scenes, {
    playground: Playground,
    'shared-domain': SharedDomain,
    texture: Texture,
    accessibility: Accessibility,
  }) as never;

const DATA = {
  pair: [
    { label: 'Result', value: -1000 },
    { label: 'Benchmark', texture: true, value: 33 },
  ],
  april: [
    { label: 'Result', value: 420 },
    { label: 'Benchmark', texture: true, value: 180 },
  ],
  withIndex: [
    { label: 'Portfolio', value: 640 },
    { label: 'Index', texture: true, value: 410 },
  ],
  currency: { currency: 'BRL', style: 'currency' } as Intl.NumberFormatOptions,
};

const meta: Meta = {
  title: 'Components/Sparkline/BarCompare',
  component: SlBarCompare,
  decorators: [moduleMetadata({ imports: [SlBarCompare] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'BarCompare',
        description:
          'Two or three values compared as bars on one signed axis, each written at its bar’s end, with a zero line and ticks shared across roots.',
        framework: 'Angular',
        ...ANGULAR_SPARKLINE_DOCS.barCompare,
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
      `<span slBarCompare [data]="pair" [max]="800" [min]="-1600" [step]="800"></span>`,
    ),
  }),
};

export const SharedDomain: Story = {
  parameters: scenario('shared-domain'),
  render: () => ({
    props: DATA,
    template: stage(`<span slBarCompare [data]="pair" [max]="800" [min]="-1600" [step]="800"></span>
      <span slBarCompare [data]="april" [max]="800" [min]="-1600" [step]="800"></span>`),
  }),
};

export const Texture: Story = {
  parameters: scenario('texture'),
  render: () => ({
    props: DATA,
    template: stage(`<span slBarCompare [data]="withIndex"></span>`),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: DATA,
    template: stage(
      `<span slBarCompare locale="pt-BR" [data]="pair" [formatOptions]="currency"></span>`,
    ),
  }),
};
