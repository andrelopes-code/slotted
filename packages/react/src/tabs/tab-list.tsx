import { createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { useEffect, useRef } from 'react';

import { tabsClassName, useTabs } from './tabs-context';
import type { TabListProps } from './tabs.types';

export function TabList({ children, className, ...nativeProps }: TabListProps) {
  const { activation, orientation, select, value } = useTabs();
  const listRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RovingTabindexHandle>(null);

  // Read through refs so the roving handle is created once: recreating it on
  // every orientation or selection change would drop the tab stop mid-keystroke.
  const orientationRef = useRef(orientation);
  const behaviourRef = useRef({ activation, select });
  orientationRef.current = orientation;
  behaviourRef.current = { activation, select };

  useEffect(() => {
    const list = listRef.current;
    if (list === null) return;

    const handle = createRovingTabindex(list, {
      itemSelector: '[role="tab"]',
      onMove: (_index, item) => {
        const { activation: mode, select: choose } = behaviourRef.current;
        const next = item.dataset['value'];
        if (mode === 'automatic' && next !== undefined) choose(next);
      },
      orientation: () => orientationRef.current,
    });

    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    const handle = handleRef.current;
    if (list === null || handle === null) return;

    handle.refresh();
    const items = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
    const index = items.findIndex((item) => item.dataset['value'] === value);
    if (index !== -1) handle.setActive(index);
  }, [value]);

  return (
    <div
      {...nativeProps}
      aria-orientation={orientation}
      className={tabsClassName('slotted-tabs__list', className)}
      data-part="list"
      ref={listRef}
      role="tablist"
    >
      {children}
    </div>
  );
}
