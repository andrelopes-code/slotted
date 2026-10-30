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

/**
 * `inherit` is the absence of a color rather than a color of its own, so it
 * removes the attribute and lets the surface decide.
 */
export function toneAttribute(tone: IconTone | undefined): string | null {
  return tone === undefined || tone === 'inherit' ? null : tone;
}
