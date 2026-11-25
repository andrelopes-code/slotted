import type { PlainDateTime } from '@slotted/core/date';
import type { MouseEvent } from 'react';

import { DateTimeField } from '../datetime-field';
import type { DateTimeFieldProps } from '../datetime-field';
import { PickerHalfButton } from '../picker-panel/picker-range-head';

interface DateTimeRangeHalfProps {
  readonly current: boolean;
  readonly field: Partial<DateTimeFieldProps>;
  readonly label: string;
  readonly moment: PlainDateTime | null;
  readonly onPart: (part: 'day' | 'time', event: MouseEvent<HTMLButtonElement>) => void;
  readonly onType: (next: PlainDateTime | null, source: unknown) => void;
  readonly typed: boolean;
  readonly words: { readonly day: string; readonly time: string };
}

/** The value of one end: the field it is typed in, or its day and its time as presses. */
export function DateTimeRangeHalf(props: DateTimeRangeHalfProps) {
  const { current, field, label, moment, onPart, onType, typed, words } = props;

  if (typed) {
    return (
      <DateTimeField
        {...field}
        aria-label={label}
        onValueChange={(next, request) => onType(next, request.source)}
        size="sm"
        value={moment}
        variant="plain"
      />
    );
  }

  return (
    <>
      <PickerHalfButton current={current} onClick={(event) => onPart('day', event)} part="day">
        {words.day}
      </PickerHalfButton>

      <PickerHalfButton current={current} onClick={(event) => onPart('time', event)} part="time">
        {words.time}
      </PickerHalfButton>
    </>
  );
}
