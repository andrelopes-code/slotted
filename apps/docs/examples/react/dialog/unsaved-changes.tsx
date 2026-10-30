import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogIcon,
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

export default function DialogUnsavedChanges() {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [address, setAddress] = useState('Pier 70, Suite 300, Seattle, WA 98121');
  const [draft, setDraft] = useState(address);
  const dirty = draft !== address;

  const leave = () => {
    if (dirty) setConfirming(true);
    else setOpen(false);
  };

  return (
    <Inline align="center" gap={3}>
      <Dialog
        open={open}
        onOpenChange={(next, request) => {
          if (next) {
            setDraft(address);
            setOpen(true);
          } else if (dirty) {
            request.cancel();
            setConfirming(true);
          } else {
            setOpen(false);
          }
        }}
      >
        <DialogTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              Change delivery address
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delivery address</DialogTitle>
            <DialogDescription>Applies to order SO-1182 and to later orders.</DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel>Address</FieldLabel>
              <TextField value={draft} onValueChange={setDraft} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" tone="secondary" onClick={leave}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAddress(draft);
                setOpen(false);
              }}
            >
              Save address
            </Button>
          </DialogFooter>
          <AlertDialog open={confirming} onOpenChange={setConfirming} tone="warning">
            <DialogContent>
              <DialogHeader>
                <AlertDialogIcon />
                <DialogTitle>Discard the new address?</DialogTitle>
                <DialogDescription>
                  The address you typed is not saved. The order keeps the previous one.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <AlertDialogCancel
                  render={(props) => (
                    <Button {...props} tone="secondary" variant="outline">
                      Keep editing
                    </Button>
                  )}
                />
                <AlertDialogAction
                  onClick={() => setOpen(false)}
                  render={(props) => (
                    <Button {...props} tone="warning">
                      Discard changes
                    </Button>
                  )}
                />
              </DialogFooter>
            </DialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>
      <Text size="sm" tone="muted">
        {address}
      </Text>
    </Inline>
  );
}
