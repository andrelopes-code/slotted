import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Avatar } from './avatar';

/** One transparent pixel: a logo whose ground is the page's. */
const LOGO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const DARK = { colorScheme: 'dark', '--slotted-tone-accent-surface': '#1e293b' } as CSSProperties;

const loaded = async () => {
  const root = document.querySelector('[data-ui="avatar"]') as HTMLElement;
  await expect.poll(() => root.getAttribute('data-status')).toBe('loaded');
  return root;
};

/**
 * A logo with transparency, designed for a white ground, vanished on the dark
 * tint the tone kept painting behind a loaded picture.
 */
describe('the ground behind a loaded avatar', () => {
  it('is the picture alone once it has loaded', async () => {
    render(
      <div style={DARK}>
        <Avatar name="Bank" src={LOGO} tone="accent" />
      </div>,
    );
    const root = await loaded();

    expect(getComputedStyle(root).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('is a light plate in a dark scheme when asked for one', async () => {
    render(
      <div style={DARK}>
        <Avatar name="Bank" src={LOGO} surface="plate" tone="accent" />
      </div>,
    );
    const root = await loaded();

    expect(getComputedStyle(root).backgroundColor).toBe('rgb(255, 255, 255)');
  });
});
