import { momentOf } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';
import type { ReactNode, Ref, RefObject } from 'react';

import { Calendar } from '../calendar';
import type { CalendarHandle, CalendarProps } from '../calendar';
import { Clock } from '../clock';
import type { ClockHandle, ClockProps } from '../clock';
import type { DateTimeFieldProps } from '../datetime-field';
import { useMessages } from '../i18n';
import { PickerFooter } from '../picker-panel/picker-footer';
import { PickerGroup } from '../picker-panel/picker-group';
import { PickerJump } from '../picker-panel/picker-jump';
import { PickerPanel } from '../picker-panel/picker-panel';
import { PickerRail } from '../picker-panel/picker-rail';
import { PickerRangeHead } from '../picker-panel/picker-range-head';
import type { PickerPosition } from '../picker-panel/use-picker-position';
import { DateTimeRangeHalf } from './datetime-range-half';
import type { DateTimeRangePickerProps } from './datetime-range-picker.types';
import type { useDateTimeRangePanel } from './use-datetime-range-panel';

interface DateTimeRangePanelProps {
  readonly calendar: Partial<CalendarProps>;
  readonly calendarRef: Ref<CalendarHandle>;
  readonly clock: Partial<ClockProps>;
  readonly clockRefs: Record<PickerPosition, RefObject<ClockHandle | null>>;
  readonly confirm: boolean;
  readonly field: Partial<DateTimeFieldProps>;
  readonly footer: ReactNode;
  readonly labels: Record<PickerPosition, string>;
  readonly locale: string;
  readonly months: number;
  /** One part at a time, and the two ends as buttons: a field would open a keyboard. */
  readonly narrow: boolean;
  readonly panel: ReturnType<typeof useDateTimeRangePanel>;
  readonly position: PickerPosition;
  readonly renderSlot: DateTimeRangePickerProps['renderSlot'];
  readonly today: PlainDate;
}

/** The two ends of a run of moments over its months, and a clock for each. */
export function DateTimeRangePanel(props: DateTimeRangePanelProps) {
  const { calendar, calendarRef, clock, clockRefs, confirm, field, footer, labels } = props;
  const { locale, months, narrow, panel, position, renderSlot, today } = props;
  const t = useMessages(pickerPanelMessages);
  const hasRail = panel.presets.length > 0 || panel.durations.length > 0;

  const halfOf = (which: PickerPosition) => ({
    ...panel[which],
    current: position === which,
    invalid: panel.refusal !== null && which === 'end',
    label: labels[which],
    onEnter: () => panel.enter(which, 'pointer', undefined),
    value: (
      <DateTimeRangeHalf
        current={position === which}
        field={field}
        label={labels[which]}
        moment={momentOf(panel.draft[which])}
        onPart={(part, event) => {
          panel.enter(which, 'pointer', event);
          panel.setShowing(part);
        }}
        onType={(next, source) => panel.type(which, next, source)}
        typed={!narrow && isTyped(panel.draft[which])}
        words={panel[which]}
      />
    ),
  });

  return (
    <PickerPanel
      footer={
        <PickerFooter
          canApply={panel.canApply}
          canClear={panel.canClear}
          confirm={confirm}
          hint={panel.refusal ?? footer ?? panel.hint}
          invalid={panel.refusal !== null}
          onApply={(event) => panel.write(panel.draft, event)}
          onClear={panel.clear}
        />
      }
      kind="datetime-range"
      rail={
        hasRail && (
          <PickerRail presets={panel.presets}>
            {panel.durations.length > 0 && (
              <PickerGroup chips={panel.durations} label={t('duration')} />
            )}
            <PickerJump
              locale={locale}
              max={calendar.max}
              min={calendar.min}
              months={months}
              onJump={panel.jump}
              selected={panel.selectedMonths}
              shown={panel.page}
              today={today}
            />
          </PickerRail>
        )
      }
      showing={panel.showing}
    >
      <PickerRangeHead end={halfOf('end')} span={panel.span} start={halfOf('start')} />

      <div data-part="body" data-part-body="">
        <Calendar
          {...calendar}
          defaultFocusedDate={panel.anchor}
          focusedDate={panel.focused ?? undefined}
          isDateOver={panel.isOver}
          isDateUnavailable={panel.isUnavailable}
          locale={locale}
          months={months}
          onFocusedDateChange={panel.setFocused}
          onPageChange={panel.setPage}
          onPreviewChange={panel.setPreview}
          onValueChange={(next, request) => panel.takeDays(next, request.source)}
          onViewChange={panel.setView}
          ref={calendarRef}
          selectionMode="range"
          value={panel.shown}
          view={panel.view}
        />
      </div>

      <div data-part="clocks" data-part-clocks="">
        {(['start', 'end'] as const).map((which) => (
          <Clock
            {...clock}
            {...panel.times[which]}
            {...(position === which ? { 'data-current': '' } : {})}
            aria-label={labels[which]}
            key={which}
            onFocus={() => panel.enter(which, 'keyboard', undefined)}
            onValueChange={(next, request) => panel.takeTime(which, next, request)}
            ref={clockRefs[which]}
            renderSlot={
              renderSlot &&
              ((state) => renderSlot({ ...state, date: panel.draft[which].date, position: which }))
            }
            value={panel.draft[which].time}
          />
        ))}
      </div>
    </PickerPanel>
  );
}

/** A field writes whole moments: an end with one half is written in words instead. */
function isTyped({ date, time }: { date: unknown; time: unknown }): boolean {
  return (date === null) === (time === null);
}
