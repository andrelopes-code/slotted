import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Kbd } from './kbd';

/**
 * A theme that re-tints the tone tokens inside a region keeps key caps opaque
 * through the family's own surface token.
 */
describe('the surface of a key cap', () => {
  const cap = () => document.querySelector('[data-ui="kbd"]') as HTMLElement;

  it('reads --slotted-kbd-surface ahead of the tone token in the soft variant', () => {
    render(
      <div style={{ '--slotted-tone-secondary-surface': 'rgb(1 2 3 / 0.2)' } as never}>
        <div style={{ '--slotted-kbd-surface': 'rgb(250, 240, 230)' } as never}>
          <Kbd variant="soft">K</Kbd>
        </div>
      </div>,
    );
    expect(getComputedStyle(cap()).backgroundColor).toBe('rgb(250, 240, 230)');
  });

  it('keeps the tone token when the family token is absent', () => {
    render(
      <div style={{ '--slotted-tone-secondary-surface': 'rgb(1, 2, 3)' } as never}>
        <Kbd variant="soft">K</Kbd>
      </div>,
    );
    expect(getComputedStyle(cap()).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('reads --slotted-kbd-border-color and --slotted-kbd-color in every variant that draws them', () => {
    render(
      <div
        style={
          {
            '--slotted-kbd-border-color': 'rgb(10, 20, 30)',
            '--slotted-kbd-color': 'rgb(40, 50, 60)',
          } as never
        }
      >
        <Kbd variant="outline">K</Kbd>
      </div>,
    );
    const style = getComputedStyle(cap());
    expect(style.borderTopColor).toBe('rgb(10, 20, 30)');
    expect(style.borderBottomColor).toBe('rgb(10, 20, 30)');
    expect(style.color).toBe('rgb(40, 50, 60)');
  });
});
