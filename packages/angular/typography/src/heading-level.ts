import { Directive, inject, isDevMode } from '@angular/core';

import type { HeadingLevelValue } from './typography';

/**
 * One section deeper. A heading inside takes the next rank, which is how the
 * outline stays correct in a tree assembled from components that cannot see
 * each other: the HTML Standard requires each heading to be less than, equal
 * to, or one greater than the heading before it, and stepping by exactly one
 * is the only way to guarantee that without reading the document.
 *
 * The directive sits on the element the consumer already wrote for the
 * section, so it adds nothing to the DOM. The depth is fixed for the life of
 * the element, so it is a value rather than a signal.
 */
@Directive({
  selector: '[slHeadingLevel]',
  standalone: true,
  exportAs: 'slHeadingLevel',
})
export class SlHeadingLevel {
  private readonly parent = inject(SlHeadingLevel, { optional: true, skipSelf: true });

  readonly level: HeadingLevelValue;

  constructor() {
    const outer = this.parent?.level ?? 1;
    this.level = Math.min(outer + 1, 6) as HeadingLevelValue;

    if (isDevMode() && outer === 6) {
      console.warn(
        'slHeadingLevel nested past level 6. The platform has six ranks, so a heading inside stays at 6 and the outline stops recording depth here.',
      );
    }
  }
}
