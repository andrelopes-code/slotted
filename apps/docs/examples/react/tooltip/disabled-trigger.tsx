import { Button } from '@slotted/react/button';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';

export default function TooltipDisabledTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} disabled focusableWhenDisabled>
            Ship order
          </Button>
        )}
      />
      <TooltipLayer>
        <TooltipContent>2 of 6 lines are still waiting to be picked in Savannah.</TooltipContent>
        <TooltipArrow />
      </TooltipLayer>
    </Tooltip>
  );
}
