import { tabsClassName, useTabs } from './tabs-context';
import type { TabProps } from './tabs.types';

export function Tab({
  className,
  disabled = false,
  onClick,
  onKeyDown,
  value,
  ...nativeProps
}: TabProps) {
  const { activation, panelId, select, tabId, value: selected } = useTabs();
  const isSelected = selected === value;

  return (
    <button
      {...nativeProps}
      aria-controls={panelId(value)}
      aria-selected={isSelected}
      className={tabsClassName('slotted-tabs__tab', className)}
      data-disabled={disabled ? '' : undefined}
      data-part="tab"
      data-selected={isSelected ? '' : undefined}
      data-value={value}
      disabled={disabled}
      id={tabId(value)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) select(value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || activation !== 'manual') return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(value);
        }
      }}
      role="tab"
      type="button"
    />
  );
}
