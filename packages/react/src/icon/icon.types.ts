import type { GlyphName } from '@slotted/core/glyph';
import type { ComponentPropsWithRef } from 'react';

/**
 * Three steps read the control icon scale, which the theme restates per
 * density. `text` follows the type the icon sits in, because a control-sized
 * glyph inside a display heading is not an icon.
 */
export type IconSize = 'text' | 'sm' | 'md' | 'lg';

export type IconTone =
  | 'inherit'
  | 'default'
  | 'muted'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inverse';

export interface IconProps extends ComponentPropsWithRef<'span'> {
  /**
   * The artwork points somewhere, so it mirrors in a right-to-left document.
   * An arrow, a chevron and a reply are directional; a clock and a warning are
   * not, and mirroring them only makes them wrong.
   */
  directional?: boolean | undefined;
  /**
   * The name the icon carries when it says something the text around it does
   * not. Absent, the icon leaves the accessibility tree: there is no separate
   * decorative switch, so an icon cannot be named and hidden at once.
   */
  label?: string | undefined;
  size?: IconSize | undefined;
  /** `inherit` takes the color of whatever contains the icon. */
  tone?: IconTone | undefined;
}

export interface GlyphProps extends Omit<ComponentPropsWithRef<'svg'>, 'children'> {
  /** One of the library's own icons: its glyph token without `--slotted-icon-`. */
  name: GlyphName;
  /**
   * The first shape filled and the symbol cut out of it — a tone's status
   * mark. For glyphs whose first shape encloses the rest (`circle-*`,
   * `triangle-alert`).
   */
  solid?: boolean | undefined;
}
