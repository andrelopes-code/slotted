import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

/** One step either way: a day, a year, the length of a run. */
@Component({
  selector: 'button[slPickerStep]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `
    @if (turns()) {
      <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
    } @else if (slPickerStep() === 'increase') {
      <span slIcon><svg slGlyph name="plus"></svg></span>
    } @else {
      <span slIcon><svg slGlyph name="minus"></svg></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    type: 'button',
    'data-part': 'step',
    'data-part-step': '',
    '[attr.aria-label]': 'label()',
    '[attr.data-direction]': 'slPickerStep()',
  },
})
export class SlPickerStep {
  readonly slPickerStep = input.required<'previous' | 'next' | 'decrease' | 'increase'>();
  readonly label = input.required<string>();

  protected readonly turns = computed(() => ['previous', 'next'].includes(this.slPickerStep()));
}
