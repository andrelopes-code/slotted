import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { NumberField } from '@slotted/react/number-field';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

export default function PopoverForm() {
  const [open, setOpen] = useState(false);
  const [onHand, setOnHand] = useState(39);
  const [count, setCount] = useState<number | null>(39);
  const [note, setNote] = useState('');
  const dirty = count !== onHand || note !== '';

  return (
    <Inline align="center" gap={3}>
      <Text size="sm">Chai: {onHand} units on hand</Text>
      <Popover
        initialFocus="input"
        open={open}
        onOpenChange={(next, request) => {
          if (!next && request.reason === 'outsidePress' && dirty) {
            request.cancel();
            return;
          }
          if (next) {
            setCount(onHand);
            setNote('');
          }
          setOpen(next);
        }}
      >
        <PopoverTrigger
          render={(props) => (
            <Button {...props} size="sm" tone="secondary" variant="outline">
              Adjust stock
            </Button>
          )}
        />
        <PopoverLayer>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Adjust Chai stock</PopoverTitle>
              <PopoverDescription>Seattle warehouse, bin A-14</PopoverDescription>
            </PopoverHeader>
            <PopoverBody>
              <Stack gap={3}>
                <Field>
                  <FieldLabel>Counted quantity</FieldLabel>
                  <NumberField end="units" min={0} value={count} onValueChange={setCount} />
                </Field>
                <Field>
                  <FieldLabel>Reason</FieldLabel>
                  <TextField value={note} onValueChange={setNote} />
                </Field>
              </Stack>
            </PopoverBody>
            <PopoverFooter>
              <Button size="sm" tone="secondary" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={count === null}
                onClick={() => {
                  if (count !== null) setOnHand(count);
                  setOpen(false);
                }}
              >
                Save
              </Button>
            </PopoverFooter>
          </PopoverContent>
          <PopoverArrow />
        </PopoverLayer>
      </Popover>
    </Inline>
  );
}
