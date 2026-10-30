import { keyedProps } from '@slotted/core/selector-key';
import { buttonMessages } from '@slotted/core/i18n';

import { useMessages } from '../i18n';
import { ButtonContent } from './button-content';
import { BUTTON_DEFAULTS } from './button.constants';
import {
  blockActivation,
  inertness,
  rootData,
  useAppearance,
  useLoadingIndicator,
} from './button-root';
import { ButtonIndicator } from './button-indicator';
import type { ButtonProps, ButtonRootProps } from './button.types';

/**
 * A momentary action. Persistent state belongs to ToggleButton, and navigation
 * to ButtonLink, so this member never grows an `aria-pressed` or an `href`.
 */
export function Button({
  children,
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
  render,
  size,
  start,
  tone,
  type = 'button',
  variant,
  ...nativeProps
}: ButtonProps) {
  const appearance = useAppearance({ size, tone, variant }, BUTTON_DEFAULTS);
  const inert = inertness({ disabled, focusableWhenDisabled, loading });
  const waiting = useLoadingIndicator({ loading, loadingDelay });
  const t = useMessages(buttonMessages, messages);

  const rootProps: ButtonRootProps = keyedProps({
    ...nativeProps,
    ...rootData({ disabled, fullWidth, justify, loading, ...appearance }),
    'aria-disabled': inert.ariaDisabled,
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
    },
    /*
      The capture phase, because a control that is unavailable or still working
      must refuse the activation before any listener the consumer attached to
      it can run — including the submit a `type="submit"` button would perform
      while it keeps its place in the tab sequence.
    */
    onClickCapture: (event) => {
      if (inert.refuses) return blockActivation(event);
      onClickCapture?.(event);
    },
    type,
  });

  return render === undefined ? <button {...rootProps} /> : render(rootProps);
}
