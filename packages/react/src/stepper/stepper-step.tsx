import type { StepperStepProps } from './stepper.types';

/**
 * `status` is one value from a closed set, not two booleans: a step cannot be
 * both complete and upcoming, and a pair of flags would admit that. The step in
 * progress also carries aria-current="step", which is the part a screen reader
 * reads.
 */
export function StepperStep({
  'aria-current': ariaCurrent,
  status = 'upcoming',
  ...nativeProps
}: StepperStepProps) {
  return (
    <li
      {...nativeProps}
      aria-current={ariaCurrent ?? (status === 'current' ? 'step' : undefined)}
      data-part="step"
      data-status={status}
    />
  );
}
