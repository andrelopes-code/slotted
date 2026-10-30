import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverLayer,
  PopoverTrigger,
} from '@slotted/react/popover';

export default function PopoverArrowAndOffset() {
  return (
    <Inline gap={3} justify="center" wrap="wrap">
      <Popover>
        <PopoverTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              With arrow
            </Button>
          )}
        />
        <PopoverLayer>
          <PopoverContent aria-label="Pickup window">
            <PopoverBody>Speedy Express collects between 3:30 and 4:00 PM.</PopoverBody>
          </PopoverContent>
          <PopoverArrow />
        </PopoverLayer>
      </Popover>
      <Popover arrow={false} sideOffset={8}>
        <PopoverTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              No arrow, 8px further
            </Button>
          )}
        />
        <PopoverLayer>
          <PopoverContent aria-label="Pickup window">
            <PopoverBody>Speedy Express collects between 3:30 and 4:00 PM.</PopoverBody>
          </PopoverContent>
          <PopoverArrow />
        </PopoverLayer>
      </Popover>
    </Inline>
  );
}
