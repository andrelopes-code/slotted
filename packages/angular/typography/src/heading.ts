import { textBoxValues } from '@slotted/core/text';
import type { TextBox } from '@slotted/core/text';
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

import { SlHeadingLevel } from './heading-level';
import { toneAttribute, truncatedLines } from './typography';
import type {
  HeadingLevelValue,
  TypographyAlign,
  TypographyNumeric,
  TypographySize,
  TypographyTone,
  TypographyTransform,
  TypographyWeight,
  TypographyWrap,
} from './typography';

/** The size each rank reads at before anyone asks for another. */
const SIZE_OF_LEVEL: Record<HeadingLevelValue, TypographySize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'sm',
};

/**
 * A heading is a rank in the document outline and a size on the page, and the
 * two are separate. The rank is the element the consumer wrote, because that
 * is where the platform keeps it; the size follows the rank until `size` asks
 * for another.
 *
 * The section the heading sits in states the rank it expects, and a heading
 * more than one rank deeper than that has skipped one. The skip is reported,
 * never corrected: the element the consumer wrote is the element rendered.
 */
@Component({
  selector: 'h1[slHeading],h2[slHeading],h3[slHeading],h4[slHeading],h5[slHeading],h6[slHeading]',
  standalone: true,
  exportAs: 'slHeading',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/typography/typography.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'typography',
    'data-ui-typography': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-weight]': 'weight()',
    '[attr.data-tone]': 'toneAttribute()',
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-wrap]': 'wrap()',
    '[attr.data-transform]': 'transform() ?? null',
    '[attr.data-numeric]': 'numeric() ?? null',
    '[attr.data-truncate]': 'lines()',
    '[style.--slotted-typography-lines]': 'lines()',
    '[attr.data-text-box]': 'box().trim',
    '[style.--_text-box-edge]': 'box().edge',
  },
})
export class SlHeading {
  readonly align = input<TypographyAlign>();
  readonly numeric = input<TypographyNumeric>();
  readonly size = input<TypographySize>();
  readonly tone = input<TypographyTone>();
  readonly transform = input<TypographyTransform>();
  readonly truncate = input<boolean | number>();
  readonly weight = input<TypographyWeight>('semibold');
  readonly wrap = input<TypographyWrap>('balance');
  /**
   * Takes the half-leading off the start, the end or both edges of the box, so
   * the heading shares a top edge, a bottom edge and an optical center with an
   * element beside it. The edge defaults to the theme's
   * `--slotted-text-box-edge` (`cap alphabetic`).
   */
  readonly textBox = input<TextBox>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly section = inject(SlHeadingLevel, { optional: true });

  /** The rank of the element the consumer wrote, which the tag already states. */
  readonly level = Number(this.element.tagName.slice(1)) as HeadingLevelValue;

  protected readonly resolvedSize = computed(() => this.size() ?? SIZE_OF_LEVEL[this.level]);
  protected readonly toneAttribute = computed(() => toneAttribute(this.tone()));
  protected readonly lines = computed(() => truncatedLines(this.truncate()));
  protected readonly box = computed(() => textBoxValues(this.textBox()));

  constructor() {
    const ambient = this.section?.level ?? 1;

    if (isDevMode() && this.level > ambient + 1) {
      console.warn(
        `Heading level ${this.level} skips the outline: this section allows at most ${ambient + 1}. Put slHeadingLevel on the section, or write the rank the content actually has.`,
      );
    }
  }
}
