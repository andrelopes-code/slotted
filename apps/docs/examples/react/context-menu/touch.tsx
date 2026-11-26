import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import { MenuContent, MenuItem } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuTouch() {
  return (
    <ContextMenu longPressDelay={800}>
      <ContextMenuTrigger>
        <Stack gap={1}>
          <Heading level={2} size="md">
            Order SO-10482
          </Heading>
          <Text size="sm" tone="muted">
            Out for delivery. On touch, hold for 800 ms.
          </Text>
        </Stack>
      </ContextMenuTrigger>
      <MenuContent>
        <MenuItem>View order</MenuItem>
        <MenuItem>Track delivery</MenuItem>
        <MenuItem>Print packing slip</MenuItem>
      </MenuContent>
    </ContextMenu>
  );
}
