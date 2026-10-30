import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';

export default function PopoverNarrow() {
  return (
    <Inline justify="end">
      <Popover align="start" size="lg">
        <PopoverTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              Volume pricing
            </Button>
          )}
        />
        <PopoverLayer>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Volume pricing for Chai</PopoverTitle>
            </PopoverHeader>
            <PopoverBody>
              18.00 USD a case up to 24 cases, 16.20 USD from 25 cases, and 15.30 USD from 100
              cases. Prices apply to orders shipped from the Seattle warehouse.
            </PopoverBody>
          </PopoverContent>
          <PopoverArrow />
        </PopoverLayer>
      </Popover>
    </Inline>
  );
}
