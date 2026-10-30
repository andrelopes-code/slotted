import { describe, expect, it } from 'vitest';

import { createChartModel } from '../chart/index';
import type { ChartTheme } from '../chart/index';
import { loadEngine, replaceableComponents } from './loader';
import { buildChartOption, requiredChunks } from './option';

/**
 * ECharts keeps one registry per page, and this file is its own page: no other
 * test has registered the grid or the zoom here. That is the page the defect
 * lived on — a lone pie, or charts that never zoom — and the harness never
 * was, because some other chart on it had always loaded both chunks.
 */
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
  duration: 1,
  easing: [0.2, 0, 0, 1],
  forcedColors: false,
};

describe('an update on a page that never registered the grid or the zoom', () => {
  it('names only the component types this page knows', async () => {
    const model = createChartModel({
      x: { field: 'k' },
      data: [
        { k: 'a', v: 1 },
        { k: 'b', v: 2 },
      ],
      series: [{ kind: 'pie', field: 'v' }],
    });
    const view = { model, theme };
    const { init } = await loadEngine(requiredChunks(view));
    expect(replaceableComponents()).toEqual(['series']);

    const chart = init(null as unknown as HTMLElement, undefined, {
      renderer: 'svg',
      ssr: true,
      width: 320,
      height: 200,
    });
    const { option } = buildChartOption(view, 320);
    expect(() => chart.setOption(option, { replaceMerge: ['series', 'dataZoom'] })).toThrow(
      /dataZoom/,
    );
    expect(() => chart.setOption(option, { replaceMerge: replaceableComponents() })).not.toThrow();
    chart.dispose();
  });

  it('adds the axes and the zoom once their chunks are registered', async () => {
    const model = createChartModel({
      x: { field: 'k' },
      data: [
        { k: 'a', v: 1 },
        { k: 'b', v: 2 },
      ],
      series: [{ kind: 'line', field: 'v' }],
    });
    await loadEngine(requiredChunks({ model, theme, zoomable: true }));
    expect(replaceableComponents()).toEqual(['series', 'xAxis', 'yAxis', 'grid', 'dataZoom']);
  });
});
