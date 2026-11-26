import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import { MenuContent, MenuItem, MenuSeparator } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuBasic() {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Stack gap={1}>
          <Heading level={2} size="md">
            Q3 board deck.pdf
          </Heading>
          <Text size="sm" tone="muted">
            4.2 MB, edited yesterday. Right-click anywhere on this file.
          </Text>
        </Stack>
      </ContextMenuTrigger>
      <MenuContent>
        <MenuItem>Open</MenuItem>
        <MenuItem>Rename</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger">Move to trash</MenuItem>
      </MenuContent>
    </ContextMenu>
  );
}
