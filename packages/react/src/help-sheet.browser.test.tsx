import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { cdp, page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Chart } from './chart';
import { DashboardGrid, DashboardWidget } from './dashboard-grid';
import { DataGrid } from './data-grid';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from './popover';

const NOTE = 'What the figure says. Its formula. An example.';

const ROWS = [{ id: 'a', rate: 3 }];
const COLUMNS = [{ id: 'rate', label: 'Savings rate', kind: 'number' as const, description: NOTE }];

const families: { name: string; part: string; label: string; node: ReactNode }[] = [
  {
    name: 'dashboard widget',
    part: 'help',
    label: 'About Savings rate',
    node: (
      <DashboardGrid aria-label="Plan">
        <DashboardWidget help={NOTE} key="rate" title="Savings rate" value="rate">
          3%
        </DashboardWidget>
      </DashboardGrid>
    ),
  },
  {
    name: 'data grid column',
    part: 'column-help',
    label: 'About Savings rate',
    node: (
      <DataGrid aria-label="Plans" columns={COLUMNS} rowKey="id" rows={ROWS} virtualize={false} />
    ),
  },
  {
    name: 'chart',
    part: 'help',
    label: 'About this chart',
    node: (
      <Chart
        data={[{ x: 'a', y: 1 }]}
        help={NOTE}
        series={[{ kind: 'line', field: 'y' }]}
        title="Savings rate"
        x={{ field: 'x' }}
      />
    ),
  },
];

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const layer = () => document.querySelector<HTMLElement>('[data-ui="popover"][data-open]');

const control = (part: string) =>
  document.querySelector<HTMLElement>(`button[data-part="${part}"]`)!;

async function settle() {
  for (let index = 0; index < 5; index += 1) await frame();
  await Promise.allSettled(document.getAnimations().map((animation) => animation.finished));
}

async function press(element: HTMLElement) {
  await userEvent.click(element);
  await vi.waitFor(() => expect(layer()).not.toBeNull());
  await settle();
}

/**
 * A note of several paragraphs opened over the widgets around it on a phone,
 * at a place its trigger decided, with no visible way out.
 */
describe('a help note on a phone', () => {
  beforeEach(async () => {
    await page.viewport(390, 844);
  });

  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it.each(families)('is a modal sheet named by the title of its $name', async ({ node, part }) => {
    render(node);
    await press(control(part));
    const sheet = layer()!;
    const dialog = sheet.querySelector<HTMLElement>('[role="dialog"]')!;
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby')!)!;
    const box = dialog.getBoundingClientRect();

    expect(sheet.dataset['presentation']).toBe('sheet');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(heading.textContent).toBe('Savings rate');
    expect(heading.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(dialog.textContent).toContain(NOTE);
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(Math.round(box.bottom)).toBe(844);
    expect(Math.round(box.width)).toBe(390);

    /* The strip over the panel is the scrim. */
    const scrim = sheet.querySelector<HTMLElement>('[data-part="backdrop"]')!;
    await userEvent.click(scrim, { position: { x: 195, y: 40 } });
    await vi.waitFor(() => expect(layer()).toBeNull());

    expect(document.activeElement).toBe(control(part));
  });

  it.each(families)('closes the sheet of a $name on Escape', async ({ node, part }) => {
    render(node);
    await press(control(part));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(layer()).toBeNull());

    expect(document.activeElement).toBe(control(part));
  });

  it('holds focus in the sheet, and closes it on a pull of the grip', async () => {
    render(families[0]!.node);
    await press(control('help'));
    const dialog = layer()!.querySelector<HTMLElement>('[role="dialog"]')!;
    for (let index = 0; index < 4; index += 1) {
      await userEvent.keyboard('{Tab}');
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    const grip = dialog.querySelector('[data-part="grip"]')!.getBoundingClientRect();
    await pull(grip.left + grip.width / 2, grip.top + grip.height / 2, dialog.offsetHeight * 0.7);
    await vi.waitFor(() => expect(layer()).toBeNull());
  });

  it('keeps a long note under the screen, with its body scrolling', async () => {
    render(
      <Popover presentation="auto">
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverLayer>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Savings rate</PopoverTitle>
              <PopoverClose />
            </PopoverHeader>
            <PopoverBody>
              <div style={{ blockSize: 3000 }}>Long</div>
            </PopoverBody>
          </PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    await press(document.querySelector('button')!);
    const dialog = layer()!.querySelector<HTMLElement>('[role="dialog"]')!;
    const body = dialog.querySelector<HTMLElement>('[data-part="body"]')!;

    expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(844 * 0.9 + 1);
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(dialog.querySelectorAll('[data-part="title"]')).toHaveLength(1);

    await userEvent.click(dialog.querySelector<HTMLElement>('[data-part="close"]')!);
    await vi.waitFor(() => expect(layer()).toBeNull());
  });

  it('leaves a popover with no presentation anchored', async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverLayer>
          <PopoverContent aria-label="Filters">
            <PopoverBody>Anchored</PopoverBody>
          </PopoverContent>
        </PopoverLayer>
      </Popover>,
    );
    await press(document.querySelector('button')!);

    expectAnchored('Filters');
  });
});

describe('a help note on a wide screen', () => {
  beforeEach(async () => {
    await page.viewport(1024, 844);
  });

  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it.each(families)('is anchored to the control of a $name', async ({ label, node, part }) => {
    render(node);
    await press(control(part));

    expectAnchored(label);
  });
});

function expectAnchored(label: string) {
  const dialog = layer()!.querySelector<HTMLElement>('[role="dialog"]')!;

  expect(layer()!.dataset['presentation']).toBe('popover');
  expect(dialog.getAttribute('aria-label')).toBe(label);
  expect(dialog.hasAttribute('aria-modal')).toBe(false);
  expect(layer()!.querySelector('[data-part="backdrop"], [data-part="grip"]')).toBeNull();
}

async function pull(x: number, y: number, by: number) {
  const frameBox = window.frameElement?.getBoundingClientRect();
  const at = (dy: number) => [{ x: (frameBox?.left ?? 0) + x, y: (frameBox?.top ?? 0) + y + dy }];
  await cdp().send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) });
  for (let step = 1; step <= 10; step += 1) {
    await cdp().send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: at((by * step) / 10),
    });
    await frame();
  }

  await cdp().send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await frame();
}
