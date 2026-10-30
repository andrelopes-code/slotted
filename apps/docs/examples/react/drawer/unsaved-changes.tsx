import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { Field, FieldLabel } from '@slotted/react/field';
import { InlineMessage } from '@slotted/react/inline-message';
import { Textarea } from '@slotted/react/textarea';

export default function DrawerUnsavedChanges() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState('Leave at the loading dock, door 3.');
  const [draft, setDraft] = useState(saved);
  const [confirming, setConfirming] = useState(false);

  const close = () => {
    setConfirming(false);
    setOpen(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next, request) => {
        if (next) {
          setDraft(saved);
          setConfirming(false);
        } else if (draft !== saved) {
          request.cancel();
          setConfirming(true);
          return;
        }
        setOpen(next);
      }}
    >
      <DrawerTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Delivery instructions
          </Button>
        )}
      />
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>Delivery instructions</DrawerTitle>
          <DrawerDescription>Order SO-1182, printed on the packing slip.</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <Field>
            <FieldLabel>Instructions for the carrier</FieldLabel>
            <Textarea
              value={draft}
              onValueChange={(value) => {
                setDraft(value);
                setConfirming(false);
              }}
            />
          </Field>
        </DrawerBody>
        <DrawerFooter>
          {confirming ? (
            <>
              <InlineMessage live="polite" tone="warning">
                Discard your changes to the instructions?
              </InlineMessage>
              <Button variant="ghost" tone="secondary" onClick={() => setConfirming(false)}>
                Keep editing
              </Button>
              <Button tone="danger" onClick={close}>
                Discard
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                tone="secondary"
                onClick={() => (draft === saved ? close() : setConfirming(true))}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setSaved(draft);
                  close();
                }}
              >
                Save
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerPanel>
    </Drawer>
  );
}
