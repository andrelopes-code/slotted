import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { SlProgressIndicatorBase } from './progress-indicator-base';
import type { ProgressShape } from './progress-indicator.constants';

/**
 * The wait a shape keeps, rather than the wait a ring reports.
 *
 * It is M3 Expressive's loading indicator, which Google recommends *instead of*
 * an indeterminate circular indicator for a wait under five seconds, and which
 * no other design system and no headless library surveyed ships at all. A
 * rounded shape morphs through a sequence — circle, clover, flower, trefoil,
 * oval — while it turns, at two periods that do not divide into each other, so
 * the sequence never shows the same shape in the same orientation twice.
 *
 * It measures nothing on purpose. A loader with a value would be a shape whose
 * progress nobody could read off a morphing outline, and the family already
 * has two shapes that report a number.
 *
 * `contained` draws M3's fully rounded container behind the shape, at M3's own
 * 38:48 ratio. It is the form to reach for on a photograph or a colored
 * surface, where a bare shape has no ground to be seen against.
 *
 * Content after the label is projected, so a loader can stand in a sentence
 * the consumer wrote rather than only beside a string it was given.
 */
@Component({
  selector: '[slLoader]',
  standalone: true,
  template: `<div data-part="track" data-part-track="">
      <div data-part="indicator" data-part-indicator=""></div>
    </div>
    @if (labelText(); as text) {
      <span
        data-part="label"
        data-part-label=""
        [id]="labelId"
        [attr.data-ui]="labelUi()"
        [attr.data-ui-visually-hidden]="labelUi() ? '' : null"
        >{{ text }}</span
      >
    }
    <ng-content />`,
  styleUrls: [
    '../../../styles/src/progress-indicator/progress-indicator.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slLoader',
  host: {
    'data-ui': 'progress-indicator',
    'data-ui-progress-indicator': '',
    'data-part': 'root',
    'data-part-root': '',
    'data-shape': 'morph',
    '[attr.role]': 'roleAttribute()',
    '[attr.aria-hidden]': 'hiddenFromTree()',
    '[attr.aria-labelledby]': 'labelledByAttribute()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-tone]': 'toneValue()',
    '[attr.data-indeterminate]': 'indeterminateAttribute()',
    '[attr.data-contained]': 'containedAttribute()',
    '[attr.hidden]': 'painted() ? null : ""',
  },
})
export class SlLoader extends SlProgressIndicatorBase {
  protected override readonly shape: ProgressShape = 'morph';

  /** M3's fully rounded container behind the morphing shape. */
  readonly contained = input(false, { transform: booleanAttribute });

  protected readonly labelUi = computed(() => (this.labelHidden() ? 'visually-hidden' : null));
  protected readonly containedAttribute = computed(() => (this.contained() ? '' : null));
}
