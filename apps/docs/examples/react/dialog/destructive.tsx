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
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function DialogDestructive() {
  const [deleted, setDeleted] = useState(false);

  return (
    <Inline align="center" gap={3}>
      <AlertDialog>
        <DialogTrigger
          render={(props) => (
            <Button {...props} tone="danger" variant="outline">
              Delete price list
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <AlertDialogIcon />
            <DialogTitle>Delete the 2026 wholesale price list?</DialogTitle>
            <DialogDescription>
              The 412 prices in it are removed, and 9 customers on this list move to retail prices.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AlertDialogCancel
              render={(props) => (
                <Button {...props} tone="secondary" variant="outline">
                  Keep price list
                </Button>
              )}
            />
            <AlertDialogAction
              onClick={() => setDeleted(true)}
              render={(props) => (
                <Button {...props} tone="danger">
                  Delete price list
                </Button>
              )}
            />
          </DialogFooter>
        </DialogContent>
      </AlertDialog>
      {deleted ? (
        <Text role="status" size="sm" tone="muted">
          The 2026 wholesale price list was deleted.
        </Text>
      ) : null}
    </Inline>
  );
}
