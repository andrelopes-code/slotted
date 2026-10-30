import { keyedProps } from '@slotted/core/selector-key';
import type { CSSProperties } from 'react';

import type { BadgeAnchorProps, BadgeAnchorRootProps } from './badge.types';

/**
 * The correction, as the two custom properties the stylesheet reads. An axis
 * the page did not state is left out rather than written as nought, so the
 * frame's own default is what answers and a theme that moves it still wins.
 */
function offsetStyle(offset: BadgeAnchorProps['offset']): CSSProperties | undefined {
  if (offset === undefined) return undefined;
  const style: Record<string, string> = {};
  if (offset.x !== undefined) style['--slotted-badge-anchor-offset-x'] = `${offset.x}px`;
  if (offset.y !== undefined) style['--slotted-badge-anchor-offset-y'] = `${offset.y}px`;
  return style as CSSProperties;
}

/**
 * The frame that places a badge on the corner of something else. It wraps the
 * host rather than rewriting it: React cannot safely reach into an element it
 * did not render, and a frame that only worked when the host was one of the
 * elements it knew would fail silently on every other one.
 *
 * The consequence is written on the reference page: the badge is read after the
 * host in document order, and an interactive host whose name must carry the
 * count wires `aria-describedby` to the badge's own id, or names the count in
 * its own `aria-label`.
 *
 * The badge is the anchor's last child, after the host it sits on.
 */
export function BadgeAnchor({
  offset,
  overlap = 'rectangle',
  placement = 'top-end',
  render,
  style,
  ...nativeProps
}: BadgeAnchorProps) {
  const correction = offsetStyle(offset);
  const rootProps: BadgeAnchorRootProps = keyedProps({
    ...nativeProps,
    'data-overlap': overlap,
    'data-part': 'anchor',
    'data-placement': placement,
    'data-ui': 'badge',
    /* The consumer's own style is spread first: a page that writes the two
       properties by hand keeps them, and `offset` is the named way to do it. */
    ...(correction === undefined && style === undefined
      ? {}
      : { style: { ...style, ...correction } }),
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
