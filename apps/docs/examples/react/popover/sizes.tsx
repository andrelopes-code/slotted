import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  type PopoverSize,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';

const sizes: PopoverSize[] = ['sm', 'md', 'lg'];

export default function PopoverSizes() {
  return (
    <Inline gap={3} justify="center" wrap="wrap">
      {sizes.map((size) => (
        <Popover key={size} size={size}>
          <PopoverTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                {size}
              </Button>
            )}
          />
          <PopoverLayer>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Order 10248</PopoverTitle>
              </PopoverHeader>
              <PopoverBody>
                Vins et alcools Chevalier, Reims. Three lines, 440.00 USD, shipped by Federal
                Shipping on Jul 16.
              </PopoverBody>
            </PopoverContent>
            <PopoverArrow />
          </PopoverLayer>
        </Popover>
      ))}
    </Inline>
  );
}
