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

export type LoadingBarPlacement = 'inline' | 'fixed';

/**
 * The same measurement as ProgressBar, reported the same way. What differs is
 * where it sits: a page-level bar belongs to the viewport, not to whatever
 * happens to contain it.
 */
@Component({
  selector: 'div[slLoadingBar]',
  standalone: true,
  template: `<span data-part="indicator" [style.inline-size]="indicatorSize()"></span>`,
  styleUrl: '../../../styles/src/loading-bar/loading-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-loading-bar',
    'data-slotted-component': 'loading-bar',
    'data-part': 'root',
    role: 'progressbar',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'valueNow()',
    '[attr.aria-valuetext]': 'valueText() || null',
    '[attr.data-placement]': 'placement()',
    '[attr.data-indeterminate]': "indeterminate() ? '' : null",
  },
})
export class SlLoadingBar {
  readonly max = input(100);
  readonly placement = input<LoadingBarPlacement>('inline');
  readonly value = input<number | null>(null);
  readonly valueText = input('');

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  readonly indeterminate = computed(() => {
    const value = this.value();
    return value === null || Number.isNaN(value);
  });

  readonly valueNow = computed(() =>
    this.indeterminate() ? null : clamp(this.value() as number, 0, this.max()),
  );

  readonly indicatorSize = computed(() => {
    const now = this.valueNow();
    return now === null ? null : `${percentOf(now, 0, this.max())}%`;
  });

  constructor() {
    if (!isDevMode()) return;
    const ariaLabel = this.element.getAttribute('aria-label');
    const ariaLabelledBy = this.element.getAttribute('aria-labelledby');
    if (!ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
      console.warn(
        'LoadingBar has no accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it.',
      );
    }
  }
}
