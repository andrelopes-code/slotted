import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverLayer,
  type PopoverSide,
  PopoverTrigger,
} from '@slotted/react/popover';

const sides: { side: PopoverSide; text: string }[] = [
  { side: 'top', text: 'Speedy Express collects at 4:00 PM.' },
  { side: 'bottom', text: 'United Package collects at 5:30 PM.' },
  { side: 'inline-start', text: 'Federal Shipping collects at 11:00 AM.' },
  { side: 'inline-end', text: 'Northwind Courier collects at 2:00 PM.' },
];

export default function PopoverPlacement() {
  return (
    <Inline gap={3} justify="center" wrap="wrap">
      {sides.map(({ side, text }) => (
        <Popover key={side} side={side}>
          <PopoverTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                {side}
              </Button>
            )}
          />
          <PopoverLayer>
            <PopoverContent aria-label={`Pickup, ${side}`}>
              <PopoverBody>{text}</PopoverBody>
            </PopoverContent>
            <PopoverArrow />
          </PopoverLayer>
        </Popover>
      ))}
    </Inline>
  );
}
