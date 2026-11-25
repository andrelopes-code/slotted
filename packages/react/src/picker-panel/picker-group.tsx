import { useId } from 'react';
import type { MouseEvent } from 'react';

/** One step or one length of a group. */
export interface PickerChipView {
  readonly disabled: boolean;
  readonly label: string;
  readonly onPress: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly selected?: boolean | undefined;
}

interface PickerGroupProps {
  readonly chips: readonly PickerChipView[];
  /** `rail` is a group of the column; `offsets` is a row under a clock. */
  readonly part?: 'group' | 'offsets';
  readonly label: string;
}

/** A named set of steps: from now, or the length of a run. */
export function PickerGroup({ chips, label, part = 'group' }: PickerGroupProps) {
  const id = useId();

  return (
    <div {...{ [`data-part-${part}`]: '' }} aria-labelledby={id} data-part={part} role="group">
      <span data-part="group-label" data-part-group-label="" id={id}>
        {label}
      </span>

      <div data-part="chips" data-part-chips="">
        {chips.map((chip) => (
          <button
            aria-pressed={chip.selected}
            data-part="chip"
            data-part-chip=""
            disabled={chip.disabled}
            key={chip.label}
            onClick={chip.onPress}
            type="button"
            {...(chip.selected === true ? { 'data-selected': '' } : {})}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
