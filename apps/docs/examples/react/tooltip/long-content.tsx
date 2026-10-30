import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';

export default function TooltipLongContent() {
  return (
    <Inline gap={3} align="center">
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Carrier exception
            </Button>
          )}
        />
        <TooltipLayer>
          <TooltipContent>
            UPS reported an address exception at the Memphis hub on September 29. The parcel is held
            until Atlas Freight confirms a delivery window.
          </TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Return label
            </Button>
          )}
        />
        <TooltipLayer>
          <TooltipContent>RMA-2291-SO10485-1Z999AA10123456784-ATLASFREIGHT-MEMPHIS</TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
    </Inline>
  );
}
