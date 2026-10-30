export type TypographySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type TypographyWeight = 'regular' | 'medium' | 'semibold';
export type TypographyTone =
  | 'inherit'
  | 'default'
  | 'muted'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inverse';
export type TypographyAlign = 'start' | 'center' | 'end';
export type TypographyWrap = 'normal' | 'nowrap' | 'balance' | 'pretty';
export type TypographyTransform = 'none' | 'uppercase' | 'capitalize';
export type TypographyNumeric = 'normal' | 'tabular';

/** The six the platform has. A seventh would be a heading no browser knows. */
export type HeadingLevelValue = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * `inherit` is the absence of a colour rather than a colour of its own, so it
 * removes the attribute and lets the surface decide.
 */
export function toneAttribute(tone: TypographyTone | undefined): string | null {
  return tone === undefined || tone === 'inherit' ? null : tone;
}

/**
 * `true` keeps one line, a number keeps that many, and nothing keeps them all.
 * The count travels to CSS as a custom property, because a line clamp cannot
 * be read from an attribute.
 */
export function truncatedLines(truncate: boolean | number | undefined): number | null {
  if (truncate === undefined || truncate === false) return null;
  if (truncate === true) return 1;
  return Math.max(1, Math.trunc(truncate));
}
