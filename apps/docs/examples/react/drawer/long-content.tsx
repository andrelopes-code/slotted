import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const EVENTS = [
  { at: 'Oct 6, 7:42 AM', what: 'Out for delivery, Seattle, WA' },
  { at: 'Oct 6, 5:10 AM', what: 'Arrived at the delivery facility, Seattle, WA' },
  { at: 'Oct 5, 11:58 PM', what: 'Departed facility, Portland, OR' },
  { at: 'Oct 5, 9:20 PM', what: 'Arrived at facility, Portland, OR' },
  { at: 'Oct 5, 2:04 PM', what: 'Departed facility, Medford, OR' },
  { at: 'Oct 5, 10:37 AM', what: 'Arrived at facility, Medford, OR' },
  { at: 'Oct 4, 11:15 PM', what: 'Departed facility, Sacramento, CA' },
  { at: 'Oct 4, 6:48 PM', what: 'Arrived at facility, Sacramento, CA' },
  { at: 'Oct 4, 1:30 PM', what: 'Departed facility, Reno, NV' },
  { at: 'Oct 4, 9:02 AM', what: 'Processed at the origin facility, Reno, NV' },
  { at: 'Oct 3, 6:15 PM', what: 'Picked up from the Northwind warehouse, Reno, NV' },
  { at: 'Oct 3, 4:40 PM', what: 'Weighed and labelled: 3 packages, 18.4 kg' },
  { at: 'Oct 3, 2:12 PM', what: 'Packed at station 4, Reno, NV' },
  { at: 'Oct 3, 11:05 AM', what: 'Picked from aisles 12, 14 and 21' },
  { at: 'Oct 2, 4:55 PM', what: 'Released to the warehouse' },
  { at: 'Oct 2, 4:31 PM', what: 'Payment captured, card ending 4242' },
];

export default function DrawerLongContent() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Tracking history
          </Button>
        )}
      />
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>Tracking 1Z999AA10123456784</DrawerTitle>
          <DrawerDescription>Shipment SH-4471, 16 events since 2 October.</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <Stack gap={4}>
            {EVENTS.map((event) => (
              <Stack key={event.at} gap={0}>
                <Text size="sm" tone="muted">
                  {event.at}
                </Text>
                <Text size="sm">{event.what}</Text>
              </Stack>
            ))}
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button>Email to customer</Button>
        </DrawerFooter>
      </DrawerPanel>
    </Drawer>
  );
}
