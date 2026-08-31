import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export type TagVariant = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
export type TagFill = 'solid' | 'outline' | 'subtle';
export type TagSize = 'sm' | 'md';

/**
 * The same three appearance axes as Badge, over the same five tones. A tag
 * differs from a badge in what the reader can do with it, not in how it looks.
 */
@Component({
  selector: 'span[slTag]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/tag/tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-tag',
    'data-slotted-component': 'tag',
    'data-part': 'root',
    '[attr.data-variant]': 'variant()',
    '[attr.data-fill]': 'fill()',
    '[attr.data-size]': 'size()',
  },
})
export class SlTag {
  readonly fill = input<TagFill>('solid');
  readonly size = input<TagSize>('md');
  readonly variant = input<TagVariant>('secondary');
}
