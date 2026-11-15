import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

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

/* A household budget in reais: this month against the eight months before it. */
const BRL = { currency: 'BRL', maximumFractionDigits: 0, style: 'currency' } as const;
const SAVINGS = [1000, -500, 2000, 0, 1500, 500, 2500, 1000];
const ROWS = [
  { label: 'Savings', value: 800, values: SAVINGS },
  { label: 'Debt service', value: 2200, values: [1800, 1900, 2100, 2000, 2300, 2250, 2400, 2350] },
  { label: 'Investments', value: -300, values: [200, 400, -200, 600, 300, 0, 500, 100] },
].map((row) => ({ ...row, mean: mean(row.values) }));
const money = new Intl.NumberFormat('en-US', BRL);

export const Playground: Story = {
  args: {
    formatOptions: BRL,
    label: 'Savings',
    reference: mean(SAVINGS),
    size: 'md',
    value: 800,
    values: SAVINGS,
  },
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
    <Table columns={4}>
      <TableContent>
        <TableCaption>
          This month (large dot) against the last eight (small dots, their span the band) and their
          mean (dashed tick), on one axis from -R$1,000 to R$3,000
        </TableCaption>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Item</TableColumnHeader>
            <TableColumnHeader numeric>This month</TableColumnHeader>
            <TableColumnHeader numeric>8-month mean</TableColumnHeader>
            <TableColumnHeader>Against the last eight months</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.label} value={row.label}>
              <TableRowHeader>{row.label}</TableRowHeader>
              <TableCell numeric>{money.format(row.value)}</TableCell>
              <TableCell numeric>{money.format(row.mean)}</TableCell>
              <TableCell>
                <PositionStrip
                  formatOptions={BRL}
                  label={row.label}
                  max={3000}
                  min={-1000}
                  reference={row.mean}
                  size="sm"
                  value={row.value}
                  values={row.values}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  ),
};

export const Pending: Story = {
  parameters: scenario('pending'),
  render: () => (
    <div className="slotted-demo-stage" data-align="start" data-layout="stack">
      <PositionStrip formatOptions={BRL} hideValue label="Savings" value={null} values={SAVINGS} />
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
        reference={1200}
        value={800}
        values={SAVINGS}
      />
    </div>
  ),
};

function mean(values: readonly number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
