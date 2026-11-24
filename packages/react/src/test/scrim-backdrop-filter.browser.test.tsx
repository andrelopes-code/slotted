import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { cdp, page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';

import { Dialog, DialogBody, DialogContent, DialogTitle } from '../dialog';
import { Drawer, DrawerBody, DrawerPanel, DrawerTitle } from '../drawer';
import { paint } from './ink';

/**
 * The filter of the veil a modal layer draws over the page: the page is
 * filtered, the panel over it is not, and it comes and goes with the veil.
 */
const LAYERS: [
  family: string,
  panel: string,
  layer: (open: boolean, modal: boolean) => ReactNode,
][] = [
  [
    'dialog',
    'content',
    (open, modal) => (
      <Dialog modal={modal} open={open}>
        <DialogContent>
          <DialogTitle>Review</DialogTitle>
          <DialogBody>Sharp words on the panel</DialogBody>
        </DialogContent>
      </Dialog>
    ),
  ],
  [
    'drawer',
    'panel',
    (open, modal) => (
      <Drawer modal={modal} open={open}>
        <DrawerPanel>
          <DrawerTitle>Review</DrawerTitle>
          <DrawerBody>Sharp words on the panel</DrawerBody>
        </DrawerPanel>
      </Drawer>
    ),
  ],
];

describe.each(LAYERS)('the backdrop filter of the scrim of a %s', (family, panel, layer) => {
  afterEach(async () => {
    document.documentElement.removeAttribute('style');
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
    await cdp().send('Emulation.clearDeviceMetricsOverride');
    await page.viewport(412, 915);
  });

  it('is none by default', async () => {
    render(layer(true, true));
    await opened(family);

    expect(filter(family)).toBe('none');
  });

  it('is the token over a modal layer, and none over one that is not modal', async () => {
    setToken(family);
    const { unmount } = render(layer(true, true));
    await opened(family);
    expect(filter(family)).toBe('blur(6px)');
    unmount();

    render(layer(true, false));
    await opened(family);

    expect(filter(family)).toBe('none');
  });

  it.each([
    ['prefers-reduced-transparency', 'reduce'],
    ['forced-colors', 'active'],
  ])('is none under %s', async (name, value) => {
    setToken(family);
    await cdp().send('Emulation.setEmulatedMedia', { features: [{ name, value }] });
    render(layer(true, true));
    await opened(family);

    expect(filter(family)).toBe('none');
  });

  it('arrives and leaves with the veil', async () => {
    setToken(family);
    for (const [name, value] of MOTION) document.documentElement.style.setProperty(name, value);
    const { rerender } = render(layer(false, true));

    rerender(layer(true, true));
    await expect.poll(() => radius(family)).toBeGreaterThan(0);
    expect(radius(family)).toBeLessThan(6);
    await expect.poll(() => radius(family)).toBe(6);

    rerender(layer(false, true));
    await expect.poll(() => radius(family)).toBeLessThan(6);
    expect(radius(family)).toBeGreaterThan(0);
  });

  it('filters the page and not the panel', async () => {
    /* Wide enough that a dialog leaves the page in sight around it, and not drawn scaled. */
    await cdp().send('Emulation.setDeviceMetricsOverride', {
      deviceScaleFactor: 1,
      height: 600,
      mobile: false,
      width: 900,
    });
    await page.viewport(900, 600);
    await expect.poll(() => window.frameElement!.getBoundingClientRect().width).toBe(900);
    const scene = (
      <>
        <div style={STRIPES} />
        {layer(true, true)}
      </>
    );
    document.documentElement.style.setProperty('--slotted-scrim', 'rgb(0 0 0 / 0.3)');
    /* A filter too small to see: with one, text is rasterized in gray in both captures. */
    setToken(family, 'blur(0.01px)');
    const { unmount } = render(scene);
    await opened(family);
    await frames(3);
    const plain = await paint();
    unmount();

    setToken(family);
    render(scene);
    await opened(family);
    await frames(3);
    const filtered = await paint();
    const box = document
      .querySelector(`[data-ui="${family}"] [data-part="${panel}"]`)!
      .getBoundingClientRect();
    const inside = new DOMRect(box.left + 8, box.top + 8, box.width - 16, box.height - 16);
    const outside = new DOMRect(4, 4, 60, 40);

    expect(difference(plain, filtered, inside)).toBeLessThanOrEqual(8);
    expect(difference(plain, filtered, outside)).toBeGreaterThan(20);
  });
});

const STRIPES = {
  background: 'repeating-linear-gradient(90deg, #000 0 4px, #fff 4px 8px)',
  inset: 0,
  position: 'fixed',
} as const;

/** The theme's motion tokens, which the test document does not load. */
const MOTION = [
  ['--slotted-duration-long', '400ms'],
  ['--slotted-duration-medium', '400ms'],
  ['--slotted-duration-short', '400ms'],
  ['--slotted-easing-exit', 'linear'],
  ['--slotted-easing-standard', 'linear'],
] as const;

type Painted = Awaited<ReturnType<typeof paint>>;

function setToken(family: string, value = 'blur(6px)') {
  document.documentElement.style.setProperty(`--slotted-${family}-scrim-backdrop-filter`, value);
}

async function frames(count: number) {
  for (let index = 0; index < count; index += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

async function opened(family: string) {
  await expect
    .poll(() => document.querySelector(`[data-ui="${family}"]`)?.hasAttribute('data-open'))
    .toBe(true);
  await frames(2);
}

function filter(family: string) {
  const backdrop = document.querySelector(`[data-ui="${family}"] > [data-part="backdrop"]`);

  return backdrop === null ? 'none' : getComputedStyle(backdrop).backdropFilter;
}

function radius(family: string) {
  return Number(/blur\(([\d.]+)px\)/.exec(filter(family))?.[1] ?? 0);
}

/** The largest difference of a channel between two captures inside a box. */
function difference(first: Painted, second: Painted, box: DOMRect) {
  const row = (y: number) => Math.floor(y + first.origin.y) * first.width;
  let largest = 0;
  for (let y = Math.ceil(box.top); y < Math.floor(box.bottom); y += 1) {
    for (let x = Math.ceil(box.left); x < Math.floor(box.right); x += 1) {
      const at = (row(y) + Math.floor(x + first.origin.x)) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const change = Math.abs(first.data[at + channel]! - second.data[at + channel]!);
        largest = Math.max(largest, change);
      }
    }
  }

  return largest;
}
