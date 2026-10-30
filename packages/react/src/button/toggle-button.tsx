import { keyedProps } from '@slotted/core/selector-key';
import { buttonMessages } from '@slotted/core/i18n';

import { useMessages } from '../i18n';
import { ButtonContent } from './button-content';
import { TOGGLE_BUTTON_DEFAULTS } from './button.constants';
import {
  blockActivation,
  inertness,
  rootData,
  useAppearance,
  useLoadingIndicator,
  usePressed,
} from './button-root';
import { ButtonIndicator } from './button-indicator';
import type { ButtonRootProps, ToggleButtonProps } from './button.types';

/**
 * A two-state action. The APG is explicit that the label of a toggle must not
 * change with its state — "Mute" stays "Mute" and the state is announced
 * beside it — so this is a member of its own rather than a prop on Button:
 * reaching for it is what makes that obligation visible to the consumer.
 *
 * It waits, because a toggle that persists is the common one: "Follow",
 * "Subscribe" and "Watch" all reach a server before the state is true. While
 * it waits it holds the state it still has, so the person is never shown a
 * value that has not been agreed to.
 */
export function ToggleButton({
  children,
  defaultPressed,
  disabled = false,
  end,
  focusableWhenDisabled = false,
  fullWidth = false,
  justify = 'center',
  loading = false,
  loadingDelay = 0,
  messages,
  onClick,
  onClickCapture,
  onPressedChange,
  pressed,
  render,
  size,
  start,
  tone,
  type = 'button',
  variant,
  ...nativeProps
}: ToggleButtonProps) {
  const appearance = useAppearance({ size, tone, variant }, TOGGLE_BUTTON_DEFAULTS);
  const inert = inertness({ disabled, focusableWhenDisabled, loading });
  const waiting = useLoadingIndicator({ loading, loadingDelay });
  const t = useMessages(buttonMessages, messages);
  const state = usePressed({ defaultPressed, onPressedChange, pressed });

  const rootProps: ButtonRootProps = keyedProps({
    ...nativeProps,
    ...rootData({ disabled, fullWidth, justify, loading, pressed: state.pressed, ...appearance }),
    'aria-disabled': inert.ariaDisabled,
    'aria-pressed': state.pressed,
    children: (
      <ButtonContent
        end={end}
        indicator={waiting ? <ButtonIndicator label={t('loading')} /> : null}
        start={start}
      >
        {children}
      </ButtonContent>
    ),
    disabled: inert.nativelyDisabled,
    onClick: (event) => {
      if (inert.refuses) return blockActivation(event);
      onClick?.(event);
      /*
        A consumer that calls preventDefault has refused the activation, and
        a refused activation moves nothing.
      */
      if (!event.defaultPrevented) state.requestToggle(event);
    },
    onClickCapture: (event) => {
      if (inert.refuses) return blockActivation(event);
      onClickCapture?.(event);
    },
    type,
  });

  return render === undefined ? <button {...rootProps} /> : render(rootProps);
}
