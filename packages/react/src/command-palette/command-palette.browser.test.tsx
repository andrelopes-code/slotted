import { cleanup, render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { cdp, page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';

import { press } from '../test/press';
import { CommandPalette } from './command-palette';
import type { CommandPaletteItem } from './command-palette.types';

const ITEMS: CommandPaletteItem[] = [
  { id: 'inbox', label: 'Inbox', group: 'nav' },
  { id: 'projects', label: 'Projects', group: 'nav' },
  { id: 'deploy', label: 'Deploy to production', group: 'actions' },
];
const GROUPS = [
  { id: 'nav', label: 'Go to' },
  { id: 'actions', label: 'Actions' },
];

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Focus stays in the input while the palette is open: a press on a group
 * label or on the list's own space, with a mouse or a finger, leaves it there.
 * The press's default action used to blur the input, and focus rested on the
 * body, outside the modal dialog; on a phone the keyboard closed.
 */
describe('a press inside the open palette', () => {
  it.each(['mouse', 'touch'] as const)('keeps focus in the input, with a %s', async (pointer) => {
    render(<CommandPalette defaultOpen groups={GROUPS} items={ITEMS} />);
    const input = screen.getByRole('combobox');
    input.focus();
    await frame();
    expect(document.activeElement).toBe(input);

    const label = document.querySelector('[data-part="group-label"]') as HTMLElement;
    await press(label, pointer);
    expect(document.activeElement).toBe(input);

    /* The list's own space: a point inside it that no row covers. */
    const list = document.querySelector('[data-part="list"]') as HTMLElement;
    const rect = list.getBoundingClientRect();
    const point = { x: rect.left + rect.width / 2, y: rect.bottom - 2 };
    expect(document.elementFromPoint(point.x, point.y)).toBe(list);
    await press(list, pointer, point);
    expect(document.activeElement).toBe(input);
  });
});

/**
 * A theme draws the palette as a material through the family's filter token;
 * unset, the panel filters nothing, and a reader who asked for less
 * transparency gets no filter whatever the theme set.
 */
describe('the backdrop filter', () => {
  afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  });

  function filter(token?: string) {
    render(
      <div
        style={
          token === undefined
            ? {}
            : { ['--slotted-command-palette-backdrop-filter' as string]: token }
        }
      >
        <CommandPalette groups={GROUPS} items={ITEMS} presentation="inline" />
      </div>,
    );
    const root = document.querySelector('[data-ui="command-palette"]') as HTMLElement;
    return getComputedStyle(root).backdropFilter;
  }

  it('is the theme’s token', () => {
    expect(filter('blur(9px)')).toBe('blur(9px)');
  });

  it('is none by default', () => {
    expect(filter()).toBe('none');
  });

  it('is none under reduced transparency', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    expect(filter('blur(9px)')).toBe('none');
  });
});

/**
 * A group label paints no surface at rest, so a translucent panel does not
 * draw a second layer under it, and fills only while rows pass under it.
 */
describe('a group label on a translucent panel', () => {
  const many: CommandPaletteItem[] = Array.from({ length: 40 }, (_, index) => ({
    id: `item-${index}`,
    label: `Item ${index}`,
    group: index < 30 ? 'nav' : 'actions',
  }));

  function open() {
    render(
      <div
        style={
          {
            '--slotted-command-palette-surface': 'rgba(255, 255, 255, 0.5)',
            '--slotted-command-palette-group-label-stuck-surface': 'rgb(1, 2, 3)',
          } as CSSProperties
        }
      >
        <CommandPalette groups={GROUPS} items={many} presentation="inline" />
      </div>,
    );

    return document.querySelector('[data-part="group-label"]') as HTMLElement;
  }

  it('is transparent while not stuck', async () => {
    const label = open();
    await frame();

    expect(label.hasAttribute('data-stuck')).toBe(false);
    expect(getComputedStyle(label).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('carries data-stuck and the stuck surface once rows pass under it', async () => {
    const label = open();
    const list = document.querySelector('[data-part="list"]') as HTMLElement;

    list.style.maxBlockSize = '200px';
    list.scrollTop = 200;
    for (let tries = 0; tries < 30 && !label.hasAttribute('data-stuck'); tries += 1) await frame();

    expect(label.hasAttribute('data-stuck')).toBe(true);
    expect(getComputedStyle(label).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});

/* Under a material panel no stuck fill is right: the fallback is as translucent as the panel, and the
   rows were read through the label. */
describe('a stuck group label on a material panel', () => {
  const long: CommandPaletteItem[] = Array.from({ length: 40 }, (_, index) => ({
    id: `item-${index}`,
    label: `Item ${index} ${'MWMW '.repeat(8)}`,
    group: index < 30 ? 'nav' : 'actions',
  }));

  afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  });

  async function stuck(tokens: Record<string, string>) {
    render(
      <div style={{ background: 'linear-gradient(90deg, #c33, #36c)', ...tokens } as CSSProperties}>
        <CommandPalette groups={GROUPS} items={long} presentation="inline" />
      </div>,
    );
    const list = document.querySelector('[data-part="list"]') as HTMLElement;
    const label = document.querySelector('[data-part="group-label"]') as HTMLElement;

    list.style.maxBlockSize = '200px';
    list.scrollTop = 200;
    for (let tries = 0; tries < 30 && !label.hasAttribute('data-stuck'); tries += 1) await frame();

    return label;
  }

  const MATERIAL = {
    '--slotted-command-palette-backdrop-filter': 'blur(20px)',
    '--slotted-command-palette-surface': 'rgba(255, 255, 255, 0.68)',
    '--slotted-text': '#111111',
  };

  it('paints nothing over the panel but what the theme states for it', async () => {
    const plain = getComputedStyle(await stuck(MATERIAL));
    expect(plain.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(plain.backdropFilter).toBe('none');
    cleanup();

    const own = getComputedStyle(
      await stuck({
        ...MATERIAL,
        '--slotted-command-palette-group-label-stuck-backdrop-filter': 'blur(8px)',
      }),
    );
    expect(own.backdropFilter).toBe('blur(8px)');
  });

  it('filters nothing under reduced transparency', async () => {
    const label = await stuck({
      ...MATERIAL,
      '--slotted-command-palette-group-label-stuck-backdrop-filter': 'blur(8px)',
    });
    expect(getComputedStyle(label).backdropFilter).toBe('blur(8px)');

    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    expect(getComputedStyle(label).backdropFilter).toBe('none');
  });

  it('leaves no row to read through it', async () => {
    const label = await stuck(MATERIAL);
    const rows = document.querySelector('[data-part="list"]')!;

    const beneath = await roughness(label, rows);

    expect(beneath.row).toBeGreaterThan(60);
    expect(beneath.label).toBeLessThan(12);
  });
});

/** The largest step of luminance between neighbouring pixels, in the label's band and in a row under it. */
async function roughness(label: Element, rows: Element) {
  const base64 = await page.screenshot({ element: document.documentElement, save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const scale = image.width / document.documentElement.clientWidth;
  const band = label.getBoundingClientRect();
  const left = band.left + band.width / 2;

  const step = (top: number, height: number) => {
    const { data, width } = context.getImageData(
      Math.round(left * scale),
      Math.round(top * scale),
      Math.round((band.width / 3) * scale),
      Math.round(height * scale),
    );
    let largest = 0;
    for (let at = 4; at < data.length; at += 4) {
      if ((at / 4) % width === 0) continue;
      const luminance = (index: number) =>
        0.2126 * data[index]! + 0.7152 * data[index + 1]! + 0.0722 * data[index + 2]!;
      largest = Math.max(largest, Math.abs(luminance(at) - luminance(at - 4)));
    }

    return largest;
  };

  const inner = rows.getBoundingClientRect();
  return {
    label: step(band.top + 1, band.height - 2),
    row: step(band.bottom + 4, inner.bottom - band.bottom - 8),
  };
}
