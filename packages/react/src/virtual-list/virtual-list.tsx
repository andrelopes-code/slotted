import '@slotted/styles/virtual-list/virtual-list.css';

import { virtualWindow } from '@slotted/core/collection';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { UIEvent } from 'react';

import { VirtualListContext } from './virtual-list-context';
import type { VirtualListContextValue, VirtualListProps } from './virtual-list.types';

/**
 * Renders the rows near the viewport and claims all of them. The root is the
 * scroll container; the canvas inside it carries the block size of the whole
 * list, so the scrollbar describes the list rather than the window.
 *
 * The viewport starts unmeasured, at nought, which is what a server render and
 * the first client render both see. That is what keeps hydration quiet, and
 * `overscan` is what stops that first window being empty.
 */
export function VirtualList({
  children,
  className,
  itemCount,
  itemSize,
  onScroll,
  overscan = 4,
  ...nativeProps
}: VirtualListProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportSize, setViewportSize] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;

    const measure = () => setViewportSize(root.clientHeight);
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const window = virtualWindow({ itemCount, itemSize, overscan, scrollOffset, viewportSize });

  const context = useMemo<VirtualListContextValue>(
    () => ({ itemCount, itemSize }),
    [itemCount, itemSize],
  );

  /**
   * Both numbers come from the same element and the same layout, so they are
   * read together. The observer above answers a resize that arrives without a
   * scroll; this answers the far more common case, and answers it in
   * environments that have no observer to install.
   */
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    onScroll?.(event);
    setScrollOffset(event.currentTarget.scrollTop);
    setViewportSize(event.currentTarget.clientHeight);
  };

  return (
    <VirtualListContext.Provider value={context}>
      <div
        {...nativeProps}
        className={['slotted-virtual-list', className].filter(Boolean).join(' ')}
        data-part="root"
        data-slotted-component="virtual-list"
        onScroll={handleScroll}
        ref={rootRef}
        role="list"
        tabIndex={0}
      >
        <div data-part="canvas" role="none" style={{ blockSize: window.totalSize }}>
          {Array.from({ length: window.endIndex - window.startIndex }, (_, offset) => {
            const index = window.startIndex + offset;
            return <Fragment key={index}>{children(index)}</Fragment>;
          })}
        </div>
      </div>
    </VirtualListContext.Provider>
  );
}
