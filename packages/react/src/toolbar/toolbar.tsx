import '@slotted/styles/toolbar/toolbar.css';

import { createRovingTabindex } from '@slotted/core/focus';
import { useEffect, useRef } from 'react';

import { TOOLBAR_ITEM_SELECTOR } from './toolbar.constants';
import type { ToolbarProps } from './toolbar.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/**
 * One tab stop for a group of controls, which is the whole point of the
 * pattern: a formatting toolbar of twelve buttons should cost a keyboard user
 * one Tab, not twelve.
 */
export function Toolbar({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  orientation = 'horizontal',
  ...nativeProps
}: ToolbarProps) {
  const root = useRef<HTMLDivElement>(null);
  const latestOrientation = useRef(orientation);
  latestOrientation.current = orientation;

  if (isDevelopment && !ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
    console.warn(
      'Toolbar has no accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it.',
    );
  }

  useEffect(() => {
    const element = root.current;
    if (element === null) return;

    const roving = createRovingTabindex(element, {
      itemSelector: TOOLBAR_ITEM_SELECTOR,
      orientation: () => latestOrientation.current,
    });

    /**
     * The controls are the consumer's, so they come and go without this
     * component rendering. A control added after mount would otherwise keep
     * its own tab stop and break the single one the pattern promises.
     */
    const observer = new MutationObserver(() => roving.refresh());
    observer.observe(element, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      roving.destroy();
    };
  }, []);

  return (
    <div
      {...nativeProps}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      className={['slotted-toolbar', className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      data-part="root"
      data-slotted-component="toolbar"
      ref={root}
      role="toolbar"
    />
  );
}
