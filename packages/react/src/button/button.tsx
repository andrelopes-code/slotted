import '@slotted/styles/button/button.css';

import { ButtonContentLayer } from './button-content';
import { BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, blockActivation, buttonClassName } from './button-root';
import type { ButtonProps } from './button.types';

export function Button({
  'aria-busy': ariaBusy,
  'aria-disabled': ariaDisabled,
  children,
  className,
  disabled = false,
  fill = BUTTON_DEFAULTS.fill,
  fullWidth = false,
  leading,
  loading = false,
  loadingIndicator,
  loadingText,
  onClick,
  onClickCapture,
  size = BUTTON_DEFAULTS.size,
  trailing,
  type = 'button',
  variant = BUTTON_DEFAULTS.variant,
  ...nativeProps
}: ButtonProps) {
  const interactionBlocked = loading || ariaDisabled === true || ariaDisabled === 'true';
  const state = disabled ? 'disabled' : loading ? 'loading' : undefined;

  return (
    <button
      {...nativeProps}
      {...appearanceData({ component: 'button', fill, fullWidth, size, state, variant })}
      aria-busy={loading || ariaBusy || undefined}
      aria-disabled={loading || ariaDisabled || undefined}
      className={buttonClassName(className)}
      disabled={disabled}
      onClick={(event) => {
        if (interactionBlocked) return blockActivation(event);
        onClick?.(event);
      }}
      onClickCapture={(event) => {
        if (interactionBlocked) return blockActivation(event);
        onClickCapture?.(event);
      }}
      type={type}
    >
      <ButtonContentLayer
        leading={leading}
        loading={loading}
        loadingIndicator={loadingIndicator}
        loadingText={loadingText}
        trailing={trailing}
      >
        {children}
      </ButtonContentLayer>
    </button>
  );
}
