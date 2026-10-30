import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlTag } from './tag';

/**
 * The control at the end of the chip, on the consumer's own button so its
 * listeners and its attributes stay theirs. The glyph is the family's `x`,
 * drawn as the `Glyph` element unless the consumer wrote content of their own:
 * a character is never an icon.
 *
 * Its name is composed rather than repeated. The hidden word and the tag's own
 * label are joined by `aria-labelledby`, so it announces "Remove Design"
 * without the consumer writing the value a second time — the string four of
 * the surveyed implementations make the consumer keep in step with the value
 * by hand. Text referenced by `aria-labelledby` counts even when the element
 * holding it is hidden, which is what lets the word cost no space.
 */
@Component({
  selector: 'button[slTagRemove]',
  standalone: true,
  exportAs: 'slTagRemove',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
      ><span slIcon><svg slGlyph name="x"></svg></span></ng-content
    ><span hidden [id]="tag.removeWordId">{{ tag.t('remove') }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'remove',
    'data-part-remove': '',
    type: 'button',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.disabled]': "tag.removeRefused() ? '' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlTagRemove {
  protected readonly tag = inject(SlTag);

  protected readonly labelledBy = computed(() => `${this.tag.removeWordId} ${this.tag.labelId}`);

  protected onClick(event: MouseEvent) {
    /* The X is its own target. A handler the consumer put on the chip is about
       the chip, and a removal is not a press of it. */
    event.stopPropagation();
    this.tag.requestRemoval('remove', event);
  }
}
