import { render } from '@testing-library/react';
import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppShell } from './app-shell';
import {
  AppShellAside,
  AppShellAsideBody,
  AppShellAsideResizer,
  AppShellMain,
} from './app-shell-parts';
import type { AppShellCanvas, AppShellNavSide } from './app-shell.types';

/** Renders the pane as a column and returns the point its resizer must lie on. */
function placed(canvas: AppShellCanvas, navSide: AppShellNavSide) {
  render(
    <AppShell asideMode="inline" asideOpen canvas={canvas} navSide={navSide} scroll="content">
      <AppShellMain>
        <p>Orders</p>
      </AppShellMain>
      <AppShellAside>
        <AppShellAsideResizer />
        <AppShellAsideBody>
          <p>ORD-4521</p>
        </AppShellAsideBody>
      </AppShellAside>
    </AppShell>,
  );
  const main = document.querySelector('[data-part="main"]')!.getBoundingClientRect();
  const asideElement = document.querySelector('[data-part="aside"]') as HTMLElement;
  const aside = asideElement.getBoundingClientRect();
  const resizer = document.querySelector('[data-part="aside-resizer"]') as HTMLElement;
  const box = resizer.getBoundingClientRect();
  return { aside, asideElement, box, main, resizer, y: box.top + box.height / 2 };
}

describe('the pane edge', () => {
  beforeEach(async () => {
    await page.viewport(1440, 900);
  });
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it.each<[AppShellCanvas, AppShellNavSide]>([
    ['inset', 'start'],
    ['inset', 'end'],
    ['floating', 'start'],
    ['floating', 'end'],
  ])('lies on the centre of the gutter, canvas %s, navigation at the %s', (canvas, navSide) => {
    const { aside, box, main, resizer, y } = placed(canvas, navSide);
    const [before, after] =
      navSide === 'start' ? [main.right, aside.left] : [aside.right, main.left];
    const gutter = (before + after) / 2;

    expect(after - before).toBeGreaterThan(0);
    expect(Math.abs(box.left + box.width / 2 - gutter)).toBeLessThanOrEqual(0.5);
    expect(resizer.contains(document.elementFromPoint(gutter, y))).toBe(true);
  });

  it.each<[AppShellCanvas, AppShellNavSide]>([
    ['flush', 'start'],
    ['flush', 'end'],
    ['panel', 'start'],
    ['panel', 'end'],
  ])('lies on the centre of the seam, canvas %s, navigation at the %s', (canvas, navSide) => {
    const { aside, asideElement, box, resizer, y } = placed(canvas, navSide);
    const style = getComputedStyle(asideElement);
    const seam =
      navSide === 'start'
        ? aside.left + parseFloat(style.borderLeftWidth) / 2
        : aside.right - parseFloat(style.borderRightWidth) / 2;

    expect(Math.abs(box.left + box.width / 2 - seam)).toBeLessThanOrEqual(0.5);
    expect(resizer.contains(document.elementFromPoint(seam, y))).toBe(true);
  });
});
