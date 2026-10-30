import { useState } from 'react';

import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
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
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

const DETAILS = [
  { term: 'Ship to', value: '1200 Harbor Ave, Seattle, WA' },
  { term: 'Payment', value: 'Captured, card ending 4242' },
  { term: 'Items', value: '14 cases, 3 products' },
  { term: 'Warehouse', value: 'Reno, NV' },
  { term: 'Total', value: '$1,240.00' },
];

export default function DrawerBasic() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            View order SO-1182
          </Button>
        )}
      />
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>Order SO-1182</DrawerTitle>
          <DrawerDescription>Contoso Foods, placed on 2 October 2026.</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <Stack gap={4}>
            <Inline>
              <Badge tone="accent">Ready to ship</Badge>
            </Inline>
            <DescriptionList>
              {DETAILS.map((detail) => (
                <DescriptionListItem key={detail.term}>
                  <DescriptionListTerm>{detail.term}</DescriptionListTerm>
                  <DescriptionListDescription>{detail.value}</DescriptionListDescription>
                </DescriptionListItem>
              ))}
            </DescriptionList>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={() => setOpen(false)}>Create shipment</Button>
        </DrawerFooter>
      </DrawerPanel>
    </Drawer>
  );
}
