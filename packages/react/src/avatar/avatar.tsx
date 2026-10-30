import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/avatar/avatar.css';

import { useCallback, useState } from 'react';
import type { ReactEventHandler } from 'react';

import { initialsFrom, toneFrom } from '@slotted/core/identity';

import { Glyph, Icon } from '../icon';
import { useAvatarDefaults } from './avatar-defaults';
import type {
  AvatarImageProps,
  AvatarProps,
  AvatarResolvedTone,
  AvatarRootProps,
  AvatarStatus,
} from './avatar.types';

/**
 * The palette `tone="auto"` chooses from, in the order the hash indexes it.
 * Five is a small palette and collisions are frequent by construction: the
 * colour is an aid to scanning a list of faces, and the name is what identifies
 * the person — which is why it is on the root in every one of the four
 * statuses.
 */
const AUTO_TONES: readonly AvatarResolvedTone[] = [
  'accent',
  'secondary',
  'success',
  'warning',
  'danger',
];

/** At the smallest step there is room for one letter, which is Fluent's rule at 16 pixels. */
const INITIALS_MAX = { xs: 1, sm: 2, md: 2, lg: 2, xl: 2 } as const;

/**
 * A picture of a person or an entity, and what stands in when there is none:
 * the initials taken from the name, then a glyph the family owns. A request
 * that fails never paints the browser's torn-page mark, because the picture is
 * out of sight until it reports that it arrived.
 *
 * The name lives on the root and the picture takes an empty `alt`, so the
 * avatar announces the same thing before and after the photograph loads. Every
 * surveyed implementation names the image instead, which makes the same avatar
 * “Ada Lovelace” once the picture arrives and “AL” before it.
 *
 * `status` is the one value the family derives, and a load event is a fact
 * rather than a request: there is nothing to cancel, and the closed reason
 * vocabulary in `docs/state-and-events.md` has no member that fits. It is
 * reported through `onStatusChange`, and a status the consumer passes wins over
 * the derivation — for a server that already knows, or a loader the family
 * cannot see.
 */
export function Avatar({
  children,
  decorative = false,
  disabled = false,
  idFor,
  initials,
  locale,
  name,
  onStatusChange,
  render,
  renderImage,
  role,
  shape,
  size,
  src,
  status,
  surface = 'tone',
  tone,
  variant,
  ...nativeProps
}: AvatarProps) {
  const defaults = useAvatarDefaults();
  const resolvedSize = size ?? defaults.size;
  const resolvedLocale = locale ?? defaults.locale;

  /**
   * The derivation, and the picture it belongs to. A `src` that changes starts
   * a new request, so the status it produced no longer describes anything; the
   * reset happens during render rather than in an effect, so no frame is ever
   * painted with the previous picture's answer.
   */
  const [derived, setDerived] = useState(() => ({ src, status: statusFor(src) }));
  if (derived.src !== src) setDerived({ src, status: statusFor(src) });

  const resolvedStatus = status ?? derived.status;

  const report = useCallback(
    (next: AvatarStatus, forSrc: string | undefined) => {
      setDerived((current) => (current.src === forSrc ? { src: forSrc, status: next } : current));
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  /**
   * A picture already in the browser cache finishes decoding before React
   * attaches the load handler, so the callback ref asks the element whether it
   * is already complete rather than waiting for an event that has been and
   * gone. Without it an avatar shows initials over a picture that is already
   * there.
   */
  const measure = useCallback(
    (element: HTMLImageElement | null) => {
      if (element === null) return;
      if (element.complete && element.naturalWidth > 0) report('loaded', element.currentSrc || src);
    },
    [report, src],
  );

  const handleLoad: ReactEventHandler<HTMLImageElement> = () => report('loaded', src);
  const handleError: ReactEventHandler<HTMLImageElement> = () => report('error', src);

  const resolvedTone =
    (tone ?? defaults.tone) === 'auto'
      ? (toneFrom({ seed: idFor ?? name, tones: AUTO_TONES }) ?? 'secondary')
      : ((tone ?? defaults.tone) as AvatarResolvedTone);

  const letters =
    initials ?? initialsFrom({ name, max: INITIALS_MAX[resolvedSize], locale: resolvedLocale });

  const imageProps: AvatarImageProps | undefined =
    src === undefined
      ? undefined
      : {
          /* The root carries the name; naming the picture as well would read the
             person twice, and would name them differently before it loads. */
          alt: '',
          'data-part': 'image',
          ...selectorKeyProps('part', 'image'),
          onError: handleError,
          onLoad: handleLoad,
          ref: measure,
          src,
        };

  const rootProps: AvatarRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {imageProps === undefined ? null : renderImage === undefined ? (
          <img {...imageProps} />
        ) : (
          renderImage(imageProps)
        )}
        <span data-part="fallback" data-part-fallback="">
          {/* No picture and no name to take initials from: the person glyph. */}
          {children ??
            (letters === '' ? (
              <Icon>
                <Glyph name="person" />
              </Icon>
            ) : (
              letters
            ))}
        </span>
      </>
    ),
    'data-part': 'root',
    'data-shape': shape ?? defaults.shape,
    'data-size': resolvedSize,
    'data-status': resolvedStatus,
    'data-surface': surface,
    'data-tone': resolvedTone,
    'data-ui': 'avatar',
    'data-variant': variant ?? defaults.variant,
    ...(disabled ? { 'data-disabled': '' } : {}),
    /**
     * The W3C `alt` decision tree, in this library's vocabulary and with the
     * rule `icon` already took: a name present decides `role="img"`, an absent
     * one decides `aria-hidden`. `decorative` is the third case — a name that
     * is written beside the avatar, where announcing it reads the person twice.
     */
    ...(decorative || name === undefined || name.trim() === ''
      ? { 'aria-hidden': true }
      : { 'aria-label': name, role: 'img' }),
    /* An explicit role the consumer wrote is never replaced by an inferred one. */
    ...(role === undefined ? {} : { role }),
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}

/**
 * Deterministic from the props alone, so a server render and the hydration that
 * follows it start from the same status and nothing flashes between them.
 */
function statusFor(src: string | undefined): AvatarStatus {
  return src === undefined ? 'idle' : 'loading';
}
