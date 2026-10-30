import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Field, FieldLabel } from '@slotted/react/field';
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
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

const customers = [
  'Alfreds Futterkiste',
  'Ernst Handel',
  'Frankenversand',
  'Königlich Essen',
  'Wartian Herkku',
];

export default function PopoverFocus() {
  const [query, setQuery] = useState('');
  const matches = customers.filter((name) =>
    name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Popover align="start" initialFocus="input">
      <PopoverTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Find a customer
          </Button>
        )}
      />
      <PopoverLayer>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Find a customer</PopoverTitle>
          </PopoverHeader>
          <PopoverBody>
            <Stack gap={3}>
              <Field>
                <FieldLabel>Company name</FieldLabel>
                <TextField type="search" value={query} onValueChange={setQuery} />
              </Field>
              <Text size="sm" tone="muted">
                {matches.length === 0 ? 'No customer matches.' : matches.join(', ')}
              </Text>
            </Stack>
          </PopoverBody>
        </PopoverContent>
        <PopoverArrow />
      </PopoverLayer>
    </Popover>
  );
}
