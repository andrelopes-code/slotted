import type { PlainDate } from '@slotted/core/date';
import type { ReactNode, Ref } from 'react';

import { Calendar } from '../calendar';
import type { CalendarHandle, CalendarProps } from '../calendar';
import { PickerFooter } from '../picker-panel/picker-footer';
import { PickerJump } from '../picker-panel/picker-jump';
import { PickerPanel } from '../picker-panel/picker-panel';
import { PickerHalfButton, PickerRangeHead } from '../picker-panel/picker-range-head';
import { PickerRail } from '../picker-panel/picker-rail';
import type { DateRangePickerPosition } from './date-range-picker.types';
import type { useRangePanel } from './use-range-panel';

interface DateRangePanelProps {
  readonly calendar: Partial<CalendarProps>;
  readonly calendarRef: Ref<CalendarHandle>;
  /** The picker may be cleared: `clearable`, and not `required`. */
  readonly clearable: boolean;
  readonly confirm: boolean;
  readonly footer: ReactNode;
  readonly labels: { readonly end: string; readonly start: string };
  readonly locale: string;
  readonly months: number;
  readonly panel: ReturnType<typeof useRangePanel>;
  readonly position: DateRangePickerPosition;
  readonly today: PlainDate;
}

/** The two ends of a run over its months. */
export function DateRangePanel(props: DateRangePanelProps) {
  const { calendar, calendarRef, confirm, footer, labels, locale, months, panel, today } = props;

  const halfOf = (which: DateRangePickerPosition) => ({
    ...panel[which],
    current: props.position === which,
    invalid: panel.refusal !== null && which === 'end',
    label: labels[which],
    onEnter: () => panel.enter(which, undefined),
    value: (
      <PickerHalfButton onClick={(event) => panel.enter(which, event)} part="day">
        {panel[which].text}
      </PickerHalfButton>
    ),
  });

  return (
    <PickerPanel
      footer={
        <PickerFooter
          canApply={panel.canApply}
          canClear={panel.canClear}
          clearable={props.clearable}
          confirm={confirm}
          hint={panel.refusal ?? footer ?? panel.hint}
          invalid={panel.refusal !== null}
          onApply={(event) => panel.write(panel.draft, event)}
          onClear={panel.clear}
        />
      }
      kind="date-range"
      rail={
        panel.presets.length > 0 && (
          <PickerRail presets={panel.presets}>
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
          onValueChange={(next, request) => panel.take(next, request.source)}
          onViewChange={panel.setView}
          ref={calendarRef}
          selectionMode="range"
          value={panel.shown}
          view={panel.view}
        />
      </div>
    </PickerPanel>
  );
}
