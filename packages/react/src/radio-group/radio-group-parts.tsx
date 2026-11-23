import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { useId } from 'react';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { useRadioGroup } from './radio-group';
import type { RadioGroupSelectionReason, RadioProps, RadioRootProps } from './radio-group.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is the rule every activating family in this library writes,
 * and it is why `Space` and a pointer are told apart without a key listener.
 */
function activationReason(event: MouseEvent<HTMLInputElement>): RadioGroupSelectionReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One item of the set.
 *
 * It is a part of `radio-group` and not a family: outside a group it has no
 * exclusive set to belong to, and the platform's whole keyboard model is
 * defined over the set.
 *
 * The mark is a sibling of the control for the reason `checkbox` records —
 * Firefox renders no pseudo-element on an `input` — and the label names the
 * control through `for` so the description below it can be read without
 * choosing anything.
 */
export function Radio({
  'aria-describedby': describedBy,
  children,
  className,
  description,
  disabled,
  id,
  onChange,
  onClick,
  ref,
  render,
  style,
  value,
  ...nativeProps
}: RadioProps) {
  const group = useRadioGroup();
  const generatedId = useId();
  const controlId = id ?? `slotted-radio-${generatedId}`;
  const descriptionId = `${controlId}-description`;

  const checked = group.value === value;
  const resolvedDisabled = disabled ?? group.disabled;

  const rootProps: RadioRootProps = keyedProps({
    children: (
      <>
        <input
          {...withSelectorKey(nativeProps, 'part', 'control')}
          aria-describedby={
            /* What the field says is said once, on the group, which is the
               control as far as the field is concerned. */
            [describedBy, description === undefined ? undefined : descriptionId]
              .filter(Boolean)
              .join(' ') || undefined
          }
          checked={checked}

          disabled={resolvedDisabled}
          id={controlId}
          name={group.name}
          onChange={onChange ?? (() => undefined)}
          onClick={(event: MouseEvent<HTMLInputElement>) => {
            onClick?.(event);
            if (event.defaultPrevented) return;
            if (!group.select(value, activationReason(event), event)) {
              event.preventDefault();
            }
          }}
          ref={ref}
          type="radio"
          value={value}
        />
        <span data-part="indicator" data-part-indicator="">
          <Icon>
            <Glyph name="dot" />
          </Icon>
        </span>
        {children === undefined ? null : (
          <label data-part="label" data-part-label="" htmlFor={controlId}>
            {children}
          </label>
        )}
        {description === undefined ? null : (
          <p data-part="description" data-part-description="" id={descriptionId}>
            {description}
          </p>
        )}
      </>
    ),
    className,
    ...(checked ? { 'data-checked': '' } : {}),
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    'data-part': 'item',
    style,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
