import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import { MenuContent, MenuItem } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuLongPressOff() {
  return (
    <ContextMenu longPress={false}>
      <ContextMenuTrigger tabIndex={0}>
        <Stack gap={1}>
          <Heading level={2} size="md">
            Invoice INV-3307
          </Heading>
          <Text size="sm" tone="muted">
            Touch and pen keep their own long-press behavior here.
          </Text>
        </Stack>
      </ContextMenuTrigger>
      <MenuContent>
        <MenuItem>Send reminder</MenuItem>
        <MenuItem>Record payment</MenuItem>
        <MenuItem>Download PDF</MenuItem>
      </MenuContent>
    </ContextMenu>
  );
}
