import { useRef, useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

const CUSTOMERS = [
  'Contoso Foods',
  'Fabrikam Grocers',
  'Northwind Traders',
  'Tailspin Market',
  'Wide World Importers',
  'Woodgrove Deli',
];

export default function DialogInitialFocus() {
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const matches = CUSTOMERS.filter((name) => name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog initialFocus={search} onOpenChange={(open) => open && setQuery('')}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Find a customer
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find a customer</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <DialogBody>
          <Stack gap={4}>
            <TextField
              ref={search}
              aria-label="Customer name"
              placeholder="Search by name"
              type="search"
              value={query}
              onValueChange={setQuery}
            />
            <Stack gap={2}>
              {matches.map((name) => (
                <Text key={name} size="sm">
                  {name}
                </Text>
              ))}
            </Stack>
          </Stack>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
