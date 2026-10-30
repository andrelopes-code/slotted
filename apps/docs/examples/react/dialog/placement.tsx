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
import { Textarea } from '@slotted/react/textarea';

export default function DialogPlacement() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen} placement="top">
      <DialogTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Add a note
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Note on order SO-1182</DialogTitle>
          <DialogDescription>The warehouse team sees the note on the pick list.</DialogDescription>
          <DialogClose />
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel>Note</FieldLabel>
            <Textarea rows={3} maxRows={12} placeholder="Leave at the loading dock after 2 pm." />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Add note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
