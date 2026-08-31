import '@slotted/styles/tabs/tabs.css';

import { useCallback, useId, useMemo, useState } from 'react';

import { TabsContext, tabsClassName } from './tabs-context';
import type { TabsContextValue, TabsProps } from './tabs.types';

export function Tabs({
  activation = 'automatic',
  children,
  className,
  defaultValue,
  id,
  onValueChange,
  orientation = 'horizontal',
  value,
  ...nativeProps
}: TabsProps) {
  const generatedId = useId();
  const base = id ?? `slotted-tabs-${generatedId}`;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = value ?? uncontrolled;

  const select = useCallback(
    (next: string) => {
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [onValueChange, value],
  );

  const context = useMemo<TabsContextValue>(
    () => ({
      activation,
      orientation,
      panelId: (item) => `${base}-panel-${item}`,
      select,
      tabId: (item) => `${base}-tab-${item}`,
      value: selected,
    }),
    [activation, base, orientation, select, selected],
  );

  return (
    <TabsContext.Provider value={context}>
      <div
        {...nativeProps}
        className={tabsClassName('slotted-tabs', className)}
        data-orientation={orientation}
        data-part="root"
        data-slotted-component="tabs"
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}
