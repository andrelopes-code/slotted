import type { ClockCell } from '@slotted/core/date';
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';

import type { ClockUnitName } from './clock.types';

interface ClockOptionProps extends Pick<
  ComponentPropsWithoutRef<'button'>,
  'onFocus' | 'tabIndex'
> {
  readonly cell: ClockCell;
  readonly children: ReactNode;
  readonly disabled: boolean;
  readonly onPick: (value: number, event: MouseEvent<HTMLButtonElement>) => void;
  readonly unit: ClockUnitName;
}

/** One hour, minute, second or whole time. A refused one keeps its focus and takes no press. */
export function ClockOption({
  cell,
  children,
  disabled,
  onPick,
  unit,
  ...roving
}: ClockOptionProps) {
  return (
    <button
      {...roving}
      {...{ [`data-part-${unit}`]: '' }}
      aria-disabled={disabled || cell.unavailable ? true : undefined}
      aria-label={cell.name}
      aria-selected={cell.selected}
      data-part={unit}
      onClick={(event) => {
        if (!cell.unavailable) onPick(cell.value, event);
      }}
      role="option"
      type="button"
      {...(cell.now ? { 'data-now': '' } : {})}
      {...(cell.selected ? { 'data-selected': '' } : {})}
      {...(cell.unavailable ? { 'data-unavailable': '' } : {})}
      {...(disabled ? { 'data-disabled': '' } : {})}
    >
      {children}
    </button>
  );
}
