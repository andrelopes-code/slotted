import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlGrid } from '@slotted/angular/grid';
import { provideSlotted } from '@slotted/angular/i18n';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlMeter } from './meter';
import type { MeterSize } from './meter.constants';
import { ANGULAR_METER_DOCS, ANGULAR_METER_TOKENS } from './meter.docs';

interface MeterStoryArgs {
  max: number;
  size: MeterSize;
  value: number;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_METER_DOCS.meter.scenes, {
    playground: Playground,
    tones: Tones,
    sizes: Sizes,
    regions: Regions,
    'in-table': InTable,
    accessibility: Accessibility,
  }) as never;

/* A portfolio of 10,000.00 split by asset class. */
const DATA = {
  allocation: [
    { name: 'Fixed income', cents: 4380, share: '43.80%' },
    { name: 'Equities', cents: 3120, share: '31.20%' },
    { name: 'Real estate', cents: 1650, share: '16.50%' },
    { name: 'Cash', cents: 850, share: '8.50%' },
  ],
  tones: ['accent', 'secondary', 'info', 'success', 'warning', 'danger'],
  disk: [40, 72, 91],
};

const family = moduleMetadata({
  imports: [
    SlMeter,
    SlGrid,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
});

const meta: Meta<MeterStoryArgs> = {
  title: 'Components/Meter',
  component: SlMeter,
  decorators: [family],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Meter',
        description:
          'A static value within a known range, drawn as a length: a share of a whole, a reading against a scale, read out as a meter and never as a wait.',
        framework: 'Angular',
        ...ANGULAR_METER_DOCS.meter,
        tokens: ANGULAR_METER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<MeterStoryArgs>;

/** One demonstration: what it is called, what to look at, and the stage that holds it. */
const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="stack">${body}</div>
  </section>`;

export const Playground: Story = {
  args: { max: 100, size: 'md', value: 41 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <div class="slotted-demo-measure">
    <div slMeter aria-label="Share of the total" [max]="max" [size]="size" [value]="value"></div>
  </div>
</div>`,
  }),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => ({
    props: DATA,
    template: scene(
      'six tones at 41%',
      'The ground is mixed from each tone’s own ink.',
      `@for (tone of tones; track tone) {
        <div slMeter [attr.aria-label]="tone + ' share'" [tone]="$any(tone)" [value]="41"></div>
      }`,
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: scene(
      'sm · md · lg at 72%',
      'The thickness steps; the length is the column’s.',
      `<div slMeter aria-label="Storage, small" size="sm" [value]="72"></div>
       <div slMeter aria-label="Storage, medium" size="md" [value]="72"></div>
       <div slMeter aria-label="Storage, large" size="lg" [value]="72"></div>`,
    ),
  }),
};

export const Regions: Story = {
  parameters: scenario('regions'),
  render: () => ({
    props: DATA,
    template: scene(
      'disk usage, optimum at nought',
      'Below 60% success, up to 85% warning, past it danger.',
      `@for (value of disk; track value) {
        <div slMeter [attr.aria-label]="'Disk usage ' + value + '%'" [high]="85" [low]="60" [optimum]="0" [value]="value"></div>
      }`,
    ),
  }),
};

export const InTable: Story = {
  parameters: scenario('in-table'),
  render: () => ({
    props: DATA,
    template: `
<div slTable [columns]="3">
  <div slTableContent>
      <caption slTableCaption>Allocation of 10,000.00</caption>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader>Asset class</th>
          <th slTableColumnHeader numeric>Share</th>
          <th slTableColumnHeader>Proportion</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (line of allocation; track line.name) {
          <tr slTableRow>
            <th slTableRowHeader>{{ line.name }}</th>
            <td slTableCell numeric>{{ line.share }}</td>
            <td slTableCell><div slMeter decorative [max]="10000" [value]="line.cents"></div></td>
          </tr>
        }
      </tbody>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  decorators: [applicationConfig({ providers: [provideSlotted({ locale: 'pt-BR' })] })],
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('the share as text', 'Inspect the host: aria-valuetext is “43,8%” under pt-BR.', `<div slMeter aria-label="Renda fixa" [max]="10000" [value]="4380"></div>`)}
  ${scene('a value text of your own', 'valueText replaces the share.', `<div slMeter aria-label="Used storage" [max]="5" [value]="3" valueText="3 of 5 GB"></div>`)}
</div>`,
  }),
};
