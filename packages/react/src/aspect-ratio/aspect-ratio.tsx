import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/aspect-ratio/aspect-ratio.css';

import type { CSSProperties } from 'react';

import type {
  AspectRatioAttribute,
  AspectRatioProps,
  AspectRatioRootProps,
  AspectRatioValue,
} from './aspect-ratio.types';

const NAMES = new Set(['square', 'landscape', 'portrait', 'video', 'wide']);

/**
 * The attribute the stylesheet keys on, and the token the instance writes
 * when the ratio is a number rather than a name. A pair is written as it was
 * given, `16 / 9`, so the DOM says what the consumer said; a number is its
 * own quotient. A name writes no token: the stylesheet holds the five.
 */
export function resolveAspectRatio(ratio: AspectRatioValue): {
  attribute: AspectRatioAttribute;
  token: string | undefined;
} {
  if (typeof ratio === 'string' && NAMES.has(ratio)) {
    return { attribute: ratio, token: undefined };
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
 * clipped and nothing escapes. The frame reserves; the crop is `Image`'s
 * decision.
 */
export function AspectRatio({ children, ratio, render, style, ...nativeProps }: AspectRatioProps) {
  const { attribute, token } = resolveAspectRatio(ratio);

  const rootProps: AspectRatioRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'root',
    'data-ratio': attribute,
    'data-ui': 'aspect-ratio',
    /* The consumer's own style survives, and the token is written beside it. */
    style:
      token === undefined
        ? style
        : ({ ...style, '--slotted-aspect-ratio': token } as CSSProperties),
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
