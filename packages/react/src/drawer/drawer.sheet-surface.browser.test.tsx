import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerResizer,
  DrawerTitle,
} from './index';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * The sticky header and resizer of a `drag="panel"` sheet painted the drawer
 * surface over the panel's own, so a translucent surface read as a darker
 * band at the top. They paint nothing at rest, and the header surface once
 * the content passes under them.
 */
describe('the sticky top of a bottom sheet over a translucent surface', () => {
  beforeEach(() => {
    const root = document.documentElement.style;
    root.setProperty('--slotted-drawer-surface', 'rgb(40 40 40 / 0.68)');
    root.setProperty('--slotted-drawer-header-surface', 'rgb(10, 20, 30)');
  });
  afterEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('paints no second layer at rest, and the header surface once the content is under it', async () => {
    render(
      <Drawer defaultOpen drag="panel" side="bottom">
        <DrawerPanel>
          <DrawerResizer />
          <DrawerHeader>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Text</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            {Array.from({ length: 40 }, (_, index) => (
              <p key={index} style={{ blockSize: 48, margin: 0 }}>
                Row {index + 1}
              </p>
            ))}
          </DrawerBody>
        </DrawerPanel>
      </Drawer>,
    );
    for (let index = 0; index < 45; index += 1) await frame();
    const layer = document.querySelector<HTMLElement>('[data-ui="drawer"]')!;
    const header = layer.querySelector<HTMLElement>('[data-part="header"]')!;
    const resizer = layer.querySelector<HTMLElement>('[data-part="resizer"]')!;
    const background = (element: HTMLElement) => getComputedStyle(element).backgroundColor;

    expect(background(header)).toBe('rgba(0, 0, 0, 0)');
    expect(background(resizer)).toBe('rgba(0, 0, 0, 0)');
    expect(header.hasAttribute('data-stuck')).toBe(false);

    layer.scrollTo({ behavior: 'instant', top: layer.scrollHeight });
    for (let index = 0; index < 10; index += 1) await frame();

    expect(layer.hasAttribute('data-sheet-content')).toBe(true);
    expect(header.hasAttribute('data-stuck')).toBe(true);
    expect(resizer.hasAttribute('data-stuck')).toBe(true);
    expect(background(header)).toBe('rgb(10, 20, 30)');
    expect(background(resizer)).toBe('rgb(10, 20, 30)');
  });
});
