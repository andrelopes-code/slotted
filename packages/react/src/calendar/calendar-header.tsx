import type { MonthYearPart } from '@slotted/core/date';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import type { CalendarView } from './calendar.types';

interface CalendarHeaderProps {
  readonly editable: boolean;
  /** The pieces of the heading: the name of the month, and what stands around it. */
  readonly heading: readonly MonthYearPart[];
  readonly headingId: string;
  /** Absent on a month that is not the last of the page. */
  readonly nextName: string | undefined;
  readonly onTurn: (direction: 1 | -1) => (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onWalkUp: () => void;
  /** Absent on a month that is not the first of the page. */
  readonly previousName: string | undefined;
  readonly view: CalendarView;
}

/**
 * The name of a page and the controls that turn it. The heading is a live
 * region: paging with a key changes nothing focus lands on, so without this
 * nothing announces the new month.
 */
export function CalendarHeader({
  editable,
  heading,
  headingId,
  nextName,
  onTurn,
  onWalkUp,
  previousName,
  view,
}: CalendarHeaderProps) {
  return (
    <div data-part="header" data-part-header="">
      {previousName !== undefined && (
        <button
          aria-label={previousName}
          data-part="previous"
          data-part-previous=""
          disabled={!editable}
          onClick={onTurn(-1)}
          type="button"
        >
          <Icon directional>
            <Glyph name="chevron-right" />
          </Icon>
        </button>
      )}

      <button
        aria-live="polite"
        data-part="heading"
        data-part-heading=""
        disabled={!editable || view === 'year'}
        id={headingId}
        onClick={onWalkUp}
        type="button"
      >
        {heading.map((part) =>
          part.type === 'rest' ? (
            <span data-part="heading-rest" data-part-heading-rest="" key={part.value}>
              {part.value}
            </span>
          ) : (
            part.value
          ),
        )}
      </button>

      {nextName !== undefined && (
        <button
          aria-label={nextName}
          data-part="next"
          data-part-next=""
          disabled={!editable}
          onClick={onTurn(1)}
          type="button"
        >
          <Icon directional>
            <Glyph name="chevron-right" />
          </Icon>
        </button>
      )}
    </div>
  );
}
