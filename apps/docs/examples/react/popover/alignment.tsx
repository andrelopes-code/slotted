import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Popover,
  type PopoverAlign,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverLayer,
  PopoverTrigger,
} from '@slotted/react/popover';

const alignments: PopoverAlign[] = ['start', 'center', 'end'];

export default function PopoverAlignment() {
  return (
    <Inline gap={3} justify="center" wrap="wrap">
      {alignments.map((align) => (
        <Popover key={align} align={align}>
          <PopoverTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                Align {align}
              </Button>
            )}
          />
          <PopoverLayer>
            <PopoverContent aria-label={`Restock, aligned ${align}`}>
              <PopoverBody>Restock 40 units of Chang from Exotic Liquids by Oct 14.</PopoverBody>
            </PopoverContent>
            <PopoverArrow />
          </PopoverLayer>
        </Popover>
      ))}
    </Inline>
  );
}
