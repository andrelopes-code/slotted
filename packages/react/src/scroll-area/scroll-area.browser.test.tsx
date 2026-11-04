import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ScrollArea } from './index';

/* The root is a grid with an implicit `auto` row, which sizes to its content and ignores a
   `max-block-size`: the root stopped at the bound and the viewport overflowed it unscrolled. */
describe('a scroll area bounded by maxBlockSize', () => {
  it('scrolls its viewport inside the bound', () => {
    render(
      <ScrollArea maxBlockSize="10rem" messages={{ label: 'Stock movements' }}>
        <ScrollArea.Content>
          <div style={{ blockSize: '40rem' }}>Movements</div>
        </ScrollArea.Content>
      </ScrollArea>,
    );
    const root = document.querySelector('[data-ui="scroll-area"]') as HTMLElement;
    const viewport = root.querySelector('[data-part="viewport"]') as HTMLElement;

    expect(viewport.getBoundingClientRect().height).toBeCloseTo(
      root.getBoundingClientRect().height,
      0,
    );
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
  });
});
