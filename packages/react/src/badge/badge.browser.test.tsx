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
