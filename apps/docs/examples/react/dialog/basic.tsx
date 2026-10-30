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
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

export default function DialogBasic() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('ap@northwindtraders.com');
  const [draft, setDraft] = useState(email);

  return (
    <Inline align="center" gap={3}>
      <Text size="sm">{email}</Text>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(email);
          setOpen(next);
        }}
      >
        <DialogTrigger
          render={(props) => (
            <Button {...props} size="sm" tone="secondary" variant="outline">
              Edit billing email
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Billing email</DialogTitle>
            <DialogDescription>
              Invoices and payment receipts for Northwind Traders go to this address.
            </DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <TextField type="email" value={draft} onValueChange={setDraft} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setEmail(draft);
                setOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Inline>
  );
}
