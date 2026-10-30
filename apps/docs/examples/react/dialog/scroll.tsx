import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const ITEMS = Array.from({ length: 24 }, (_, index) => ({
  sku: `NW-${String(4100 + index * 7)}`,
  name: [
    'Chai, 10 boxes',
    'Aniseed syrup, 12 bottles',
    'Cajun seasoning, 48 jars',
    'Olive oil, 36 bottles',
    'Dried pears, 12 packs',
    'Curry sauce, 12 jars',
  ][index % 6],
}));

const TERMS = [
  'Prices are in US dollars and exclude sales tax, which is added at the rate of the delivery address.',
  'Payment is due 30 days from the invoice date. Balances unpaid after 45 days accrue interest at 1% a month.',
  'Goods travel at the risk of Northwind Traders until they are signed for at the delivery address.',
  'Damaged goods are reported within 5 business days of delivery, with photos of the packaging and the label.',
  'Returns of undamaged goods are accepted within 30 days and are refunded less a 10% restocking fee.',
  'Orders above $5,000 may be split into several shipments, each invoiced when it leaves the warehouse.',
  'Either party may end a standing order with 14 days of written notice; shipments already picked are invoiced.',
  'These terms are governed by the law of the State of Washington.',
];

export default function DialogScroll() {
  const [open, setOpen] = useState(false);

  return (
    <Inline gap={2}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              Review 24 line items
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase order PO-7730</DialogTitle>
            <DialogDescription>Only the list scrolls; the actions stay in view.</DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <Stack gap={2}>
              {ITEMS.map((item) => (
                <Inline key={item.sku} gap={3} justify="between">
                  <Text size="sm">{item.name}</Text>
                  <Text size="sm" tone="muted">
                    {item.sku}
                  </Text>
                </Inline>
              ))}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Approve order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog scroll="viewport">
        <DialogTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              Read the terms of sale
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms of sale</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              {TERMS.map((term) => (
                <Text key={term}>{term}</Text>
              ))}
            </Stack>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </Inline>
  );
}
