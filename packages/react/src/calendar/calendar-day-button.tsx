import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipLayer, TooltipTrigger } from '../tooltip';

interface CalendarDayButtonProps extends ComponentPropsWithoutRef<'span'> {
  /** What `renderDayTooltip` says of the day; nothing draws no tooltip. */
  readonly tooltip: ReactNode;
}

/**
 * The element of a day that takes the focus and the press. A tooltip of the
 * day is triggered by that element, so it opens by key as it does by pointer.
 */
export function CalendarDayButton({ tooltip, ...day }: CalendarDayButtonProps) {
  if (tooltip === null || tooltip === undefined || tooltip === false) {
    return <span {...day} />;
  }

  return (
    <Tooltip>
      <TooltipTrigger {...(day as object)} render={(props) => <span {...props} />} />
      <TooltipLayer>
        <TooltipContent>{tooltip}</TooltipContent>
      </TooltipLayer>
    </Tooltip>
  );
}
