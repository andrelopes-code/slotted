import { computed, Directive, ElementRef, inject, input } from '@angular/core';

export type StepperStatus = 'upcoming' | 'current' | 'complete';

/**
 * `status` is one value from a closed set, not two booleans: a step cannot be
 * both complete and upcoming, and a pair of flags would admit that. The step in
 * progress also carries aria-current="step", which is the part a screen reader
 * reads.
 */
@Directive({
  selector: 'li[slStepperStep]',
  standalone: true,
  host: {
    'data-part': 'step',
    '[attr.data-status]': 'status()',
    '[attr.aria-current]': 'ariaCurrent()',
  },
})
export class SlStepperStep {
  readonly status = input<StepperStatus>('upcoming');

  private readonly ownAriaCurrent = inject(ElementRef<HTMLElement>).nativeElement.getAttribute(
    'aria-current',
  );

  readonly ariaCurrent = computed(
    () => this.ownAriaCurrent ?? (this.status() === 'current' ? 'step' : null),
  );
}
