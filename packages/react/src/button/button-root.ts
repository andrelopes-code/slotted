import type { SyntheticEvent } from 'react';

import type { ButtonFill, ButtonSize, ButtonVariant } from './button.types';

export function buttonClassName(className?: string) {
  return ['slotted-button', className].filter(Boolean).join(' ');
}

export function appearanceData(options: {
  component: string;
  disabled?: boolean;
  fill: ButtonFill;
  fullWidth: boolean;
  loading?: boolean;
  pressed?: boolean;
  size: ButtonSize;
  variant: ButtonVariant;
}) {
  return {
    'data-disabled': options.disabled ? '' : undefined,
    'data-fill': options.fill,
    'data-full-width': options.fullWidth ? '' : undefined,
    'data-loading': options.loading ? '' : undefined,
    'data-pressed': options.pressed ? '' : undefined,
    'data-size': options.size,
    'data-slotted-component': options.component,
    'data-variant': options.variant,
  } as const;
}

export function blockActivation(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation?.();
}
