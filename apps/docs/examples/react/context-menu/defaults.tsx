import {
  ContextMenu,
  ContextMenuDefaultsProvider,
  ContextMenuTrigger,
} from '@slotted/react/context-menu';
import { MenuContent, MenuItem } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuDefaults() {
  return (
    <ContextMenuDefaultsProvider longPressDelay={800}>
      <Stack gap={4}>
        <ContextMenu>
          <ContextMenuTrigger>
            <Stack gap={1}>
              <Heading level={2} size="md">
                Inbound dock
              </Heading>
              <Text size="sm" tone="muted">
                Holds for 800 ms, the delay the provider sets.
              </Text>
            </Stack>
          </ContextMenuTrigger>
          <MenuContent>
            <MenuItem>Schedule unloading</MenuItem>
            <MenuItem>View arrivals</MenuItem>
          </MenuContent>
        </ContextMenu>
        <ContextMenu longPressDelay={300}>
          <ContextMenuTrigger>
            <Stack gap={1}>
              <Heading level={2} size="md">
                Outbound dock
              </Heading>
              <Text size="sm" tone="muted">
                Holds for 300 ms, the delay this target sets.
              </Text>
            </Stack>
          </ContextMenuTrigger>
          <MenuContent>
            <MenuItem>Schedule loading</MenuItem>
            <MenuItem>View departures</MenuItem>
          </MenuContent>
        </ContextMenu>
      </Stack>
    </ContextMenuDefaultsProvider>
  );
}
