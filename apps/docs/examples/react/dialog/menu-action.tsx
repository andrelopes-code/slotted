import { useRef, useState } from 'react';

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
} from '@slotted/react/dialog';
import { Field, FieldLabel } from '@slotted/react/field';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';
import { TextField } from '@slotted/react/text-field';

export default function DialogMenuAction() {
  const actions = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Menu>
        <MenuTrigger
          ref={actions}
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              Customer actions
            </Button>
          )}
        />
        <MenuContent>
          <MenuItem onSelect={() => setOpen(true)}>Change credit limit…</MenuItem>
          <MenuItem>Export statement</MenuItem>
          <MenuSeparator />
          <MenuItem tone="danger">Suspend account…</MenuItem>
        </MenuContent>
      </Menu>
      <Dialog open={open} onOpenChange={setOpen} finalFocus={actions} size="sm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit limit</DialogTitle>
            <DialogDescription>
              Contoso Foods has $18,420.00 outstanding on open invoices.
            </DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel>Limit in US dollars</FieldLabel>
              <TextField inputMode="decimal" defaultValue="25000" />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save limit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
