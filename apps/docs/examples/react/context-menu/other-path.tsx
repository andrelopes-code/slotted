import { Button } from '@slotted/react/button';
import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import { Inline } from '@slotted/react/inline';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuOtherPath() {
  const actions = (
    <MenuContent aria-label="Shipment actions">
      <MenuItem>Track shipment</MenuItem>
      <MenuItem>Print label</MenuItem>
      <MenuItem>Contact carrier</MenuItem>
    </MenuContent>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Stack gap={2}>
          <Heading level={2} size="md">
            Shipment SH-20418
          </Heading>
          <Text size="sm" tone="muted">
            Right-click this shipment or press Actions: both open the same commands.
          </Text>
          <Inline>
            <Menu>
              <MenuTrigger
                render={(props) => (
                  <Button {...props} variant="outline">
                    Actions
                  </Button>
                )}
              />
              {actions}
            </Menu>
          </Inline>
        </Stack>
      </ContextMenuTrigger>
      {actions}
    </ContextMenu>
  );
}
