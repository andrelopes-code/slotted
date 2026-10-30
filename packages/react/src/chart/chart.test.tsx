import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChartEngineCallbacks, ChartEngineRenderView } from '@slotted/core/chart-echarts';

/**
 * The engine is ECharts, which draws nothing without a canvas and a layout,
 * and jsdom has neither. The binding's contract with it is the three things
 * `@slotted/core/chart-echarts` exports, so the tests stand a recording engine
 * in its place: what the binding asks it to draw, and a pointer the tests can
 * move.
 */
const engine = vi.hoisted(() => ({
  views: [] as ChartEngineRenderView[],
  callbacks: null as ChartEngineCallbacks | null,
  emphasized: [] as (string | null)[],
}));

vi.mock('@slotted/core/chart-echarts', () => ({
  mountChartEngine: (_element: HTMLElement, callbacks: ChartEngineCallbacks) => {
    engine.callbacks = callbacks;
    return {
      update: async (view: ChartEngineRenderView) => {
        engine.views.push(view);
        callbacks.onRender?.();
      },
      locate: () => ({
        x: 120,
        y: 40,
        band: { start: 100, size: 40 },
        frame: { start: 8, size: 200 },
        horizontal: false,
      }),
      emphasize: (key: string | null) => engine.emphasized.push(key),
      toDataURL: () => 'data:image/svg+xml,<svg/>',
      dispose: () => {},
    };
  },
  preloadChartEngine: async () => {},
}));

const { Chart, ChartDefaultsProvider } = await import('./index');
const { SlottedProvider } = await import('../i18n');

const data = [
  { month: 'Jan', revenue: 120, cost: 80 },
  { month: 'Feb', revenue: 132, cost: 90 },
  { month: 'Mar', revenue: 150, cost: 95 },
];
const series = [
  { kind: 'line', field: 'revenue', label: 'Revenue' },
  { kind: 'bar', field: 'cost', label: 'Cost' },
] as const;
const base = {
  data,
  series,
  x: { field: 'month' } as const,
  locale: 'en-US',
  title: 'Revenue and cost',
};

const root = () => document.querySelector('[data-ui="chart"]')!;
const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`);
/** The glyph a part draws, as the `Glyph` element inside its icon box. */
const glyph = (name: string) =>
  part(name)?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
const parts = (name: string) => [
  ...document.querySelectorAll<HTMLElement>(`[data-part="${name}"]`),
];
const legendItems = () => [
  ...document.querySelectorAll<HTMLElement>('[data-part="legend"] > [data-part="legend-item"]'),
];

/**
 * A context no chart read before has its theme read on the next frame, and
 * the engine draws only with a theme.
 */
const nextFrame = () =>
  act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

beforeEach(() => {
  engine.views = [];
  engine.callbacks = null;
  engine.emphasized = [];
});

describe('Chart', () => {
  it('names the plot by its aria-label when no title is written', () => {
    const { title: _title, ...untitled } = base;
    render(<Chart {...untitled} aria-label="Revenue, last 12 months" />);

    expect(screen.getByRole('group', { name: 'Revenue, last 12 months' })).toBe(part('plot'));
    expect(part('title')).toBeNull();
  });

  it('is a figure its caption names, with a plot named by the title and described in words', () => {
    render(<Chart {...base} description="Thousands, 2026" />);

    expect(root().tagName).toBe('FIGURE');
    expect(root()).toHaveAttribute('data-part', 'root');
    const plot = part('plot')!;
    expect(plot).toHaveAttribute('role', 'group');
    expect(plot).toHaveAttribute('aria-roledescription', 'chart');
    expect(plot).toHaveAttribute('tabindex', '0');
    expect(document.getElementById(plot.getAttribute('aria-labelledby')!)).toHaveTextContent(
      'Revenue and cost',
    );
    const described = plot
      .getAttribute('aria-describedby')!
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent);
    expect(described[0]).toBe('Thousands, 2026');
    expect(described[1]).toContain('Combined chart with 2 series and 3 points, from Jan to Mar.');
    expect(part('canvas')).toHaveAttribute('aria-hidden', 'true');
    expect(part('tooltip')).toHaveAttribute('aria-hidden', 'true');
  });

  it('hands the engine the model and the theme it reads from the stylesheet', async () => {
    render(<Chart {...base} zoomable renderer="svg" />);
    await nextFrame();

    const view = engine.views.at(-1)!;
    expect(view.model.series.map((entry) => entry.id)).toEqual(['revenue', 'cost']);
    expect(view.theme.slots).toHaveLength(8);
    expect(view.zoomable).toBe(true);
    expect(view.renderer).toBe('svg');
  });

  /**
   * A read appends a probe and computes two dozen styles. Inside the mount
   * commit it forced a style recalculation of the page just committed, then a
   * second render before the first paint — on every chart, for the values the
   * chart beside it had already read.
   */
  it('reads the theme once per context, never inside the mount commit', async () => {
    const styles = vi.spyOn(window, 'getComputedStyle');
    /* One read is one computed style of the plot part; the probe's follows it. */
    const reads = () =>
      styles.mock.calls.filter(([element]) => element.matches('[data-part="plot"]')).length;
    const mount = () =>
      render(
        <div data-context="theme-once">
          <Chart {...base} />
        </div>,
      );

    mount();
    expect(reads()).toBe(0);
    await nextFrame();
    expect(reads()).toBe(1);

    const drawn = engine.views.length;
    mount();
    expect(reads()).toBe(1);
    expect(engine.views.length).toBe(drawn + 1);
    await nextFrame();
    expect(reads()).toBe(1);
    styles.mockRestore();
  });

  /**
   * A parent that draws again writes its axes and series as new literals with
   * the same content. Read by identity, each was a new model: a dashboard that
   * saved its layout rebuilt every chart on it, its legend measured and its
   * engine redrawn, for nothing that had changed.
   */
  it('keeps its model when a parent draws it again with the same axes and series', async () => {
    const view = (title: string) => (
      <Chart
        data={data}
        title={title}
        locale="en-US"
        x={{ field: 'month' }}
        y={{ format: { style: 'currency', currency: 'USD' } }}
        series={[
          { kind: 'line', field: 'revenue', label: 'Revenue' },
          { kind: 'bar', field: 'cost', label: 'Cost' },
        ]}
      />
    );
    const { rerender } = render(view('Revenue and cost'));
    await nextFrame();
    const drawn = engine.views.length;
    const model = engine.views.at(-1)!.model;
    rerender(view('Revenue and cost'));
    expect(engine.views.length).toBe(drawn);

    rerender(
      <Chart
        data={data}
        title="Revenue"
        locale="en-US"
        x={{ field: 'month' }}
        series={[{ kind: 'line', field: 'revenue', label: 'Revenue' }]}
      />,
    );
    expect(engine.views.at(-1)!.model).not.toBe(model);
    expect(engine.views.at(-1)!.model.series.map((entry) => entry.id)).toEqual(['revenue']);
  });

  it('writes the axes a stylesheet selects on', () => {
    render(<Chart {...base} palette="focus" size="lg" toolbar="hover" variant="card" />);

    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(root()).toHaveAttribute('data-variant', 'card');
    expect(root()).toHaveAttribute('data-palette', 'focus');
    expect(root()).toHaveAttribute('data-toolbar', 'hover');
  });

  it('passes native props through and composes the consumer’s key handler', () => {
    const onKeyDown = vi.fn();
    const ref = createRef<HTMLElement>();
    render(
      <Chart
        {...base}
        className="kpi"
        data-testid="c"
        id="revenue"
        onKeyDown={onKeyDown}
        ref={ref}
      />,
    );

    expect(root()).toHaveClass('kpi');
    expect(root()).toHaveAttribute('id', 'revenue');
    expect(ref.current).toBe(root());
    fireEvent.keyDown(root(), { key: 'a' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  describe('legend', () => {
    it('toggles a series and says which input asked', async () => {
      const onHiddenChange = vi.fn();
      render(<Chart {...base} onHiddenChange={onHiddenChange} />);
      await nextFrame();

      const [revenue, cost] = legendItems();
      expect(revenue).toHaveAttribute('aria-pressed', 'true');
      fireEvent.pointerDown(cost!);
      fireEvent.click(cost!);

      expect(onHiddenChange).toHaveBeenCalledWith(
        ['cost'],
        expect.objectContaining({ reason: 'pointer' }),
      );
      expect(legendItems()[1]).toHaveAttribute('aria-pressed', 'false');
      expect(engine.views.at(-1)!.model.series[1]!.visible).toBe(false);
    });

    it('isolates a series with Shift+Enter, and asks without moving when controlled', () => {
      const onHiddenChange = vi.fn();
      render(<Chart {...base} hidden={[]} onHiddenChange={onHiddenChange} />);

      fireEvent.keyDown(legendItems()[0]!, { key: 'Enter', shiftKey: true });

      expect(onHiddenChange).toHaveBeenCalledWith(
        ['cost'],
        expect.objectContaining({ reason: 'keyboard' }),
      );
      expect(legendItems()[1]).toHaveAttribute('aria-pressed', 'true');
    });

    it('is one tab stop, and the arrows move inside it', () => {
      render(<Chart {...base} />);

      const [first, second] = legendItems();
      expect(first).toHaveAttribute('tabindex', '0');
      expect(second).toHaveAttribute('tabindex', '-1');
      act(() => first!.focus());
      fireEvent.keyDown(first!, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(second);
    });
  });

  describe('keyboard on the plot', () => {
    it('moves along a series, across series, and asks with the reason keyboard', () => {
      const onActivePointChange = vi.fn();
      render(
        <Chart
          {...base}
          defaultActivePoint={{ series: 'revenue', key: 'Jan' }}
          onActivePointChange={onActivePointChange}
        />,
      );

      fireEvent.keyDown(part('plot')!, { key: 'ArrowRight' });
      expect(onActivePointChange).toHaveBeenLastCalledWith(
        { series: 'revenue', key: 'Feb' },
        expect.objectContaining({ reason: 'keyboard' }),
      );
      fireEvent.keyDown(part('plot')!, { key: 'ArrowDown' });
      expect(onActivePointChange).toHaveBeenLastCalledWith(
        { series: 'cost', key: 'Feb' },
        expect.objectContaining({ reason: 'keyboard' }),
      );
      fireEvent.keyDown(part('plot')!, { key: 'Escape' });
      expect(onActivePointChange).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ reason: 'escape' }),
      );
    });

    it('selects the point it is on with Enter when the chart is selectable', () => {
      const onSelectionChange = vi.fn();
      render(
        <Chart
          {...base}
          defaultActivePoint={{ series: 'cost', key: 'Mar' }}
          onSelectionChange={onSelectionChange}
          selectable
        />,
      );

      fireEvent.keyDown(part('plot')!, { key: 'Enter' });
      expect(onSelectionChange).toHaveBeenCalledWith(
        { series: 'cost', key: 'Mar' },
        expect.objectContaining({ reason: 'keyboard' }),
      );
    });

    it('zooms with + and resets with 0 when zoomable', () => {
      const onZoomChange = vi.fn();
      render(
        <Chart
          {...base}
          defaultActivePoint={{ series: 'revenue', key: 'Feb' }}
          onZoomChange={onZoomChange}
          zoomable
        />,
      );

      fireEvent.keyDown(part('plot')!, { key: '+' });
      expect(onZoomChange).toHaveBeenLastCalledWith(
        { start: 0.25, end: 0.75 },
        expect.objectContaining({ reason: 'keyboard' }),
      );
      expect(glyph('zoom-reset')).toBe('rotate-ccw');
      fireEvent.keyDown(part('plot')!, { key: '0' });
      expect(onZoomChange).toHaveBeenLastCalledWith(
        { start: 0, end: 1 },
        expect.objectContaining({ reason: 'keyboard' }),
      );
      expect(part('zoom-reset')).toBeNull();
    });
  });

  describe('pointer and overlay', () => {
    it('follows the engine’s pointer with a crosshair, markers and a tooltip', () => {
      const onActivePointChange = vi.fn();
      render(<Chart {...base} onActivePointChange={onActivePointChange} />);

      act(() => engine.callbacks!.onPointer!({ series: 'revenue', key: 'Feb' }, undefined));

      expect(onActivePointChange).toHaveBeenCalledWith(
        { series: 'revenue', key: 'Feb' },
        expect.objectContaining({ reason: 'pointer' }),
      );
      expect(part('tooltip')).toHaveAttribute('data-open');
      expect(part('tooltip-title')).toHaveTextContent('Feb');
      expect(parts('tooltip-item').map((row) => row.textContent)).toEqual(['Revenue132', 'Cost90']);
      expect(part('crosshair')).not.toHaveAttribute('hidden');
      expect(part('crosshair')).toHaveAttribute('data-band');
      expect(parts('marker')).toHaveLength(1);
    });

    it('renders a custom tooltip from the context', async () => {
      render(
        <Chart
          {...base}
          defaultActivePoint={{ series: 'cost', key: 'Mar' }}
          renderTooltip={(context) => (
            <strong data-testid="custom">{context.items.length} series</strong>
          )}
        />,
      );
      await nextFrame();
      expect(screen.getByTestId('custom')).toHaveTextContent('2 series');
    });

    it('shows each series’ value at the active point in the legend', () => {
      render(<Chart {...base} defaultActivePoint={{ series: 'cost', key: 'Feb' }} legendValues />);
      expect(parts('legend-value').map((value) => value.textContent)).toEqual(['132', '90']);
      expect(legendItems()[1]).toHaveAttribute('data-current');
    });
  });

  describe('views and states', () => {
    it('draws the table region’s ring for a focus from the keyboard, and not for a click followed by Shift', () => {
      /** A pointer press focuses the nearest focusable ancestor, as a browser does. */
      const press = (target: Element) => {
        fireEvent.pointerDown(target);
        target.closest<HTMLElement>('[tabindex], a[href], button')?.focus();
      };
      render(<Chart {...base} />);
      fireEvent.click(part('view-toggle')!);
      const region = part('table-region') as HTMLElement;

      press(region.querySelector('td')!);
      fireEvent.keyDown(region, { key: 'Shift' });
      expect(document.activeElement).toBe(region);
      expect(region).not.toHaveAttribute('data-focus-origin', 'keyboard');

      region.blur();
      fireEvent.keyDown(document.body, { key: 'Tab' });
      region.focus();
      expect(region).toHaveAttribute('data-focus-origin', 'keyboard');
    });

    it('opens the table inside the plot and says so', () => {
      const onTableOpenChange = vi.fn();
      render(<Chart {...base} help="Monthly totals." onTableOpenChange={onTableOpenChange} />);
      expect(glyph('view-toggle')).toBe('file-spreadsheet');
      expect(glyph('menu-trigger')).toBe('ellipsis');
      expect(glyph('help')).toBe('circle-info');

      fireEvent.pointerDown(part('view-toggle')!);
      fireEvent.click(part('view-toggle')!);

      expect(onTableOpenChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ reason: 'pointer' }),
      );
      expect(part('view-toggle')).toHaveAttribute('aria-pressed', 'true');
      expect(part('plot')!.contains(part('table-region'))).toBe(true);
      expect(part('table')!.querySelectorAll('tbody tr')).toHaveLength(3);
    });

    it('stands a skeleton of its kind in the plot while it waits, and holds the toolbar’s box out of reach', () => {
      render(<Chart {...base} loading />);

      expect(root()).toHaveAttribute('data-loading');
      expect(part('plot')).toHaveAttribute('aria-busy', 'true');
      expect(part('skeleton')).toHaveAttribute('data-kind', 'bar');
      // The header keeps the width its words wrap in; nothing in the box can be reached.
      expect(part('toolbar')).toHaveAttribute('data-waiting');
      expect(part('toolbar')).toHaveAttribute('inert');
      expect(part('toolbar')).toHaveAttribute('aria-hidden', 'true');
      expect(part('toolbar')).not.toHaveAttribute('role');
      expect(part('summary')).toHaveTextContent('Loading chart');
      expect(engine.views).toHaveLength(0);
    });

    it('says why it is empty and offers every series back when all are hidden', () => {
      const onHiddenChange = vi.fn();
      render(
        <Chart {...base} defaultHidden={['revenue', 'cost']} onHiddenChange={onHiddenChange} />,
      );

      expect(part('empty')).toHaveTextContent('Every series is hidden');
      fireEvent.click(part('empty')!.querySelector('button')!);
      expect(onHiddenChange).toHaveBeenCalledWith([], expect.anything());
    });

    it('fails with a retry the consumer handles', () => {
      const onRetry = vi.fn();
      render(<Chart {...base} error onRetry={onRetry} />);

      expect(part('error')).toHaveTextContent('The chart could not be drawn');
      fireEvent.click(part('error')!.querySelector('button')!);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('takes the whole screen as a layer where the API is absent, and leaves on Escape', () => {
      const onFullscreenChange = vi.fn();
      render(<Chart {...base} onFullscreenChange={onFullscreenChange} />);

      expect(glyph('fullscreen-toggle')).toBe('maximize');
      fireEvent.click(part('fullscreen-toggle')!);
      expect(root()).toHaveAttribute('data-fullscreen');
      expect(glyph('fullscreen-toggle')).toBe('minimize');
      fireEvent.keyDown(root(), { key: 'Escape' });
      expect(root()).not.toHaveAttribute('data-fullscreen');
      expect(glyph('fullscreen-toggle')).toBe('maximize');
      expect(onFullscreenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: 'escape' }),
      );
    });
  });

  describe('defaults and handle', () => {
    it('takes an application’s defaults, and an explicit prop still wins', () => {
      render(
        <ChartDefaultsProvider palette="sequential" variant="card">
          <Chart {...base} variant="plain" />
        </ChartDefaultsProvider>,
      );

      expect(root()).toHaveAttribute('data-palette', 'sequential');
      expect(root()).toHaveAttribute('data-variant', 'plain');
    });

    it('speaks the language in force, and lays its own messages over it', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <Chart {...base} messages={{ toolbar: 'Tools' }} />
        </SlottedProvider>,
      );

      // language: pt-BR
      expect(part('plot')).toHaveAttribute('aria-roledescription', 'gráfico');
      // language: en-US
      expect(part('toolbar')).toHaveAccessibleName('Tools');
      // language: pt-BR
      expect(screen.getByRole('button', { name: 'Mostrar como tabela' })).toBeInTheDocument();
      // language: en-US
    });

    it('exposes focus, a zoom reset, the drawing and the data', () => {
      const handle = createRef<import('./index').ChartHandle>();
      const onZoomChange = vi.fn();
      render(
        <Chart
          {...base}
          defaultZoom={{ start: 0.5, end: 1 }}
          handleRef={handle}
          onZoomChange={onZoomChange}
          zoomable
        />,
      );

      act(() => handle.current!.focus());
      expect(document.activeElement).toBe(part('plot'));
      act(() => handle.current!.resetZoom());
      expect(onZoomChange).toHaveBeenCalledWith(
        { start: 0, end: 1 },
        expect.objectContaining({ reason: 'programmatic' }),
      );
      expect(handle.current!.toDataURL()).toMatch(/^data:image\/svg/);
      expect(handle.current!.toCsv().split('\r\n')[0]).toBe('Category,Revenue,Cost');
    });
  });
});

describe('Chart row typing', () => {
  interface Row {
    label: string;
    value: number | null;
  }
  const rows: readonly Row[] = [{ label: 'Jan', value: 1 }];

  it('takes rows typed by an interface and checks the fields named against its keys', () => {
    void (<Chart data={rows} x={{ field: 'label' }} series={[{ kind: 'bar', field: 'value' }]} />);
    void (
      <Chart
        data={rows}
        // @ts-expect-error -- `cost` is not a key of the row.
        series={[{ kind: 'bar', field: 'cost' }]}
      />
    );
    void (
      <Chart
        data={rows}
        // @ts-expect-error -- `day` is not a key of the row.
        x={{ field: 'day' }}
        series={[{ kind: 'bar', field: 'value' }]}
      />
    );
  });
});
