import { ButtonContentLayer } from './button-content';
import { BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, blockActivation, buttonClassName } from './button-root';
import type { ButtonLinkProps, ButtonLinkRootProps } from './button.types';

export function ButtonLink({
  children,
  className,
  disabled = false,
  fullWidth = false,
  href,
  leading,
  onAuxClick,
  onClick,
  onKeyDown,
  render,
  size = BUTTON_DEFAULTS.size,
  tabIndex,
  tone = BUTTON_DEFAULTS.tone,
  trailing,
  variant = BUTTON_DEFAULTS.variant,
  ...anchorProps
}: ButtonLinkProps) {
  const rootProps: ButtonLinkRootProps = {
    ...anchorProps,
    ...appearanceData({
      component: 'button-link',
      fullWidth,
      size,
      state: disabled ? 'disabled' : undefined,
      tone,
      variant,
    }),
    'aria-disabled': disabled || anchorProps['aria-disabled'] || undefined,
    children: (
      <ButtonContentLayer leading={leading} loading={false} trailing={trailing}>
        {children}
      </ButtonContentLayer>
    ),
    className: buttonClassName(className),
    href,
    onAuxClick: (event) => {
      if (disabled) return blockActivation(event);
      onAuxClick?.(event);
    },
    onClick: (event) => {
      if (disabled) return blockActivation(event);
      onClick?.(event);
    },
    onKeyDown: (event) => {
      if (disabled && (event.key === 'Enter' || event.key === ' ')) {
        return blockActivation(event);
      }
      onKeyDown?.(event);
    },
    tabIndex: disabled ? (tabIndex ?? -1) : tabIndex,
  };

  return render === undefined ? <a {...rootProps} /> : render(rootProps);
}
