import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

/**
 * The five ratios a product decides once, named for what they hold rather
 * than for their numbers, so the decision reads in the DOM.
 */
export type AspectRatioName = 'square' | 'landscape' | 'portrait' | 'video' | 'wide';

/**
 * A name, a number (`16 / 9`), or the pair the number came from (`[16, 9]`).
 * The pair is written into the stylesheet exactly, where a number would be
 * written as its quotient.
 */
export type AspectRatioValue = AspectRatioName | number | readonly [number, number];

/** What the DOM says the ratio is: one of the names, or `custom` for a number. */
export type AspectRatioAttribute = AspectRatioName | 'custom';

const NAMES = new Set(['square', 'landscape', 'portrait', 'video', 'wide']);

/**
 * The attribute the stylesheet keys on, and the token the instance writes
 * when the ratio is a number rather than a name. A pair is written as it was
 * given, `16 / 9`, so the DOM says what the consumer said; a number is its
 * own quotient. A name writes no token: the stylesheet holds the five.
 */
export function resolveAspectRatio(ratio: AspectRatioValue): {
  attribute: AspectRatioAttribute;
  token: string | null;
} {
  if (typeof ratio === 'string' && NAMES.has(ratio)) {
    return { attribute: ratio, token: null };
  }
  if (typeof ratio === 'number') {
    return { attribute: 'custom', token: String(ratio) };
  }
  const [width, height] = ratio as readonly [number, number];
  return { attribute: 'custom', token: `${width} / ${height}` };
}

/**
 * A box that is a stated proportion of its own width before anything is in
 * it, so a picture, a map or an embedded player arrives into room already
 * held for it and moves nothing below.
 *
 * It is the platform's `aspect-ratio`, not the padding hack, and the
 * difference is what happens to content taller than the box: the frame keeps
 * the ratio while the content fits and grows when it does not. Nothing is
 * clipped and nothing escapes. The frame reserves; the crop is `slImage`'s
 * decision.
 *
 * The component is written on the element the page chose — a `div`, a
 * `figure`, an `li` — and projects whatever the consumer put in it.
 */
@Component({
  selector: '[slAspectRatio]',
  standalone: true,
  exportAs: 'slAspectRatio',
  template: `<ng-content></ng-content>`,
  styleUrl: '../../../styles/src/aspect-ratio/aspect-ratio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'aspect-ratio',
    'data-ui-aspect-ratio': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-ratio]': 'resolved().attribute',
    '[style.--slotted-aspect-ratio]': 'resolved().token',
  },
})
export class SlAspectRatio {
  /**
   * The proportion the box holds before anything is in it. Required: the
   * ratio is the consumer's decision, and a frame that named none is a frame
   * nobody thought about.
   */
  readonly ratio = input.required<AspectRatioValue>();

  protected readonly resolved = computed(() => resolveAspectRatio(this.ratio()));
}
