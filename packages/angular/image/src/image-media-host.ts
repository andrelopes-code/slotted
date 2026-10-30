import { InjectionToken } from '@angular/core';

/**
 * What the picture tells the image it sits in.
 *
 * It is a token rather than the component's own class so that one directive
 * can serve both pictures the family knows about: the `<img>` the image
 * renders for its own `src`, and the `<img>` the consumer projects — which is
 * the one that carries `ngSrc`, and therefore the one `NgOptimizedImage` can
 * reach. A directive that injected the component directly would put a cycle
 * between the two files, and the component imports the directive for its own
 * template.
 */
export interface ImageMediaHost {
  /** The picture arrived, or was already there. */
  reportLoaded(): void;
  /** The picture failed. The host decides whether a second URL is tried. */
  reportError(): void;
}

export const IMAGE_MEDIA_HOST = new InjectionToken<ImageMediaHost>('slotted image media host');
