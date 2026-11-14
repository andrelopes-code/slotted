import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { Grid } from '../grid';
import { SlottedProvider } from '../i18n';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '../table';
import { Meter } from './meter';
import { REACT_METER_DOCS, REACT_METER_TOKENS } from './meter.docs';
import type { MeterTone } from './meter.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_METER_DOCS.meter.scenes, {
    playground: Playground,
    tones: Tones,
    sizes: Sizes,
    regions: Regions,
    'in-table': InTable,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Meter',
  component: Meter,
  args: { value: 41 },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Meter',
        description:
          'A static value within a known range, drawn as a length: a share of a whole, a reading against a scale, read out as a meter and never as a wait.',
        framework: 'React',
        ...REACT_METER_DOCS.meter,
        tokens: REACT_METER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A portfolio of 10,000.00 split by asset class. */
const ALLOCATION = [
  { name: 'Fixed income', cents: 4380 },
  { name: 'Equities', cents: 3120 },
  { name: 'Real estate', cents: 1650 },
  { name: 'Cash', cents: 850 },
];
const TONES: MeterTone[] = ['accent', 'secondary', 'info', 'success', 'warning', 'danger'];

function Scene({ children, label, note }: { children: ReactNode; label: string; note: string }) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout="stack">
        {children}
      </div>
    </section>
  );
}

export const Playground: Story = {
  args: { 'aria-label': 'Share of the total', max: 100, min: 0, size: 'md', value: 41 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <div className="slotted-demo-measure">
        <Meter {...args} />
      </div>
    </div>
  ),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => (
    <Scene label="six tones at 41%" note="The ground is mixed from each tone’s own ink.">
      {TONES.map((tone) => (
        <Meter aria-label={`${tone} share`} key={tone} tone={tone} value={41} />
      ))}
    </Scene>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Scene label="sm · md · lg at 72%" note="The thickness steps; the length is the column’s.">
      <Meter aria-label="Storage, small" size="sm" value={72} />
      <Meter aria-label="Storage, medium" size="md" value={72} />
      <Meter aria-label="Storage, large" size="lg" value={72} />
    </Scene>
  ),
};

export const Regions: Story = {
  parameters: scenario('regions'),
  render: () => (
    <Scene
      label="disk usage, optimum at nought"
      note="Below 60% success, up to 85% warning, past it danger."
    >
      {[40, 72, 91].map((value) => (
        <Meter
          aria-label={`Disk usage ${value}%`}
          high={85}
          key={value}
          low={60}
          optimum={0}
          value={value}
        />
      ))}
    </Scene>
  ),
};

export const InTable: Story = {
  parameters: scenario('in-table'),
  render: () => (
    <Table columns={3}>
      <TableContent>
        <TableCaption>Allocation of 10,000.00</TableCaption>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Asset class</TableColumnHeader>
            <TableColumnHeader numeric>Share</TableColumnHeader>
            <TableColumnHeader>Proportion</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ALLOCATION.map((line) => (
            <TableRow key={line.name}>
              <TableRowHeader>{line.name}</TableRowHeader>
              <TableCell numeric>{(line.cents / 100).toFixed(2)}%</TableCell>
              <TableCell>
                <Meter decorative max={10000} value={line.cents} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene label="the share as text" note="Inspect the root: aria-valuetext is “43.8%”.">
        <Meter aria-label="Fixed income" max={10000} value={4380} />
      </Scene>
      <Scene label="in the language in force" note="The same share under pt-BR: “43,8%”.">
        <SlottedProvider locale="pt-BR">
          <Meter aria-label="Renda fixa" max={10000} value={4380} />
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};
