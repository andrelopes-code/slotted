import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { useId } from 'react';
import type { MouseEvent } from 'react';

import { useSegmentedControl } from './segmented-control';
import type {
  SegmentProps,
  SegmentRootProps,
  SegmentedControlSelectionReason,
} from './segmented-control.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is the rule every activating family in this library
 * writes, and it is why `Space` and a pointer are told apart without a key
 * listener existing anywhere in the family.
 */
function activationReason(event: MouseEvent<HTMLInputElement>): SegmentedControlSelectionReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One segment of the track.
 *
 * It is a part of `segmented-control` and not a family: outside a control it
 * has no exclusive set to belong to, and the platform's whole keyboard model is
 * defined over the set.
 *
 * The radio is real, visually hidden and left where it is: it covers the
 * segment and reaches the track's own edge, so the hit area is the control's
 * height rather than the thumb's, and `Space`, a click and a tap are one event
 * the family answers once. It is deliberately not substitutable — a segment
 * that became a `button` or an `a` would lose the semantics this family exists
 * to have, and a row that navigates is `tabs`.
 */
export function Segment({
  'aria-describedby': describedBy,
  children,
  className,
  disabled,
  icon,
  id,
  onChange,
  onClick,
  ref,
  render,
  style,
  value,
  ...nativeProps
}: SegmentProps) {
  const control = useSegmentedControl();
  const generatedId = useId();
  const controlId = id ?? `slotted-segment-${generatedId}`;

  const checked = control.value === value;
  const resolvedDisabled = disabled ?? control.disabled;

  const rootProps: SegmentRootProps = keyedProps({
    children: (
      <>
        <input
          {...withSelectorKey(nativeProps, 'part', 'control')}
          aria-describedby={describedBy}
          checked={checked}

          disabled={resolvedDisabled}
          id={controlId}
          name={control.name}
          onChange={onChange ?? (() => undefined)}
          onClick={(event: MouseEvent<HTMLInputElement>) => {
            onClick?.(event);
            if (event.defaultPrevented) return;
            if (!control.select(value, activationReason(event), event)) {
              event.preventDefault();
            }
          }}
          ref={ref}
          type="radio"
          value={value}
        />
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
    ...(checked ? { 'data-checked': '' } : {}),
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    'data-part': 'item',
    style,
  });

  return render === undefined ? <label {...rootProps} /> : render(rootProps);
}
