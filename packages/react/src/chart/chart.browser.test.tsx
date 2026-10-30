import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';

import { Segment, SegmentedControl } from '../segmented-control';
import { Chart } from './index';

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
