import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogIcon,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function ButtonConfirmDelete() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <Inline align="center" gap={2}>
      <AlertDialog onOpenChange={setOpen} open={open}>
        <DialogTrigger
          render={(props) => (
            <Button
              {...props}
              disabled={deleted}
              focusableWhenDisabled
              start={<Glyph name="trash" />}
              tone="danger"
              variant="outline"
            >
              Delete supplier
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <AlertDialogIcon />
            <DialogTitle>Delete Northwind Traders?</DialogTitle>
            <DialogDescription>
              The supplier and its 18 open purchase orders are removed for everyone. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AlertDialogCancel
              render={(props) => (
                <Button {...props} tone="secondary" variant="outline">
                  Keep supplier
                </Button>
              )}
            />
            <AlertDialogAction
              onClick={() => setDeleted(true)}
              render={(props) => (
                <Button {...props} tone="danger">
                  Delete supplier
                </Button>
              )}
            />
          </DialogFooter>
        </DialogContent>
      </AlertDialog>
      {deleted ? (
        <>
          <Text size="sm" tone="muted">
            Northwind Traders was deleted.
          </Text>
          <Button onClick={() => setDeleted(false)} size="sm" tone="secondary" variant="ghost">
            Undo
          </Button>
        </>
      ) : null}
    </Inline>
  );
}
