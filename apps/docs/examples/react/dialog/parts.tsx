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

const DETAILS = [
  { term: 'Carrier', value: 'UPS Ground' },
  { term: 'Tracking number', value: '1Z 999 AA1 01 2345 6784' },
  { term: 'Packages', value: '3, 18.4 kg in total' },
  { term: 'Estimated delivery', value: 'Thursday, 8 October' },
];

export default function DialogParts() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            View shipment
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shipment SH-4471</DialogTitle>
          <DialogDescription>Order SO-1182 for Contoso Foods, Seattle.</DialogDescription>
          <Badge tone="accent">In transit</Badge>
          <DialogClose />
        </DialogHeader>
        <DialogBody>
          <DescriptionList>
            {DETAILS.map((detail) => (
              <DescriptionListItem key={detail.term}>
                <DescriptionListTerm>{detail.term}</DescriptionListTerm>
                <DescriptionListDescription>{detail.value}</DescriptionListDescription>
              </DescriptionListItem>
            ))}
          </DescriptionList>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button>Print label</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
