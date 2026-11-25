import { clockRows } from '@slotted/core/date';
import type { ClockGroup } from '@slotted/core/date';
import { Fragment } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { ClockOption } from './clock-option';
import type { ClockSlotState } from './clock.types';
import { useClockGrid } from './use-clock-grid';

interface ClockGroupsProps {
  readonly disabled: boolean;
  readonly groups: readonly ClockGroup[];
  readonly label: string;
  readonly onPick: (value: number, event: MouseEvent<HTMLButtonElement>) => void;
  readonly renderSlot?: ((state: ClockSlotState) => ReactNode) | undefined;
  readonly unit: 'hour' | 'slot';
}

const COLUMNS = { hour: 6, slot: 3 } as const;

/** The hours, or a stated list of whole times: one listbox, a part of the day to a group. */
export function ClockGroups({
  disabled,
  groups,
  label,
  onPick,
  renderSlot,
  unit,
}: ClockGroupsProps) {
  const cells = groups.flatMap((group) => group.cells);
  const counts = groups.map((group) => group.cells.length);
  const grid = useClockGrid({ cells, disabled, rows: clockRows(counts, COLUMNS[unit]) });
  const part = `${unit}s`;

  return (
    <div
      {...grid.listProps}
      {...{ [`data-part-${part}`]: '' }}
      aria-label={label}
      data-part={part}
      role="listbox"
    >
      {groups.map((group, row) => {
        const before = counts.slice(0, row).reduce((sum, count) => sum + count, 0);
        const options = group.cells.map((cell, index) => (
          <ClockOption
            {...grid.itemProps(before + index)}
            cell={cell}
            disabled={disabled}
            key={cell.value}
            onPick={onPick}
            unit={unit}
          >
            {cell.time !== undefined && renderSlot !== undefined
              ? renderSlot({ ...cell, time: cell.time })
              : cell.label}
          </ClockOption>
        ));
        const Cells = unit === 'slot' ? 'div' : Fragment;

        return (
          <div aria-label={group.name} key={before} role="group">
            <span aria-hidden="true" data-part="period" data-part-period="">
              {group.label}
            </span>
            <Cells {...(unit === 'slot' ? { 'data-part': 'cells', 'data-part-cells': '' } : {})}>
              {options}
            </Cells>
          </div>
        );
      })}
    </div>
  );
}
