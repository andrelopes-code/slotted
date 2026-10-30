import { keyedProps } from '@slotted/core/selector-key';
import type { ContainerBreakoutProps, ContainerBreakoutRootProps } from './container.types';

/**
 * A child that leaves the bound behind and reaches both edges of the
 * container: a table, a banner, a strip of media inside a page of prose.
 *
 * It answers the container rather than the viewport, so it is still correct
 * nested, inside a scroll region, and in a container that does not fill the
 * page. Bounded content returns inside it by nesting another `Container`.
 */
export function ContainerBreakout({ render, ...nativeProps }: ContainerBreakoutProps) {
  const rootProps: ContainerBreakoutRootProps = keyedProps({
    ...nativeProps,
    'data-part': 'breakout',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
