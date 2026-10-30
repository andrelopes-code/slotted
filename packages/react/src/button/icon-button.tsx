import { keyedProps } from '@slotted/core/selector-key';
import { buttonMessages } from '@slotted/core/i18n';

import { useMessages } from '../i18n';
import { ICON_BUTTON_DEFAULTS } from './button.constants';
import {
  blockActivation,
  holdsPressedState,
  inertness,
  rootData,
  useAppearance,
  useLoadingIndicator,
  usePressed,
} from './button-root';
import { ButtonIndicator } from './button-indicator';
import type { ButtonRootProps, IconButtonProps } from './button.types';

/**
 * The same control as Button with no room for a label, so the accessible name
 * is an explicit attribute the type system makes mandatory.
 *
 * It takes `pressed` directly instead of being paired with a toggle member of
 * its own: its name is already an attribute that must not change with the
 * state, so toggling adds no obligation a separate member would exist to
 * enforce. `aria-pressed` appears only once the consumer opts in — a plain
 * icon button that announced itself as a toggle would be announcing a state it
 * does not have.
 */
export function IconButton({
  children,
  defaultPressed,
  disabled = false,
  focusableWhenDisabled = false,
  loading = false,
  loadingDelay = 0,
  messages,
  onClick,
  onClickCapture,
  onPressedChange,
  pressed,
  render,
  shape = ICON_BUTTON_DEFAULTS.shape,
  size,
  tone,
  type = 'button',
  variant,
  ...nativeProps
}: IconButtonProps) {
  const appearance = useAppearance({ size, tone, variant }, ICON_BUTTON_DEFAULTS);
  const inert = inertness({ disabled, focusableWhenDisabled, loading });
  const waiting = useLoadingIndicator({ loading, loadingDelay });
  const t = useMessages(buttonMessages, messages);
  const toggles = holdsPressedState({ defaultPressed, pressed });
  const state = usePressed({ defaultPressed, onPressedChange, pressed });

  const rootProps: ButtonRootProps = keyedProps({
    ...nativeProps,
    ...rootData({
      disabled,
      loading,
      pressed: toggles ? state.pressed : undefined,
      shape,
      ...appearance,
    }),
    'aria-disabled': inert.ariaDisabled,
    'aria-pressed': toggles ? state.pressed : undefined,
    /*
      The glyph's own box holds the ring for the length of the wait. It is
      already the size of the ring, so the control does not move, and the icon
      is the one thing this member can afford to hide: it carries no name.
    */
    children: (
      <span data-part="icon" data-part-icon="">
        {children}
        {waiting ? <ButtonIndicator label={t('loading')} /> : null}
      </span>
    ),
    disabled: inert.nativelyDisabled,
    onClick: (event) => {
      if (inert.refuses) return blockActivation(event);
      onClick?.(event);
      if (toggles && !event.defaultPrevented) state.requestToggle(event);
    },
    onClickCapture: (event) => {
      if (inert.refuses) return blockActivation(event);
      onClickCapture?.(event);
    },
    type,
  });

  return render === undefined ? <button {...rootProps} /> : render(rootProps);
}
