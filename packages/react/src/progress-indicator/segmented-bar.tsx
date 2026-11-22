import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/progress-indicator/progress-indicator.css';

import type { CSSProperties } from 'react';

import { useLocale } from '../i18n';
import { useProgressIndicatorDefaults } from './progress-indicator-defaults';
import type { SegmentedBarProps } from './progress-indicator.types';

/**
 * One total split into parts: one bar of segments whose widths are in the
 * ratio of their values, for a budget by category or a quota by file type,
 * with a table or a list beside it as the legend. The track is a picture of
 * the parts (`role="img"`), named by every part's label in order in the
 * language's list format; the scale under it stays text. `current` marks one
 * part and dims the others, which a row of the legend sets from its pointer.
 */
export function SegmentedBar({
  'aria-label': ariaLabel,
  current = null,
  end,
  segments,
  size,
  start,
  style,
  ...nativeProps
}: SegmentedBarProps) {
  const defaults = useProgressIndicatorDefaults();
  const locale = useLocale();
  const parts = new Intl.ListFormat(locale, { type: 'unit' }).format(
    segments.map((segment) => segment.label),
  );
  const keyOf = (index: number) => segments[index]?.key ?? index;

  return (
    <div
      {...keyedProps({
        ...nativeProps,
        ...(current === null ? {} : { 'data-current': '' }),
        'data-part': 'root',
        'data-shape': 'segmented',
        'data-size': size ?? defaults.size,
        'data-ui': 'progress-indicator',
        style,
      })}
    >
      <div
        aria-label={ariaLabel === undefined ? parts : `${ariaLabel}: ${parts}`}
        data-part="track"
        data-part-track=""
        role="img"
      >
        {segments.map((segment, index) => (
          <span
            data-part="segment"
            data-part-segment=""
            key={String(keyOf(index))}
            {...(segment.pattern === undefined ? {} : { 'data-pattern': segment.pattern })}
            {...(current !== null && keyOf(index) === current ? { 'data-current': '' } : {})}
            style={
              {
                '--_segment-color': `var(--slotted-data-${String(segment.color ?? (index % 8) + 1)})`,
                flexGrow: Math.max(0, segment.value),
              } as CSSProperties
            }
          />
        ))}
      </div>
      {start === undefined && end === undefined ? null : (
        <div data-part="scale" data-part-scale="">
          <span>{start}</span>
          <span>{end}</span>
        </div>
      )}
    </div>
  );
}
