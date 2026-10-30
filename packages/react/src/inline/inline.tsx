import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/inline/inline.css';

import type { InlineProps, InlineRootProps } from './inline.types';

/**
 * Inline arranges its children along the inline axis and lets them wrap. It
 * paints nothing and adds no semantics: a div is the default because a div
 * claims nothing, and a list of tags or a group of actions is a claim the
 * consumer makes through `render`.
 *
 * An axis reaches the stylesheet only when someone decided it. The base rule
 * already carries the family defaults — wrapping, centred, separated by half a
 * rem — and a layout is the most numerous element in a document.
 *
 * There is no axis that reverses the children. The order they are written in is
 * the order they are read in, by a screen reader and by the Tab key alike.
 */
export function Inline({ align, gap, justify, render, wrap, ...nativeProps }: InlineProps) {
  const rootProps: InlineRootProps = keyedProps({
    ...nativeProps,
    ...(align === undefined ? {} : { 'data-align': align }),
    ...(gap === undefined ? {} : { 'data-gap': String(gap) }),
    ...(justify === undefined ? {} : { 'data-justify': justify }),
    ...(wrap === undefined ? {} : { 'data-wrap': wrap }),
    'data-part': 'root',
    'data-ui': 'inline',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
