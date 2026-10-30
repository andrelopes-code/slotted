import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';
import { Text } from '@slotted/react/typography';

export default function MenuKeepOpen() {
  const [cartons, setCartons] = useState(24);

  return (
    <Inline align="center" gap={3}>
      <Menu>
        <MenuTrigger
          render={(props) => (
            <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
              Adjust quantity
            </Button>
          )}
        />
        <MenuContent>
          <MenuItem closeOnSelect={false} onSelect={() => setCartons((count) => count + 1)}>
            Add 1 carton
          </MenuItem>
          <MenuItem closeOnSelect={false} onSelect={() => setCartons((count) => count + 10)}>
            Add 10 cartons
          </MenuItem>
          <MenuItem
            closeOnSelect={false}
            onSelect={() => setCartons((count) => Math.max(0, count - 1))}
          >
            Remove 1 carton
          </MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => setCartons(24)}>Reset to ordered quantity</MenuItem>
        </MenuContent>
      </Menu>
      <Text size="sm" tone="muted">
        {cartons} cartons
      </Text>
    </Inline>
  );
}
