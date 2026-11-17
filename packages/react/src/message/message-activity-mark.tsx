import type { ReactNode } from 'react';

import { SPINNER_RING } from '../button/spinner-ring';
import { Glyph, Icon } from '../icon';
import type { MessageActivityStepStatus } from './message.types';

interface MessageActivityMarkProps {
  icon: ReactNode | undefined;
  status: MessageActivityStepStatus;
}

/**
 * What stands before the words of a step. Without `icon` it is the status
 * mark: a tick, the ring, or an empty box that keeps the column. With `icon`
 * it is a tile holding the icon of the step's source, and the tick takes the
 * icon's place once the step is complete.
 */
export function MessageActivityMark({ icon, status }: MessageActivityMarkProps) {
  const tick = (
    <Icon>
      <Glyph name="check" />
    </Icon>
  );

  if (icon !== undefined) {
    return (
      <span aria-hidden="true" data-part="activity-step-icon" data-part-activity-step-icon="">
        {status === 'complete' ? tick : icon}
      </span>
    );
  }

  if (status === 'complete') return tick;

  if (status === 'current') {
    return (
      <span aria-hidden="true">
        <span aria-hidden="true" data-ui="spinner" data-ui-spinner="">
          {SPINNER_RING}
        </span>
      </span>
    );
  }

  return <span aria-hidden="true" />;
}
