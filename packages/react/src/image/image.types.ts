import type { ComponentPropsWithRef, HTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';

import type { AspectRatioValue } from '../aspect-ratio/aspect-ratio.types';

/**
 * How wide and how tall the box is. `intrinsic` is the picture's own size,
 * shrunk to fit; `fill` is the parent's in both axes; `framed` is the
 * column's width and the frame's height, and it is what a decided `ratio`
 * implies.
 */
export type ImageLayout = 'intrinsic' | 'fill' | 'framed';

/** The five values `object-fit` has. `cover` crops; `contain` letterboxes. */
export type ImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

/**
 * The focal point a crop keeps. `start` and `end` are the family's own —
 * `object-position` has no logical keywords — and mirror under `dir="rtl"`.
 * Any other value (`30% 20%`, a CMS focal point) is written on the instance.
 */
export type ImagePosition = 'center' | 'top' | 'bottom' | 'start' | 'end';

/** What the DOM says the focal point is: one of the names, or `custom`. */
export type ImagePositionAttribute = ImagePosition | 'custom';

export type ImageRadius = 'none' | 'sm' | 'md' | 'lg';

/**
 * What stands under the picture while it is on its way. `surface` is the
 * sunken ground; `blur` is `placeholderSrc` scaled and blurred where the
 * picture will be; `none` paints nothing.
 */
export type ImagePlaceholder = 'none' | 'surface' | 'blur';

/** Where the picture is. Four values, because a boolean cannot say why there is none. */
export type ImageStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** One `<source>` of a `<picture>`: art direction by media, or a format by type. */
export interface ImageSource {
  media?: string | undefined;
  sizes?: string | undefined;
  srcSet: string;
  type?: string | undefined;
}

/** What an application sets once for every image under it. */
export interface ImageDefaults {
  bordered: boolean;
  decoding: NonNullable<ImgHTMLAttributes<HTMLImageElement>['decoding']>;
  fit: ImageFit;
  layout: ImageLayout;
  loading: NonNullable<ImgHTMLAttributes<HTMLImageElement>['loading']>;
  placeholder: ImagePlaceholder;
  position: ImagePosition | (string & {});
  radius: ImageRadius;
}

export interface ImageDefaultsProviderProps extends Partial<ImageDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the root. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element — an
 * `<a>` for a thumbnail that opens a page, a `<button>` for one that opens a
 * dialog, a `<figure>` for one with a caption.
 */
export interface ImageRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-bordered'?: '' | undefined;
  'data-fit': ImageFit;
  'data-layout': ImageLayout;
  'data-part': string;
  'data-placeholder': ImagePlaceholder;
  'data-position': ImagePositionAttribute;
  'data-radius': ImageRadius;
  'data-status': ImageStatus;
  'data-ui': string;
}

/**
 * What `renderImage` receives: everything the family needs on the element
 * that holds the picture, and nothing about which element that is. It is
 * how a Next.js `<Image>` or any other loader still reports its load to the
 * family.
 */
export interface ImageMediaProps extends ImgHTMLAttributes<HTMLImageElement> {
  'data-part': string;
  ref: (element: HTMLImageElement | null) => void;
}

/**
 * `placeholder` is omitted and redeclared: on an `img` the attribute means
 * nothing, and this family's axis is what stands under the picture. `alt` is
 * redeclared as required, because the WAI decision tree has no branch for a
 * picture that says nothing about itself — `""` is the decorative branch.
 *
 * Everything else is the element's, and it reaches the element: `src`,
 * `srcSet`, `sizes`, `width`, `height`, `loading`, `decoding`,
 * `fetchPriority`, `crossOrigin`, `referrerPolicy`, every `aria-*` and every
 * handler, and `ref`. `className` and `style` are the exception, and they
 * reach the root, because the root is what a consumer sees and sizes.
 */
export interface ImageProps extends Omit<
  ComponentPropsWithRef<'img'>,
  'alt' | 'children' | 'placeholder'
> {
  /** What the picture shows, or `""` for a picture that is decoration beside its own text. */
  alt: string;
  /** A subtle inset edge, for a photograph of a white wall on a white page. */
  bordered?: boolean | undefined;
  /**
   * Content of the fallback, in place of the glyph, once the picture has
   * failed: a message, a retry, a logotype.
   */
  fallback?: ReactNode | undefined;
  /**
   * A second URL to try when `src` fails. The status stays `loading` while it
   * is tried, and `error` is reached only if it fails too.
   */
  fallbackSrc?: string | undefined;
  /** Defaults to the provider, then to `cover`. */
  fit?: ImageFit | undefined;
  /**
   * Defaults to the provider, then to `intrinsic`; a `ratio` implies
   * `framed` unless one is stated.
   */
  layout?: ImageLayout | undefined;
  /** Called when the picture's loading status changes. Never called for a status passed in. */
  onStatusChange?: ((status: ImageStatus) => void) | undefined;
  /** Defaults to the provider, then to `surface`. */
  placeholder?: ImagePlaceholder | undefined;
  /**
   * Content over the placeholder's ground while the picture is on its way —
   * a `Skeleton`, a blurhash canvas.
   */
  placeholderContent?: ReactNode | undefined;
  /** The small picture `placeholder="blur"` scales and blurs. A data URI, usually. */
  placeholderSrc?: string | undefined;
  /**
   * A focal point: one of the five names, or any `object-position` value,
   * written on the instance. Defaults to the provider, then to `center`.
   */
  position?: ImagePosition | (string & {}) | undefined;
  /**
   * The picture the page is waiting for: `loading="eager"` and
   * `fetchPriority="high"`, unless either is stated. Next's and
   * NgOptimizedImage's word for it.
   */
  priority?: boolean | undefined;
  /** Defaults to the provider, then to `none`. */
  radius?: ImageRadius | undefined;
  /**
   * The proportion the box holds before the picture arrives. Renders an
   * `AspectRatio` inside the root and lays the picture out `framed`.
   */
  ratio?: AspectRatioValue | undefined;
  /** Renders the root into the element the page means. */
  render?: ((props: ImageRootProps) => ReactNode) | undefined;
  /**
   * Renders the picture into the consumer's own element — a Next.js
   * `<Image>`, a loader with a signed URL — while the family keeps reporting
   * the load.
   */
  renderImage?: ((props: ImageMediaProps) => ReactNode) | undefined;
  /** The `<source>`s of a `<picture>`, in order. The `<img>` is written last. */
  sources?: readonly ImageSource[] | undefined;
  /**
   * Where the picture is. Supplied, it wins over what the family derives
   * from the element — for a server that already knows, or a loader the
   * family cannot see.
   */
  status?: ImageStatus | undefined;
}
