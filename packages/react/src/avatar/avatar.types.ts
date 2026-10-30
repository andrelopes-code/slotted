import type { ComponentPropsWithRef, HTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';

/**
 * Which of the five semantic colors the fallback is painted in. `auto` derives
 * it from the name, so the same person keeps the same color in a list that is
 * re-sorted and in a table that is paged.
 */
export type AvatarTone =
  'auto' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** The palette `auto` chooses from, in the order the hash indexes it. */
export type AvatarResolvedTone = Exclude<AvatarTone, 'auto'>;

/** How that color is painted. `soft` is the tinted disc an avatar usually is. */
export type AvatarVariant = 'soft' | 'solid';
/**
 * The ground behind the avatar. `tone` paints the tone behind the fallback and
 * nothing behind a loaded picture; `none` paints nothing; `plate` paints a
 * light plate in every scheme, for a logo designed for a white ground.
 */
export type AvatarSurface = 'tone' | 'none' | 'plate';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** A circle is a person; a square is a team, an organization or a bot. */
export type AvatarShape = 'circle' | 'square';

/** Where the picture is. Four values, because a boolean cannot say why there is none. */
export type AvatarStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** What an application sets once for every avatar under it. */
export interface AvatarDefaults {
  /** BCP 47. Used to upper-case the initials, and by the group to join names. */
  locale: string | undefined;
  shape: AvatarShape;
  size: AvatarSize;
  tone: AvatarTone;
  variant: AvatarVariant;
}

export interface AvatarDefaultsProviderProps extends Partial<AvatarDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives. It names the family's own attributes over the native
 * ones every element shares; `ref` is not named because the element the
 * consumer renders decides its own type, and React passes it through the same
 * spread either way.
 */
export interface AvatarRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
  'data-shape': AvatarShape;
  'data-size': AvatarSize;
  'data-status': AvatarStatus;
  'data-surface': AvatarSurface;
  'data-tone': AvatarResolvedTone;
  'data-ui': string;
  'data-variant': AvatarVariant;
}

/**
 * What `renderImage` receives: everything the family needs on the element that
 * holds the picture, and nothing about which element that is. It is how a
 * Next.js `<Image>` or any other loader still reports its load to the family.
 */
export interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  'data-part': string;
  ref: (element: HTMLImageElement | null) => void;
}

export interface AvatarProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /**
   * Content for the fallback, in place of the initials and the glyph. A logo, a
   * company mark, an `Icon`. The name is still what the avatar is called.
   */
  children?: ReactNode | undefined;
  /**
   * Takes the avatar out of the accessibility tree. For an avatar beside the
   * name it belongs to, where announcing it would read the person twice. The
   * name is still what the initials and the color are derived from.
   */
  decorative?: boolean | undefined;
  /** A deactivated account, or an avatar inside a control the page has turned off. */
  disabled?: boolean | undefined;
  /**
   * A stable identifier to derive the color from, when the name is not stable
   * or two people share one. Defaults to `name`.
   */
  idFor?: string | undefined;
  /**
   * The letters to draw, in place of the ones derived from the name. Two
   * graphemes at most is what the box holds; `xs` draws one.
   */
  initials?: string | undefined;
  /** BCP 47, for the case of the initials. Defaults to the provider, then to the runtime. */
  locale?: string | undefined;
  /**
   * The person or entity this is a picture of. It is the accessible name in
   * every status, the source of the initials, and the seed of the color.
   */
  name?: string | undefined;
  /** Called when the picture's loading status changes. Never called for a status passed in. */
  onStatusChange?: ((status: AvatarStatus) => void) | undefined;
  /**
   * Renders the wiring into the element the page means — an `<a>` for an avatar
   * that navigates to a profile, a `<button>` for one that opens a menu.
   */
  render?: ((props: AvatarRootProps) => ReactNode) | undefined;
  /**
   * Renders the picture into the consumer's own element — a Next.js `<Image>`,
   * a loader with a signed URL — while the family keeps reporting the load.
   */
  renderImage?: ((props: AvatarImageProps) => ReactNode) | undefined;
  /** Defaults to the provider, then to `circle`. */
  shape?: AvatarShape | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: AvatarSize | undefined;
  /** The picture. Absent, the avatar is its fallback and nothing is requested. */
  src?: string | undefined;
  /**
   * Where the picture is. Supplied, it wins over what the family derives from
   * the element — for a server that already knows, or a loader the family
   * cannot see.
   */
  status?: AvatarStatus | undefined;
  /** Defaults to the provider, then to `auto`, which derives it from the name. */
  tone?: AvatarTone | undefined;
  /** Defaults to the provider, then to `soft`. */
  variant?: AvatarVariant | undefined;
  /** The ground behind the avatar; `tone` by default. */
  surface?: AvatarSurface | undefined;
}

export type AvatarGroupLayout = 'stack' | 'spread';

export interface AvatarGroupRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-layout': AvatarGroupLayout;
  'data-part': string;
  'data-shape': AvatarShape;
  'data-size': AvatarSize;
  'data-ui': string;
}

export interface AvatarGroupProps extends ComponentPropsWithRef<'ul'> {
  /** `stack` overlaps the members; `spread` lays them apart and wraps. */
  layout?: AvatarGroupLayout | undefined;
  /** BCP 47, for the digits of the summary and for joining the hidden names. */
  locale?: string | undefined;
  /**
   * The largest number of discs the group draws, the summary included. Above
   * it, one fewer member is shown and the rest are summarized. `false` shows
   * every member.
   */
  max?: number | false | undefined;
  /**
   * What the summary is called. Defaults to the hidden members' names, joined
   * for the locale — which is only possible while every hidden member is in the
   * DOM, so a group given a larger `total` supplies this itself.
   */
  overflowLabel?: string | undefined;
  /** Renders the list into another element — an `<ol>` for a ranked row. */
  render?: ((props: AvatarGroupRootProps) => ReactNode) | undefined;
  /** Provided to every member. An avatar that states its own still wins. */
  shape?: AvatarShape | undefined;
  /** Provided to every member. An avatar that states its own still wins. */
  size?: AvatarSize | undefined;
  /**
   * How many members there really are, when the page renders fewer than it
   * has — a server-paged list showing three of forty. Defaults to the number
   * of children.
   */
  total?: number | undefined;
  /** Provided to every member. An avatar that states its own still wins. */
  variant?: AvatarVariant | undefined;
}
