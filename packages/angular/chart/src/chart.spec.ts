import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import type { ChartPoint, ChartZoom } from '@slotted/core/chart';
import type { ChartEngineCallbacks, ChartEngineRenderView } from '@slotted/core/chart-echarts';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHART_ENGINE, SlChart } from './chart';
import { provideChartDefaults } from './chart-defaults';
import { SlChartTooltip } from './chart-templates';

/**
 * ECharts draws nothing in jsdom, and the binding's contract with it is the
 * engine's three calls. The token that provides the engine takes a recording
 * one here: what the chart asks it to draw, and a pointer the tests move.
 */
const engine = {
  views: [] as ChartEngineRenderView[],
  callbacks: null as ChartEngineCallbacks | null,
};
const recordingEngine = (_element: HTMLElement, callbacks: ChartEngineCallbacks) => {
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
    emphasize: () => {},
    toDataURL: () => 'data:image/svg+xml,<svg/>',
    dispose: () => {},
  };
};

@Component({
  imports: [SlChart, SlChartTooltip],
  template: `<figure
    slChart
    #chart="slChart"
    title="Revenue and cost"
    locale="en-US"
    [data]="data"
    [series]="series"
    [x]="{ field: 'month' }"
    [loading]="loading()"
    [error]="error()"
    [zoomable]="true"
    [selectable]="true"
    [legendValues]="legendValues()"
    [(hidden)]="hidden"
    [(activePoint)]="activePoint"
    [(zoom)]="zoom"
    [(tableOpen)]="tableOpen"
    [(fullscreen)]="fullscreen"
    (hiddenChangeRequest)="requests.push($event)"
    (activePointChangeRequest)="requests.push($event)"
    (zoomChangeRequest)="requests.push($event)"
    (tableOpenChangeRequest)="requests.push($event)"
    (fullscreenChangeRequest)="requests.push($event)"
    (retry)="retries = retries + 1"
  >
    @if (custom()) {
      <ng-template slChartTooltip let-context
        ><strong class="custom">{{ context.items.length }} series</strong></ng-template
      >
    }
  </figure>`,
})
class TestHost {
  readonly data = [
    { month: 'Jan', revenue: 120, cost: 80 },
    { month: 'Feb', revenue: 132, cost: 90 },
    { month: 'Mar', revenue: 150, cost: 95 },
  ];
  readonly series = [
    { kind: 'line', field: 'revenue', label: 'Revenue' },
    { kind: 'bar', field: 'cost', label: 'Cost' },
  ] as const;
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly legendValues = signal(false);
  readonly custom = signal(false);
  readonly hidden = signal<readonly string[]>([]);
  readonly activePoint = signal<ChartPoint | null>(null);
  readonly zoom = signal<ChartZoom>({ start: 0, end: 1 });
  readonly tableOpen = signal(false);
  readonly fullscreen = signal(false);
  readonly requests: ChangeRequest<unknown>[] = [];
  retries = 0;
  readonly chart = viewChild.required<SlChart>('chart');
}

async function mount(configure?: (host: TestHost) => void, providers: unknown[] = []) {
  TestBed.configureTestingModule({
    imports: [TestHost],
    providers: [{ provide: CHART_ENGINE, useValue: recordingEngine }, ...providers] as never[],
  });
  const fixture = TestBed.createComponent(TestHost);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  /* A context no chart read before has its theme read on the next frame. */
  await nextFrame();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="chart"]') as HTMLElement;
  const part = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  const parts = (name: string) => [...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)];
  const legendItems = () => [
    ...root.querySelectorAll<HTMLElement>('[data-part="legend"] > [data-part="legend-item"]'),
  ];
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  return { fixture, host: fixture.componentInstance, root, part, parts, legendItems, settle };
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** The glyph a part draws, as the `Glyph` element inside its icon box. */
const glyphOf = (element: HTMLElement | null) =>
  element?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');

const key = (target: HTMLElement, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }),
  );

beforeEach(() => {
  engine.views = [];
  engine.callbacks = null;
});

/** A pointer press focuses the nearest focusable ancestor, as a browser does. */
const press = (target: Element) => {
  target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  target.closest<HTMLElement>('[tabindex], a[href], button')?.focus();
};

@Component({
  imports: [SlChart],
  template: `<figure
    slChart
    aria-label="Revenue by month"
    locale="en-US"
    [data]="data"
    [series]="[{ kind: 'bar', field: 'revenue', label: 'Revenue' }]"
    [x]="{ field: 'month' }"
  ></figure>`,
})
class UntitledHost {
  readonly data = [{ month: 'Jan', revenue: 120 }];
}

describe('SlChart', () => {
  it('names the plot by the aria-label of the figure when there is no title', async () => {
    TestBed.configureTestingModule({
      imports: [UntitledHost],
      providers: [{ provide: CHART_ENGINE, useValue: recordingEngine }] as never[],
    });
    const fixture = TestBed.createComponent(UntitledHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement.querySelector('[data-ui="chart"]') as HTMLElement;
    const plot = root.querySelector<HTMLElement>('[data-part="plot"]')!;

    expect(root.getAttribute('aria-label')).toBe('Revenue by month');
    expect(plot.getAttribute('aria-label')).toBe('Revenue by month');
    expect(plot.getAttribute('aria-labelledby')).toBeNull();
    expect(root.querySelector('[data-part="title"]')).toBeNull();
  });

  it('is a figure its caption names, with a plot named by the title and described in words', async () => {
    const { root, part } = await mount();

    expect(root.tagName).toBe('FIGURE');
    expect(root.getAttribute('title')).toBeNull();
    const plot = part('plot')!;
    expect(plot.getAttribute('role')).toBe('group');
    expect(plot.getAttribute('aria-roledescription')).toBe('chart');
    expect(document.getElementById(plot.getAttribute('aria-labelledby')!)?.textContent).toBe(
      'Revenue and cost',
    );
    expect(document.getElementById(plot.getAttribute('aria-describedby')!)?.textContent).toContain(
      'Combined chart with 2 series and 3 points, from Jan to Mar.',
    );
    expect(part('tooltip')?.getAttribute('aria-hidden')).toBe('true');
  });

  /**
   * A read appends a probe and computes two dozen styles. Right after the
   * first render it forced a style recalculation of everything rendered — on
   * every chart, for the values the chart beside it had already read.
   */
  it('reads the theme once per context, never right after a render', async () => {
    const styles = vi.spyOn(window, 'getComputedStyle');
    /* One read is one computed style of the plot part; the probe's follows it. */
    const reads = () =>
      styles.mock.calls.filter(([element]) => element.matches('[data-part="plot"]')).length;
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: CHART_ENGINE, useValue: recordingEngine }],
    });
    const create = async () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.nativeElement.setAttribute('data-context', 'theme-once');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    };

    await create();
    expect(reads()).toBe(0);
    await nextFrame();
    expect(reads()).toBe(1);

    await create();
    expect(reads()).toBe(1);
    /* Each chart drew once, both with the one theme read. */
    expect(engine.views).toHaveLength(2);
    expect(engine.views[1]!.theme).toBe(engine.views[0]!.theme);
    await nextFrame();
    expect(reads()).toBe(1);
    styles.mockRestore();
  });

  it('hands the engine the model and the theme it reads from the stylesheet', async () => {
    await mount();
    const view = engine.views.at(-1)!;
    expect(view.model.series.map((entry) => entry.id)).toEqual(['revenue', 'cost']);
    expect(view.theme.slots).toHaveLength(8);
    expect(view.zoomable).toBe(true);
  });

  it('toggles a series from the legend, asking first and moving the two-way value', async () => {
    const { host, legendItems, settle } = await mount();

    const cost = legendItems()[1]!;
    cost.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    cost.click();
    await settle();

    expect(host.hidden()).toEqual(['cost']);
    expect(host.requests.at(-1)).toMatchObject({ value: ['cost'], reason: 'pointer' });
    expect(legendItems()[1]!.getAttribute('aria-pressed')).toBe('false');
  });

  it('lets a handler cancel the request, and nothing moves', async () => {
    const { host, fixture, legendItems, settle } = await mount();
    fixture.componentInstance.chart().hiddenChangeRequest.subscribe((request) => request.cancel());

    legendItems()[0]!.click();
    await settle();

    expect(host.hidden()).toEqual([]);
  });

  it('walks the plot with the arrows and says why', async () => {
    const { host, part, settle } = await mount((h) =>
      h.activePoint.set({ series: 'revenue', key: 'Jan' }),
    );

    key(part('plot')!, 'ArrowRight');
    await settle();
    expect(host.activePoint()).toEqual({ series: 'revenue', key: 'Feb' });
    expect(host.requests.at(-1)).toMatchObject({ reason: 'keyboard' });

    key(part('plot')!, 'ArrowDown');
    await settle();
    expect(host.activePoint()).toEqual({ series: 'cost', key: 'Feb' });

    key(part('plot')!, 'Escape');
    await settle();
    expect(host.activePoint()).toBeNull();
    expect(host.requests.at(-1)).toMatchObject({ reason: 'escape' });
  });

  it('draws the crosshair, the markers and the tooltip at the engine’s point', async () => {
    const { part, parts, settle } = await mount();

    engine.callbacks!.onPointer!({ series: 'revenue', key: 'Feb' }, undefined);
    await settle();

    expect(part('tooltip')?.hasAttribute('data-open')).toBe(true);
    expect(part('tooltip-title')?.textContent).toBe('Feb');
    expect(parts('tooltip-item').map((row) => row.textContent?.replace(/\s+/g, ''))).toEqual([
      'Revenue132',
      'Cost90',
    ]);
    expect(part('crosshair')?.hidden).toBe(false);
    expect(parts('marker')).toHaveLength(1);
  });

  it('renders a custom tooltip from a template', async () => {
    const { root } = await mount((h) => {
      h.custom.set(true);
      h.activePoint.set({ series: 'cost', key: 'Mar' });
    });
    expect(root.querySelector('.custom')?.textContent).toBe('2 series');
  });

  it('draws the table region’s ring for a focus from the keyboard, and not for a click followed by Shift', async () => {
    const { part, settle } = await mount();
    part('view-toggle')!.click();
    await settle();
    const region = part('table-region') as HTMLElement;

    press(region.querySelector('td')!);
    key(region, 'Shift');
    expect(document.activeElement).toBe(region);
    expect(region.getAttribute('data-focus-origin')).not.toBe('keyboard');

    region.blur();
    key(document.body as HTMLElement, 'Tab');
    region.focus();
    expect(region.getAttribute('data-focus-origin')).toBe('keyboard');
  });

  it('opens the table inside the plot', async () => {
    const { host, part, settle } = await mount();
    expect(glyphOf(part('view-toggle'))).toBe('file-spreadsheet');
    expect(glyphOf(part('menu-trigger'))).toBe('ellipsis');

    part('view-toggle')!.click();
    await settle();

    expect(host.tableOpen()).toBe(true);
    expect(part('plot')!.contains(part('table-region'))).toBe(true);
    expect(part('table')!.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('zooms with + and gives the whole domain back with 0', async () => {
    const { host, part, settle } = await mount((h) =>
      h.activePoint.set({ series: 'revenue', key: 'Feb' }),
    );

    key(part('plot')!, '+');
    await settle();
    expect(host.zoom()).toEqual({ start: 0.25, end: 0.75 });
    expect(glyphOf(part('zoom-reset'))).toBe('rotate-ccw');

    key(part('plot')!, '0');
    await settle();
    expect(host.zoom()).toEqual({ start: 0, end: 1 });
  });

  it('stands a skeleton in the plot while it waits, and holds the toolbar’s box out of reach', async () => {
    const { root, part } = await mount((h) => h.loading.set(true));

    expect(root.hasAttribute('data-loading')).toBe(true);
    expect(part('plot')?.getAttribute('aria-busy')).toBe('true');
    expect(part('skeleton')?.getAttribute('data-kind')).toBe('bar');
    // The header keeps the width its words wrap in; nothing in the box can be reached.
    expect(part('toolbar')?.hasAttribute('data-waiting')).toBe(true);
    expect(part('toolbar')?.hasAttribute('inert')).toBe(true);
    expect(part('toolbar')?.getAttribute('aria-hidden')).toBe('true');
    expect(part('toolbar')?.getAttribute('role')).toBeNull();
  });

  it('fails with a retry the consumer handles', async () => {
    const { host, part, settle } = await mount((h) => h.error.set(true));

    expect(part('error')?.textContent).toContain('The chart could not be drawn');
    part('error')!.querySelector('button')!.click();
    await settle();
    expect(host.retries).toBe(1);
  });

  it('takes the whole screen as a layer where the API is absent, and leaves on Escape', async () => {
    const { host, root, part, settle } = await mount();

    expect(glyphOf(part('fullscreen-toggle'))).toBe('maximize');
    part('fullscreen-toggle')!.click();
    await settle();
    expect(root.hasAttribute('data-fullscreen')).toBe(true);
    expect(glyphOf(part('fullscreen-toggle'))).toBe('minimize');

    key(root, 'Escape');
    await settle();
    expect(host.fullscreen()).toBe(false);
    expect(host.requests.at(-1)).toMatchObject({ value: false, reason: 'escape' });
  });

  it('takes an application’s defaults', async () => {
    const { root, part } = await mount(undefined, [
      provideChartDefaults({ palette: 'sequential', variant: 'card' }),
    ]);

    expect(root.getAttribute('data-palette')).toBe('sequential');
    expect(root.getAttribute('data-variant')).toBe('card');
    expect(part('plot')?.getAttribute('aria-roledescription')).toBe('chart');
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    const { part, settle } = await mount(undefined, [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);

    // language: pt-BR
    expect(part('plot')?.getAttribute('aria-roledescription')).toBe('gráfico');
    expect(part('toolbar')?.getAttribute('aria-label')).toBe('Ações do gráfico');
    // language: en-US

    locale.set('en-US');
    await settle();
    expect(part('toolbar')?.getAttribute('aria-label')).toBe('Chart actions');
  });

  it('exposes focus, a zoom reset, the drawing and the data through exportAs', async () => {
    const { host, part, settle } = await mount((h) => h.zoom.set({ start: 0.5, end: 1 }));

    const chart = host.chart();
    chart.focus();
    expect(document.activeElement).toBe(part('plot'));
    chart.resetZoom();
    await settle();
    expect(host.zoom()).toEqual({ start: 0, end: 1 });
    expect(chart.toDataURL()).toMatch(/^data:image\/svg/);
    expect(chart.toCsv().split('\r\n')[0]).toBe('Category,Revenue,Cost');
  });
});

describe('SlChart row typing', () => {
  interface Row {
    label: string;
    value: number | null;
  }

  @Component({
    imports: [SlChart],
    template: `<figure
      slChart
      title="Typed"
      [data]="rows"
      [x]="{ field: 'label' }"
      [series]="[{ kind: 'bar', field: 'value' }]"
    ></figure>`,
  })
  class TypedHost {
    readonly rows: readonly Row[] = [{ label: 'Jan', value: 1 }];
  }

  it('takes rows typed by an interface and checks the fields named against its keys', () => {
    type Series = ReturnType<SlChart<Row>['series']>[number];
    // @ts-expect-error -- `cost` is not a key of the row.
    const wrong: Series = { kind: 'bar', field: 'cost' };
    void wrong;

    TestBed.configureTestingModule({
      providers: [{ provide: CHART_ENGINE, useValue: recordingEngine }],
    });
    const fixture = TestBed.createComponent(TypedHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-ui="chart"]')).not.toBeNull();
  });
});
