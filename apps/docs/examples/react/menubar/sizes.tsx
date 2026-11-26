import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import { Menubar } from '@slotted/react/menubar';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function MenubarSizes() {
  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        sm
      </Text>
      <Menubar aria-label="Operations, small" size="sm">
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
      <Text size="sm" tone="muted">
        md
      </Text>
      <Menubar aria-label="Operations, medium" size="md">
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
      <Text size="sm" tone="muted">
        lg
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
  );
}
