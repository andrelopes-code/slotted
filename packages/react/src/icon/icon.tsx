import '@slotted/styles/icon/icon.css';

import type { IconProps } from './icon.types';

/**
 * Icon is the box a glyph is drawn in, not the glyph. The library ships no
 * catalogue: the artwork is the consumer's — a Lucide component, an inline
 * `svg`, anything that renders one — and this family owns the size it is drawn
 * at, the color it inherits, where it sits against a line of text, and
 * whether it mirrors where reading runs the other way.
 *
 * An axis reaches the stylesheet only when someone decided it; the base rule
 * already paints the default size, and `tone: 'inherit'` is the absence of a
 * color rather than a color of its own.
 */
export function Icon({ directional, label, size, tone, ...nativeProps }: IconProps) {
  /**
   * The icon is decorative when it has no name and meaningful when it has one,
   * which is why there is no `decorative` prop: named and hidden cannot both
   * be true. The naming attributes are read as well as `label`, because
   * `<Icon aria-label="…" />` is what a consumer writes without reading the
   * documentation, and answering it with a hidden, named icon would be a
   * silent defect in the likeliest mistake.
   */
  const named =
    label !== undefined ||
    nativeProps['aria-label'] !== undefined ||
    nativeProps['aria-labelledby'] !== undefined;

  return (
    <span
      {...nativeProps}
      {...(size === undefined ? {} : { 'data-size': size })}
      {...(tone === undefined || tone === 'inherit' ? {} : { 'data-tone': tone })}
      {...(directional === true ? { 'data-directional': '' } : {})}
      {...(named
        ? {
            role: nativeProps.role ?? 'img',
            ...(label === undefined ? {} : { 'aria-label': label }),
          }
        : { 'aria-hidden': true })}
      data-part="root"
      data-part-root=""
      data-ui="icon"
      data-ui-icon=""
    />
  );
}
