import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
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

/* A household budget in reais: this month against the eight months before it. */
const BRL: Intl.NumberFormatOptions = {
  currency: 'BRL',
  maximumFractionDigits: 0,
  style: 'currency',
};
const SAVINGS = [1000, -500, 2000, 0, 1500, 500, 2500, 1000];
const money = new Intl.NumberFormat('en-US', BRL);
const DATA = {
  brl: BRL,
  currency: { currency: 'BRL', style: 'currency' } as Intl.NumberFormatOptions,
  savings: SAVINGS,
  savingsMean: mean(SAVINGS),
  rows: [
    { label: 'Savings', value: 800, values: SAVINGS },
    {
      label: 'Debt service',
      value: 2200,
      values: [1800, 1900, 2100, 2000, 2300, 2250, 2400, 2350],
    },
    { label: 'Investments', value: -300, values: [200, 400, -200, 600, 300, 0, 500, 100] },
  ].map((row) => ({
    ...row,
    mean: mean(row.values),
    meanText: money.format(mean(row.values)),
    valueText: money.format(row.value),
  })),
};

const meta: Meta = {
  title: 'Components/Sparkline/PositionStrip',
  component: SlPositionStrip,
  decorators: [
    moduleMetadata({
      imports: [
        SlPositionStrip,
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
    }),
  ],
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
      `<span slPositionStrip label="Savings" [formatOptions]="brl" [reference]="savingsMean" [value]="800" [values]="savings"></span>`,
    ),
  }),
};

export const Stacked: Story = {
  parameters: scenario('stacked'),
  render: () => ({
    props: DATA,
    template: `
<div slTable [columns]="4">
  <div slTableContent>
    <caption slTableCaption>
      This month (large dot) against the last eight (small dots, their span the band) and their
      mean (dashed tick), on one axis from -R$1,000 to R$3,000
    </caption>
    <thead slTableHead>
      <tr slTableRow>
        <th slTableColumnHeader>Item</th>
        <th slTableColumnHeader numeric>This month</th>
        <th slTableColumnHeader numeric>8-month mean</th>
        <th slTableColumnHeader>Against the last eight months</th>
      </tr>
    </thead>
    <tbody slTableBody>
      @for (row of rows; track row.label) {
        <tr slTableRow [value]="row.label">
          <th slTableRowHeader>{{ row.label }}</th>
          <td slTableCell numeric>{{ row.valueText }}</td>
          <td slTableCell numeric>{{ row.meanText }}</td>
          <td slTableCell>
            <span slPositionStrip size="sm" [formatOptions]="brl" [label]="row.label" [max]="3000" [min]="-1000" [reference]="row.mean" [value]="row.value" [values]="row.values"></span>
          </td>
        </tr>
      }
    </tbody>
  </div>
</div>`,
  }),
};

export const Pending: Story = {
  parameters: scenario('pending'),
  render: () => ({
    props: DATA,
    template: stage(
      `<span slPositionStrip hideValue label="Savings" [formatOptions]="brl" [values]="savings"></span>`,
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: DATA,
    template: stage(
      `<span slPositionStrip label="Savings" [formatOptions]="currency" [reference]="1200" [value]="800" [values]="savings"></span>`,
    ),
  }),
};

function mean(values: readonly number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
