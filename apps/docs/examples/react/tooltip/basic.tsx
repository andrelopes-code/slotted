import { Button } from '@slotted/react/button';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';

export default function TooltipBasic() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Sync inventory
          </Button>
        )}
      />
      <TooltipLayer>
        <TooltipContent>Pulls stock levels from Reno, Columbus and Savannah.</TooltipContent>
        <TooltipArrow />
      </TooltipLayer>
    </Tooltip>
  );
}
