import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import { MenuContent, MenuItem, MenuSeparator } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuKeyboard() {
  return (
    <ContextMenu>
      <ContextMenuTrigger tabIndex={0}>
        <Stack gap={1}>
          <Heading level={2} size="md">
            Release notes 4.2
          </Heading>
          <Text size="sm" tone="muted">
            Press Tab to focus this item, then Shift+F10 or the Menu key.
          </Text>
        </Stack>
      </ContextMenuTrigger>
      <MenuContent>
        <MenuItem>Open</MenuItem>
        <MenuItem>Copy link</MenuItem>
        <MenuSeparator />
        <MenuItem>Archive</MenuItem>
      </MenuContent>
    </ContextMenu>
  );
}
