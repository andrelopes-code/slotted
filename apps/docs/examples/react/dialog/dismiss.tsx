import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Text } from '@slotted/react/typography';

export default function DialogDismiss() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen} escape="none" outsidePress="none">
      <DialogTrigger render={(props) => <Button {...props}>Import products</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import 1,240 products</DialogTitle>
          <DialogDescription>
            From spring-catalogue.csv into the Northwind price list.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Text size="sm">
            38 rows update existing products and 1,202 add new ones. Escape and a press outside the
            panel leave this dialog open; choose one of the actions.
          </Text>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
            Cancel import
          </Button>
          <Button onClick={() => setOpen(false)}>Start import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
