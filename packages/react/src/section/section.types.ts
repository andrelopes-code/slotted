import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { HeadingLevelValue } from '../typography';

/** The type step the heading sits at, independent of its rank. */
export type SectionSize = 'sm' | 'md' | 'lg';

/**
 * The rank of the heading. `auto` takes the one the outline gives — `h2`
 * directly in a page, one deeper inside another section.
 */
export type SectionLevel = 'auto' | '1' | '2' | '3' | '4' | '5' | '6';

/** The ground: nothing, or a surface with an edge and a radius and no shadow. */
export type SectionGround = 'none' | 'surface';

/**
 * The form of a top-level heading: `label` is small capitals, `title` is mixed
 * case at a larger step. A nested section keeps the subsection's form.
 */
export type SectionHeadingForm = 'label' | 'title';

/** What an application sets once for every section under it. */
export interface SectionDefaults {
  divider: boolean;
  ground: SectionGround;
  heading: SectionHeadingForm;
  size: SectionSize;
  sticky: boolean;
}

export interface SectionDefaultsProviderProps extends Partial<SectionDefaults> {
  children?: ReactNode | undefined;
}

/** What the family hands its own parts. */
export interface SectionContextValue {
  /** The rank the heading renders at. */
  level: HeadingLevelValue;
  /** The identifier the root names through `aria-labelledby` once a heading is rendered. */
  headingId: string;
  /** Tells the root a heading exists, so it becomes a region. */
  registerHeading: (present: boolean) => void;
  /** Hands the root the header element, so a sticky header's height can be measured. */
  registerHeader: (element: HTMLElement | null) => void;
}

/** What `render` receives for the root. */
export interface SectionRootProps extends HTMLAttributes<HTMLElement> {
  'aria-labelledby'?: string | undefined;
  'data-divider'?: '' | undefined;
  'data-ground': SectionGround;
  'data-heading': SectionHeadingForm;
  'data-level': string;
  'data-part': string;
  'data-size': SectionSize;
  'data-sticky'?: '' | undefined;
  'data-ui': string;
  id: string;
}

/** What `render` receives for a plain part. */
export interface SectionPartProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  /** On the header: the callback the root measures a sticky header through. */
  ref?: Ref<HTMLElement> | undefined;
}

/** What `render` receives for the heading. */
export interface SectionHeadingRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  id: string;
}

export interface SectionProps extends ComponentPropsWithRef<'section'> {
  /** Defaults to the provider, then `false`. A rule under the header. */
  divider?: boolean | undefined;
  /** Defaults to the provider, then `none`. */
  ground?: SectionGround | undefined;
  /** Defaults to the provider, then `label`. The form of a top-level heading. */
  heading?: SectionHeadingForm | undefined;
  /** Defaults to `auto`: the rank the outline gives. */
  level?: SectionLevel | undefined;
  /** Renders the root into another element. */
  render?: ((props: SectionRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then `md`. */
  size?: SectionSize | undefined;
  /** Defaults to the provider, then `false`. The header stays under the page chrome. */
  sticky?: boolean | undefined;
}

export interface SectionPartComponentProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: SectionPartProps) => ReactNode) | undefined;
}

export interface SectionBodyProps extends SectionPartComponentProps {
  /**
   * In a surface section, runs the body to the panel's inline edges and to
   * the block edge it touches, clipped to the panel's corners. For a table or
   * a grid with no frame of its own. Without a surface there is no inset to
   * take back, and it has no effect.
   * @default false
   */
  bleed?: boolean | undefined;
}

export interface SectionEyebrowProps extends ComponentPropsWithRef<'span'> {
  render?: ((props: SectionPartProps) => ReactNode) | undefined;
}

export interface SectionDescriptionProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: SectionPartProps) => ReactNode) | undefined;
}

export interface SectionHeadingProps extends ComponentPropsWithRef<'h2'> {
  /** Renders the heading into another element; `aria-level` keeps the rank when it is not a heading element. */
  render?: ((props: SectionHeadingRootProps) => ReactNode) | undefined;
}
