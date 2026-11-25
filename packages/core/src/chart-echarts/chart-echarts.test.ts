// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { createChartModel, skeletonAxes, type ChartSpec, type ChartTheme } from '../chart/index';
import { loadEngine } from './loader';
import { buildChartOption, chooseRenderer, requiredChunks } from './option';

const theme: ChartTheme = {
  slots: [
    '#2563eb',
    '#ea580c',
    '#0891b2',
    '#dc2626',
    '#7c3aed',
    '#a16207',
    '#c026d3',
    '#16a34a',
  ].map((hex) => hex),
  tones: {
    neutral: 'rgb(71, 85, 105)',
    accent: 'rgb(37, 99, 235)',
    secondary: 'rgb(100, 116, 139)',
    success: 'rgb(22, 163, 74)',
    info: 'rgb(2, 132, 199)',
    warning: 'rgb(202, 138, 4)',
    danger: 'rgb(220, 38, 38)',
  },
  overflow: 'rgb(100, 116, 139)',
  text: 'rgb(15, 23, 42)',
  label: 'rgb(71, 85, 105)',
  grid: 'rgb(216, 222, 230)',
  axis: 'rgb(148, 163, 184)',
  reference: 'rgb(100, 116, 139)',
  surface: 'rgb(255, 255, 255)',
  fontFamily: 'sans-serif',
  labelSize: 12,
  lineWidth: 2,
  markerSize: 6,
  barRadius: 4,
  areaOpacity: 0.16,
  inset: 8,
  duration: 320,
  easing: [0.2, 0, 0, 1],
  forcedColors: false,
};

const spec: ChartSpec = {
  x: { field: 'm' },
  data: [
    { m: 'Jan', a: 1, b: 4 },
    { m: 'Feb', a: 3, b: 2 },
    { m: 'Mar', a: 2, b: 5 },
  ],
  series: [
    { kind: 'area', field: 'a' },
    { kind: 'bar', field: 'b' },
  ],
};

describe('buildChartOption', () => {
  it('leaves tooltip, legend, title and toolbox to the family', () => {
    const { option } = buildChartOption({ model: createChartModel(spec), theme });
    for (const key of ['tooltip', 'legend', 'title', 'toolbox', 'axisPointer']) {
      expect(option).not.toHaveProperty(key);
    }
  });

  it('drops a hidden series and keeps the others’ indexes', () => {
    const result = buildChartOption({ model: createChartModel(spec, { hidden: ['a'] }), theme });
    expect((result.option['series'] as { id: string }[]).map((series) => series.id)).toEqual(['b']);
    expect(result.seriesIndex.get('b')).toBe(0);
  });

  it('paints each series from the theme, and never from the engine’s palette', () => {
    const { option } = buildChartOption({ model: createChartModel(spec), theme });
    const [area, bar] = option['series'] as {
      lineStyle?: { color: string };
      itemStyle: { color: string };
    }[];
    expect(area!.lineStyle!.color).toBe('#2563eb');
    expect(bar!.itemStyle.color).toBe('#ea580c');
    expect(option).not.toHaveProperty('color');
  });

  it('does not animate under reduced motion', () => {
    const { option } = buildChartOption({
      model: createChartModel(spec),
      theme: { ...theme, duration: 1 },
    });
    expect(option['animation']).toBe(false);
  });

  it('keeps the wheel for the page unless a modifier is held', () => {
    const { option } = buildChartOption({
      model: createChartModel(spec),
      theme,
      zoomable: true,
      zoom: { start: 0.25, end: 0.75 },
    });
    const [zoom] = option['dataZoom'] as { start: number; end: number; zoomOnMouseWheel: string }[];
    expect(zoom).toMatchObject({ start: 25, end: 75, zoomOnMouseWheel: 'ctrl' });
  });

  it('draws the selected range as a band, and pans a range-selectable window with Shift', () => {
    const view = {
      model: createChartModel(spec),
      theme,
      zoomable: true,
      range: { from: 'Jan', to: 'Feb' },
      rangeSelectable: true,
    };
    const { option } = buildChartOption(view);
    const [zoom] = option['dataZoom'] as { moveOnMouseMove: boolean | string }[];
    const [host] = option['series'] as { markArea?: { data: { xAxis?: number }[][] } }[];

    expect(zoom!.moveOnMouseMove).toBe('shift');
    expect(host!.markArea?.data.map(([from, to]) => [from!.xAxis, to!.xAxis])).toEqual([[0, 1]]);
    expect(requiredChunks(view)).toContain('annotations');
  });

  it('asks only for the chunks the view draws', () => {
    expect(requiredChunks({ model: createChartModel(spec), theme }).sort()).toEqual(
      ['bar', 'base', 'cartesian', 'line'].sort(),
    );
    const pie = createChartModel({
      x: { field: 'k' },
      data: [{ k: 'a', v: 1 }],
      series: [{ kind: 'pie', field: 'v' }],
    });
    expect(requiredChunks({ model: pie, theme }).sort()).toEqual(['base', 'pie']);
    expect(requiredChunks({ model: pie, theme: { ...theme, forcedColors: true } })).toContain(
      'texture',
    );
  });

  it('draws on canvas past the threshold when asked for auto', () => {
    const many = createChartModel({
      x: { field: 'i' },
      data: Array.from({ length: 5000 }, (_, i) => ({ i, v: i })),
      series: [{ kind: 'line', field: 'v' }],
    });
    expect(chooseRenderer({ model: many, theme })).toBe('canvas');
    expect(chooseRenderer({ model: many, theme, renderer: 'svg' })).toBe('svg');
  });

  it('hands the option to the escape hatch last', () => {
    const { option } = buildChartOption({
      model: createChartModel(spec),
      theme,
      extendOption: (option) => ({ ...option, extra: true }),
    });
    expect(option['extra']).toBe(true);
  });
});

describe('the category axis labels', () => {
  const labelsAt = (categories: string[], width: number) => {
    const model = createChartModel({
      x: { field: 'k' },
      data: categories.map((k, index) => ({ k, v: 1000 + index * 37 })),
      series: [{ kind: 'bar', field: 'v' }],
    });
    const { option } = buildChartOption({ model, theme }, width);
    return (option['xAxis'] as { axisLabel: Record<string, unknown> }[])[0]!.axisLabel;
  };

  it('thins thirty dates the plot cannot hold, rather than cutting each one', () => {
    const days = Array.from({ length: 30 }, (_, i) => `09-${String(i + 1).padStart(2, '0')}`);
    const label = labelsAt(days, 800);
    expect(label['interval']).toBeUndefined();
    expect(label['width']).toBeUndefined();
    expect(label['overflow']).toBeUndefined();
    expect(label['hideOverlap']).toBe(true);
  });

  it('keeps every label when each one fits its band', () => {
    const label = labelsAt(['Jan', 'Feb', 'Mar', 'Apr'], 800);
    expect(label['interval']).toBe(0);
  });

  it('measures the band on the plot, so long names in a narrow card do not touch', () => {
    const label = labelsAt(['Web store', 'Mobile app', 'Marketplace', 'Wholesale'], 330);
    expect(label['interval']).toBeUndefined();
    expect(label['width']).toBeUndefined();
    expect(label['hideOverlap']).toBe(true);
  });
});

/**
 * The option is also held against ECharts itself: rendered to an SVG string
 * in node, through the same chunks the browser loads. An option ECharts
 * refused or misread would draw nothing, and the count of marks says so.
 */
describe('the engine draws the option', () => {
  async function render(model: ReturnType<typeof createChartModel>, chunks: string[]) {
    const { init } = await loadEngine(chunks);
    const chart = init(null as unknown as HTMLElement, undefined, {
      renderer: 'svg',
      ssr: true,
      width: 400,
      height: 240,
    });
    chart.setOption(buildChartOption({ model, theme: { ...theme, duration: 1 } }, 400).option);
    const svg = chart.renderToSVGString();
    chart.dispose();
    return svg;
  }

  it('draws a line, its area and three bars', async () => {
    const model = createChartModel(spec);
    const svg = await render(model, requiredChunks({ model, theme }));
    expect(svg).toContain('#2563eb');
    expect(svg).toContain('#ea580c');
    expect(svg.match(/<path/g)?.length ?? 0).toBeGreaterThan(5);
  });

  /* With `recordKey` the categories are keyed by the record and named by the x
     field: an annotation that named a category by its x value matched no key,
     went to the engine as `{ xAxis: undefined }`, and the mark line's filter
     threw — the whole chart drew its error state for one line it could not place. */
  it('places a line on the category its x value names when records are keyed, and drops one that names none', async () => {
    const keyed: ChartSpec = {
      x: { field: 'm' },
      recordKey: 'id',
      data: [
        { id: 'w1', m: 'Week of Aug 8', a: 1 },
        { id: 'w2', m: 'Week of Aug 15', a: 3 },
      ],
      series: [{ kind: 'bar', field: 'a' }],
      annotations: [
        { kind: 'line', axis: 'x', value: 'Week of Aug 15', label: 'Month end' },
        { kind: 'line', axis: 'x', value: 'w1', label: 'By key' },
        { kind: 'line', axis: 'x', value: 'Week of Sep 1', label: 'Nowhere' },
      ],
    };
    const model = createChartModel(keyed);
    const { option } = buildChartOption({ model, theme });
    const marks = (option['series'] as { markLine?: { data: Record<string, unknown>[] } }[])[0]!
      .markLine!.data;
    expect(marks.map((mark) => mark['xAxis'])).toEqual([1, 0]);
    const svg = await render(model, requiredChunks({ model, theme }));
    expect(svg).toContain('Month end');
    expect(svg).not.toContain('Nowhere');
  });

  /* The label of an upright line sat centerd over it: on the last category of a
     narrow plot half of "Month end Aug 31" stood past the plot's end and was cut. */
  it('keeps the label of a line on an end category inside the plot', () => {
    const model = createChartModel({
      x: { field: 'm' },
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, index) => ({ m, a: index })),
      series: [{ kind: 'bar', field: 'a' }],
      annotations: [
        { kind: 'line', axis: 'x', value: 'Jan', label: 'Opened' },
        { kind: 'line', axis: 'x', value: 'Mar', label: 'Mid' },
        { kind: 'line', axis: 'x', value: 'Jun', label: 'Month end' },
      ],
    });
    const { option } = buildChartOption({ model, theme });
    const marks = (
      option['series'] as { markLine?: { data: { label: { align?: string } }[] } }[]
    )[0]!.markLine!.data;
    expect(marks.map((mark) => mark.label.align)).toEqual(['left', 'center', 'right']);
  });

  it('draws every slice of a pie in its own slot', async () => {
    const model = createChartModel({
      x: { field: 'k' },
      data: [
        { k: 'a', v: 1 },
        { k: 'b', v: 2 },
        { k: 'c', v: 3 },
      ],
      series: [{ kind: 'pie', field: 'v', innerRadius: 0.6 }],
    });
    const svg = await render(model, requiredChunks({ model, theme }));
    for (const color of ['#2563eb', '#ea580c', '#0891b2']) expect(svg).toContain(color);
  });

  /* Two groups sharing one x field leave a gap in each series wherever the
     other group has a record; the size callback met them as nothing and threw. */
  it('draws a scatter whose series have gaps, with and without bubble sizes', async () => {
    for (const sizeField of [undefined, 'size']) {
      const model = createChartModel({
        x: { field: 'x', type: 'value' },
        data: [
          { x: 1, a: 2, b: null, size: 3 },
          { x: 2, a: null, b: 4, size: 9 },
        ],
        series: [
          { kind: 'scatter', field: 'a', sizeField },
          { kind: 'scatter', field: 'b', sizeField },
        ],
      });
      const svg = await render(model, requiredChunks({ model, theme }));
      expect(svg).toContain('#2563eb');
      expect(svg).toContain('#ea580c');
    }
  });
});

describe('the extent of the value axis', () => {
  const balance: ChartSpec = {
    data: [
      { day: '1', balance: 9_300_000 },
      { day: '2', balance: 9_050_000 },
      { day: '3', balance: 10_200_000 },
      { day: '4', balance: 9_800_000 },
    ],
    series: [{ id: 'balance', kind: 'line', field: 'balance', label: 'Balance' }],
    x: { field: 'day' },
  };

  async function lowestTick(spec: ChartSpec) {
    const model = createChartModel(spec);
    const { init } = await loadEngine(requiredChunks({ model, theme }));
    const chart = init(null as unknown as HTMLElement, undefined, {
      renderer: 'svg',
      ssr: true,
      width: 400,
      height: 240,
    });
    chart.setOption(buildChartOption({ model, theme: { ...theme, duration: 1 } }, 400).option);
    chart.renderToSVGString();
    const internals = chart as unknown as {
      getModel: () => { getComponent: (name: string, index: number) => unknown };
    };
    const axis = (
      internals.getModel().getComponent('yAxis', 0) as {
        axis: { scale: { getTicks: () => { value: number }[] } };
      }
    ).axis;
    const lowest = Math.min(...axis.scale.getTicks().map((tick) => tick.value));
    chart.dispose();
    return lowest;
  }

  function yAxis(spec: ChartSpec) {
    const { option } = buildChartOption({ model: createChartModel(spec), theme });
    return (option['yAxis'] as { scale?: boolean }[])[0]!;
  }

  it('fits the axis of a line to its data', async () => {
    expect(yAxis(balance).scale).toBe(true);
    expect(await lowestTick(balance)).toBeGreaterThan(0);
  });

  it('keeps zero on the axis of a bar', async () => {
    const bars: ChartSpec = {
      ...balance,
      series: [{ id: 'balance', kind: 'bar', field: 'balance', label: 'Balance' }],
    };

    expect(yAxis(bars).scale).toBeUndefined();
    expect(await lowestTick(bars)).toBe(0);
  });

  it('keeps zero under a stacked area, and when the series is hidden lets a line fit', () => {
    const stacked: ChartSpec = {
      ...balance,
      series: [{ id: 'balance', kind: 'area', field: 'balance', stack: 's' }],
    };
    const mixed: ChartSpec = {
      ...balance,
      series: [
        { id: 'line', kind: 'line', field: 'balance' },
        { id: 'bars', kind: 'bar', field: 'balance' },
      ],
    };
    const hiddenBars = buildChartOption({
      model: createChartModel(mixed, { hidden: ['bars'] }),
      theme,
    });

    expect(yAxis(stacked).scale).toBeUndefined();
    expect(yAxis(mixed).scale).toBeUndefined();
    expect((hiddenBars.option['yAxis'] as { scale?: boolean }[])[0]!.scale).toBe(true);
  });

  it('obeys an explicit extent over the default', () => {
    const forced: ChartSpec = { ...balance, y: { extent: 'zero' } };
    const fitted: ChartSpec = {
      ...balance,
      series: [{ id: 'balance', kind: 'bar', field: 'balance' }],
      y: { extent: 'data' },
    };

    expect(yAxis(forced).scale).toBeUndefined();
    expect(yAxis(fitted).scale).toBe(true);
  });
});

describe('a range series', () => {
  const forecast: ChartSpec = {
    x: { field: 'day' },
    data: [
      { day: '1', value: 10, low: 8, high: 13 },
      { day: '2', value: 12, low: 9, high: 15 },
      { day: '3', value: 11, low: 7, high: null },
    ],
    series: [
      { id: 'forecast', kind: 'line', field: 'value', label: 'Forecast' },
      { id: 'likely', kind: 'range', lower: 'low', upper: 'high', label: 'Likely', of: 'forecast' },
    ],
  };

  function drawn(hidden: string[] = []) {
    return buildChartOption({ model: createChartModel(forecast, { hidden }), theme });
  }

  it('stacks a filled band on an invisible line, so its edges pass through both bounds', () => {
    const { option, seriesIndex } = drawn();
    const series = option['series'] as Record<string, unknown>[];
    const lower = series.find((entry) => entry['id'] === 'likely__lower')!;
    const band = series.find((entry) => entry['id'] === 'likely')!;

    expect(lower['data']).toEqual([8, 9, null]);
    expect(band['data']).toEqual([5, 6, null]);
    expect(band['stack']).toBe(lower['stack']);
    expect(band['stackStrategy']).toBe('all');
    expect(band['areaStyle']).toBeDefined();
    expect(seriesIndex.get('likely')).toBe(series.indexOf(band));
    expect(seriesIndex.has('likely__lower')).toBe(false);
  });

  it('draws through the engine, with the axis holding both edges of the band', async () => {
    const model = createChartModel(forecast);
    const { init } = await loadEngine(requiredChunks({ model, theme }));
    const chart = init(null as unknown as HTMLElement, undefined, {
      renderer: 'svg',
      ssr: true,
      width: 400,
      height: 240,
    });
    chart.setOption(buildChartOption({ model, theme: { ...theme, duration: 1 } }, 400).option);
    const svg = chart.renderToSVGString();
    const internals = chart as unknown as {
      getModel: () => { getComponent: (name: string, index: number) => unknown };
    };
    const axis = (
      internals.getModel().getComponent('yAxis', 0) as {
        axis: { scale: { getExtent: () => [number, number] } };
      }
    ).axis;
    const [low, high] = axis.scale.getExtent();
    chart.dispose();

    expect(svg).toContain('<path');
    expect(low).toBeLessThanOrEqual(8);
    expect(high).toBeGreaterThanOrEqual(15);
  });

  it('leaves the line alone when the band is hidden', () => {
    const series = drawn(['likely']).option['series'] as { id: string }[];

    expect(series.map((entry) => entry.id)).toEqual(['forecast']);
  });
});

const times: ChartSpec = {
  x: {
    field: 'at',
    type: 'time',
    ticks: ['2020-01-01', new Date(2030, 0, 1), 'never'],
    secondary: (date) => `${date.getUTCFullYear() - 1986} yrs`,
  },
  data: [
    { at: '2016-01-01', v: 1 },
    { at: '2040-01-01', v: 2 },
  ],
  series: [{ kind: 'line', field: 'v' }],
};

const built = (value: ChartSpec, width = 600) =>
  buildChartOption({ model: createChartModel(value), theme }, width).option as {
    grid: { left: number; right: number };
    series: Record<string, any>[];
    xAxis: { axisLabel: Record<string, any>; axisTick: Record<string, any> }[];
    yAxis: { axisLabel: Record<string, any> }[];
  };

describe('the labels of an axis', () => {
  it('are drawn unless the axis says otherwise, and labelWidth keeps the room', () => {
    const hidden = built({
      ...spec,
      x: { field: 'm', labels: false },
      y: { labels: false, labelWidth: 60 },
    });

    expect(built(spec).xAxis[0]!.axisLabel['show']).toBe(true);
    expect(hidden.xAxis[0]!.axisLabel['show']).toBe(false);
    expect(hidden.yAxis[0]!.axisLabel['show']).toBe(false);
    expect(hidden.grid.left).toBe(theme.inset * 2 + 60);
  });

  it('stand at the ticks a time axis is given, with the second line under each', () => {
    const { axisLabel, axisTick } = built(times).xAxis[0]!;
    const ticks = [Date.UTC(2020, 0, 1), Date.UTC(2030, 0, 1)];

    expect(axisLabel['customValues']).toEqual(ticks);
    expect(axisTick['customValues']).toEqual(ticks);
    expect(axisLabel['formatter'](ticks[0])).toMatch(/\n\{secondary\|34 yrs\}$/);
  });

  it('take no ticks on a category axis, and clear the ones of the option before', () => {
    const { axisLabel } = built({ ...spec, x: { field: 'm', ticks: ['Jan'] } }).xAxis[0]!;

    expect(axisLabel['customValues']).toBeNull();
  });
});

describe('the end label of a line', () => {
  const line = (endLabel: ChartSpec['series'][number]['endLabel']): ChartSpec => ({
    ...spec,
    data: [...spec.data, { m: 'Apr', a: null, b: null }],
    series: [{ kind: 'line', field: 'a', label: 'Plan', endLabel }],
  });

  it('writes the name and the value at a point, or the text a function returns', () => {
    const text = (endLabel: ChartSpec['series'][number]['endLabel']) =>
      built(line(endLabel)).series[0]!['endLabel']['formatter']({ dataIndex: 2 });

    expect(text(true)).toBe('Plan 2');
    expect(text(({ category, formatted, series }) => `${series} ${category} ${formatted}`)).toBe(
      'Plan Mar 2',
    );
  });

  it('takes the series color, or the text color when it is strong', () => {
    const label = (endLabel: ChartSpec['series'][number]['endLabel']) =>
      built(line(endLabel)).series[0]!['endLabel'];

    expect(label(true)).toMatchObject({ color: '#2563eb', fontWeight: 500 });
    expect(label({ strong: true })).toMatchObject({ color: theme.text, fontWeight: 600 });
    expect(label(undefined)).toEqual({ show: false });
  });

  it('reserves the room of the widest label and loads its collision handling', () => {
    const plain = built(line(undefined)).grid.right;
    const view = { model: createChartModel(line(true)), theme };

    expect(built(line(true)).grid.right - plain).toBeCloseTo('Plan 2'.length * 12 * 0.6 + 10);
    expect(requiredChunks(view)).toContain('labels');
  });

  it('is drawn by lines and areas of an upright chart alone', () => {
    const bars = createChartModel({
      ...spec,
      series: [{ kind: 'bar', field: 'b', endLabel: true }],
    });
    const lying = createChartModel({ ...line(true), orientation: 'horizontal' });

    expect(bars.series[0]!.endLabel).toBeNull();
    expect(lying.series[0]!.endLabel).toBeNull();
  });
});

describe('skeletonAxes', () => {
  it('draws the labels the loaded chart writes, and the room a width keeps', () => {
    expect(skeletonAxes(spec)).toEqual({ column: 'labels', row: 'labels' });
    expect(skeletonAxes({ x: { field: 'm', labels: false }, y: { labels: false } })).toEqual({
      column: 'none',
      row: 'none',
    });
    expect(skeletonAxes({ y: { labels: false, labelWidth: 60 } }).column).toBe('room');
    expect(skeletonAxes({ orientation: 'horizontal', x: { field: 'm', labels: false } })).toEqual({
      column: 'none',
      row: 'labels',
    });
  });
});

describe('the label of an annotation', () => {
  it('takes the tone of the annotation, and the text color without one', () => {
    const series = built({
      ...spec,
      annotations: [
        { kind: 'band', from: 1, to: 2, label: 'Loss', tone: 'danger' },
        { kind: 'line', value: 3, label: 'Goal' },
      ],
    }).series[0]!;

    expect(series['markArea'].data[0][0].label.color).toBe(theme.tones.danger);
    expect(series['markLine'].data[0].label.color).toBe(theme.text);
  });
});
