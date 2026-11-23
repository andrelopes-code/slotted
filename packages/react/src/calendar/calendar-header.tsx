import type { MouseEvent, ReactNode } from 'react';

import { Glyph, Icon } from '../icon';
import type { CalendarView } from './calendar.types';

interface CalendarHeaderProps {
  readonly editable: boolean;
  readonly heading: ReactNode;
  readonly headingId: string;
  readonly nextName: string;
  readonly onTurn: (direction: 1 | -1) => (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onWalkUp: () => void;
  readonly previousName: string;
  readonly view: CalendarView;
}

/**
 * The name of the page and the controls that turn it. The heading is a live
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

      <button
        aria-live="polite"
        data-part="heading"
        data-part-heading=""
        disabled={!editable || view === 'year'}
        id={headingId}
        onClick={onWalkUp}
        type="button"
      >
        {heading}
        {view === 'year' ? null : (
          <Icon>
            <Glyph name="chevron-down" />
          </Icon>
        )}
      </button>

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
    </div>
  );
}
