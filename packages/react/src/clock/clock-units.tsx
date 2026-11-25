import { clockColumns, clockRows } from '@slotted/core/date';
import type { ClockCell } from '@slotted/core/date';
import type { MouseEvent } from 'react';

import { ClockOption } from './clock-option';
import { useClockGrid } from './use-clock-grid';

interface ClockUnitsProps {
  readonly cells: readonly ClockCell[];
  readonly disabled: boolean;
  readonly label: string;
  readonly onPick: (value: number, event: MouseEvent<HTMLButtonElement>) => void;
  readonly unit: 'minute' | 'second';
}

/** The minutes of an hour or the seconds of a minute, as many across as the step asks for. */
export function ClockUnits({ cells, disabled, label, onPick, unit }: ClockUnitsProps) {
  const columns = clockColumns(cells.length);
  const grid = useClockGrid({ cells, disabled, rows: clockRows([cells.length], columns) });
  const part = `${unit}s`;

  return (
    <div {...{ [`data-part-${part}`]: '' }} data-columns={columns} data-part={part}>
      <span aria-hidden="true" data-part="period" data-part-period="">
        {label}
      </span>
      <div
        {...grid.listProps}
        aria-label={label}
        data-part="cells"
        data-part-cells=""
        role="listbox"
      >
        {cells.map((cell, index) => (
          <ClockOption
            {...grid.itemProps(index)}
            cell={cell}
            disabled={disabled}
            key={cell.value}
            onPick={onPick}
            unit={unit}
          >
            {cell.label}
          </ClockOption>
        ))}
      </div>
    </div>
  );
}
