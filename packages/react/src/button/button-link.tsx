import type { SyntheticEvent } from 'react';

import { ButtonContentLayer } from './button-content';
import { BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, blockActivation, buttonClassName } from './button-root';
import type { ButtonLinkProps, ButtonLinkRootProps } from './button.types';

export function ButtonLink({
  'aria-disabled': ariaDisabled,
  children,
  className,
  disabled = false,
  fullWidth = false,
  href,
  leading,
  onAuxClick,
  onAuxClickCapture,
  onClick,
  onClickCapture,
  onKeyDown,
  onKeyDownCapture,
  render,
  size = BUTTON_DEFAULTS.size,
  tabIndex,
  tone = BUTTON_DEFAULTS.tone,
  trailing,
  variant = BUTTON_DEFAULTS.variant,
  ...anchorProps
}: ButtonLinkProps) {
  const interactionBlocked = disabled || ariaDisabled === true || ariaDisabled === 'true';
  const blockInteraction = (event: SyntheticEvent) => {
    if (!interactionBlocked) return false;
    blockActivation(event);
    return true;
  };
  const isActivationKey = (key: string) => key === 'Enter' || key === ' ';

  const rootProps: ButtonLinkRootProps = {
    ...anchorProps,
    ...appearanceData({
      component: 'button-link',
      fullWidth,
      size,
      state: interactionBlocked ? 'disabled' : undefined,
      tone,
      variant,
    }),
    'aria-disabled': interactionBlocked || ariaDisabled || undefined,
    children: (
      <ButtonContentLayer leading={leading} loading={false} trailing={trailing}>
        {children}
      </ButtonContentLayer>
    ),
    className: buttonClassName(className),
    ...(render === undefined ? { href } : {}),
    onAuxClick: (event) => {
      if (blockInteraction(event)) return;
      onAuxClick?.(event);
    },
    onAuxClickCapture: (event) => {
      if (blockInteraction(event)) return;
      onAuxClickCapture?.(event);
    },
    onClick: (event) => {
      if (blockInteraction(event)) return;
      onClick?.(event);
    },
    onClickCapture: (event) => {
      if (blockInteraction(event)) return;
      onClickCapture?.(event);
    },
    onKeyDown: (event) => {
      if (isActivationKey(event.key) && blockInteraction(event)) return;
      onKeyDown?.(event);
    },
    onKeyDownCapture: (event) => {
      if (isActivationKey(event.key) && blockInteraction(event)) return;
      onKeyDownCapture?.(event);
    },
    tabIndex: interactionBlocked ? (tabIndex ?? -1) : tabIndex,
  };

  return render === undefined ? <a {...rootProps} /> : render(rootProps);
}
