import {
  blockedAround,
  isDateRefusedInRun,
  orderedRun,
  presetValue,
  stepRun,
} from '@slotted/core/date';
import type { DateRangeRules, PickerPreset, PlainDate } from '@slotted/core/date';
import { useCallback, useMemo, useState } from 'react';

import { isSameValue } from '../calendar';
import type { CalendarValue, DateRange } from '../calendar';
import { usePickerDraft } from '../picker-panel/use-picker-draft';
import type { DateRangePickerPosition } from './date-range-picker.types';

/** How far `contiguous` looks for an unavailable day when no `maxLength` bounds it. */
const CONTIGUOUS_SEARCH = 366;

interface RangeDraftOptions {
  readonly held: DateRange | null;
  readonly isOpen: boolean;
  readonly onPosition: (next: DateRangePickerPosition, source: unknown) => void;
  readonly position: DateRangePickerPosition;
  readonly presets: readonly PickerPreset<DateRange>[];
  readonly rules: DateRangeRules;
}

/**
 * The run the panel composes. A press in the grid writes the end the position
 * names: the first press of a run opens it, and the second closes it. The end
 * is withheld from the grid while it is the one being chosen, because a press
 * on a whole run starts another one.
 */
export function useRangeDraft(options: RangeDraftOptions) {
  const { held, isOpen, onPosition, position, rules } = options;
  const { draft, setDraft } = usePickerDraft({ equals: isSameValue, isOpen, value: held });
  const [preview, setPreview] = useState<PlainDate | null>(null);

  const start = draft?.start ?? null;
  const end = draft?.end ?? null;
  const shown: CalendarValue = position === 'end' && start !== null ? { start, end: null } : draft;
  const openStart = shown !== null && shown.end === null ? shown.start : null;

  const blocked = useMemo(
    () =>
      openStart === null || rules.contiguous === false
        ? { before: null, after: null }
        : blockedAround(
            openStart,
            rules.unavailable ?? (() => false),
            rules.maxLength ?? CONTIGUOUS_SEARCH,
          ),
    [openStart, rules],
  );

  /** The days refused while a start is chosen: past a limit, or past an unavailable day. */
  const isUnavailable = useCallback(
    (date: PlainDate) =>
      openStart === null
        ? rules.unavailable?.(date) === true
        : isDateRefusedInRun(openStart, date, rules, blocked),
    [blocked, openStart, rules],
  );

  /** A day pressed in the grid. Answers the run when the press made it whole. */
  function take(next: CalendarValue, source: unknown): DateRange | null {
    if (next === null || Array.isArray(next) || !('start' in next)) return null;

    setDraft(next);
    onPosition(next.end === null ? 'end' : 'start', source);

    return next.end === null ? null : next;
  }

  return {
    draft,
    end,
    isUnavailable,
    /** The run as it would close on the pending end, ordered the way the press will order it. */
    pending: openStart !== null && preview !== null ? orderedRun(openStart, preview) : null,
    presets: options.presets.map((preset) => ({
      label: preset.label,
      value: presetValue(preset),
    })),
    setDraft,
    setPreview,
    shown,
    start,
    stepped: (direction: 1 | -1) => (draft === null ? null : stepRun(draft, direction, rules)),
    take,
  };
}
