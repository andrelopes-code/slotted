import { readChartTheme } from '@slotted/core/chart';
import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { cdp, page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Segment, SegmentedControl } from '../segmented-control';
import { Stack } from '../stack';
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
 * The theme is read through probes that declare each property as `var()`; a
 * property nothing declares falls back, and a consumer's blanket rule does not
 * reach the probes.
 */
describe('the theme a chart reads', () => {
  it('resolves what the context declares and falls back for the rest', () => {
    const { container } = render(
      <div
        style={
          {
            '--_chart-text': 'rgb(1 2 3)',
            '--_chart-slot-1': 'color-mix(in srgb, rgb(255 0 0) 50%, rgb(0 0 255))',
            '--_chart-tone-danger': '#ff0000',
            '--_chart-label-size': '0.75rem',
            '--_chart-line-width': 'calc(1px + 0.5px)',
            '--_chart-area-opacity': '0.3',
            '--_chart-duration': '120ms',
            '--_chart-easing': 'cubic-bezier(0.1, 0.2, 0.3, 1)',
          } as CSSProperties
        }
      >
        <style>{'* { transition: none !important; scale: none !important; }'}</style>
        <div data-testid="plot" />
      </div>,
    );
    const theme = readChartTheme(container.querySelector('[data-testid="plot"]')!);

    expect(theme).toMatchObject({
      text: 'rgb(1, 2, 3)',
      labelSize: 12,
      lineWidth: 1.5,
      markerSize: 6,
      barRadius: 4,
      inset: 8,
      areaOpacity: 0.3,
      duration: 120,
      easing: [0.1, 0.2, 0.3, 1],
    });
    expect(theme.slots[0]).toBe('rgb(128, 0, 128)');
    expect(theme.slots[1]).toBe('rgb(1, 2, 3)');
    expect(theme.tones.danger).toBe('rgb(255, 0, 0)');
    expect(theme.tones.info).toBe('rgb(1, 2, 3)');
    expect(theme.surface).not.toBe(theme.grid);
    expect(container.querySelector('[data-testid="plot"]')!.childElementCount).toBe(0);
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
    /* The first tooltip waits for the engine, which is fetched on demand. */
    await vi.waitFor(
      () => expect(document.querySelector('[data-part="tooltip-label"]')).not.toBeNull(),
      { timeout: 10_000 },
    );
    const labels = [...document.querySelectorAll('[data-part="tooltip-label"]')];

    for (const label of labels) expect(label.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it.each([
    ['added beside the content', true, <div data-testid="added">Scheduled: -$99.90</div>],
    ['of a family beside the content', true, <Stack data-testid="added">Scheduled: -$99.90</Stack>],
    ['of a family in its place', false, <Stack data-testid="added">Scheduled: -$99.90</Stack>],
  ])('gives an element %s the width of the tooltip', async (_, beside, element) => {
    render(
      <Chart
        data={[{ x: 'a', y: 1 }]}
        defaultActivePoint={opened}
        renderTooltip={(context, model) => (
          <>
            {beside && <ChartTooltipContent context={context} model={model} />}
            {element}
          </>
        )}
        series={[{ id: 'y', kind: 'line', field: 'y', label: 'Y' }]}
        x={{ field: 'x' }}
      />,
    );
    const added = await vi.waitFor(() => {
      const found = document.querySelector('[data-testid="added"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
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

describe('two charts stacked on the same categories', () => {
  it('put a category at one place when their value axes share a label width', async () => {
    const percent = (value: number) => `${value.toFixed(2)}%`;
    const months = Array.from({ length: 12 }, (_, index) => `m${index + 1}`);
    const chart = (low: number, high: number, testId: string) => (
      <div data-testid={testId}>
        <Chart
          data={months.map((month, index) => ({
            month,
            value: low + ((high - low) * index) / 11,
          }))}
          renderer="svg"
          series={[{ id: 'v', kind: 'line', field: 'value', label: 'Value', format: percent }]}
          x={{ field: 'month' }}
          y={{ format: percent, labelWidth: 56 }}
        />
      </div>
    );
    const { getByTestId } = render(
      <div style={{ inlineSize: 400 }}>
        {chart(3.9, 5.7, 'level')}
        {chart(-30, 0, 'drawdown')}
      </div>,
    );
    const firstLabel = (testId: string) =>
      vi.waitFor(() => {
        const label = [...getByTestId(testId).querySelectorAll('svg text')].find(
          (text) => text.textContent === 'm1',
        );
        expect(label).toBeDefined();
        const box = label!.getBoundingClientRect();
        return box.left + box.width / 2;
      });

    expect(await firstLabel('level')).toBeCloseTo(await firstLabel('drawdown'), 0);
  });
});

const part = (name: string) => [...document.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)];

/** The texts the engine drew, once it has drawn `count` of them. */
const drawnTexts = async (root: ParentNode, match: (text: string) => boolean, count = 1) =>
  vi.waitFor(
    () => {
      const texts = [
        ...root.querySelectorAll<SVGTextElement>('[data-part="plot"] svg text'),
      ].filter((text) => match(text.textContent ?? ''));
      expect(texts).toHaveLength(count);
      return texts;
    },
    { timeout: 10_000 },
  );

const boxOf = (element: Element) => element.getBoundingClientRect();

const overlap = (a: DOMRect, b: DOMRect) =>
  a.left < b.right - 0.5 &&
  b.left < a.right - 0.5 &&
  a.top < b.bottom - 0.5 &&
  b.top < a.bottom - 0.5;

describe('a wide plot', () => {
  beforeEach(async () => {
    await page.viewport(1200, 915);
  });

  afterEach(async () => {
    await page.viewport(412, 915);
  });

  /** The box stopped at 18rem, and the rows of a range crossed its edge. */
  it('grows the tooltip to the width of its rows', async () => {
    const money = (value: number) => `R$ ${value.toFixed(2)} of the plan`;
    render(
      <div style={{ inlineSize: 1100 }}>
        <Chart
          data={[
            { x: 'a', y: 151100, lo: 151100, hi: 161590 },
            { x: 'b', y: 152100, lo: 151100, hi: 161590 },
          ]}
          defaultActivePoint={{ series: 'y', key: 'a' }}
          series={[
            { id: 'y', kind: 'line', field: 'y', label: 'Forecast of the year', format: money },
            {
              id: 'r',
              kind: 'range',
              lower: 'lo',
              upper: 'hi',
              label: 'Above the plan',
              format: money,
            },
          ]}
          x={{ field: 'x' }}
        />
      </div>,
    );
    await vi.waitFor(() => expect(part('tooltip-label')).toHaveLength(2), { timeout: 10_000 });
    const tooltip = part('tooltip')[0]!;

    for (const element of tooltip.querySelectorAll('*')) {
      expect(boxOf(element).right).toBeLessThanOrEqual(boxOf(tooltip).right);
    }
    for (const label of part('tooltip-label')) {
      expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
    }
  });

  it('wraps a long note of the tooltip at 18rem', async () => {
    render(
      <div style={{ inlineSize: 1100 }}>
        <Chart
          annotations={[
            { kind: 'line', axis: 'x', value: 'a', label: 'A note of it. '.repeat(15) },
          ]}
          data={[{ x: 'a', y: 1 }]}
          defaultActivePoint={{ series: 'y', key: 'a' }}
          series={[{ id: 'y', kind: 'line', field: 'y', label: 'Y' }]}
          x={{ field: 'x' }}
        />
      </div>,
    );
    await vi.waitFor(() => expect(part('tooltip-note')).toHaveLength(1), { timeout: 10_000 });
    const note = boxOf(part('tooltip-note')[0]!);

    expect(note.width).toBeLessThanOrEqual(18 * 16);
    expect(note.height).toBeGreaterThan(40);
  });

  it('draws a category axis told to write no labels with the plot of the chart above', async () => {
    const rows = ['Jan', 'Feb', 'Mar'].map((month, index) => ({ month, v: index + 1 }));
    const chart = (labels: boolean, kind: 'line' | 'bar', size: 'sm' | 'md') => (
      <Chart
        data={rows}
        renderer="svg"
        series={[{ id: 'v', kind, field: 'v', label: 'V' }]}
        size={size}
        x={{ field: 'month', labels }}
        y={{ labelWidth: 60 }}
      />
    );
    const { container } = render(
      <div style={{ inlineSize: 800 }}>
        <div data-testid="above">{chart(true, 'bar', 'md')}</div>
        <div data-testid="under">{chart(false, 'bar', 'md')}</div>
      </div>,
    );
    const at = (id: string) => container.querySelector(`[data-testid="${id}"]`)!;
    const months = (text: string) => rows.some((row) => row.month === text);
    await drawnTexts(at('above'), months, 3);
    await vi.waitFor(() => expect(at('under').querySelector('svg text')).not.toBeNull(), {
      timeout: 10_000,
    });
    const bars = (id: string) =>
      [...at(id).querySelectorAll('[data-part="plot"] svg path')]
        .map(boxOf)
        .filter((box) => box.width > 20 && box.width < 200 && box.height > 10)
        .map((box) => ({ left: box.left, height: box.height }));

    expect([...at('under').querySelectorAll('svg text')].some((t) => months(t.textContent!))).toBe(
      false,
    );
    expect(bars('under').map((bar) => Math.round(bar.left))).toEqual(
      bars('above').map((bar) => Math.round(bar.left)),
    );
    expect(Math.max(...bars('under').map((bar) => bar.height))).toBeGreaterThan(
      Math.max(...bars('above').map((bar) => bar.height)),
    );
  });

  it('draws three strokes apart without color, in the plot and in the legend', async () => {
    const { container } = render(
      <div style={{ inlineSize: 600 }}>
        <Chart
          data={[
            { x: 'a', s: 1, d: 2, t: 3 },
            { x: 'b', s: 2, d: 3, t: 4 },
          ]}
          renderer="svg"
          series={[
            { id: 's', kind: 'line', field: 's', label: 'Solid', tone: 'neutral' },
            {
              id: 'd',
              kind: 'line',
              field: 'd',
              label: 'Dashed',
              tone: 'neutral',
              stroke: 'dashed',
            },
            {
              id: 't',
              kind: 'line',
              field: 't',
              label: 'Dotted',
              tone: 'neutral',
              stroke: 'dotted',
            },
          ]}
          x={{ field: 'x' }}
        />
      </div>,
    );
    const lines = await vi.waitFor(
      () => {
        const found = [
          ...container.querySelectorAll('[data-part="plot"] svg path[stroke-linejoin="round"]'),
        ];
        expect(found).toHaveLength(3);
        return found;
      },
      { timeout: 10_000 },
    );

    expect(lines.map((line) => line.getAttribute('stroke-dasharray'))).toEqual([
      null,
      '4,4',
      '0.1,4',
    ]);
    expect(lines.map((line) => line.getAttribute('stroke-linecap'))).toEqual([
      'round',
      'round',
      'round',
    ]);
    const swatches = part('legend-marker').map(
      (marker) => getComputedStyle(marker).backgroundImage,
    );
    expect(new Set(swatches).size).toBe(3);
  });

  it('keeps the strokes of the legend apart under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    try {
      render(
        <Chart
          data={[{ x: 'a', s: 1, t: 3 }]}
          series={[
            { id: 's', kind: 'line', field: 's', label: 'Solid' },
            { id: 't', kind: 'line', field: 't', label: 'Dotted', stroke: 'dotted' },
          ]}
          x={{ field: 'x' }}
        />,
      );
      const [solid, dotted] = part('legend-marker').map((marker) => getComputedStyle(marker));

      expect(solid!.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(dotted!.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(dotted!.backgroundImage).toContain('gradient');
    } finally {
      await cdp().send('Emulation.setEmulatedMedia', { features: [] });
    }
  });

  it('writes the label of an annotation in its tone, and in the text color without one', async () => {
    const { container } = render(
      <div
        style={
          {
            '--slotted-text': 'rgb(1, 2, 3)',
            '--slotted-tone-danger-text': 'rgb(150, 0, 0)',
            inlineSize: 600,
          } as CSSProperties
        }
      >
        <Chart
          annotations={[
            { kind: 'band', axis: 'x', from: 'a', to: 'b', tone: 'danger', label: 'Loss' },
            { kind: 'line', axis: 'x', value: 'c', label: 'Audit' },
          ]}
          data={['a', 'b', 'c', 'd'].map((x, v) => ({ x, v }))}
          renderer="svg"
          series={[{ id: 'v', kind: 'line', field: 'v', label: 'V' }]}
          x={{ field: 'x' }}
        />
      </div>,
    );
    const [loss] = await drawnTexts(container, (text) => text === 'Loss');
    const [audit] = await drawnTexts(container, (text) => text === 'Audit');

    expect(getComputedStyle(loss!).fill).toBe('rgb(150, 0, 0)');
    expect(getComputedStyle(audit!).fill).toBe('rgb(1, 2, 3)');
  });

  it('labels the ticks a time axis is given, each with its second line', async () => {
    const { container } = render(
      <div style={{ inlineSize: 600 }}>
        <Chart
          data={Array.from({ length: 70 }, (_, index) => ({
            at: `${2016 + index}-01-01`,
            v: index,
          }))}
          renderer="svg"
          series={[{ id: 'v', kind: 'line', field: 'v', label: 'V' }]}
          x={{
            field: 'at',
            type: 'time',
            format: (value) => String(new Date(value).getUTCFullYear()),
            secondary: (date) => `${date.getUTCFullYear() - 1986} yrs`,
            ticks: [2020, 2030, 2040, 2050, 2060, 2070, 2080].map((year) => `${year}-01-01`),
          }}
        />
      </div>,
    );
    const years = await drawnTexts(container, (text) => /^20\d\d$/.test(text), 7);
    const terms = await drawnTexts(container, (text) => / yrs$/.test(text), 7);
    const byLeft = (texts: SVGTextElement[]) => texts.map(boxOf).sort((a, b) => a.left - b.left);
    const [first, second] = [byLeft(years), byLeft(terms)];
    const boxes = [...first, ...second];

    expect(years.map((text) => text.textContent).sort()).toEqual([
      '2020',
      '2030',
      '2040',
      '2050',
      '2060',
      '2070',
      '2080',
    ]);
    second.forEach((box, index) => expect(box.top).toBeGreaterThan(first[index]!.top + 8));
    boxes.forEach((box, index) =>
      boxes.slice(index + 1).forEach((other) => expect(overlap(box, other)).toBe(false)),
    );
    for (const box of boxes) {
      expect(box.bottom).toBeLessThanOrEqual(boxOf(part('plot')[0]!).bottom);
    }
  });

  it.each([600, 1000])('ends each line with its label in a plot %s wide', async (inlineSize) => {
    const node = (hidden: string[]) => (
      <div style={{ inlineSize }}>
        <Chart
          data={Array.from({ length: 10 }, (_, index) => ({
            year: String(2016 + index),
            plan: index * 10,
            peers: index * 10.2,
            market: index * 4,
          }))}
          hidden={hidden}
          legend={false}
          renderer="svg"
          series={[
            { id: 'plan', kind: 'line', field: 'plan', label: 'Plan', endLabel: { strong: true } },
            { id: 'peers', kind: 'line', field: 'peers', label: 'Peers', endLabel: true },
            {
              id: 'market',
              kind: 'line',
              field: 'market',
              label: 'Market',
              endLabel: ({ formatted }) => `Index ${formatted}`,
            },
          ]}
          size="lg"
          x={{ field: 'year' }}
          y={{ format: { minimumFractionDigits: 1 } }}
        />
      </div>
    );
    const { container, rerender } = render(node([]));
    const isEnd = (text: string) => /^(Plan|Peers|Index) /.test(text);
    const ends = await drawnTexts(container, isEnd, 3);
    const plot = boxOf(part('plot')[0]!);

    expect(ends.map((text) => text.textContent).sort()).toEqual([
      'Index 36.0',
      'Peers 91.8',
      'Plan 90.0',
    ]);
    await vi.waitFor(() => {
      const boxes = ends.map(boxOf);
      boxes.forEach((box, index) => {
        boxes.slice(index + 1).forEach((other) => expect(overlap(box, other)).toBe(false));
        expect(box.right).toBeLessThanOrEqual(plot.right);
        expect(box.left).toBeGreaterThan(plot.left + plot.width / 2);
      });
    });
    const weight = (name: string) =>
      ends.find((text) => text.textContent!.startsWith(name))!.style.fontWeight ||
      getComputedStyle(ends.find((text) => text.textContent!.startsWith(name))!).fontWeight;
    expect(weight('Plan')).toBe('600');
    expect(weight('Peers')).toBe('500');

    rerender(node(['peers']));
    const left = await drawnTexts(container, isEnd, 2);
    expect(left.map((text) => text.textContent).sort()).toEqual(['Index 36.0', 'Plan 90.0']);
  });
});
