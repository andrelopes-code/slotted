import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/image/image.css';

import { useCallback, useState } from 'react';
import type { CSSProperties, ReactEventHandler, ReactNode } from 'react';

import { AspectRatio } from '../aspect-ratio/aspect-ratio';
import { Glyph, Icon } from '../icon';
import { useImageDefaults } from './image-defaults';
import type {
  ImageMediaProps,
  ImagePositionAttribute,
  ImageProps,
  ImageRootProps,
  ImageStatus,
} from './image.types';

const POSITIONS = new Set(['center', 'top', 'bottom', 'start', 'end']);

/** Which of the two URLs the element is showing, and what it said about it. */
interface Derived {
  attempt: 'primary' | 'fallback';
  src: string | undefined;
  status: ImageStatus;
}

/**
 * A picture, and what stands in for it before it arrives and after it fails.
 * The `<img>` is the platform's and keeps every attribute the platform gives
 * it; the family adds the two layers under it, a fit, a focal point, a
 * corner and an edge, and composes the frame from `AspectRatio` when a ratio
 * was decided.
 *
 * Nothing is reserved without a decision: `width` and `height` on the
 * element, or `ratio` on the root, are the two ways to decide, and both hold
 * the box before the first byte. A root with neither has no height until the
 * picture reports, which is the platform's own behavior.
 *
 * `status` is the one value the family derives, and a load event is a fact
 * rather than a request: there is nothing to cancel, and the closed reason
 * vocabulary in `docs/state-and-events.md` has no member that fits. It is
 * reported through `onStatusChange`, and a status the consumer passes wins
 * over the derivation — for a server that already knows, or a loader the
 * family cannot see. `fallbackSrc` is tried before `error` is reported.
 */
export function Image({
  alt,
  bordered,
  className,
  decoding,
  fallback,
  fallbackSrc,
  fetchPriority,
  fit,
  layout,
  loading,
  onError,
  onLoad,
  onStatusChange,
  placeholder,
  placeholderContent,
  placeholderSrc,
  position,
  priority = false,
  radius,
  ratio,
  ref,
  render,
  renderImage,
  sources,
  src,
  status,
  style,
  ...nativeProps
}: ImageProps) {
  const defaults = useImageDefaults();

  /**
   * The derivation, and the picture it belongs to. A `src` that changes
   * starts a new request, so the status it produced no longer describes
   * anything; the reset happens during render rather than in an effect, so
   * no frame is ever painted with the previous picture's answer.
   */
  const [derived, setDerived] = useState<Derived>(() => ({
    attempt: 'primary',
    src,
    status: statusFor(src),
  }));
  if (derived.src !== src) setDerived({ attempt: 'primary', src, status: statusFor(src) });

  const resolvedStatus = status ?? derived.status;
  const shownSrc = derived.attempt === 'fallback' ? fallbackSrc : src;

  const report = useCallback(
    (next: Derived) => {
      setDerived((current) => (current.src === next.src ? next : current));
      onStatusChange?.(next.status);
    },
    [onStatusChange],
  );

  /**
   * A picture already in the browser cache finishes decoding before React
   * attaches the load handler, so the callback ref asks the element whether
   * it is already complete rather than waiting for an event that has been
   * and gone. The consumer's own ref is served from the same callback.
   */
  const measure = useCallback(
    (element: HTMLImageElement | null) => {
      if (typeof ref === 'function') ref(element);
      else if (ref !== null && ref !== undefined) ref.current = element;
      if (element === null) return;
      if (element.complete && element.naturalWidth > 0 && derived.status === 'loading') {
        report({ attempt: derived.attempt, src, status: 'loaded' });
      }
    },
    [derived, ref, report, src],
  );

  const handleLoad: ReactEventHandler<HTMLImageElement> = (event) => {
    /* The consumer's handler first, and it always runs. */
    onLoad?.(event);
    /* The callback ref may already have answered for a cached picture. */
    if (derived.status === 'loaded') return;
    report({ attempt: derived.attempt, src, status: 'loaded' });
  };

  /**
   * The first failure is answered with the second URL when there is one, and
   * the status stays `loading` while it is tried; `error` is what is left
   * when nothing could be shown. The consumer's `onError` fires on both, for
   * whoever wants to log the first.
   */
  const handleError: ReactEventHandler<HTMLImageElement> = (event) => {
    onError?.(event);
    if (derived.attempt === 'primary' && fallbackSrc !== undefined) {
      setDerived({ attempt: 'fallback', src, status: 'loading' });
      return;
    }
    report({ attempt: derived.attempt, src, status: 'error' });
  };

  const resolvedLayout = layout ?? (ratio === undefined ? defaults.layout : 'framed');
  const resolvedPosition = position ?? defaults.position;
  const positionAttribute: ImagePositionAttribute = POSITIONS.has(resolvedPosition)
    ? (resolvedPosition as ImagePositionAttribute)
    : 'custom';
  const resolvedPlaceholder = placeholder ?? defaults.placeholder;

  const mediaProps: ImageMediaProps = keyedProps({
    ...nativeProps,
    alt,
    'data-part': 'image',
    decoding: decoding ?? defaults.decoding,
    /* `priority` is Next's and NgOptimizedImage's word; a stated `loading`
       or `fetchPriority` is the consumer's and wins. */
    ...(fetchPriority === undefined
      ? priority
        ? { fetchPriority: 'high' }
        : {}
      : { fetchPriority }),
    loading: loading ?? (priority ? 'eager' : defaults.loading),
    onError: handleError,
    onLoad: handleLoad,
    ref: measure,
    ...(shownSrc === undefined ? {} : { src: shownSrc }),
  });

  const media = renderImage === undefined ? <img {...mediaProps} /> : renderImage(mediaProps);

  const picture =
    sources === undefined || sources.length === 0 ? (
      media
    ) : (
      <picture data-part="picture" data-part-picture="">
        {sources.map((source, index) => (
          <source
            key={index}
            {...(source.media === undefined ? {} : { media: source.media })}
            {...(source.sizes === undefined ? {} : { sizes: source.sizes })}
            srcSet={source.srcSet}
            {...(source.type === undefined ? {} : { type: source.type })}
          />
        ))}
        {media}
      </picture>
    );

  const layers: ReactNode = (
    <>
      {picture}
      <span aria-hidden="true" data-part="placeholder" data-part-placeholder="">
        {resolvedPlaceholder === 'blur' && placeholderSrc !== undefined ? (
          <img alt="" src={placeholderSrc} />
        ) : null}
        {placeholderContent}
      </span>
      <span data-part="fallback" data-part-fallback="">
        {/* The mark a picture leaves behind, unless the consumer wrote their own. */}
        {fallback ?? (
          <Icon>
            <Glyph name="image-off" />
          </Icon>
        )}
      </span>
    </>
  );

  const rootProps: ImageRootProps = keyedProps({
    children: ratio === undefined ? layers : <AspectRatio ratio={ratio}>{layers}</AspectRatio>,
    ...(className === undefined ? {} : { className }),
    'data-fit': fit ?? defaults.fit,
    'data-layout': resolvedLayout,
    'data-part': 'root',
    'data-placeholder': resolvedPlaceholder,
    'data-position': positionAttribute,
    'data-radius': radius ?? defaults.radius,
    'data-status': resolvedStatus,
    'data-ui': 'image',
    ...((bordered ?? defaults.bordered) ? { 'data-bordered': '' } : {}),
    /* The consumer's own style survives, and the focal point is written beside it. */
    style:
      positionAttribute === 'custom'
        ? ({ ...style, '--slotted-image-position': resolvedPosition } as CSSProperties)
        : style,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * Deterministic from the props alone, so a server render and the hydration
 * that follows it start from the same status and nothing flashes between.
 */
function statusFor(src: string | undefined): ImageStatus {
  return src === undefined ? 'idle' : 'loading';
}
