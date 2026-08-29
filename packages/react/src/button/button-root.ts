import type { SyntheticEvent } from 'react';

import type { ButtonSize, ButtonTone, ButtonVariant } from './button.types';

export type ButtonState = 'disabled' | 'loading' | 'pressed' | undefined;

export function buttonClassName(className?: string) {
  return ['slotted-button', className].filter(Boolean).join(' ');
}

export function appearanceData(options: {
  component: string;
  fullWidth: boolean;
  size: ButtonSize;
  state: ButtonState;
  tone: ButtonTone;
  variant: ButtonVariant;
}) {
  return {
    'data-full-width': options.fullWidth ? '' : undefined,
    'data-size': options.size,
    'data-slotted-component': options.component,
    'data-state': options.state,
    'data-tone': options.tone,
    'data-variant': options.variant,
  } as const;
}

export function blockActivation(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation?.();
}
