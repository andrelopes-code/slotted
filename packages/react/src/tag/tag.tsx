import '@slotted/styles/tag/tag.css';

import type { TagProps, TagRootProps } from './tag.types';

/**
 * The same three appearance axes as Badge, over the same five tones. A tag
 * differs from a badge in what the reader can do with it, not in how it looks.
 */
export function Tag({
  className,
  fill = 'solid',
  render,
  size = 'md',
  variant = 'secondary',
  ...nativeProps
}: TagProps) {
  const rootProps: TagRootProps = {
    ...nativeProps,
    className: ['slotted-tag', className].filter(Boolean).join(' '),
    'data-fill': fill,
    'data-part': 'root',
    'data-size': size,
    'data-slotted-component': 'tag',
    'data-variant': variant,
  };

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
