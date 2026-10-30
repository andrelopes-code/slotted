import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const activity = [
  'Jul 4, 9:12 AM. Order placed by Vins et alcools Chevalier.',
  'Jul 4, 9:40 AM. Payment authorised, 440.00 USD.',
  'Jul 5, 8:05 AM. Allocated to the Seattle warehouse.',
  'Jul 5, 2:30 PM. Picked by Nancy Davolio.',
  'Jul 6, 10:15 AM. Packed in two cartons, 14.2 kg.',
  'Jul 8, 11:00 AM. Customs documents filed for France.',
  'Jul 16, 4:00 PM. Collected by Federal Shipping.',
  'Jul 18, 7:20 AM. Arrived at the Le Havre hub.',
  'Jul 19, 9:45 AM. Out for delivery in Reims.',
  'Jul 19, 3:10 PM. Delivered, signed by P. Henriot.',
];

export default function PopoverScrolling() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Order 10248 activity
          </Button>
        )}
      />
      <PopoverLayer>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Order 10248 activity</PopoverTitle>
            <PopoverClose />
          </PopoverHeader>
          <PopoverBody>
            <Stack gap={3}>
              {activity.map((entry) => (
                <Text key={entry} size="sm">
                  {entry}
                </Text>
              ))}
            </Stack>
          </PopoverBody>
          <PopoverFooter>
            <Button size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </PopoverFooter>
        </PopoverContent>
        <PopoverArrow />
      </PopoverLayer>
    </Popover>
  );
}
