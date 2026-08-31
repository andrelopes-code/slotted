import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  isDevMode,
  ViewEncapsulation,
} from '@angular/core';
import { clamp, percentOf } from '@slotted/core/measure';

/**
 * A value outside the range is clamped rather than rejected: progress is
 * usually computed from two numbers an application does not fully control, and
 * a bar that overflows its track or runs backwards is worse than one that sits
 * at either end.
 */
@Component({
  selector: 'div[slProgressBar]',
  standalone: true,
  template: `<span data-part="indicator" [style.inline-size]="indicatorSize()"></span>`,
  styleUrl: '../../../styles/src/progress-bar/progress-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-progress-bar',
    'data-slotted-component': 'progress-bar',
    'data-part': 'root',
    role: 'progressbar',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'valueNow()',
    '[attr.aria-valuetext]': 'valueText() || null',
    '[attr.data-indeterminate]': "indeterminate() ? '' : null",
  },
})
export class SlProgressBar {
  readonly max = input(100);
  readonly value = input<number | null>(null);
  readonly valueText = input('');

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  readonly indeterminate = computed(() => {
    const value = this.value();
    return value === null || Number.isNaN(value);
  });

  readonly valueNow = computed(() => {
    if (this.indeterminate()) return null;
    return clamp(this.value() as number, 0, this.max());
  });

  readonly indicatorSize = computed(() => {
    const now = this.valueNow();
    if (now === null) return null;
    return `${percentOf(now, 0, this.max())}%`;
  });

  constructor() {
    if (!isDevMode()) return;
    const ariaLabel = this.element.getAttribute('aria-label');
    const ariaLabelledBy = this.element.getAttribute('aria-labelledby');
    if (!ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
      console.warn(
        'ProgressBar has no accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it.',
      );
    }
  }
}
