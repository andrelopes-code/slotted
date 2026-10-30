import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/stat-card/stat-card.css';

import { statCardMessages } from '@slotted/core/i18n';
import { useId, useMemo } from 'react';

import { useLocale, useMessages } from '../i18n';
import { StatCardProvider, toneOf, trendOf } from './stat-card-context';
import { useStatCardDefaults } from './stat-card-defaults';
import type { StatCardContextValue, StatCardProps, StatCardRootProps } from './stat-card.types';

/**
 * A metric with its name, its change and its trend, in a frame.
 *
 * The root holds the facts the parts read — which way is good, the change,
 * the status, whether it is loading — and derives the one thing two parts
 * have to agree on: the tone of the change, which the delta wears and the
 * trend hands to its sparkline. It is derived here, synchronously, from
 * `delta` and `goodWhen`, so the first paint on the server already carries
 * it; a delta that reported its tone upward after mounting would paint one
 * frame in the wrong color and mismatch on hydration.
 *
 * The root is a group named by its label, so a reader who lands on the
 * action inside it hears which metric it belongs to. It carries `aria-busy`
 * while loading; the placeholders are `skeleton`s, and a consumer who wants
 * one announcement for a whole dashboard wraps it in a `SkeletonRegion`.
 */
export function StatCard({
  attention,
  children,
  delta,
  fill,
  formatOptions,
  goodWhen,
  layout,
  loading = false,
  locale,
  messages,
  render,
  size,
  status = 'ready',
  tone,
  ...nativeProps
}: StatCardProps) {
  const defaults = useStatCardDefaults();
  const appLocale = useLocale();
  const t = useMessages(statCardMessages, messages);
  const labelId = useId();
  const resolved = {
    fill: fill ?? defaults.fill ?? 'outline',
    goodWhen: goodWhen ?? defaults.goodWhen ?? 'up',
    layout: layout ?? defaults.layout ?? 'inline',
    size: size ?? defaults.size ?? 'md',
    locale: locale ?? appLocale,
    formatOptions: formatOptions ?? defaults.formatOptions,
  };
  const resolvedTone =
    tone ?? (delta === undefined ? undefined : toneOf(trendOf(delta), resolved.goodWhen));

  const context = useMemo<StatCardContextValue>(
    () => ({
      delta,
      formatOptions: resolved.formatOptions,
      goodWhen: resolved.goodWhen,
      labelId,
      loading,
      locale: resolved.locale,
      t,
      size: resolved.size,
      status,
      tone: resolvedTone,
    }),
    [
      delta,
      resolved.formatOptions,
      resolved.goodWhen,
      labelId,
      loading,
      resolved.locale,
      t,
      resolved.size,
      status,
      resolvedTone,
    ],
  );

  const rootProps: StatCardRootProps = keyedProps({
    'aria-labelledby': labelId,
    ...nativeProps,
    'aria-busy': loading || undefined,
    'data-attention': status === 'ready' && !loading ? attention : undefined,
    children: (
      <StatCardProvider value={context}>
        <div data-part="body" data-part-body="">
          {children}
        </div>
      </StatCardProvider>
    ),
    'data-fill': resolved.fill,
    'data-good-when': resolved.goodWhen,
    'data-layout': resolved.layout,
    'data-loading': loading || undefined,
    'data-part': 'root',
    'data-size': resolved.size,
    'data-status': status,
    'data-tone': resolvedTone,
    'data-ui': 'stat-card',
    role: 'group',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
