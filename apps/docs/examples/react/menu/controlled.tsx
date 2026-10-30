import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import { Text } from '@slotted/react/typography';

export default function MenuControlled() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('Closed');

  return (
    <Inline align="center" gap={3} wrap="wrap">
      <Menu
        onOpenChange={(next, request) => {
          setOpen(next);
          setLast(`${next ? 'Opened' : 'Closed'} by ${request.reason}`);
        }}
        open={open}
      >
        <MenuTrigger
          render={(props) => (
            <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
              Bulk actions
            </Button>
          )}
        />
        <MenuContent>
          <MenuItem>Mark 12 orders as packed</MenuItem>
          <MenuItem>Print 12 packing slips</MenuItem>
          <MenuItem>Export selection</MenuItem>
        </MenuContent>
      </Menu>
      <Button onClick={() => setOpen(true)} variant="ghost">
        Open from code
      </Button>
      <Text size="sm" tone="muted">
        {last}
      </Text>
    </Inline>
  );
}
