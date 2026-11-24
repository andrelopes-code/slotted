import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton, SkeletonRegion } from './index';

/**
 * A box that covers content has that content's own geometry: nothing around it
 * moves when the wait ends, whatever line height the page sets.
 */
describe('a placeholder that covers content', () => {
  it.each(['column', 'row'] as const)('moves nothing in a %s', (direction) => {
    const { container, rerender } = render(<Scene direction={direction} loading />);
    const loading = boxes(container);

    rerender(<Scene direction={direction} loading={false} />);

    expect(boxes(container)).toEqual(loading);
  });
});

interface SceneProps {
  direction: 'column' | 'row';
  loading: boolean;
}

function Scene({ direction, loading }: SceneProps) {
  return (
    <div style={{ fontSize: 16, inlineSize: 400, lineHeight: 1.75 }}>
      <SkeletonRegion loading={loading}>
        <div style={{ alignItems: 'start', display: 'flex', flexDirection: direction, gap: 8 }}>
          <Skeleton shape="circle" size="lg">
            <span data-box="" style={{ blockSize: 48, display: 'block', inlineSize: 48 }} />
          </Skeleton>
          <Skeleton>
            <span data-box="" style={{ fontSize: 12, lineHeight: 1.25 }}>
              Invoice 4821
            </span>
          </Skeleton>
          <Skeleton>
            <span data-box="" style={{ fontSize: 14, lineHeight: 1.25 }}>
              Paid in full
            </span>
          </Skeleton>
        </div>
      </SkeletonRegion>
    </div>
  );
}

function boxes(container: HTMLElement) {
  return [...container.querySelectorAll('[data-box]')].map((box) => {
    const { height, left, top, width } = box.getBoundingClientRect();
    return [left, top, width, height].map(Math.round);
  });
}
