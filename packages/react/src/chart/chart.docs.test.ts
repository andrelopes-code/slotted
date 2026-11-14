import { describe, expect, it } from 'vitest';

import { createChartModel, readChartTheme } from '@slotted/core/chart';
import { buildChartOption } from '@slotted/core/chart-echarts';

import { REACT_CHART_DOCS } from './chart.docs';

interface InsideZoom {
  moveOnMouseMove: boolean;
  zoomOnMouseWheel: boolean | 'ctrl';
}

/** The zoomable row and the zoom event say what the engine's dataZoom does with a drag and a wheel. */
describe('the zoom gestures the chart page names', () => {
  it('match the dataZoom option', () => {
    const zoom = insideZoom();
    const zoomable = REACT_CHART_DOCS.chart.api.find((row) => row.name === 'zoomable');
    const event = REACT_CHART_DOCS.chart.events.find((row) => row.name === 'onZoomChange');

    expect(zoom.moveOnMouseMove).toBe(true);
    expect(zoom.zoomOnMouseWheel).toBe('ctrl');
    expect(zoomable?.description).toMatch(/Ctrl\+wheel[^;]* zoom/);
    expect(zoomable?.description).toMatch(/a drag pans/);
    expect(zoomable?.description).not.toMatch(/^Drag/);
    expect(event?.when).toMatch(/a drag that pans/);
    expect(event?.when).not.toMatch(/on a drag,/);
  });
});

function insideZoom() {
  const model = createChartModel({
    x: { field: 'm' },
    data: [
      { m: 'Jan', a: 1 },
      { m: 'Feb', a: 3 },
    ],
    series: [{ kind: 'line', field: 'a' }],
  });

  const { option } = buildChartOption({
    model,
    theme: readChartTheme(document.body),
    zoomable: true,
  });

  return (option['dataZoom'] as InsideZoom[])[0]!;
}
