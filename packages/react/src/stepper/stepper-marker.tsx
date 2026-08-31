import type { StepperMarkerProps } from './stepper.types';

/**
 * Hidden from assistive technology. The marker holds a number or a tick that
 * repeats what the label and aria-current already say, and "3" read out
 * between two step names is noise.
 */
export function StepperMarker({ 'aria-hidden': ariaHidden, ...nativeProps }: StepperMarkerProps) {
  return <span {...nativeProps} aria-hidden={ariaHidden ?? 'true'} data-part="marker" />;
}
