import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

/**
 * A step on the space scale. Separation is chosen from the scale rather than
 * stated as a length, so a theme retunes every layout at once and no component
 * invents a rhythm of its own. `0` is the absence of separation.
 */
export type InlineGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Across the flow, which for a run is the block axis. */
export type InlineAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

/** Along the flow, which for a run is the inline axis. */
export type InlineJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export type InlineWrap = 'wrap' | 'nowrap';

/**
 * Inline arranges its children along the inline axis and lets them wrap. It
 * paints nothing and adds no semantics: the element is the one the consumer
 * wrote, so a list of tags stays a list.
 *
 * An axis reaches the stylesheet only when someone decided it. The base rule
 * already carries the family defaults — wrapping, centred, separated by half a
 * rem — and a layout is the most numerous element in a document.
 *
 * There is no input that reverses the children. The order they are written in
 * is the order they are read in, by a screen reader and by the Tab key alike.
 */
@Component({
  selector: '[slInline]',
  standalone: true,
  exportAs: 'slInline',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/inline/inline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'inline',
    'data-ui-inline': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-align]': 'align() ?? null',
    /* `align` is also an obsolete HTML attribute a browser still honours on a
       div, centring its text; written statically for the input it would stay. */
    '[attr.align]': 'null',
    '[attr.data-justify]': 'justify() ?? null',
    '[attr.data-wrap]': 'wrap() ?? null',
  },
})
export class SlInline {
  /** Positions items across the flow. `baseline` puts their type on one line. */
  readonly align = input<InlineAlign>();
  /** Separation between items, as a step on the space scale. */
  readonly gap = input<InlineGap>();
  /** Positions items along the flow, and distributes the space between them. */
  readonly justify = input<InlineJustify>();
  /** `nowrap` keeps one line, and overflows a container narrower than it. */
  readonly wrap = input<InlineWrap>();
}
