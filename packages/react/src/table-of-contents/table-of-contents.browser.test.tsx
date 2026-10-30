import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { TableOfContents } from './table-of-contents';

const frames = async (count: number) => {
  for (let frame = 0; frame < count; frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

/**
 * A sticky column pins under the page's chrome a step clear of it, the gap
 * the content beside it keeps, and not flush against it.
 */
describe('the sticky column of a table of contents', () => {
  function pinned(style = '') {
    render(
      <div
        data-testid="scroller"
        style={
          {
            '--slotted-page-sticky-top': '60px',
            blockSize: 500,
            overflow: 'auto',
            position: 'relative',
          } as CSSProperties
        }
      >
        <div
          data-testid="chrome"
          style={{ background: 'Canvas', blockSize: 60, insetBlockStart: 0, position: 'sticky' }}
        />
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ blockSize: 3000, flex: 1 }} />
          <div>
            <style>{style}</style>
            <TableOfContents
              items={[
                { id: 'a', label: 'A' },
                { id: 'b', label: 'B' },
              ]}
              label="On this page"
              sticky
            />
          </div>
        </div>
      </div>,
    );
    const scroller = document.querySelector('[data-testid="scroller"]') as HTMLElement;
    const chrome = document.querySelector('[data-testid="chrome"]') as HTMLElement;
    const toc = document.querySelector('[data-ui="table-of-contents"]') as HTMLElement;
    return { chrome, scroller, toc };
  }

  it('stands the default inset clear of the chrome once the page scrolls', async () => {
    const { chrome, scroller, toc } = pinned();
    scroller.scrollTop = 800;
    await frames(2);
    const inset = Number.parseFloat(getComputedStyle(toc).insetBlockStart) - 60;
    expect(inset).toBeGreaterThan(0);
    expect(toc.getBoundingClientRect().top - chrome.getBoundingClientRect().bottom).toBeCloseTo(
      inset,
      1,
    );
  });

  it('follows --slotted-table-of-contents-sticky-inset', async () => {
    const { chrome, scroller, toc } = pinned(
      '[data-ui-table-of-contents] { --slotted-table-of-contents-sticky-inset: 40px; }',
    );
    scroller.scrollTop = 800;
    await frames(2);
    expect(toc.getBoundingClientRect().top - chrome.getBoundingClientRect().bottom).toBeCloseTo(
      40,
      1,
    );
  });
});
