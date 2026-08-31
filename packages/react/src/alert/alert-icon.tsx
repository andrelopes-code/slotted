import type { AlertIconProps } from './alert.types';

/**
 * Hidden from assistive technology by default. The tone the icon carries is
 * already in the words; announcing "warning triangle" adds a noun nobody
 * needs. A consumer who means the icon to be read passes aria-hidden={false}.
 */
export function AlertIcon({ 'aria-hidden': ariaHidden, ...nativeProps }: AlertIconProps) {
  return <span {...nativeProps} aria-hidden={ariaHidden ?? 'true'} data-part="icon" />;
}
