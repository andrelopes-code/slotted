import { toISOTime } from '@slotted/core/date';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { PickerTrigger } from '../picker-panel/picker-trigger';
import type { PickerLayer } from '../picker-panel/use-picker-layer';
import type { TimeRange } from './time-range-picker.types';

interface TimeRangeControlProps {
  readonly clearLabel: string;
  readonly editable: boolean;
  readonly endName: string | undefined;
  readonly held: TimeRange | null;
  readonly layer: PickerLayer;
  readonly onClear: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  readonly placeholder: string;
  readonly spoken: string;
  readonly startName: string | undefined;
  readonly summary: string | null;
}

/** The frame: the run in words as the trigger, one clear, and what a form posts. */
export function TimeRangeControl(props: TimeRangeControlProps) {
  const { clearLabel, editable, held, layer, onClear, placeholder, spoken, summary } = props;
  const posted = { start: props.startName, end: props.endName };

  return (
    <div data-part="control" data-part-control="">
      <PickerTrigger disabled={!editable} glyph="clock" label={spoken} layer={layer}>
        <span
          data-part="summary"
          data-part-summary=""
          {...(summary === null ? { 'data-placeholder': '' } : {})}
        >
          {summary ?? placeholder}
        </span>
      </PickerTrigger>

      {onClear !== undefined && (
        <button
          aria-label={clearLabel}
          data-part="clear"
          data-part-clear=""
          disabled={!editable}
          onClick={onClear}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      )}

      {(['start', 'end'] as const).map((position) => {
        const time = held?.[position] ?? null;

        return (
          <input
            data-part="hidden-input"
            data-part-hidden-input=""
            key={position}
            name={posted[position]}
            type="hidden"
            value={time === null ? '' : toISOTime(time)}
          />
        );
      })}
    </div>
  );
}
