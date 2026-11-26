import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import { Menubar } from '@slotted/react/menubar';
import type { MenubarChangeRequest } from '@slotted/react/menubar';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function MenubarControlled() {
  const [open, setOpen] = useState<string | undefined>(undefined);
  const [last, setLast] = useState('No menu open');

  function handleValueChange(next: string, request: MenubarChangeRequest) {
    setOpen(next === '' ? undefined : next);
    setLast(next === '' ? `Closed by ${request.reason}` : `${next} opened by ${request.reason}`);
  }

  return (
    <Stack gap={4}>
      <Menubar aria-label="Operations" onValueChange={handleValueChange} value={open}>
        <Menu value="orders">
          <MenuTrigger>Orders</MenuTrigger>
          <MenuContent>
            <MenuItem>New order</MenuItem>
            <MenuItem>Open order…</MenuItem>
          </MenuContent>
        </Menu>
        <Menu value="inventory">
          <MenuTrigger>Inventory</MenuTrigger>
          <MenuContent>
            <MenuItem>Receive stock</MenuItem>
            <MenuItem>Count stock</MenuItem>
          </MenuContent>
        </Menu>
        <Menu value="reports">
          <MenuTrigger>Reports</MenuTrigger>
          <MenuContent>
            <MenuItem>Sales by region</MenuItem>
            <MenuItem>Late shipments</MenuItem>
          </MenuContent>
        </Menu>
      </Menubar>
      <Inline align="center" gap={3} wrap="wrap">
        <Button onClick={() => setOpen('inventory')} variant="ghost">
          Open Inventory
        </Button>
        <Button onClick={() => setOpen(undefined)} variant="ghost">
          Close
        </Button>
        <Text size="sm" tone="muted">
          {last}
        </Text>
      </Inline>
    </Stack>
  );
}
