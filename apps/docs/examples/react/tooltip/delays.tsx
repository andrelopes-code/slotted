import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';

export default function TooltipDelays() {
  return (
    <Inline gap={3} align="center">
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Release hold
            </Button>
          )}
        />
        <TooltipLayer>
          <TooltipContent>Returns SO-10483 to the pick queue in Reno.</TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
      <Tooltip openDelay={1200} closeDelay={400}>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline" tone="danger">
              Cancel order
            </Button>
          )}
        />
        <TooltipLayer>
          <TooltipContent>
            Refunds $318.50 to Brightline Studio and restocks 3 lines.
          </TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
      <Tooltip openDelay={200}>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Track parcel
            </Button>
          )}
        />
        <TooltipLayer>
          <TooltipContent>UPS · out for delivery in Portland, OR.</TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
    </Inline>
  );
}
