import { ButtonContentLayer } from './button-content';
import { TOGGLE_BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, blockActivation, buttonClassName } from './button-root';
import type { ToggleButtonProps } from './button.types';

export function ToggleButton({
  'aria-disabled': ariaDisabled,
  children,
  className,
  disabled = false,
  fill = TOGGLE_BUTTON_DEFAULTS.fill,
  fullWidth = false,
  leading,
  onClick,
  onClickCapture,
  onPressedChange,
  pressed = false,
  size = TOGGLE_BUTTON_DEFAULTS.size,
  trailing,
  type = 'button',
  variant = TOGGLE_BUTTON_DEFAULTS.variant,
  ...nativeProps
}: ToggleButtonProps) {
  const interactionBlocked = ariaDisabled === true || ariaDisabled === 'true';

  return (
    <button
      {...nativeProps}
      {...appearanceData({
        component: 'toggle-button',
        disabled,
        fill,
        fullWidth,
        pressed,
        size,
        variant,
      })}
      aria-disabled={ariaDisabled}
      aria-pressed={pressed}
      className={buttonClassName(className)}
      disabled={disabled}
      onClick={(event) => {
        if (interactionBlocked) return blockActivation(event);
        onClick?.(event);
        if (!event.defaultPrevented) onPressedChange?.(!pressed);
      }}
      onClickCapture={(event) => {
        if (interactionBlocked) return blockActivation(event);
        onClickCapture?.(event);
      }}
      type={type}
    >
      <ButtonContentLayer leading={leading} loading={false} trailing={trailing}>
        {children}
      </ButtonContentLayer>
    </button>
  );
}
