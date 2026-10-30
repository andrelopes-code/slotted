import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Drawer, DrawerBody, DrawerPanel, DrawerTitle } from '../drawer';
import { Dialog, DialogBody, DialogContent, DialogTitle } from './index';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/* The theme's motion tokens, which the test document does not load. */
beforeEach(() => {
  document.documentElement.style.setProperty('--slotted-duration-short', '80ms');
  document.documentElement.style.setProperty('--slotted-duration-long', '120ms');
  document.documentElement.style.setProperty('--slotted-easing-standard', 'linear');
  document.documentElement.style.setProperty('--slotted-easing-exit', 'linear');
});
afterEach(() => {
  document.documentElement.removeAttribute('style');
});

/**
 * An application renders an overlay conditionally — `{subject && <Drawer open />}`.
 * Mounted open, the layer was painted in its final state on its first frame
 * and never entered; unmounted on close, it never left, because nothing said
 * when its exit had ended.
 */
describe('a layer mounted open', () => {
  it('starts a dialog from its closed style and reports when it is settled', async () => {
    const settled = vi.fn();
    render(
      <Dialog open onOpenChangeComplete={settled}>
        <DialogContent>
          <DialogTitle>T</DialogTitle>
          <DialogBody>B</DialogBody>
        </DialogContent>
      </Dialog>,
    );
    const layer = document.querySelector('[data-ui="dialog"][data-part="root"]') as HTMLElement;
    expect(layer).not.toHaveAttribute('data-open');

    await expect.poll(() => layer.hasAttribute('data-open')).toBe(true);
    await expect.poll(() => settled.mock.calls).toEqual([[true]]);
  });

  it('starts a drawer from its closed style, and reports its exit once', async () => {
    const settled = vi.fn();
    const view = render(
      <Drawer open onOpenChangeComplete={settled}>
        <DrawerPanel>
          <DrawerTitle>T</DrawerTitle>
          <DrawerBody>B</DrawerBody>
        </DrawerPanel>
      </Drawer>,
    );
    const root = document.querySelector('[data-ui="drawer"][data-part="root"]') as HTMLElement;
    expect(root).not.toHaveAttribute('data-open');
    await expect.poll(() => settled.mock.calls).toEqual([[true]]);

    view.rerender(
      <Drawer open={false} onOpenChangeComplete={settled}>
        <DrawerPanel>
          <DrawerTitle>T</DrawerTitle>
          <DrawerBody>B</DrawerBody>
        </DrawerPanel>
      </Drawer>,
    );
    await act(frame);
    await expect.poll(() => settled.mock.calls).toEqual([[true], [false]]);
  });
});

/**
 * Chromium draws no backdrop filter inside an element whose opacity is below
 * one, so a material drawn inside a fading panel showed the page sharp until
 * the fade ended. A plain panel paints nothing, and its children fade in its
 * place; a painted panel filters its own backdrop through its token, and its
 * own fade keeps the filter drawn.
 */
describe('a material inside a dialog', () => {
  beforeEach(() => {
    document.documentElement.style.setProperty('--slotted-duration-long', '4000ms');
  });

  it('keeps every ancestor of a plain panel’s material opaque while it enters', async () => {
    render(
      <Dialog open surface="plain">
        <DialogContent aria-label="Palette">
          <div data-testid="material" style={{ backdropFilter: 'blur(10px)' }}>
            Search
          </div>
        </DialogContent>
      </Dialog>,
    );
    const layer = document.querySelector('[data-ui="dialog"][data-part="root"]') as HTMLElement;
    await expect.poll(() => layer.hasAttribute('data-open')).toBe(true);
    await frame();
    await frame();

    const material = document.querySelector('[data-testid="material"]') as HTMLElement;
    const own = Number(getComputedStyle(material).opacity);
    expect(own).toBeGreaterThan(0);
    expect(own).toBeLessThan(1);
    expect(getComputedStyle(material).backdropFilter).toBe('blur(10px)');
    for (let node = material.parentElement; node !== null; node = node.parentElement) {
      expect(getComputedStyle(node).opacity, node.getAttribute('data-part') ?? node.tagName).toBe(
        '1',
      );
    }
  });

  it('filters a painted panel’s backdrop through the family token', async () => {
    document.documentElement.style.setProperty('--slotted-dialog-backdrop-filter', 'blur(9px)');
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>T</DialogTitle>
          <DialogBody>B</DialogBody>
        </DialogContent>
      </Dialog>,
    );
    const content = document.querySelector(
      '[data-ui="dialog"] [data-part="content"]',
    ) as HTMLElement;
    expect(getComputedStyle(content).backdropFilter).toBe('blur(9px)');
  });
});
