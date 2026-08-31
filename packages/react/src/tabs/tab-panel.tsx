import { tabsClassName, useTabs } from './tabs-context';
import type { TabPanelProps } from './tabs.types';

export function TabPanel({ className, value, ...nativeProps }: TabPanelProps) {
  const { panelId, tabId, value: selected } = useTabs();
  const isSelected = selected === value;

  return (
    <div
      {...nativeProps}
      aria-labelledby={tabId(value)}
      className={tabsClassName('slotted-tabs__panel', className)}
      data-part="panel"
      hidden={!isSelected}
      id={panelId(value)}
      role="tabpanel"
      tabIndex={isSelected ? 0 : undefined}
    />
  );
}
