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
import { Text } from '@slotted/react/typography';

export default function DialogAsyncSubmit() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const refund = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSent(true);
      setOpen(false);
    }, 1500);
  };

  return (
    <Inline align="center" gap={3}>
      <Dialog
        open={open}
        onOpenChange={(next, request) => {
          if (!next && saving) return request.cancel();
          if (next) setSent(false);
          setOpen(next);
        }}
      >
        <DialogTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              Refund order SO-1182
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund $1,240.00</DialogTitle>
            <DialogDescription>To the card ending 4242, for order SO-1182.</DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <Text size="sm">
              The payment provider takes a moment to confirm. The dialog stays open until it does.
            </Text>
          </DialogBody>
          <DialogFooter>
            <Button
              disabled={saving}
              variant="ghost"
              tone="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button loading={saving} messages={{ loading: 'Issuing refund' }} onClick={refund}>
              Issue refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {sent ? (
        <Text role="status" size="sm" tone="muted">
          Refund issued.
        </Text>
      ) : null}
    </Inline>
  );
}
