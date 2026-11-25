import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge, BadgeAnchor } from './index';

const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();

/**
 * The corner is the host's. A flex column stretches its items, and a frame
 * stretched past its host carries the badge to the corner of the column.
 */
describe('an anchored badge in a layout that stretches its items', () => {
  it.each(['column', 'row'] as const)('stays on the corner of its host in a %s', (direction) => {
    render(
      <div style={{ display: 'flex', flexDirection: direction, blockSize: 200, inlineSize: 300 }}>
        <BadgeAnchor placement="bottom-end">
          <span data-host="" style={{ blockSize: 40, inlineSize: 40 }} />
          <Badge count={3} />
        </BadgeAnchor>
      </div>,
    );

    const host = box('[data-host]');
    const badge = box('[data-ui="badge"][data-part="root"]');

    expect(badge.left + badge.width / 2).toBeCloseTo(host.right, 0);
    expect(badge.top + badge.height / 2).toBeCloseTo(host.bottom, 0);
  });
});

/** A badge taller than the line of a title pushed what is under it away. */
describe('an inline badge beside a title', () => {
  it.each(
    (['0.75rem', '1rem', '1.5rem'] as const).flatMap((fontSize) =>
      (['sm', 'md', 'lg'] as const).flatMap((size) =>
        (['pill', 'square', 'dot'] as const).map((shape) => ({ fontSize, shape, size })),
      ),
    ),
  )('keeps the line of a $fontSize title at $size, $shape', ({ fontSize, shape, size }) => {
    const { container } = render(
      <div style={{ fontSize, lineHeight: 1.4 }}>
        <div>
          Title{' '}
          <Badge inline shape={shape} size={size}>
            New
          </Badge>
        </div>
        <div>Title</div>
        <div style={{ alignItems: 'center', display: 'flex' }}>
          Title
          <Badge inline shape={shape} size={size}>
            New
          </Badge>
        </div>
      </div>,
    );
    const [line, plain, row] = [...container.firstElementChild!.children].map((element) =>
      element.getBoundingClientRect(),
    ) as [DOMRect, DOMRect, DOMRect];
    const [badge, inRow] = [...container.querySelectorAll('[data-ui="badge"]')].map((element) =>
      element.getBoundingClientRect(),
    ) as [DOMRect, DOMRect];

    expect(Math.abs(line.height - plain.height)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(row.height - plain.height)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(badge.top + badge.height / 2 - (line.top + line.height / 2))).toBeLessThan(1);
    expect(inRow.height).toBeLessThanOrEqual(plain.height + 0.5);
  });
});
