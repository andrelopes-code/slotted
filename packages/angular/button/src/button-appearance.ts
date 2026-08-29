export type ButtonState = 'disabled' | 'loading' | 'pressed' | null;

export function buttonState(options: {
  disabled: boolean;
  loading?: boolean;
  pressed?: boolean;
}): ButtonState {
  if (options.disabled) return 'disabled';
  if (options.loading) return 'loading';
  if (options.pressed) return 'pressed';
  return null;
}

export function blockActivation(event: Event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
}
