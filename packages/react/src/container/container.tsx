import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/container/container.css';

import { useContainerDefaults } from './container-defaults';
import type { ContainerProps, ContainerRootProps } from './container.types';

/**
 * Bounds the inline size of a region, insets it from the edge of the space it
 * was given, and places it inside that space. It paints nothing, separates
 * nothing and claims no semantics: a `div` claims nothing, and `main`,
 * `section` or `article` is a claim the consumer makes through `render`.
 *
 * The root is a three-track grid rather than a box with a maximum, because a
 * `ContainerBreakout` child needs a track to span. A run of text written
 * directly inside it becomes an item nothing can select and is placed in the
 * start gutter; wrap text in an element, as every layout family in this
 * library already requires.
 */
export function Container({ align, inset, render, size, ...nativeProps }: ContainerProps) {
  const defaults = useContainerDefaults();

  const rootProps: ContainerRootProps = keyedProps({
    ...nativeProps,
    'data-align': align ?? defaults.align,
    'data-inset': String(inset ?? defaults.inset),
    'data-part': 'root',
    'data-size': size ?? defaults.size,
    'data-ui': 'container',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
