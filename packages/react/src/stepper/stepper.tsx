import '@slotted/styles/stepper/stepper.css';

import type { StepperProps, StepperRootProps } from './stepper.types';

/**
 * An ordered list, because the steps are a sequence and their order is the
 * information. The component adds no role: a list of steps is a list.
 */
export function Stepper({
  className,
  orientation = 'horizontal',
  render,
  ...nativeProps
}: StepperProps) {
  const rootProps: StepperRootProps = {
    ...nativeProps,
    className: ['slotted-stepper', className].filter(Boolean).join(' '),
    'data-orientation': orientation,
    'data-part': 'root',
    'data-slotted-component': 'stepper',
  };

  return render === undefined ? <ol {...rootProps} /> : render(rootProps);
}
