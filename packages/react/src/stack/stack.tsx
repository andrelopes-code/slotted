import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/stack/stack.css';

import type { StackProps, StackRootProps } from './stack.types';

/**
 * Stack arranges its children along the block axis and separates them by one
 * step of the space scale. It paints nothing and adds no semantics: a div is
 * the default because a div claims nothing, and a list, a form or a section is
 * a claim the consumer makes through `render`.
 *
 * An axis reaches the stylesheet only when someone decided it. The base rule
 * already carries the family default, and a layout is the most numerous
 * element in a document.
 *
 * There is no axis that reverses the children. The order they are written in is
 * the order they are read in, by a screen reader and by the Tab key alike.
 */
export function Stack({ align, gap, justify, render, ...nativeProps }: StackProps) {
  const rootProps: StackRootProps = keyedProps({
    ...nativeProps,
    ...(align === undefined ? {} : { 'data-align': align }),
    ...(gap === undefined ? {} : { 'data-gap': String(gap) }),
    ...(justify === undefined ? {} : { 'data-justify': justify }),
    'data-part': 'root',
    'data-ui': 'stack',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
