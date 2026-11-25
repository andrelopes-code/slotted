import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CHART_ENGINE, SlChart } from '@slotted/angular/chart';
import { SlDashboardGrid, SlDashboardWidget } from '@slotted/angular/dashboard-grid';
import { SlDataGrid } from '@slotted/angular/data-grid';
import { afterEach, describe, expect, it, vi } from 'vitest';

@Component({
  standalone: true,
  imports: [SlChart, SlDashboardGrid, SlDashboardWidget, SlDataGrid],
  template: `
    <section data-testid="widget">
      <div slDashboardGrid aria-label="Plan">
        <sl-dashboard-widget value="rate" title="Savings rate" help="A note." />
      </div>
    </section>

    <section data-testid="column">
      <sl-data-grid aria-label="Plans" rowKey="id" [columns]="columns" [rows]="rows" />
    </section>

    <section data-testid="chart">
      <figure
        slChart
        title="Savings rate"
        help="A note."
        [data]="rows"
        [series]="series"
        [x]="{ field: 'id' }"
      ></figure>
    </section>
  `,
})
class Host {
  readonly rows = [{ id: 'a', rate: 3 }];
  readonly series = [{ kind: 'line', field: 'rate' }] as const;
  readonly columns = [{ id: 'rate', label: 'Savings rate', description: 'A note.' }];
}

const helps: [id: string, part: string, label: string][] = [
  ['widget', 'help', 'About Savings rate'],
  ['column', 'column-help', 'About Savings rate'],
  ['chart', 'help', 'About this chart'],
];

const layer = () => document.querySelector<HTMLElement>('[data-ui="popover"]');

/** A note of several paragraphs opened over the widgets around it on a phone. */
describe('the help note of a widget, a column and a chart', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(helps)('is a modal sheet named by the title on a phone, %s', async (id, part) => {
    await press(id, part, true);
    const dialog = layer()!.querySelector('[role="dialog"]')!;
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby')!);

    expect(layer()!.dataset['presentation']).toBe('sheet');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(heading?.textContent).toBe('Savings rate');
    expect(dialog.textContent).toContain('A note.');
  });

  it.each(helps)('is anchored anywhere else, %s', async (id, part, label) => {
    await press(id, part, false);
    const dialog = layer()!.querySelector('[role="dialog"]')!;

    expect(layer()!.dataset['presentation']).toBe('popover');
    expect(dialog.hasAttribute('aria-modal')).toBe(false);
    expect(dialog.getAttribute('aria-label')).toBe(label);
  });
});

async function press(id: string, part: string, phone: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: phone && query === '(max-width: 480px) and (pointer: coarse)',
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  TestBed.configureTestingModule({
    providers: [{ provide: CHART_ENGINE, useValue: engine }],
  });
  const fixture = TestBed.createComponent(Host);
  const settle = async () => {
    for (let turn = 0; turn < 3; turn += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
  };
  await settle();

  (fixture.nativeElement as HTMLElement)
    .querySelector<HTMLElement>(`[data-testid="${id}"] button[data-part="${part}"]`)!
    .click();
  await settle();
}

const engine = () => ({
  update: async () => undefined,
  locate: () => null,
  emphasize: () => undefined,
  toDataURL: () => null,
  dispose: () => undefined,
});
