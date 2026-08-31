import type { StepperLabelProps } from './stepper.types';

export function StepperLabel(props: StepperLabelProps) {
  return <span {...props} data-part="label" />;
}
