import { useRef, useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  type DialogHandle,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

const OUTCOMES: Record<string, string> = {
  partial: 'Ships the 4 items in stock today.',
  wait: 'Holds the order until every item is in stock.',
};

export default function DialogResult() {
  const dialog = useRef<DialogHandle>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  return (
    <Inline align="center" gap={3}>
      <Dialog
        ref={dialog}
        onOpenChange={(open, request) => {
          if (!open) {
            setOutcome((request.result && OUTCOMES[request.result]) ?? 'Closed without a choice.');
          }
        }}
      >
        <DialogTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              Ship order SO-1182
            </Button>
          )}
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two items are out of stock</DialogTitle>
            <DialogDescription>
              Aniseed syrup and dried pears are back in stock on 14 October.
            </DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              tone="secondary"
              onClick={() => dialog.current?.close('wait')}
            >
              Wait for all items
            </Button>
            <Button onClick={() => dialog.current?.close('partial')}>Ship 4 items now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {outcome === null ? null : (
        <Text size="sm" tone="muted">
          {outcome}
        </Text>
      )}
    </Inline>
  );
}
