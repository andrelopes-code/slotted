import {
  createTimeFormat,
  rulerKeyTarget,
  rulerScale,
  rulerShare,
  rulerTimeAt,
  SECONDS_PER_DAY,
  secondsOfDay,
} from '@slotted/core/date';
import type { ClockModel, PlainTime } from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';
import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { useMessages } from '../i18n';

interface PickerRulerProps {
  readonly end: PlainTime | null;
  readonly hourCycle?: 12 | 24 | undefined;
  readonly locale: string;
  readonly model: ClockModel;
  readonly onMove: (position: 'start' | 'end', time: PlainTime, source: unknown) => void;
  readonly start: PlainTime | null;
  readonly step: number;
}

/** The day as one axis: the run as a band with a handle on each end. */
export function PickerRuler(props: PickerRulerProps) {
  const { end, hourCycle, locale, model, onMove, start, step } = props;
  const t = useMessages(pickerPanelMessages);
  const trackRef = useRef<HTMLDivElement>(null);
  const format = createTimeFormat({ locale, hourCycle });
  const ends = { start, end };

  function handleKeyDown(position: 'start' | 'end', event: KeyboardEvent<HTMLElement>) {
    const held = ends[position];
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const next = held && rulerKeyTarget({ key: event.key, rtl }, held, model, step);
    if (next === null) return;

    event.preventDefault();
    onMove(position, next, event);
  }

  function handlePointerMove(position: 'start' | 'end', event: PointerEvent<HTMLElement>) {
    const track = trackRef.current;
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || track === null) return;

    const box = track.getBoundingClientRect();
    const share = (event.clientX - box.left) / box.width;
    const rtl = getComputedStyle(track).direction === 'rtl';
    const next = rulerTimeAt(rtl ? 1 - share : share, model);
    if (next !== null) onMove(position, next, event);
  }

  const [from, to] = [start, end].map((time) => (time === null ? null : rulerShare(time)));
  const whole = from != null && to != null && to > from;

  return (
    <div data-part="ruler" data-part-ruler="">
      <div data-part="ruler-track" data-part-ruler-track="" ref={trackRef}>
        {model.hours.map((hour) => (
          <span
            data-part="ruler-hour"
            data-part-ruler-hour=""
            key={hour.value}
            {...(hour.unavailable ? { 'data-unavailable': '' } : {})}
          />
        ))}

        {whole && (
          <div
            data-part="ruler-band"
            data-part-ruler-band=""
            style={{ insetInlineStart: `${String(from)}%`, inlineSize: `${String(to - from)}%` }}
          />
        )}

        {(['start', 'end'] as const).map((position) => {
          const held = ends[position];
          if (held === null) return null;

          return (
            <div
              aria-label={t(`${position}Handle`)}
              aria-valuemax={SECONDS_PER_DAY - 1}
              aria-valuemin={0}
              aria-valuenow={secondsOfDay(held)}
              aria-valuetext={format.describe(held)}
              data-part="ruler-handle"
              data-part-ruler-handle=""
              key={position}
              onKeyDown={(event) => handleKeyDown(position, event)}
              onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
              onPointerMove={(event) => handlePointerMove(position, event)}
              role="slider"
              style={{ insetInlineStart: `${String(rulerShare(held))}%` }}
              tabIndex={0}
            />
          );
        })}
      </div>

      <div aria-hidden="true" data-part="ruler-scale" data-part-ruler-scale="">
        {rulerScale(format).map((hour) => (
          <span key={hour}>{hour}</span>
        ))}
      </div>
    </div>
  );
}
