import { render } from '@testing-library/react';
import { useState } from 'react';
import { cdp, page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { Chart, type ChartAnnotation, type ChartRange } from './index';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const data = MONTHS.map((month, index) => ({ month, revenue: 120 + index * 8 }));

/* A renderer of its own per case: the SVG draws elements, the canvas pixels. */
const RENDERERS = ['svg', 'canvas'] as const;

/**
 * A range that clears is read on the pixels of the plot: the engine merges an
 * option over the one before it, so a state read back as `null` says nothing
 * about the band still painted.
 */
describe.each(RENDERERS)('a cleared range on a %s plot', (renderer) => {
  it('is painted over by a click', async () => {
    const { first, plot } = await selected(renderer);

    const at = point(plot, 0.5);
    await mouse('mouseMoved', at.x, at.y);
    await mouse('mousePressed', at.x, at.y);
    await mouse('mouseReleased', at.x, at.y);
    await leave();

    expect(value()).toBe('null');
    expect(await capture(plot)).toBe(first);
  });

  it('is painted over by a tap', async () => {
    const { first, plot } = await selected(renderer);

    const at = point(plot, 0.75);
    await cdp().send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
    await cdp().send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect.poll(value).toBe('null');
    expect(await capture(plot)).toBe(first);
  });

  it('is painted over by Escape', async () => {
    const { first, plot } = await selected(renderer);

    await userEvent.keyboard('{Escape}');
    await expect.poll(value).toBe('null');
    // A key on the plot draws its focus ring, which is not of the range.
    plot.blur();

    expect(await capture(plot)).toBe(first);
  });

  it('is painted over by a null range', async () => {
    const { first, plot } = await selected(renderer);

    document.querySelector<HTMLButtonElement>('[data-testid="clear"]')!.click();

    await expect.poll(value).toBe('null');
    expect(await capture(plot)).toBe(first);
  });

  it('takes the lines of the annotations it brought with it', async () => {
    const bounds = (range: ChartRange): ChartAnnotation[] => [
      { kind: 'line', axis: 'x', value: range.from, label: 'From' },
      { kind: 'line', axis: 'x', value: range.to, label: 'To' },
      { kind: 'band', from: 130, to: 140, tone: 'warning' },
    ];
    const { first, plot } = await selected(renderer, (range) => (range ? bounds(range) : []));

    document.querySelector<HTMLButtonElement>('[data-testid="clear"]')!.click();

    await expect.poll(value).toBe('null');
    expect(await capture(plot)).toBe(first);
  });
});

interface ScenarioProps {
  readonly renderer: (typeof RENDERERS)[number];
  readonly annotations: (range: ChartRange | null) => readonly ChartAnnotation[];
}

function Scenario({ renderer, annotations }: ScenarioProps) {
  const [range, setRange] = useState<ChartRange | null>(null);

  return (
    <div style={{ inlineSize: 400 }}>
      <Chart
        annotations={annotations(range)}
        data={data}
        onRangeChange={(next) => setRange(next)}
        range={range}
        rangeSelectable
        renderer={renderer}
        series={[{ kind: 'line', field: 'revenue', label: 'Revenue' }]}
        variant="card"
        x={{ field: 'month' }}
        zoomable
      />

      <output data-testid="range">{JSON.stringify(range)}</output>

      <button data-testid="clear" onClick={() => setRange(null)} type="button">
        Clear
      </button>
    </div>
  );
}

const LINE: readonly ChartAnnotation[] = [{ kind: 'line', value: 140, label: 'Target' }];

/** A chart whose range was dragged with the mouse, and the plot before the drag. */
async function selected(
  renderer: ScenarioProps['renderer'],
  annotations: ScenarioProps['annotations'] = () => LINE,
) {
  render(<Scenario annotations={annotations} renderer={renderer} />);
  const plot = document.querySelector<HTMLElement>('[data-ui="chart"] [data-part="plot"]')!;
  await expect.poll(() => plot.querySelector('svg, canvas')).not.toBeNull();
  await leave();
  const first = await capture(plot);

  const from = point(plot, 0.3);
  const to = point(plot, 0.62);
  await mouse('mouseMoved', from.x, from.y);
  await mouse('mousePressed', from.x, from.y);
  await mouse('mouseMoved', (from.x + to.x) / 2, to.y);
  await mouse('mouseMoved', to.x, to.y);
  await mouse('mouseReleased', to.x, to.y);
  await leave();

  expect(value()).not.toBe('null');
  expect(await capture(plot)).not.toBe(first);

  return { first, plot };
}

function value() {
  return document.querySelector('[data-testid="range"]')!.textContent;
}

function point(plot: HTMLElement, along: number) {
  const box = plot.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();

  return {
    x: (frame?.left ?? 0) + box.left + box.width * along,
    y: (frame?.top ?? 0) + box.top + box.height / 2,
  };
}

async function mouse(type: 'mousePressed' | 'mouseMoved' | 'mouseReleased', x: number, y: number) {
  await cdp().send('Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button: type === 'mouseMoved' ? 'none' : 'left',
    buttons: type === 'mouseReleased' ? 0 : 1,
    clickCount: 1,
  });
}

/** The pointer outside the plot, where it draws no crosshair. */
async function leave() {
  await mouse('mouseMoved', 400, 900);
}

/** The painted plot once two captures in a row agree: the drawing has settled. */
async function capture(plot: HTMLElement) {
  let last = '';
  await expect
    .poll(async () => {
      const next = await page.screenshot({ element: plot, save: false });
      const same = next === last;
      last = next;

      return same;
    })
    .toBe(true);

  return last;
}
