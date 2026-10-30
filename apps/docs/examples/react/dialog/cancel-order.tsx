import { useState } from 'react';

import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogIcon,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Text } from '@slotted/react/typography';

const REASONS = [
  { value: 'customer', label: 'The customer asked to cancel' },
  { value: 'stock', label: 'Items are out of stock' },
  { value: 'payment', label: 'The payment was flagged' },
  { value: 'duplicate', label: 'Duplicate order' },
];

export default function DialogCancelOrder() {
  const [cancelled, setCancelled] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  return (
    <Inline align="center" gap={3}>
      <Text weight="medium">Order SO-1182</Text>
      <Badge tone={cancelled ? 'danger' : 'accent'}>{cancelled ? 'Cancelled' : 'Processing'}</Badge>
      <AlertDialog onOpenChange={(open) => open && setReason(null)}>
        <DialogTrigger
          render={(props) => (
            <Button
              {...props}
              disabled={cancelled}
              focusableWhenDisabled
              size="sm"
              tone="danger"
              variant="outline"
            >
              Cancel order
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <AlertDialogIcon />
            <DialogTitle>Cancel order SO-1182?</DialogTitle>
            <DialogDescription>
              Contoso Foods is refunded $1,240.00 and the 6 items go back to stock. The order cannot
              be reopened.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field required>
              <FieldLabel>Reason</FieldLabel>
              <Select
                items={REASONS}
                value={reason}
                onValueChange={(next) => setReason(typeof next === 'string' ? next : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </DialogBody>
          <DialogFooter>
            <AlertDialogCancel
              render={(props) => (
                <Button {...props} tone="secondary" variant="outline">
                  Keep order
                </Button>
              )}
            />
            <AlertDialogAction
              onClick={() => setCancelled(true)}
              render={(props) => (
                <Button {...props} disabled={reason === null} tone="danger">
                  Cancel order
                </Button>
              )}
            />
          </DialogFooter>
        </DialogContent>
      </AlertDialog>
    </Inline>
  );
}
