import { inject, InjectionToken } from '@angular/core';

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

export type ImageLoading = 'lazy' | 'eager';
export type ImageDecoding = 'async' | 'sync' | 'auto';

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
  decoding: ImageDecoding;
  fit: ImageFit;
  layout: ImageLayout;
  loading: ImageLoading;
  placeholder: ImagePlaceholder;
  position: ImagePosition | (string & {});
  radius: ImageRadius;
}

const FALLBACK: ImageDefaults = {
  bordered: false,
  decoding: 'async',
  fit: 'cover',
  layout: 'intrinsic',
  loading: 'lazy',
  placeholder: 'surface',
  position: 'center',
  radius: 'none',
};

export const IMAGE_DEFAULTS = new InjectionToken<ImageDefaults>('slotted image defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its pictures are cut, cornered, edged and
 * held before they arrive, rather than repeating the same inputs on every
 * thumbnail in every grid. An image that states any of them itself still
 * wins: an explicit input is never overridden by the token.
 */
export function provideImageDefaults(defaults: Partial<ImageDefaults>) {
  return {
    provide: IMAGE_DEFAULTS,
    useFactory: (): ImageDefaults => ({
      bordered: defaults.bordered ?? FALLBACK.bordered,
      decoding: defaults.decoding ?? FALLBACK.decoding,
      fit: defaults.fit ?? FALLBACK.fit,
      layout: defaults.layout ?? FALLBACK.layout,
      loading: defaults.loading ?? FALLBACK.loading,
      placeholder: defaults.placeholder ?? FALLBACK.placeholder,
      position: defaults.position ?? FALLBACK.position,
      radius: defaults.radius ?? FALLBACK.radius,
    }),
  };
}

/** What an image renders as here, before it states anything of its own. */
export function injectImageDefaults(): ImageDefaults {
  return inject(IMAGE_DEFAULTS);
}
