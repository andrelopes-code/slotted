import { ICON_BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, blockActivation, buttonClassName } from './button-root';
import type { IconButtonProps } from './button.types';

function DefaultLoadingIndicator() {
  return <span className="slotted-button__spinner" />;
}

export function IconButton({
  'aria-busy': ariaBusy,
  'aria-disabled': ariaDisabled,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  children,
  className,
  disabled = false,
  fullWidth = false,
  loading = false,
  loadingIndicator,
  onClick,
  onClickCapture,
  size = ICON_BUTTON_DEFAULTS.size,
  tone = ICON_BUTTON_DEFAULTS.tone,
  type = 'button',
  variant = ICON_BUTTON_DEFAULTS.variant,
  ...nativeProps
}: IconButtonProps) {
  const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

  if (isDevelopment && !ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
    throw new Error('IconButton requires aria-label or aria-labelledby');
  }

  const interactionBlocked = loading || ariaDisabled === true || ariaDisabled === 'true';
  const state = disabled ? 'disabled' : loading ? 'loading' : undefined;

  return (
    <button
      {...nativeProps}
      {...appearanceData({ component: 'icon-button', fullWidth, size, state, tone, variant })}
      aria-busy={loading ? true : ariaBusy}
      aria-disabled={loading ? true : ariaDisabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={buttonClassName(className)}
      data-part-root="icon"
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
      <span className="slotted-button__content" data-loading-hidden={loading ? '' : undefined}>
        <span data-part="icon">{children}</span>
      </span>
      {loading ? (
        <span className="slotted-button__loading">
          <span aria-hidden="true" data-part="loading-indicator">
            {loadingIndicator ?? <DefaultLoadingIndicator />}
          </span>
        </span>
      ) : null}
    </button>
  );
}
