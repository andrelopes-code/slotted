import { useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { useSplitter } from './splitter-context';
import type { SplitterHandleProps } from './splitter.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

function readsRightToLeft(element: HTMLElement) {
  return getComputedStyle(element).direction === 'rtl';
}

/**
 * The separator, and the only focusable part of the family. Its
 * aria-orientation is perpendicular to the root's: a vertical line separates
 * two side-by-side panes. `horizontal` is the attribute's default value, so it
 * is written only in the case that departs from it.
 */
export function SplitterHandle({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...nativeProps
}: SplitterHandleProps) {
  const splitter = useSplitter();
  const [dragging, setDragging] = useState(false);

  if (isDevelopment && !ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
    console.warn(
      'SplitterHandle has no accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it.',
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (splitter === undefined || event.defaultPrevented) return;

    const root = splitter.rootRef.current;
    const horizontal = splitter.orientation === 'horizontal';
    const reversed = horizontal && root !== null && readsRightToLeft(root);
    const towardsStart = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const towardsEnd = horizontal ? 'ArrowRight' : 'ArrowDown';

    if (event.key === towardsStart) {
      splitter.setValue(splitter.value + (reversed ? splitter.step : -splitter.step));
    } else if (event.key === towardsEnd) {
      splitter.setValue(splitter.value + (reversed ? -splitter.step : splitter.step));
    } else if (event.key === 'Home') {
      splitter.setValue(splitter.min);
    } else if (event.key === 'End') {
      splitter.setValue(splitter.max);
    } else if (event.key === 'Enter') {
      splitter.toggleCollapse();
    } else {
      return;
    }

    event.preventDefault();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (splitter === undefined || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const root = splitter?.rootRef.current;
    if (splitter === undefined || !dragging || root === null || root === undefined) return;

    const rect = root.getBoundingClientRect();
    const horizontal = splitter.orientation === 'horizontal';
    const span = horizontal ? rect.width : rect.height;
    if (span === 0) return;

    const offset = horizontal ? event.clientX - rect.left : event.clientY - rect.top;
    const fraction = horizontal && readsRightToLeft(root) ? 1 - offset / span : offset / span;
    splitter.setValue(fraction * 100);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  return (
    <div
      {...nativeProps}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-orientation={splitter?.orientation === 'horizontal' ? 'vertical' : undefined}
      aria-valuemax={splitter?.max}
      aria-valuemin={splitter?.min}
      aria-valuenow={splitter?.value}
      data-part="handle"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="separator"
      tabIndex={0}
    />
  );
}
