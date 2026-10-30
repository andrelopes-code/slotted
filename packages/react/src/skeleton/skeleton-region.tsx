import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/skeleton/skeleton.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { skeletonMessages } from '@slotted/core/i18n';
import { useEffect, useMemo, useRef } from 'react';

import { useMessages } from '../i18n';
import { useSkeletonDefaults } from './skeleton-defaults';
import { SkeletonRegionProvider } from './skeleton-region-context';
import { useLoadingVisibility } from './use-loading-visibility';
import type { SkeletonRegionProps, SkeletonRegionRootProps } from './skeleton.types';

/**
 * The thing that is loading, rather than the shapes drawn on it.
 *
 * It owns four facts the boxes inside it cannot own on their own. It carries
 * `aria-busy`, which is the platform's own answer — ARIA 1.2 asks an author to
 * set it "on the container element before the first change" and clear it "when
 * the last change is complete". It holds the one announcement: twelve
 * placeholders are one wait, and PatternFly, the only surveyed library that
 * announces at all, puts the text on each box and then has to warn its readers
 * to give every one of them different words. It takes its whole subtree out of
 * the tab order. And it drives the animation phase every placeholder inside it
 * reads, so a region pulses as one surface instead of as twelve blinks.
 *
 * The announcement is emptied rather than replaced when the wait ends, because
 * emptying a live region announces nothing — so a load says one thing unless
 * `loadedLabel` asks for a second.
 *
 * The region itself is never `inert`, and that is deliberate rather than an
 * omission: an inert subtree is not announced, so marking the region would
 * silence the one thing it has to say. Each placeholder carries `inert`
 * itself, which is what actually takes a covered button out of the tab order,
 * and the announcement is the one child that never does.
 */
export function SkeletonRegion({
  animation,
  children,
  delay,
  live,
  loadedLabel,
  loading = true,
  messages,
  minDuration,
  onReveal,
  render,
  ...nativeProps
}: SkeletonRegionProps) {
  const defaults = useSkeletonDefaults();
  const t = useMessages(skeletonMessages, messages);
  const resolved = {
    animation: animation ?? defaults.animation ?? 'shimmer',
    delay: delay ?? defaults.delay ?? 0,
    label: t('label'),
    live: live ?? defaults.live ?? 'polite',
    loadedLabel: loadedLabel ?? defaults.loadedLabel,
    minDuration: minDuration ?? defaults.minDuration ?? 0,
  };

  const painted = useLoadingVisibility({
    delay: resolved.delay,
    loading,
    minDuration: resolved.minDuration,
  });

  /**
   * The withdrawal, not the prop. With `minDuration` holding, `loading` turns
   * false well before the content is reachable, and an application moving
   * focus on the prop would move it into placeholders.
   */
  const wasPainted = useRef(painted);
  useEffect(() => {
    if (wasPainted.current && !painted) onReveal?.();
    wasPainted.current = painted;
  }, [painted, onReveal]);

  const region = useMemo(
    () => ({ animation: resolved.animation, loading: painted }),
    [resolved.animation, painted],
  );

  const announcement = painted ? resolved.label : (resolved.loadedLabel ?? '');

  const rootProps: SkeletonRegionRootProps = keyedProps({
    ...nativeProps,
    'aria-busy': painted || undefined,
    children: (
      <>
        {resolved.live === 'off' ? null : (
          <span
            data-part="announcement"
            data-part-announcement=""
            data-ui="visually-hidden"
            data-ui-visually-hidden=""
            role="status"
          >
            {announcement}
          </span>
        )}
        {children}
      </>
    ),
    'data-animation': resolved.animation,
    'data-loading': painted || undefined,
    'data-part': 'region',
    'data-ui': 'skeleton',
  });

  return (
    <SkeletonRegionProvider value={region}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </SkeletonRegionProvider>
  );
}
