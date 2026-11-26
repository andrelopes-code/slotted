import { Inline } from '@slotted/react/inline';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import { Menubar, MenubarDefaultsProvider } from '@slotted/react/menubar';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function MenubarDefaults() {
  return (
    <MenubarDefaultsProvider size="sm">
      <Stack gap={4}>
        <Inline align="center" gap={4}>
          <Heading level={3} size="md">
            Northwind
          </Heading>
          <Menubar aria-label="Operations">
            <Menu value="orders">
              <MenuTrigger>Orders</MenuTrigger>
              <MenuContent>
                <MenuItem>New order</MenuItem>
                <MenuItem>Open order…</MenuItem>
              </MenuContent>
            </Menu>
            <Menu value="inventory">
              <MenuTrigger>Inventory</MenuTrigger>
              <MenuContent>
                <MenuItem>Receive stock</MenuItem>
                <MenuItem>Count stock</MenuItem>
              </MenuContent>
            </Menu>
          </Menubar>
        </Inline>
        <Text size="sm" tone="muted">
          A bar that states its own size keeps it
        </Text>
        <Menubar aria-label="Operations, large" size="lg">
          <Menu value="orders">
            <MenuTrigger>Orders</MenuTrigger>
            <MenuContent>
              <MenuItem>New order</MenuItem>
              <MenuItem>Open order…</MenuItem>
            </MenuContent>
          </Menu>
          <Menu value="inventory">
            <MenuTrigger>Inventory</MenuTrigger>
            <MenuContent>
              <MenuItem>Receive stock</MenuItem>
              <MenuItem>Count stock</MenuItem>
            </MenuContent>
          </Menu>
        </Menubar>
      </Stack>
    </MenubarDefaultsProvider>
  );
}
