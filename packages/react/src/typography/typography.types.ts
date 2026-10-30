import type { ComponentPropsWithoutRef, CSSProperties, HTMLAttributes, ReactNode } from 'react';

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

export interface TypographyAxes {
  /**
   * Alignment needs a box to align inside, so asking for it turns the default
   * inline element into a block.
   */
  align?: TypographyAlign | undefined;
  numeric?: TypographyNumeric | undefined;
  size?: TypographySize | undefined;
  /** `inherit` takes the color of whatever contains the text. */
  tone?: TypographyTone | undefined;
  transform?: TypographyTransform | undefined;
  /**
   * `true` keeps one line, a number keeps that many. The whole string stays in
   * the document either way: only the picture is shorter.
   */
  truncate?: boolean | number | undefined;
  weight?: TypographyWeight | undefined;
  wrap?: TypographyWrap | undefined;
}

export interface TypographyRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  'data-ui': string;
  style?: CSSProperties | undefined;
}

export interface TextProps extends ComponentPropsWithoutRef<'span'>, TypographyAxes {
  /** Renders the wiring into another element when a span is the wrong claim. */
  render?: ((props: TypographyRootProps) => ReactNode) | undefined;
}

export interface HeadingProps extends ComponentPropsWithoutRef<'h2'>, TypographyAxes {
  /**
   * The rank of the heading, which decides the element. Left out, the heading
   * takes the level its section provides.
   */
  level?: HeadingLevelValue | undefined;
}

export interface HeadingLevelProps {
  children?: ReactNode | undefined;
}
