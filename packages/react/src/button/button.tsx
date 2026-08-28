import './button.css';

import type { ButtonProps } from './button.types';

export function Button({
  children,
  className,
  disabled,
  leading,
  size = 'md',
  tone = 'accent',
  trailing,
  type = 'button',
  variant = 'solid',
  ...nativeProps
}: ButtonProps) {
  const classes = ['slotted-button', className].filter(Boolean).join(' ');

  return (
    <button
      {...nativeProps}
      className={classes}
      data-size={size}
      data-slotted-component="button"
      data-state={disabled ? 'disabled' : undefined}
      data-tone={tone}
      data-variant={variant}
      disabled={disabled}
      type={type}
    >
      {leading === undefined ? null : <span data-part="leading">{leading}</span>}
      <span data-part="label">{children}</span>
      {trailing === undefined ? null : <span data-part="trailing">{trailing}</span>}
    </button>
  );
}
