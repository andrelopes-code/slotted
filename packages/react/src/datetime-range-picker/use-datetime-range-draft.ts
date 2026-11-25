import {
  clockFinest,
  isSameMomentRunDraft,
  missingHalf,
  momentDraft,
  momentRunDraft,
  momentRunOf,
  orderedRun,
  runDayRefusal,
  withRunDays,
} from '@slotted/core/date';
import type { MomentRunDraft, PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import type { ChangeReason } from '@slotted/core/state';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { isRange } from '../calendar';
import type { CalendarHandle, CalendarValue } from '../calendar';
import type { ClockChangeRequest, ClockHandle } from '../clock';
import type { PickerShowing } from '../picker-panel/picker-panel';
import { usePickerDraft } from '../picker-panel/use-picker-draft';
import type { PickerPosition } from '../picker-panel/use-picker-position';
import type { PickerLayer } from '../picker-panel/use-picker-layer';
import type { DateTimeRange } from './datetime-range-picker.types';
import { isTakenRun } from './datetime-range-words';
import type { DateTimeRangeWords } from './datetime-range-words';

export interface DateTimeRangeDraftOptions {
  readonly calendarRef: RefObject<CalendarHandle | null>;
  readonly clockRefs: Record<PickerPosition, RefObject<ClockHandle | null>>;
  readonly confirm: boolean;
  readonly held: DateTimeRange | null;
  readonly layer: PickerLayer;
  readonly onPosition: (next: PickerPosition, reason: ChangeReason, source: unknown) => void;
  readonly onWrite: (next: DateTimeRange | null, reason: ChangeReason, source: unknown) => void;
  readonly position: PickerPosition;
  readonly words: DateTimeRangeWords;
}

/**
 * The run the panel composes, and where the reader goes next: the press that
 * leaves a half missing brings its grid, on the end that lacks it.
 */
export function useDateTimeRangeDraft(options: DateTimeRangeDraftOptions) {
  const { confirm, held, layer, onPosition, onWrite, position, words } = options;
  const { granularity, rules } = words;
  const { draft, setDraft } = usePickerDraft<MomentRunDraft>({
    equals: isSameMomentRunDraft,
    isOpen: layer.isOpen,
    value: momentRunDraft(held),
  });
  const [preview, setPreview] = useState<PlainDate | null>(null);
  const [showing, setShowing] = useState<PickerShowing>('day');
  const owesFocus = useRef<(() => void) | null>(null);

  /* The next opening starts from the day. */
  useEffect(() => {
    if (!layer.isOpen) setShowing('day');
  }, [layer.isOpen]);

  /* Focus goes to a grid in the commit that has it on screen. */
  useEffect(() => {
    owesFocus.current?.();
    owesFocus.current = null;
  });

  const { end, start } = draft;
  const isOpenRun = start.date !== null && (position === 'end' || end.date === null);
  const shown: CalendarValue = isOpenRun
    ? { start: start.date, end: null }
    : { start: start.date, end: end.date };

  const isUnavailable = useMemo(
    () => runDayRefusal(isOpenRun ? start : momentDraft(null), rules),
    [isOpenRun, rules, start],
  );

  function moveTo(next: PickerPosition, source: unknown) {
    if (next !== position) onPosition(next, 'select', source);
  }

  function write(next: MomentRunDraft, source: unknown, reason: ChangeReason = 'select') {
    onWrite(momentRunOf(next), reason, source);
    moveTo('start', source);
    layer.finish(source);
  }

  /** The run moved by a step, a length or a shortcut. Without a draft, it is written. */
  function take(next: MomentRunDraft, source: unknown) {
    setDraft(next);
    if (!confirm && isTakenRun(next, words)) onWrite(momentRunOf(next), 'select', source);
  }

  /* On to the half that is missing; on a whole run, back to its start. */
  function advance(next: MomentRunDraft, from: PickerPosition, source: unknown) {
    const half = missingHalf(next, from);
    moveTo(half?.position ?? 'start', source);
    if (half === null) return;

    const target = half.part === 'time' ? options.clockRefs[half.position] : options.calendarRef;
    setShowing(half.part);
    owesFocus.current = () => target.current?.focus();
  }

  function takeDays(value: CalendarValue, source: unknown) {
    if (!isRange(value)) return;

    const next = withRunDays(draft, value);
    setDraft(next);
    advance(next, 'start', source);
    if (!confirm && isTakenRun(next, words)) onWrite(momentRunOf(next), 'select', source);
  }

  function takeTime(which: PickerPosition, time: PlainTime | null, at: ClockChangeRequest) {
    const next = { ...draft, [which]: { ...draft[which], time } };
    const complete = at.unit === 'slot' || at.unit === clockFinest(granularity, rules.step);
    setDraft(next);
    if (!complete) return;
    if (!confirm && isTakenRun(next, words)) write(next, at.source);
    else advance(next, which, at.source);
  }

  return {
    clear: (source: unknown) => {
      setDraft(momentRunDraft(null));
      moveTo('start', source);
      setShowing('day');
      if (!confirm) write(momentRunDraft(null), source, 'clear');
    },
    draft,
    isUnavailable,
    moveTo,
    /** The run as it would close on the pending day. */
    pending:
      isOpenRun && start.date !== null && preview !== null
        ? withRunDays(draft, orderedRun(start.date, preview))
        : null,
    setPreview,
    setShowing,
    showing,
    shown,
    take,
    takeDays,
    takeTime,
    /* Typed in a half: without a draft to confirm, it is written as it is. */
    type: (which: PickerPosition, moment: PlainDateTime | null, source: unknown) => {
      const next = { ...draft, [which]: momentDraft(moment) };
      if (isSameMomentRunDraft(next, draft)) return;

      setDraft(next);
      if (!confirm) onWrite(momentRunOf(next), 'keyboard', source);
    },
    write,
  };
}
