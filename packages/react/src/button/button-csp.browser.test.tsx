import { render } from '@testing-library/react';
import { cdp, page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from './button';

/**
 * Under a policy that allows images from the page's own origin alone, the
 * ring was absent: it was drawn through two `data:` images used as masks, and
 * the policy refused both. The policy stays on this file's document.
 */
describe('a loading button under img-src self', () => {
  afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  });

  it('paints its ring', async () => {
    const policy = document.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = "img-src 'self'";
    document.head.append(policy);
    /* With motion allowed, a text button shows a sweep and hides its ring. */
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });

    render(
      <div style={{ background: '#ffffff', color: '#000000', padding: 16 }}>
        <Button loading style={{ background: '#ffffff', color: '#ffffff' }}>
          Save
        </Button>
      </div>,
    );
    const ring = document.querySelector('[data-ui="spinner"]') as HTMLElement;
    /* The label is white on white; only the ring is drawn in ink. */
    ring.style.setProperty('--slotted-spinner-size', '32px');
    ring.style.color = '#000000';
    await new Promise((resolve) => setTimeout(resolve, 300));

    const base64 = await page.screenshot({ element: ring, base64: true, save: false });
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    /* The track is the ink at a fifth of its strength: a grey of about 204 on white. */
    const inked = (x: number, y: number) =>
      data[(Math.round(y) * bitmap.width + Math.round(x)) * 4]! < 230;
    /* A ring: ink on its stroke, none in its middle. */
    const middle = bitmap.width / 2;
    /* The stroke's centre line: a ring of 8.875 units in a box of 24. */
    const stroke = bitmap.width * (3.125 / 24);
    expect(inked(middle, middle)).toBe(false);
    expect(
      [
        [middle, stroke],
        [middle, bitmap.height - stroke],
        [stroke, middle],
        [bitmap.width - stroke, middle],
      ].every(([x, y]) => inked(x!, y!)),
    ).toBe(true);
  });
});
