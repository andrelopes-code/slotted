import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { DashboardGrid } from './dashboard-grid';
import { Chart } from '../chart';
import { atPixelRatio, inkSpan, paint } from '../test/ink';
import { DashboardWidget } from './dashboard-widget';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * The class a grid draws in comes from its own width. A grid beside a
 * navigation rail in a 1280-pixel window is 970 pixels wide, under the
 * expanded threshold, and a stored layout of twelve columns flowed in halves.
 * `expandedFrom` states the width the expanded class starts at.
 */
describe('a dashboard grid narrower than the expanded threshold', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('stands its widgets at their stored cells from expandedFrom', async () => {
    await page.viewport(1280, 900);
    render(
      <div style={{ inlineSize: 970 }}>
        <DashboardGrid
          aria-label="Sales"
          expandedFrom={900}
          defaultLayout={[
            { key: 'a', x: 0, y: 0, w: 4, h: 2 },
            { key: 'b', x: 4, y: 0, w: 4, h: 2 },
            { key: 'c', x: 8, y: 0, w: 4, h: 2 },
          ]}
        >
          <DashboardWidget value="a" title="A" />
          <DashboardWidget value="b" title="B" />
          <DashboardWidget value="c" title="C" />
        </DashboardGrid>
      </div>,
    );
    for (let index = 0; index < 3; index += 1) await frame();
    const tops = [...document.querySelectorAll<HTMLElement>('[data-part="widget"]')].map((widget) =>
      Math.round(widget.getBoundingClientRect().top),
    );

    expect(new Set(tops).size).toBe(1);
  });
});

/**
 * A widget whose content length depends on data — a list of rows — clipped or
 * scrolled inside its card at the height its rows gave it. `rows="auto"` gives
 * it the rows its content measures.
 */
describe('a dashboard widget sized by its content', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('takes the rows its list needs, so its body does not scroll', async () => {
    await page.viewport(1280, 900);
    render(
      <div style={{ inlineSize: 1200 }}>
        <DashboardGrid aria-label="Sales">
          <DashboardWidget value="list" title="Latest" rows="auto">
            <ul style={{ margin: 0 }}>
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index} style={{ blockSize: 32 }}>
                  Row {index + 1}
                </li>
              ))}
            </ul>
          </DashboardWidget>
          <DashboardWidget value="next" title="Next" />
        </DashboardGrid>
      </div>,
    );
    for (let index = 0; index < 5; index += 1) await frame();
    const body = document.querySelector<HTMLElement>(
      '[data-part="widget"] [data-ui="card"] > [data-part="body"]',
    )!;

    expect(body.scrollHeight).toBe(body.clientHeight);
  });

  /* Rows of 4.5rem and a gap of 1rem: a whole row was a step of 88 pixels,
     and a 110-pixel figure took 160 with 50 empty under it. */
  it('is as tall as its content to a twelfth of a row, and what is below rises to it', async () => {
    await page.viewport(1280, 900);
    for (const height of [110, 140, 170]) {
      const { unmount } = render(
        <div style={{ inlineSize: 1200 }}>
          <DashboardGrid aria-label="Sales">
            <DashboardWidget value="figure" title="Revenue" rows="auto" defaultColumns={12}>
              {/* The body grows its children into the cell; the figure inside does not. */}
              <div>
                <div data-testid="figure" style={{ blockSize: height }} />
              </div>
            </DashboardWidget>
            <DashboardWidget value="below" title="Below" defaultColumns={4} />
          </DashboardGrid>
        </div>,
      );
      for (let index = 0; index < 5; index += 1) await frame();
      const widget = (key: string) =>
        document.querySelector<HTMLElement>(`[data-part="widget"][data-key="${key}"]`)!;
      const card = widget('figure').querySelector<HTMLElement>('[data-ui="card"]')!;
      const body = card.querySelector<HTMLElement>(':scope > [data-part="body"]')!;
      const figure = document.querySelector<HTMLElement>('[data-testid="figure"]')!;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const subRow = ((4.5 + 1) * rem) / 12;
      const below = widget('below').getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      const empty =
        cardBox.bottom -
        figure.getBoundingClientRect().bottom -
        parseFloat(getComputedStyle(body).paddingBlockEnd) -
        parseFloat(getComputedStyle(card).borderBlockEndWidth || '0');

      expect(below.top, `${height}`).toBeGreaterThan(cardBox.bottom);
      expect(empty, `${height}`).toBeLessThan(subRow + 0.5);
      expect(below.top - cardBox.bottom, `${height}`).toBeLessThan(rem + 0.5);
      unmount();
    }
  });
});

/**
 * A chart that is a widget's content fills the widget's body: a taller widget
 * draws a taller plot, and the body does not scroll.
 */
describe('a chart in a dashboard widget', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('draws its plot as tall as the widget leaves it', async () => {
    await page.viewport(1280, 1200);
    const data = [
      { month: 'Jan', revenue: 120 },
      { month: 'Feb', revenue: 132 },
      { month: 'Mar', revenue: 150 },
    ];
    const chart = (size?: 'lg') => (
      <Chart
        data={data}
        series={[{ kind: 'bar', field: 'revenue', label: 'Revenue' }]}
        title="Revenue"
        x={{ field: 'month' }}
        {...(size === undefined ? {} : { size })}
      />
    );
    render(
      <div style={{ inlineSize: 1200 }}>
        <DashboardGrid
          aria-label="Sales"
          defaultLayout={[
            { key: 'short', x: 0, y: 0, w: 4, h: 4 },
            { key: 'tall', x: 4, y: 0, w: 4, h: 6 },
            { key: 'large', x: 8, y: 0, w: 4, h: 4 },
          ]}
        >
          <DashboardWidget value="short" title="Short">
            {chart()}
          </DashboardWidget>
          <DashboardWidget value="tall" title="Tall">
            {chart()}
          </DashboardWidget>
          <DashboardWidget value="large" title="Large">
            {chart('lg')}
          </DashboardWidget>
        </DashboardGrid>
      </div>,
    );
    for (let index = 0; index < 3; index += 1) await frame();
    const widget = (key: string) =>
      document.querySelector<HTMLElement>(`[data-part="widget"][data-key="${key}"]`)!;
    const plot = (key: string) =>
      widget(key).querySelector<HTMLElement>('[data-part="plot"]')!.getBoundingClientRect().height;
    const body = (key: string) =>
      widget(key).querySelector<HTMLElement>('[data-ui="card"] > [data-part="body"]')!;

    expect(plot('tall')).toBeGreaterThan(plot('short') + 100);
    for (const key of ['short', 'tall', 'large']) {
      expect(body(key).scrollHeight).toBeLessThanOrEqual(body(key).clientHeight + 1);
    }
  });
});

describe('a widget with help', () => {
  const SIX = ['one', 'two', 'three', 'four', 'five', 'six'];
  const note = 'Liquid balance divided by the mean monthly expense';

  it('draws the control as a glyph no taller than 1.5rem, and the note at the help measure', async () => {
    const long = `${note}. It counts the accounts marked liquid. It excludes the cards and loans.`;
    const root = document.documentElement;

    root.style.setProperty('--slotted-dashboard-grid-help-measure', '18rem');
    render(
      <DashboardGrid aria-label="Sales">
        <DashboardWidget help={long} title="Liquidity" value="liquidity" />
      </DashboardGrid>,
    );
    const help = document.querySelector<HTMLElement>('[data-part="help"]')!;
    const rem = parseFloat(getComputedStyle(root).fontSize);

    expect(help.getBoundingClientRect().height).toBeLessThanOrEqual(1.5 * rem);

    help.focus();
    await userEvent.keyboard('{Enter}');
    await frame();
    const layer = document.querySelector<HTMLElement>('[data-ui="popover"]')!;

    expect(layer.getBoundingClientRect().width).toBeCloseTo(18 * rem, 0);

    root.style.removeProperty('--slotted-dashboard-grid-help-measure');
  });

  /**
   * Text and icon snap to the pixel grid each on its own, so the centers are
   * read from the ink, in widgets whose title rows start at other fractions.
   */
  it.each([
    [1, 'the default size', '16px', undefined],
    [1, 'a title of another size', '16px', '20px'],
    [1, 'a page of another size', '20px', undefined],
    [2, 'the default size', '16px', undefined],
    [2, 'a title of another size', '16px', '20px'],
    [2, 'a page of another size', '20px', undefined],
  ] as const)(
    'centers the ink of the glyph on the capital of the title (ratio %d, %s)',
    async (ratio, _, page, title) => {
      render(
        <div
          style={
            {
              fontSize: page,
              ...(title ? { '--slotted-dashboard-grid-title-font-size': title } : {}),
            } as CSSProperties
          }
        >
          <DashboardGrid aria-label="Sales">
            {SIX.map((value, index) => (
              <DashboardWidget
                help={note}
                key={value}
                title={index % 2 === 0 ? 'H' : `H ${'and a title of two lines '.repeat(4)}`}
                value={value}
              />
            ))}
          </DashboardGrid>
        </div>,
      );
      await frame();

      const rows = [...document.querySelectorAll<HTMLElement>('[data-part="title-row"]')];
      rows.forEach((row, index) => {
        row.style.marginBlockStart = `${String(index * 0.17)}px`;
      });

      const offsets = await atPixelRatio(ratio, async () => {
        const painted = await paint();

        return rows.map((row) => {
          const capital = inkSpan(painted, firstLetter(row.querySelector('[data-part="title"]')!));
          const help = row.querySelector('[data-part="help"]')!;
          const glyph = inkSpan(painted, help.getBoundingClientRect());

          return Number((glyph.center - capital.center).toFixed(2));
        });
      });

      expect(Math.max(...offsets.map(Math.abs)), offsets.join(' ')).toBeLessThanOrEqual(0.5);
    },
  );

  it('names the control after the title and leaves the header alone without help', () => {
    render(
      <DashboardGrid aria-label="Sales">
        <DashboardWidget help={note} title="Liquidity" value="liquidity" />
        <DashboardWidget title="Revenue" value="revenue" />
      </DashboardGrid>,
    );

    expect(
      document.querySelectorAll(
        '[data-part="widget"] [data-part="title-row"] > [data-part="help"]',
      ),
    ).toHaveLength(1);
    expect(
      document.querySelector('[data-key="liquidity"] [data-part="help"]'),
    ).toHaveAccessibleName('About Liquidity');
    expect(document.querySelector('[data-key="revenue"] [data-part="title-row"]')).toBeNull();
  });

  it('opens the note on press, then Escape closes it and returns focus', async () => {
    render(
      <DashboardGrid aria-label="Sales">
        <DashboardWidget help={note} title="Liquidity" value="liquidity" />
      </DashboardGrid>,
    );
    const help = document.querySelector<HTMLElement>('[data-part="help"]')!;

    help.focus();
    await userEvent.keyboard('{Enter}');
    await frame();

    expect(document.body.textContent).toContain(note);

    await userEvent.keyboard('{Escape}');
    await frame();

    expect(document.body.textContent).not.toContain(note);
    expect(document.activeElement).toBe(help);
  });
});

/** The box of the first letter of the text in an element. */
function firstLetter(element: Element) {
  const range = document.createRange();
  const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode()!;
  range.setStart(text, 0);
  range.setEnd(text, 1);

  return range.getBoundingClientRect();
}
