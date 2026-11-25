import { render } from '@testing-library/react';
import type { CSSProperties, ReactNode } from 'react';
import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppShell } from './app-shell';
import {
  AppShellAside,
  AppShellAsideBody,
  AppShellAsideResizer,
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavRail,
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
  ])('lies on the center of the gutter, canvas %s, navigation at the %s', (canvas, navSide) => {
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
  ])('lies on the center of the seam, canvas %s, navigation at the %s', (canvas, navSide) => {
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

/** The two scrollbar tokens are read where the bar is drawn, so a region restyles its own. */
describe('the scrollbar of a region', () => {
  const bar = (part: string) =>
    getComputedStyle(document.querySelector(`[data-part="${part}"]`)!).scrollbarColor;
  const shell = (nav?: CSSProperties) => (
    <AppShell asideMode="inline" asideOpen navOpen primary="nav">
      <AppShellNav style={nav}>
        <AppShellNavBody>Orders</AppShellNavBody>
      </AppShellNav>
      <AppShellMain>Orders</AppShellMain>
      <AppShellAside>
        <AppShellAsideBody>ORD-4521</AppShellAsideBody>
      </AppShellAside>
    </AppShell>
  );

  it('takes the tokens declared on the region alone', () => {
    const { rerender } = render(shell());
    const themed = bar('aside-body');
    expect(bar('nav-body')).toBe(themed);

    rerender(
      shell({ '--slotted-app-shell-scrollbar-thumb-color': 'transparent' } as CSSProperties),
    );

    expect(bar('nav-body')).toBe('rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)');
    expect(bar('aside-body')).toBe(themed);
  });

  it('follows the scheme of the region', () => {
    render(shell({ '--slotted-border-strong': 'rgb(1, 2, 3)' } as CSSProperties));

    expect(bar('nav-body')).toBe('rgb(1, 2, 3) rgba(0, 0, 0, 0)');
    expect(bar('aside-body')).not.toBe(bar('nav-body'));
  });
});

/**
 * A scroll container that is not positioned neither clips nor scrolls an
 * absolutely positioned descendant: the shell's root holds it instead, below
 * the fold, and the document grows to reach it.
 */
describe('an absolutely positioned descendant of a scrolling region', () => {
  beforeEach(async () => {
    await page.viewport(1440, 900);
  });
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  const hidden: CSSProperties = {
    blockSize: 1,
    clipPath: 'inset(50%)',
    inlineSize: 1,
    overflow: 'hidden',
    position: 'absolute',
  };
  const long = (
    <>
      <div style={{ blockSize: 2000, flex: 'none' }} />
      <span data-testid="hidden" style={hidden}>
        Hidden text
      </span>
    </>
  );

  it.each<[string, ReactNode, number?]>([
    ['main', <AppShellMain key="main">{long}</AppShellMain>],
    ['nav', <AppShellNav key="nav">{long}</AppShellNav>],
    [
      'nav-body',
      <AppShellNav key="nav">
        <AppShellNavBody>{long}</AppShellNavBody>
      </AppShellNav>,
    ],
    [
      'nav-rail',
      <AppShellNav key="nav">
        <AppShellNavRail>{long}</AppShellNavRail>
      </AppShellNav>,
    ],
    [
      'aside-body',
      <AppShellAside key="aside">
        <AppShellAsideBody>{long}</AppShellAsideBody>
      </AppShellAside>,
    ],
    /* The pane is a scroll container of its own where it is a row. */
    ['aside', <AppShellAside key="aside">{long}</AppShellAside>, 500],
  ])('scrolls with the %s region and not with the document', (part, region, inlineSize) => {
    render(
      <AppShell
        asideMode="inline"
        asideOpen
        navOpen
        scroll="content"
        style={{ blockSize: '100dvh', inlineSize }}
      >
        {region}
      </AppShell>,
    );
    const scroller = document.querySelector<HTMLElement>(`[data-part="${part}"]`)!;
    const target = document.querySelector<HTMLElement>('[data-testid="hidden"]')!;
    const root = document.documentElement;

    expect(root.scrollHeight).toBe(root.clientHeight);

    const before = target.getBoundingClientRect().top;
    scroller.scrollTop = 100;

    expect(scroller.scrollTop).toBe(100);
    expect(target.getBoundingClientRect().top).toBeCloseTo(before - 100, 0);
  });
});
