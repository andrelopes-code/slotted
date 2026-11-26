import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import { MenuContent, MenuItem } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuDisabled() {
  return (
    <Stack gap={4}>
      <ContextMenu>
        <ContextMenuTrigger>
          <Stack gap={1}>
            <Heading level={2} size="md">
              Draft report
            </Heading>
            <Text size="sm" tone="muted">
              Enabled: right-click opens the commands.
            </Text>
          </Stack>
        </ContextMenuTrigger>
        <MenuContent>
          <MenuItem>Edit</MenuItem>
          <MenuItem>Publish</MenuItem>
        </MenuContent>
      </ContextMenu>
      <ContextMenu disabled>
        <ContextMenuTrigger>
          <Stack gap={1}>
            <Heading level={2} size="md">
              Published report
            </Heading>
            <Text size="sm" tone="muted">
              Disabled: right-click opens the browser menu.
            </Text>
          </Stack>
        </ContextMenuTrigger>
        <MenuContent>
          <MenuItem>Edit</MenuItem>
          <MenuItem>Unpublish</MenuItem>
        </MenuContent>
      </ContextMenu>
    </Stack>
  );
}
