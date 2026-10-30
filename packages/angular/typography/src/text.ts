import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { toneAttribute, truncatedLines } from './typography';
import type {
  TypographyAlign,
  TypographyNumeric,
  TypographySize,
  TypographyTone,
  TypographyTransform,
  TypographyWeight,
  TypographyWrap,
} from './typography';

/**
 * Text sets the library's type on the element the consumer already wrote. The
 * directive makes no claim about which element that is: a paragraph, a label
 * or a table cell is a claim the consumer makes by writing the tag.
 *
 * An axis reaches the stylesheet only when someone decided it. The base rule
 * already paints the family default, and text is the most numerous element in
 * any document.
 */
@Component({
  selector: '[slText]',
  standalone: true,
  exportAs: 'slText',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/typography/typography.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'typography',
    'data-ui-typography': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'size() ?? null',
    '[attr.data-weight]': 'weight() ?? null',
    '[attr.data-tone]': 'toneAttribute()',
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-wrap]': 'wrap() ?? null',
    '[attr.data-transform]': 'transform() ?? null',
    '[attr.data-numeric]': 'numeric() ?? null',
    '[attr.data-truncate]': 'lines()',
    '[style.--slotted-typography-lines]': 'lines()',
  },
})
export class SlText {
  readonly align = input<TypographyAlign>();
  readonly numeric = input<TypographyNumeric>();
  readonly size = input<TypographySize>();
  readonly tone = input<TypographyTone>();
  readonly transform = input<TypographyTransform>();
  readonly truncate = input<boolean | number>();
  readonly weight = input<TypographyWeight>();
  readonly wrap = input<TypographyWrap>();

  protected readonly toneAttribute = computed(() => toneAttribute(this.tone()));
  protected readonly lines = computed(() => truncatedLines(this.truncate()));
}
