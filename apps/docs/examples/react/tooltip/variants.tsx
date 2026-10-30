import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';

export default function TooltipVariants() {
  return (
    <Inline gap={3} align="center">
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Reserve 40 units
            </Button>
          )}
        />
        <TooltipLayer>
          <TooltipContent>Holds 40 units of NW-4471 in Reno for 48 hours.</TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
      <Tooltip variant="surface">
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Transfer stock
            </Button>
          )}
        />
        <TooltipLayer>
          <TooltipContent>
            Moves the units from Columbus to Savannah on the next truck.
          </TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
    </Inline>
  );
}
