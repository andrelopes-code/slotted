import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';
import { Radio, RadioGroup } from '@slotted/react/radio-group';
import { Text } from '@slotted/react/typography';

const pickers = ['Nancy Davolio', 'Andrew Fuller', 'Janet Leverling', 'Margaret Peacock'];

export default function PopoverControlled() {
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState('Nancy Davolio');

  return (
    <Inline align="center" gap={3}>
      <Text size="sm">Order 10251, picked by {picker}</Text>
      <Popover open={open} onOpenChange={setOpen} align="end">
        <PopoverTrigger
          render={(props) => (
            <Button {...props} size="sm" tone="secondary" variant="outline">
              Reassign
            </Button>
          )}
        />
        <PopoverLayer>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Picker for order 10251</PopoverTitle>
            </PopoverHeader>
            <PopoverBody>
              <RadioGroup
                aria-label="Picker"
                value={picker}
                onValueChange={(next) => {
                  setPicker(next);
                  setOpen(false);
                }}
              >
                {pickers.map((name) => (
                  <Radio key={name} value={name}>
                    {name}
                  </Radio>
                ))}
              </RadioGroup>
            </PopoverBody>
          </PopoverContent>
          <PopoverArrow />
        </PopoverLayer>
      </Popover>
    </Inline>
  );
}
