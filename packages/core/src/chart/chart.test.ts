import { describe, expect, it } from 'vitest';

import { chartMessages, createTranslator } from '../i18n';
import { PT_BR } from '../i18n/locales/pt-BR';

import {
  assignColors,
  createLatestAnnouncer,
  placeLayer,
  trackModality,
  chartKeyAction,
  chartTable,
  chartTime,
  chartToCsv,
  createChartModel,
  describeChart,
  describePoint,
  describeZoom,
  firstPoint,
  FULL_ZOOM,
  movePoint,
  placeTooltip,
  toggleHidden,
  tooltipContext,
  zoomAround,
  zoomIncluding,
  zoomRange,
  type ChartSpec,
} from './index';

const t = createTranslator({ locale: 'en-US' }).family(chartMessages);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const revenue: ChartSpec = {
  locale: 'en-US',
  x: { field: 'month' },
  data: months.map((month, index) => ({
    month,
    revenue: [120, 132, null, 160, 150, 190][index],
    cost: [80, 90, 95, 100, 98, 110][index],
  })),
  series: [
    { kind: 'line', field: 'revenue', label: 'Revenue' },
    { kind: 'bar', field: 'cost', label: 'Cost' },
  ],
};

describe('createChartModel', () => {
  it('aligns every series to one list of categories, in the consumer’s order', () => {
    const model = createChartModel(revenue);
    expect(model.shape).toBe('cartesian');
    expect(model.categories.map((category) => category.key)).toEqual(months);
    expect(model.series[0]!.values).toEqual([120, 132, null, 160, 150, 190]);
    expect(model.pointCount).toBe(11);
  });

  it('treats null, NaN, infinities and text as gaps, never as zero', () => {
    const model = createChartModel({
      x: { field: 'x' },
      data: [
        { x: 'a', v: Number.NaN },
        { x: 'b', v: Infinity },
        { x: 'c', v: '4' },
        { x: 'd', v: 4 },
      ],
      series: [{ kind: 'line', field: 'v' }],
    });
    expect(model.series[0]!.values).toEqual([null, null, null, 4]);
  });

  it('keeps two records with the same category as two points', () => {
    const model = createChartModel({
      x: { field: 'x' },
      data: [
        { x: 'a', v: 1 },
        { x: 'a', v: 2 },
      ],
      series: [{ kind: 'bar', field: 'v' }],
    });
    expect(model.categories.map((category) => category.key)).toEqual(['a', 'a#2']);
  });

  it('orders a time axis by wall-clock time and never by an instant', () => {
    const model = createChartModel({
      locale: 'en-US',
      x: { field: 'day', type: 'time', format: { day: 'numeric', month: 'short' } },
      data: [
        { day: '2026-03-30', v: 3 },
        { day: '2026-03-28', v: 1 },
        { day: { year: 2026, month: 3, day: 29 }, v: 2 },
        { day: '2026-03-29T10:00+02:00', v: 9 },
      ],
      series: [{ kind: 'line', field: 'v' }],
    });
    expect(model.series[0]!.values).toEqual([1, 2, 3]);
    const [a, b, c] = model.categories.map((category) => category.x as number);
    expect(b! - a!).toBe(86_400_000);
    expect(c! - b!).toBe(86_400_000);
    expect(model.categories[0]!.label).toBe('Mar 28');
  });

  it('refuses a pie that shares its plot', () => {
    expect(() =>
      createChartModel({
        data: [],
        series: [
          { kind: 'pie', field: 'a' },
          { kind: 'bar', field: 'b' },
        ],
      }),
    ).toThrow(/pie/);
  });

  it('names why a chart is empty', () => {
    expect(createChartModel({ data: [], series: [{ kind: 'line', field: 'v' }] }).empty).toBe(
      'no-data',
    );
    expect(createChartModel(revenue, { hidden: ['revenue', 'cost'] }).empty).toBe('all-hidden');
    expect(createChartModel(revenue).empty).toBeNull();
  });
});

describe('color', () => {
  it('assigns slots in order and never cycles them', () => {
    const colors = assignColors(Array.from({ length: 10 }, () => ({})));
    expect(colors.slice(0, 8)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8].map((slot) => ({ type: 'slot', slot })),
    );
    expect(colors[8]).toEqual({ type: 'overflow' });
    expect(colors[9]).toEqual({ type: 'overflow' });
  });

  it('takes a named slot out of the sequence and lets a tone take none', () => {
    const colors = assignColors([{}, { tone: 'danger' }, { slot: 1 }, {}]);
    expect(colors).toEqual([
      { type: 'slot', slot: 2 },
      { type: 'tone', tone: 'danger' },
      { type: 'slot', slot: 1 },
      { type: 'slot', slot: 3 },
    ]);
  });

  it('colors a pie by slice', () => {
    const model = createChartModel({
      x: { field: 'name' },
      data: [
        { name: 'A', v: 1 },
        { name: 'B', v: 2 },
      ],
      series: [{ kind: 'pie', field: 'v' }],
    });
    expect(model.legend.map((entry) => entry.color)).toEqual([
      { type: 'slot', slot: 1 },
      { type: 'slot', slot: 2 },
    ]);
  });

  /**
   * An application gives each category a slot of its own, and a pie keeps it:
   * a color means the same category on every chart. A slice whose record
   * names no slot takes the next one the others left free.
   */
  it('takes each slice’s slot or tone from the fields the series names', () => {
    const model = createChartModel({
      x: { field: 'name' },
      data: [
        { name: 'Rent', v: 5, slot: 5 },
        { name: 'Food', v: 3, slot: 2 },
        { name: 'Travel', v: 2, slot: 7 },
        { name: 'Other', v: 1 },
        { name: 'Refund', v: 1, tone: 'success', slot: 3 },
      ],
      series: [{ kind: 'pie', field: 'v', slotField: 'slot', toneField: 'tone' }],
    });
    expect(model.legend.map((entry) => entry.color)).toEqual([
      { type: 'slot', slot: 5 },
      { type: 'slot', slot: 2 },
      { type: 'slot', slot: 7 },
      { type: 'slot', slot: 1 },
      { type: 'tone', tone: 'success' },
    ]);
  });
});

describe('stacks', () => {
  const stacked: ChartSpec = {
    x: { field: 'q' },
    data: [
      { q: 'Q1', a: 10, b: 30 },
      { q: 'Q2', a: -5, b: 15 },
    ],
    series: [
      { kind: 'bar', field: 'a', stack: 's' },
      { kind: 'bar', field: 'b', stack: 's' },
    ],
  };

  it('piles positive and negative values separately', () => {
    const model = createChartModel(stacked);
    expect(model.series[0]!.top).toEqual([10, -5]);
    expect(model.series[1]!.top).toEqual([40, 15]);
  });

  it('draws each value as its share of the whole under percent', () => {
    const model = createChartModel({ ...stacked, stackMode: 'percent' });
    expect(model.series[0]!.plotted).toEqual([25, -25]);
    expect(model.series[1]!.plotted).toEqual([75, 75]);
    expect(model.axes[0]!.max).toBe(100);
  });

  it('takes a hidden series out of the pile', () => {
    const model = createChartModel({ ...stacked, stackMode: 'percent' }, { hidden: ['a'] });
    expect(model.series[1]!.plotted).toEqual([100, 100]);
  });
});

describe('keyboard', () => {
  const model = createChartModel(revenue);

  it('lands on the first drawn point', () => {
    expect(firstPoint(model)).toEqual({ series: 'revenue', key: 'Jan' });
  });

  it('skips a gap and stops at the edge', () => {
    expect(movePoint(model, { series: 'revenue', key: 'Feb' }, 'next')).toEqual({
      series: 'revenue',
      key: 'Apr',
    });
    expect(movePoint(model, { series: 'revenue', key: 'Jun' }, 'next')).toEqual({
      series: 'revenue',
      key: 'Jun',
    });
  });

  it('moves between series at the nearest drawn point', () => {
    expect(movePoint(model, { series: 'cost', key: 'Mar' }, 'previous-series')).toEqual({
      series: 'revenue',
      key: 'Feb',
    });
  });

  it('starts over when the point is no longer drawn', () => {
    const hidden = createChartModel(revenue, { hidden: ['revenue'] });
    expect(movePoint(hidden, { series: 'revenue', key: 'Apr' }, 'next')).toEqual({
      series: 'cost',
      key: 'Jan',
    });
  });

  it('asks for nothing when a move lands where it began', () => {
    const state = {
      active: { series: 'revenue', key: 'Jun' },
      selection: null,
      zoom: null,
      zoomable: false,
      selectable: false,
    };
    expect(chartKeyAction(model, state, 'ArrowRight')).toEqual([]);
    expect(chartKeyAction(model, state, 'Tab')).toBeNull();
  });

  it('clears the point first, then the zoom, on Escape', () => {
    const base = { selection: null, zoomable: true, selectable: false };
    expect(
      chartKeyAction(
        model,
        { ...base, active: { series: 'cost', key: 'Jan' }, zoom: { start: 0.2, end: 0.6 } },
        'Escape',
      ),
    ).toEqual([{ type: 'active', point: null, reason: 'escape' }]);
    expect(
      chartKeyAction(model, { ...base, active: null, zoom: { start: 0.2, end: 0.6 } }, 'Escape'),
    ).toEqual([{ type: 'zoom', zoom: FULL_ZOOM, reason: 'escape' }]);
  });

  it('pans the window to keep the keyboard’s point in view', () => {
    const actions = chartKeyAction(
      model,
      {
        active: { series: 'cost', key: 'Mar' },
        selection: null,
        zoom: { start: 0, end: 0.4 },
        zoomable: true,
        selectable: false,
      },
      'ArrowRight',
    );
    expect(actions).toEqual([
      { type: 'active', point: { series: 'cost', key: 'Apr' }, reason: 'keyboard' },
      { type: 'zoom', zoom: { start: 0.2, end: 0.6 }, reason: 'keyboard' },
    ]);
  });

  it('toggles the selection of the active point', () => {
    const state = {
      active: { series: 'cost', key: 'Feb' },
      selection: null,
      zoom: null,
      zoomable: false,
      selectable: true,
    };
    expect(chartKeyAction(model, state, 'Enter')).toEqual([
      { type: 'select', point: state.active },
    ]);
    expect(chartKeyAction(model, { ...state, selection: state.active }, ' ')).toEqual([
      { type: 'select', point: null },
    ]);
  });
});

describe('zoom', () => {
  const model = createChartModel(revenue);

  it('never narrows past two categories', () => {
    expect(zoomAround(model, FULL_ZOOM, 0.5, 0.01)).toEqual({ start: 0.4, end: 0.6 });
  });

  it('maps a window to the categories inside it', () => {
    expect(zoomRange(model, { start: 0.2, end: 0.6 })).toEqual([1, 3]);
    expect(zoomIncluding({ start: 0, end: 0.4 }, 0.8)).toEqual({ start: 0.4, end: 0.8 });
  });
});

describe('legend', () => {
  const keys = ['a', 'b', 'c'];

  it('toggles one entry', () => {
    expect(toggleHidden(keys, [], 'b')).toEqual(['b']);
    expect(toggleHidden(keys, ['b'], 'b')).toEqual([]);
  });

  it('isolates an entry, and a second isolation shows every entry', () => {
    expect(toggleHidden(keys, [], 'b', 'isolate')).toEqual(['a', 'c']);
    expect(toggleHidden(keys, ['a', 'c'], 'b', 'isolate')).toEqual([]);
  });
});

describe('tooltip', () => {
  const model = createChartModel(revenue);

  /* A label the plot has no room for is still read where the pointer is. */
  it('names the upright lines that stand on the category', () => {
    const marked = createChartModel({
      ...revenue,
      annotations: [
        { kind: 'line', axis: 'x', value: 'Feb', label: 'Card statement' },
        { kind: 'line', axis: 'x', value: 'Mar', label: 'Payday' },
        { kind: 'line', value: 100, label: 'Target' },
      ],
    });
    expect(tooltipContext(marked, { series: 'cost', key: 'Feb' })?.notes).toEqual([
      'Card statement',
    ]);
    expect(tooltipContext(model, { series: 'cost', key: 'Feb' })?.notes).toEqual([]);
  });

  it('lists every visible series at the key under an axis trigger', () => {
    const context = tooltipContext(model, { series: 'cost', key: 'Feb' });
    expect(context?.trigger).toBe('axis');
    expect(context?.title).toBe('Feb');
    expect(context?.items.map((item) => [item.label, item.formatted, item.current])).toEqual([
      ['Revenue', '132', false],
      ['Cost', '90', true],
    ]);
    expect(context?.total).toBeNull();
  });

  it('leaves a gap out of the list and totals a stack', () => {
    const stacked = createChartModel({
      ...revenue,
      series: revenue.series.map((series) => ({ ...series, kind: 'bar' as const, stack: 's' })),
    });
    const context = tooltipContext(stacked, { series: 'cost', key: 'Mar' });
    expect(context?.items.map((item) => item.label)).toEqual(['Cost']);
    expect(tooltipContext(stacked, { series: 'cost', key: 'Feb' })?.total?.formatted).toBe('222');
  });

  it('places the box at the inline end and flips at the edge', () => {
    const bounds = { width: 300, height: 200 };
    const size = { width: 100, height: 40 };
    expect(placeTooltip({ anchor: { x: 50, y: 100 }, size, bounds, dockBelow: 0 })).toEqual({
      x: 62,
      y: 80,
      side: 'end',
      docked: false,
    });
    expect(placeTooltip({ anchor: { x: 250, y: 5 }, size, bounds, dockBelow: 0 })).toEqual({
      x: 138,
      y: 0,
      side: 'start',
      docked: false,
    });
    expect(
      placeTooltip({ anchor: { x: 250, y: 100 }, size, bounds, dir: 'rtl', dockBelow: 0 }).x,
    ).toBe(138);
  });

  it('docks to the top edge of a plot too narrow for a box beside the point', () => {
    expect(
      placeTooltip({
        anchor: { x: 200, y: 90 },
        size: { width: 160, height: 60 },
        bounds: { width: 320, height: 200 },
      }),
    ).toEqual({ x: 0, y: 0, side: 'end', docked: true });
  });
});

describe('text', () => {
  it('describes the chart in words, series by series', () => {
    const text = describeChart(createChartModel(revenue), t);
    expect(text).toContain('Combined chart with 2 series and 6 points, from Jan to Jun.');
    expect(text).toContain('Revenue: from 120 to 190; lowest 120 at Jan, highest 190 at Jun.');
  });

  it('describes a pie by its slices and names what it cannot draw', () => {
    const model = createChartModel({
      locale: 'en-US',
      x: { field: 'name' },
      data: [
        { name: 'A', v: 3 },
        { name: 'B', v: 1 },
        { name: 'C', v: -2 },
      ],
      series: [{ kind: 'pie', field: 'v' }],
    });
    expect(describeChart(model, t)).toBe(
      'Pie chart with 2 slices, totaling 4. A: 3, 75%. B: 1, 25%. 1 negative value is not drawn.',
    );
  });

  it('says a point and whether it is selected', () => {
    const model = createChartModel(revenue);
    const point = { series: 'cost', key: 'Mar' };
    expect(describePoint(model, point, null, t)).toBe('Cost, Mar: 95.');
    expect(describePoint(model, point, point, t)).toBe('Cost, Mar: 95. selected');
    expect(describeZoom(model, { start: 0.2, end: 0.6 }, t)).toBe('Showing Feb to Apr.');
  });

  it('speaks the language of the translator it is given', () => {
    const pt = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }).family(
      chartMessages,
    );
    const model = createChartModel(revenue);
    // language: pt-BR
    expect(describeChart(model, pt)).toContain(
      'Gráfico combinado com 2 séries e 6 pontos, de Jan a Jun.',
    );
    expect(describeZoom(model, null, pt)).toBe('Mostrando todos os dados.');
    // language: en-US
  });
});

describe('table and CSV', () => {
  it('lists the visible series, and every series when asked', () => {
    const model = createChartModel(revenue, { hidden: ['cost'] });
    expect(chartTable(model, t).columns.map((column) => column.label)).toEqual([
      'Category',
      'Revenue',
    ]);
    const all = chartTable(model, t, { includeHidden: true });
    expect(all.columns.map((column) => column.label)).toEqual(['Category', 'Revenue', 'Cost']);
    expect(all.rows[2]!.cells.map((cell) => cell.text)).toEqual(['Mar', '', '95']);
  });

  it('writes a formula-looking field as text', () => {
    const csv = chartToCsv(
      createChartModel({
        x: { field: 'x' },
        data: [{ x: '=HYPERLINK("http://x")', v: 1 }],
        series: [{ kind: 'bar', field: 'v', label: 'a,b' }],
      }),
      t,
    );
    expect(csv).toBe('Category,"a,b"\r\n"\'=HYPERLINK(""http://x"")",1');
  });
});

describe('chartTime', () => {
  it('reads a Date through the clock its reader sees', () => {
    expect(chartTime(new Date(2026, 2, 29, 2, 30))).toBe(Date.UTC(2026, 2, 29, 2, 30));
    expect(chartTime('2026-03-29T02:30')).toBe(Date.UTC(2026, 2, 29, 2, 30));
    expect(
      chartTime({
        date: { year: 2026, month: 3, day: 29 },
        time: { hour: 2, minute: 30, second: 0 },
      }),
    ).toBe(Date.UTC(2026, 2, 29, 2, 30));
  });
});

describe('createLatestAnnouncer', () => {
  it('says only the last of a run of messages, once the run stops', async () => {
    const said: string[] = [];
    const announcer = createLatestAnnouncer((message) => said.push(message), 20);
    announcer.say('jan');
    announcer.say('fev');
    announcer.say('mar');
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(said).toEqual(['mar']);
    announcer.say('abr');
    announcer.cancel();
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(said).toEqual(['mar']);
  });
});

describe('layers', () => {
  const viewport = { width: 400, height: 300 };
  const anchor = { left: 300, right: 330, top: 20, bottom: 50 };

  it('hangs under its control, from the control’s end edge, inside the viewport', () => {
    expect(placeLayer({ anchor, size: { width: 160, height: 100 }, viewport })).toEqual({
      x: 170,
      y: 54,
    });
    expect(
      placeLayer({ anchor, size: { width: 160, height: 100 }, viewport, align: 'start' }),
    ).toEqual({ x: 232, y: 54 });
    expect(placeLayer({ anchor, size: { width: 160, height: 100 }, viewport, dir: 'rtl' })).toEqual(
      { x: 232, y: 54 },
    );
  });

  it('opens upward when there is no room below', () => {
    const low = { left: 20, right: 50, top: 250, bottom: 280 };
    expect(
      placeLayer({ anchor: low, size: { width: 100, height: 120 }, viewport, align: 'start' }),
    ).toEqual({
      x: 20,
      y: 126,
    });
  });

  it('tells a pointer from a key from a script', () => {
    const button = document.createElement('button');
    const modality = trackModality(button);
    button.dispatchEvent(new Event('pointerdown'));
    expect(modality.read()).toBe('pointer');
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(modality.read()).toBe('keyboard');
    expect(modality.read()).toBe('programmatic');
    modality.destroy();
  });
});
