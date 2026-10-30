import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/toggle/toggle.css';

import { createControllable } from '@slotted/core/state';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import { useToggleDefaults } from './toggle-defaults';
import type { ToggleProps, TogglePressedReason, ToggleRootProps } from './toggle.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is the rule every activating family in this library
 * writes, and it is why `Space`, `Enter` and a pointer are told apart without
 * a key listener existing anywhere in the family.
 */
function activationReason(event: MouseEvent<HTMLElement>): TogglePressedReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * A two-state button standing on its own: a mode — Bold, Wrap, Pin — that is
 * true the moment it is pressed. `aria-pressed` is written in both states, so
 * the control is announced as a toggle rather than as a button that happens
 * to be pressed, and its label never changes with its state, which the APG
 * Button pattern calls critical.
 *
 * `button`'s ToggleButton is the other member: an action that persists —
 * Follow, Subscribe — which reaches a server and waits, in one of five tones.
 * The two hold one state model, so a consumer moving between them changes no
 * handler. Inside `toolbar` the bar owns the tab stop and the arrows, and
 * this control writes no listener of its own.
 */
export function Toggle({
  children,
  className,
  defaultPressed = false,
  disabled = false,
  icon,
  onClick,
  onPressedChange,
  pressed,
  ref,
  render,
  size,
  style,
  type = 'button',
  variant,
  ...nativeProps
}: ToggleProps) {
  const defaults = useToggleDefaults();
  const [own, setOwn] = useState(defaultPressed);
  const state = createControllable<boolean>({
    controlled: pressed,
    initial: own,
    onRequest: (request) => onPressedChange?.(request.value, request as never),
  });

  const rootProps: ToggleRootProps = keyedProps({
    ...nativeProps,
    'aria-pressed': state.value,
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
    ...(disabled ? { 'data-disabled': '' } : {}),
    'data-part': 'root',
    ...(state.value ? { 'data-pressed': '' } : {}),
    'data-size': size ?? defaults.size,
    'data-ui': 'toggle',
    'data-variant': variant ?? defaults.variant,
    onClick: (event: MouseEvent<HTMLElement>) => {
      onClick?.(event as MouseEvent<HTMLButtonElement>);
      /* A consumer that calls preventDefault has refused the activation, and
         a refused activation moves nothing. */
      if (event.defaultPrevented) return;
      const next = !state.value;
      if (state.request(next, activationReason(event), event)) setOwn(next);
    },
    style,
  });

  return render === undefined ? (
    <button {...rootProps} disabled={disabled} ref={ref} type={type} />
  ) : (
    render(rootProps)
  );
}
