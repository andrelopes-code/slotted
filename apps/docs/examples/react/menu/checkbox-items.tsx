import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Menu, MenuCheckboxItem, MenuContent, MenuTrigger } from '@slotted/react/menu';
import { Text } from '@slotted/react/typography';

export default function MenuCheckboxItems() {
  const [archived, setArchived] = useState(false);
  const [test, setTest] = useState(false);
  const [cancelled, setCancelled] = useState(true);
  const shown = [archived && 'archived', test && 'test', cancelled && 'cancelled'].filter(Boolean);

  return (
    <Inline align="center" gap={3}>
      <Menu>
        <MenuTrigger
          render={(props) => (
            <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
              Show
            </Button>
          )}
        />
        <MenuContent>
          <MenuCheckboxItem checked={archived} onCheckedChange={setArchived}>
            Archived orders
          </MenuCheckboxItem>
          <MenuCheckboxItem checked={test} onCheckedChange={setTest}>
            Test orders
          </MenuCheckboxItem>
          <MenuCheckboxItem checked={cancelled} onCheckedChange={setCancelled}>
            Cancelled orders
          </MenuCheckboxItem>
        </MenuContent>
      </Menu>
      <Text size="sm" tone="muted">
        {shown.length === 0 ? 'Open orders only' : `Including ${shown.join(', ')}`}
      </Text>
    </Inline>
  );
}
