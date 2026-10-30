import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

/**
 * A step on the space scale. Separation is chosen from the scale rather than
 * stated as a length, so a theme retunes every layout at once and no component
 * invents a rhythm of its own. `0` is the absence of separation.
 */
export type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Across the flow, which for a stack is the inline axis. */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

/** Along the flow, which for a stack is the block axis. */
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

/**
 * Stack arranges its children along the block axis and separates them by one
 * step of the space scale. It paints nothing and adds no semantics: the element
 * is the one the consumer wrote, so a list stays a list and a form stays a form.
 *
 * An axis reaches the stylesheet only when someone decided it. The base rule
 * already carries the family default, and a layout is the most numerous element
 * in a document.
 *
 * There is no input that reverses the children. The order they are written in
 * is the order they are read in, by a screen reader and by the Tab key alike.
 */
@Component({
  selector: '[slStack]',
  standalone: true,
  exportAs: 'slStack',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/stack/stack.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'stack',
    'data-ui-stack': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-align]': 'align() ?? null',
    /* `align` is also an obsolete HTML attribute a browser still honours on a
       div, centring its text; written statically for the input it would stay. */
    '[attr.align]': 'null',
    '[attr.data-justify]': 'justify() ?? null',
  },
})
export class SlStack {
  /** Positions children across the flow. Absent, they stretch. */
  readonly align = input<StackAlign>();
  /** Separation between children, as a step on the space scale. */
  readonly gap = input<StackGap>();
  /** Positions children along the flow; needs a block size to distribute. */
  readonly justify = input<StackJustify>();
}
