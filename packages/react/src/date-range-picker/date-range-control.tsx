import { compareDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import type { ChangeReason } from '@slotted/core/state';
import { useRef } from 'react';
import type { FocusEvent, KeyboardEvent, ReactNode, Ref } from 'react';

import type { DateRange } from '../calendar';
import { DateField } from '../date-field';
import type { DateFieldHandle, DateFieldProps } from '../date-field';
import { useField } from '../field';
import { Glyph, Icon } from '../icon';
import type { DateRangePickerPosition } from './date-range-picker.types';

interface DateRangeControlProps {
  readonly clear: { readonly label: string; readonly onPress: (source: unknown) => void } | null;
  readonly editable: boolean;
  readonly field: Partial<DateFieldProps>;
  readonly fieldRefs: Record<DateRangePickerPosition, Ref<DateFieldHandle>>;
  readonly held: DateRange | null;
  readonly id: string;
  readonly labels: { readonly end: string; readonly start: string };
  readonly names: { readonly end?: string | undefined; readonly start?: string | undefined };
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  readonly onPosition: (
    next: DateRangePickerPosition,
    reason: 'keyboard' | 'pointer',
    source: unknown,
  ) => void;
  readonly onValue: (next: DateRange, reason: ChangeReason, source: unknown) => void;
  readonly position: DateRangePickerPosition;
  readonly reversed: boolean;
  readonly trigger: ReactNode;
}

/** Two date fields in one frame, one clear and the trigger. */
export function DateRangeControl(props: DateRangeControlProps) {
  const { clear, field, fieldRefs, held, id, labels, names, onPosition, onValue, position } = props;
  const around = useField();
  const pointerFocus = useRef(false);
  const start = held?.start ?? null;
  const end = held?.end ?? null;

  /** Focus entering one end names it; a pointer press before it names the reason. */
  const handleFocus = (which: DateRangePickerPosition) => (event: FocusEvent<HTMLElement>) => {
    const reason = pointerFocus.current ? 'pointer' : 'keyboard';
    pointerFocus.current = false;
    if (which !== position) onPosition(which, reason, event);
  };

  const bounds = crossedBounds(start, end, field);
  const fieldOf = (which: DateRangePickerPosition) => (
    <div
      {...{ [`data-part-${which}`]: '' }}
      data-part={which}
      onFocus={handleFocus(which)}
      {...(position === which ? { 'data-current': '' } : {})}
    >
      <DateField
        {...field}
        {...bounds[which]}
        aria-label={labels[which]}
        id={`${id}-${which}`}
        invalid={which === 'end' && props.reversed ? true : undefined}
        name={names[which]}
        onValueChange={(next, request) =>
          onValue({ start, end, [which]: next }, request.reason, request.source)
        }
        ref={fieldRefs[which]}
        value={which === 'start' ? start : end}
        variant="plain"
      />
    </div>
  );

  return (
    <div
      data-part="control"
      data-part-control=""
      /* Inside a field, the frame takes the field's control identifier and its
         label, and the two ends inside it keep their own names. */
      {...(around === undefined
        ? {}
        : { 'aria-labelledby': around.ids.label, id: around.ids.control, role: 'group' })}
      onKeyDown={props.onKeyDown}
      onPointerDownCapture={() => {
        pointerFocus.current = true;
      }}
    >
      {fieldOf('start')}
      <span aria-hidden="true" data-part="separator" data-part-separator="">
        –
      </span>
      {fieldOf('end')}

      {clear !== null && (
        <button
          aria-label={clear.label}
          data-part="clear"
          data-part-clear=""
          disabled={!props.editable}
          onClick={clear.onPress}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      )}

      {props.trigger}
    </div>
  );
}

/**
 * Crossed bounds, while the order holds: the start cannot step past the end nor
 * the end before the start. Reversed, each field keeps the outer bounds and the
 * end field alone says the order is wrong.
 */
function crossedBounds(
  start: PlainDate | null,
  end: PlainDate | null,
  { max, min }: Partial<DateFieldProps>,
) {
  const ordered = start !== null && end !== null && compareDate(start, end) <= 0;
  if (!ordered) return { end: { max, min }, start: { max, min } };

  return {
    end: { max, min: min === undefined || compareDate(start, min) > 0 ? start : min },
    start: { max: max === undefined || compareDate(end, max) < 0 ? end : max, min },
  };
}
