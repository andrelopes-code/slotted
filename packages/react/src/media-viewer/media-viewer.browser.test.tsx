import '@slotted/styles/dialog/dialog.css';

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cdp, page } from 'vitest/browser';

import { MediaViewer } from './index';
import type { MediaViewerItem } from './index';

const picture = (width: number, height: number) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}">` +
      `<rect width="${String(width)}" height="${String(height)}" fill="teal"/>` +
      `<circle cx="${String(width / 4)}" cy="${String(height / 4)}" r="${String(height / 8)}" fill="gold"/>` +
      '</svg>',
  );

const ITEMS: MediaViewerItem[] = [
  { id: 'wide', name: 'wide.png', type: 'image/png', src: picture(2000, 1000) },
  { id: 'small', name: 'small.png', type: 'image/png', src: picture(300, 200) },
  { id: 'contract', name: 'contract.pdf', type: 'application/pdf', src: 'about:blank' },
];

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

async function settle() {
  for (let index = 0; index < 4; index++) await frame();
}

const part = (name: string) =>
  document.querySelector<HTMLElement>(`[data-ui="media-viewer"] [data-part="${name}"]`);
const layer = () =>
  document.querySelector<HTMLElement>('[data-ui="dialog"] [data-part="content"]')!;

/**
 * A point of the test frame in the page's coordinates. At 1440 pixels the frame
 * is drawn scaled into the runner's column, so the point is scaled with it.
 */
function onPage(x: number, y: number) {
  const offset = window.frameElement?.getBoundingClientRect();
  const scale = offset === undefined ? 1 : offset.width / window.innerWidth;

  return { x: (offset?.left ?? 0) + x * scale, y: (offset?.top ?? 0) + y * scale };
}

async function mouse(
  type: 'mousePressed' | 'mouseMoved' | 'mouseReleased' | 'mouseWheel',
  x: number,
  y: number,
  extra: Record<string, unknown> = {},
) {
  await cdp().send('Input.dispatchMouseEvent', {
    type,
    ...onPage(x, y),
    button: type === 'mouseWheel' ? 'none' : 'left',
    buttons: type === 'mousePressed' || type === 'mouseMoved' ? 1 : 0,
    clickCount: 1,
    ...extra,
  });
}

async function open(value: string, onOpenChange = vi.fn()) {
  render(
    <MediaViewer defaultOpen defaultValue={value} items={ITEMS} onOpenChange={onOpenChange} />,
  );
  await settle();
  await vi.waitFor(() => expect(part('stage')?.closest('[data-loading]')).toBeNull());
  await settle();

  return onOpenChange;
}

describe('the viewer of a 2000 × 1000 picture in a 1440 × 900 window', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('draws the picture whole at the stage width, centerd, on a layer the size of the window', async () => {
    await page.viewport(1440, 900);
    await open('wide');
    const stage = part('stage')!.getBoundingClientRect();
    const media = part('media')!.getBoundingClientRect();

    expect(Math.round(media.width)).toBe(Math.round(stage.width));
    expect(media.height).toBeCloseTo(media.width / 2, 0);
    expect(media.top - stage.top).toBeCloseTo(stage.bottom - media.bottom, 0);
    expect(layer().getBoundingClientRect()).toMatchObject({ width: 1440, height: 900 });
  });

  it('zooms to 175% over twelve wheel events of -25, keeping the point under the pointer still', async () => {
    await page.viewport(1440, 900);
    await open('wide');
    const before = part('media')!.getBoundingClientRect();
    const point = { x: before.left + before.width * 0.3, y: before.top + before.height * 0.4 };

    for (let index = 0; index < 12; index++) {
      await mouse('mouseWheel', point.x, point.y, { deltaX: 0, deltaY: -25 });
    }
    await settle();

    const after = part('frame')!.getBoundingClientRect();
    expect(part('zoom-level')?.textContent).toBe('175%');
    expect(layer().getBoundingClientRect()).toMatchObject({ width: 1440, height: 900 });
    expect(Math.abs(after.left + after.width * 0.3 - point.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(after.top + after.height * 0.4 - point.y)).toBeLessThanOrEqual(2);
  });

  it('pans a zoomed picture under a mouse drag and stays open', async () => {
    await page.viewport(1440, 900);
    const onOpenChange = await open('wide');
    part('zoom-in')!.click();
    part('zoom-in')!.click();
    await settle();
    const stage = part('stage')!;
    const scroll = { left: stage.scrollLeft, top: stage.scrollTop };
    const center = stage.getBoundingClientRect();
    const x = center.left + center.width / 2;
    const y = center.top + center.height / 2;

    await mouse('mousePressed', x, y);
    await mouse('mouseMoved', x - 120, y - 80);
    await mouse('mouseReleased', x - 120, y - 80);
    await settle();

    expect(stage.scrollLeft).not.toBe(scroll.left);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(part('stage')).not.toBeNull();
  });

  it('closes on a click on the ground beside the fitted picture', async () => {
    await page.viewport(1440, 900);
    const onOpenChange = await open('wide');
    const stage = part('stage')!.getBoundingClientRect();
    const media = part('media')!.getBoundingClientRect();

    await mouse('mousePressed', stage.left + stage.width / 2, (stage.top + media.top) / 2);
    await mouse('mouseReleased', stage.left + stage.width / 2, (stage.top + media.top) / 2);
    await settle();

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'outsidePress' }),
    );
  });

  it('never enlarges a 300 × 200 picture', async () => {
    await page.viewport(1440, 900);
    await open('small');
    const media = part('media')!.getBoundingClientRect();

    expect(media.width).toBe(300);
    expect(media.height).toBe(200);
  });

  it('shows a PDF in a frame, with no zoom of its own', async () => {
    await page.viewport(1440, 900);
    render(<MediaViewer defaultOpen defaultValue="contract" items={ITEMS} />);
    await settle();

    expect(part('media')?.tagName).toBe('IFRAME');
    expect(part('zoom')).toBeNull();
  });
});

describe('the viewer under a finger at 390 pixels', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('steps to the next file on a swipe left', async () => {
    await page.viewport(390, 844);
    await open('wide');
    const stage = part('stage')!.getBoundingClientRect();
    const y = stage.top + stage.height / 2;
    const at = (x: number) => [onPage(x, y)];
    const session = cdp();

    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(300) });
    for (const x of [260, 200, 140, 90]) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(x) });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settle();

    expect(screen.getByRole('heading').getAttribute('title')).toBe('small.png');
  });
});

/**
 * The two actions of a failure stand side by side: an `a` is content-box and a
 * `button` border-box with a pixel of user-agent padding, and the download
 * stood two pixels taller than the retry.
 */
describe('the actions of a file that did not load', () => {
  it('stand at one height', async () => {
    render(
      <MediaViewer
        defaultOpen
        items={[
          {
            id: 'broken',
            name: 'wheel-arch.jpg',
            type: 'image/jpeg',
            src: 'data:image/jpeg;base64,AAAA',
            downloadHref: '#wheel-arch.jpg',
          },
        ]}
      />,
    );
    await vi.waitFor(() => expect(part('retry')).not.toBeNull());
    const download = document.querySelector<HTMLElement>(
      '[data-ui="media-viewer"] [data-part="status"] [data-part="download"]',
    )!;

    expect(download.getBoundingClientRect().height).toBe(
      part('retry')!.getBoundingClientRect().height,
    );
  });
});
