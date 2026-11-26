import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import { Menubar } from '@slotted/react/menubar';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function MenubarKeyboard() {
  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        loop off: the arrows stop at the first and last trigger
      </Text>
      <Menubar aria-label="Operations, no wrapping" loop={false}>
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
        <Menu value="reports">
          <MenuTrigger>Reports</MenuTrigger>
          <MenuContent>
            <MenuItem>Sales by region</MenuItem>
            <MenuItem>Late shipments</MenuItem>
          </MenuContent>
        </Menu>
      </Menubar>
      <Text size="sm" tone="muted">
        typeahead off: typing a letter moves nothing
      </Text>
      <Menubar aria-label="Operations, no typeahead" typeahead={false}>
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
        <Menu value="reports">
          <MenuTrigger>Reports</MenuTrigger>
          <MenuContent>
            <MenuItem>Sales by region</MenuItem>
            <MenuItem>Late shipments</MenuItem>
          </MenuContent>
        </Menu>
      </Menubar>
    </Stack>
  );
}
