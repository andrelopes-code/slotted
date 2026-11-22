import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Segment, SegmentedControl } from '../segmented-control';
import { Chart, ChartTooltipContent } from './index';

const data = [
  { month: 'Jan', revenue: 120 },
  { month: 'Feb', revenue: 132 },
];

const center = (element: Element) => {
  const box = element.getBoundingClientRect();
  return box.top + box.height / 2;
};

/**
 * The controls of the consumer's `actions` and the chart's own toolbar sit on
 * the title's first line, so they share one vertical center.
 */
describe('the header of a card chart', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('centers a small segmented control in actions on the toolbar buttons', async () => {
    /* A phone's frame draws the toolbar's 44px touch targets and folds it into a menu. */
    await page.viewport(1024, 915);
    render(
      <Chart
        actions={
          <SegmentedControl aria-label="Range" defaultValue="week" size="sm">
            <Segment value="week">Week</Segment>
            <Segment value="month">Month</Segment>
          </SegmentedControl>
        }
        data={data}
        series={[{ kind: 'line', field: 'revenue', label: 'Revenue' }]}
        /* The fine pointer's sizes: the test frame emulates touch, which grows the toolbar to the comfortable target. */
        style={
          {
            '--slotted-control-height-sm': '1.75rem',
            '--slotted-target-comfortable': '1.75rem',
          } as CSSProperties
        }
        title="Revenue"
        variant="card"
        x={{ field: 'month' }}
      />,
    );
    const actions = document.querySelector('[data-part="actions"] [data-ui="segmented-control"]')!;
    const toolbarButton = document.querySelector('[data-part="toolbar"] button')!;
    expect(actions).not.toBeNull();
    expect(toolbarButton).not.toBeNull();
    expect(Math.abs(center(actions) - center(toolbarButton))).toBeLessThan(0.5);
  });

  it('reads the distance between the title and the description from one token', () => {
    render(
      <Chart
        data={data}
        description="One sentence."
        series={[{ kind: 'line', field: 'revenue', label: 'Revenue' }]}
        style={{ '--slotted-chart-header-gap': '0px' } as CSSProperties}
        title="Revenue"
        variant="card"
        x={{ field: 'month' }}
      />,
    );
    const heading = document.querySelector<HTMLElement>('[data-part="header"] > :first-child')!;
    const title = heading.querySelector('[data-part="title"]')!.getBoundingClientRect();
    const description = heading.querySelector('[data-part="description"]')!.getBoundingClientRect();

    expect(getComputedStyle(heading).rowGap).toBe('0px');
    expect(parseFloat(getComputedStyle(heading).minBlockSize)).toBeCloseTo(
      title.height + description.height,
      1,
    );
  });
});

/**
 * `--slotted-chart-surface` is the opaque ground the series are mixed with, so a
 * translucent theme could not make the table view translucent without it.
 */
describe('the table view of a chart', () => {
  it('paints its region and its header from tokens of its own', () => {
    const tokens = {
      '--slotted-chart-surface': '#fff',
      '--slotted-chart-table-surface': 'transparent',
      '--slotted-chart-table-header-surface': 'rgb(0 0 0 / 0.2)',
    } as CSSProperties;
    const { container } = render(
      <>
        <Chart
          data={data}
          defaultTableOpen
          palette="sequential"
          series={[{ kind: 'line', field: 'revenue', label: 'Revenue' }]}
          style={tokens}
          title="With table tokens"
          x={{ field: 'month' }}
        />
        <Chart
          data={data}
          palette="sequential"
          series={[{ kind: 'line', field: 'revenue', label: 'Revenue' }]}
          style={{ '--slotted-chart-surface': '#fff' } as CSSProperties}
          title="Without"
          x={{ field: 'month' }}
        />
      </>,
    );
    const [themed, plain] = container.querySelectorAll<HTMLElement>('[data-ui="chart"]');
    const region = themed!.querySelector('[data-part="table-region"]')!;
    const headers = [...themed!.querySelectorAll('[data-part="table"] thead th')];
    const slot = (chart: HTMLElement) =>
      getComputedStyle(chart).getPropertyValue('--_chart-slot-2');

    expect(getComputedStyle(region).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(headers.length).toBeGreaterThan(0);
    for (const header of headers) {
      expect(getComputedStyle(header).backgroundColor).toBe('rgba(0, 0, 0, 0.2)');
    }
    expect(slot(themed!)).not.toBe('');
    expect(slot(themed!)).toBe(slot(plain!));
  });
});

/**
 * The tooltip is a grid whose rows are a subgrid, so a wide value and an
 * element added beside the parts each had to be placed by the family.
 */
describe('the tooltip of a chart', () => {
  /* Wide enough that the value alone fills the tooltip's 18rem. */
  const money = (value: number) => `$${(value / 100).toFixed(2)} per month, before tax`;
  const opened = { series: 'y', key: 'a' };

  /* A phone's frame docks the tooltip across the plot, which is wide enough for any value. */
  beforeEach(async () => {
    await page.viewport(1024, 915);
  });

  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('keeps the label of every row beside a wide value', async () => {
    render(
      <Chart
        data={[{ x: 'a', y: 22697167, lo: 22606024, hi: 22709051 }]}
        defaultActivePoint={opened}
        series={[
          { id: 'y', kind: 'line', field: 'y', label: 'Forecast', format: money },
          {
            id: 'r',
            kind: 'range',
            lower: 'lo',
            upper: 'hi',
            of: 'y',
            label: 'Likely range',
            format: money,
          },
        ]}
        x={{ field: 'x' }}
      />,
    );
    await vi.waitFor(() => {
      expect(document.querySelector('[data-part="tooltip-label"]')).not.toBeNull();
    });
    const labels = [...document.querySelectorAll('[data-part="tooltip-label"]')];

    for (const label of labels) expect(label.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it('gives content added in renderTooltip the width of the tooltip', async () => {
    render(
      <Chart
        data={[{ x: 'a', y: 1 }]}
        defaultActivePoint={opened}
        renderTooltip={(context, model) => (
          <>
            <ChartTooltipContent context={context} model={model} />
            <div data-testid="added">Scheduled: -$99.90</div>
          </>
        )}
        series={[{ id: 'y', kind: 'line', field: 'y', label: 'Y' }]}
        x={{ field: 'x' }}
      />,
    );
    const added = await vi.waitFor(() => {
      const element = document.querySelector('[data-testid="added"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    const tooltip = document.querySelector('[data-part="tooltip"]') as HTMLElement;
    const style = getComputedStyle(tooltip);
    const padding = parseFloat(style.paddingInlineStart) + parseFloat(style.paddingInlineEnd);

    expect(added.getBoundingClientRect().width).toBeCloseTo(tooltip.clientWidth - padding, 0);
  });
});

/* A theme whose colors resolve to oklch(), which the engine cannot mix. */
const OKLCH = {
  '--slotted-chart-color-1': 'oklch(0.66 0.16 215)',
  '--slotted-text-muted': 'oklch(0.7 0.02 250)',
} as CSSProperties;

const fills = (root: ParentNode) =>
  [...root.querySelectorAll('svg path')].map((path) => ({
    fill: path.getAttribute('fill') ?? '',
    opacity: path.getAttribute('fill-opacity'),
  }));

describe('a theme whose colors are not rgb()', () => {
  it('dims the bars a selection does not name', async () => {
    const { container } = render(
      <div style={OKLCH}>
        <Chart
          data={[
            { x: 'a', v: 1 },
            { x: 'b', v: 2 },
          ]}
          renderer="svg"
          selectable
          selection={{ series: 's', key: 'a' }}
          series={[{ id: 's', kind: 'bar', field: 'v', label: 'V' }]}
          x={{ field: 'x' }}
        />
      </div>,
    );
    const bars = await vi.waitFor(() => {
      const painted = fills(container).filter(({ fill }) => /^(rgb|#)/.test(fill));
      expect(painted.length).toBeGreaterThanOrEqual(2);
      return painted;
    });

    expect(new Set(bars.map(({ fill }) => fill)).size).toBeGreaterThan(1);
    expect(bars.some(({ fill }) => fill.startsWith('oklch'))).toBe(false);
  });

  it('paints a band annotation translucent', async () => {
    const { container } = render(
      <div style={OKLCH}>
        <Chart
          annotations={[
            { kind: 'band', axis: 'x', from: 'a', to: 'c', tone: 'neutral', label: 'Gap' },
          ]}
          data={[
            { x: 'a', v: 1 },
            { x: 'b', v: 2 },
            { x: 'c', v: 3 },
          ]}
          renderer="svg"
          series={[{ id: 's', kind: 'line', field: 'v', label: 'V' }]}
          x={{ field: 'x' }}
        />
      </div>,
    );

    await vi.waitFor(() => {
      const band = fills(container).find(
        ({ fill, opacity }) => /0\.12\)$/.test(fill) || opacity === '0.12',
      );
      expect(band).toBeDefined();
    });
  });
});

describe('a small chart with a category axis', () => {
  it('keeps the lowest value label clear of the first category label', async () => {
    const percent = (value: number) => `${value.toFixed(2)}%`;
    const { container } = render(
      <div style={{ inlineSize: 330 }}>
        <Chart
          data={Array.from({ length: 12 }, (_, index) => ({
            month: `nov-${2021 + index}`,
            value: index % 2 === 0 ? -3 + index * 0.5 : 2 - index * 0.2,
          }))}
          renderer="svg"
          series={[{ id: 'v', kind: 'line', field: 'value', label: 'Value', format: percent }]}
          size="sm"
          x={{ field: 'month' }}
          y={{ format: percent }}
        />
      </div>,
    );
    const texts = await vi.waitFor(() => {
      const found = [...container.querySelectorAll('svg text')];
      expect(found.some((text) => text.textContent === 'nov-2021')).toBe(true);
      return found;
    });
    const first = texts.find((text) => text.textContent === 'nov-2021')!.getBoundingClientRect();
    const values = texts
      .filter((text) => /%$/.test(text.textContent ?? ''))
      .map((text) => text.getBoundingClientRect());
    const lowest = values.reduce((low, box) => (box.bottom > low.bottom ? box : low));
    const overlap =
      Math.min(first.right, lowest.right) > Math.max(first.left, lowest.left) &&
      Math.min(first.bottom, lowest.bottom) > Math.max(first.top, lowest.top);

    expect(overlap).toBe(false);
  });
});
