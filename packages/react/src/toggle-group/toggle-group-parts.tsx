import { keyedProps } from '@slotted/core/selector-key';
import type { MouseEvent } from 'react';

import { useToggleGroup } from './toggle-group';
import type {
  ToggleGroupItemProps,
  ToggleGroupItemRootProps,
  ToggleGroupSelectionReason,
} from './toggle-group.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is the rule every activating family in this library
 * writes, and it is why `Space`, `Enter` and a pointer are told apart without
 * a key listener existing anywhere in the family.
 */
function activationReason(event: MouseEvent<HTMLElement>): ToggleGroupSelectionReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One two-state button of the set.
 *
 * `aria-pressed` is written in both states, so the item is announced as a
 * toggle rather than as a button that happens to be pressed — and its label
 * never changes with its state, which the APG Button pattern calls critical.
 *
 * An item with no children is a square holding one mark, and it takes its
 * accessible name from the `aria-label` the consumer writes on it.
 */
export function ToggleGroupItem({
  children,
  className,
  disabled,
  icon,
  onClick,
  ref,
  render,
  style,
  type,
  value,
  ...nativeProps
}: ToggleGroupItemProps) {
  const group = useToggleGroup();
  const pressed = group.holds(value);
  const resolvedDisabled = disabled ?? group.disabled;

  const rootProps: ToggleGroupItemRootProps = keyedProps({
    ...nativeProps,
    'aria-pressed': pressed,
    children: (
      <>
        {icon === undefined ? null : (
          <span aria-hidden="true" data-part="icon" data-part-icon="">
            {icon}
          </span>
        )}
        {children === undefined ? null : (
          <span data-part="label" data-part-label="">
            {children}
          </span>
        )}
      </>
    ),
    className,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    'data-part': 'item',
    ...(pressed ? { 'data-pressed': '' } : {}),
    onClick: (event: MouseEvent<HTMLElement>) => {
      onClick?.(event as MouseEvent<HTMLButtonElement>);
      if (event.defaultPrevented) return;
      group.toggle(value, activationReason(event), event);
    },
    style,
  });

  return render === undefined ? (
    <button {...rootProps} disabled={resolvedDisabled} ref={ref} type={type ?? 'button'} />
  ) : (
    render(rootProps)
  );
}
