import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import { Menubar } from '@slotted/react/menubar';
import { Stack } from '@slotted/react/stack';

export default function MenubarStates() {
  return (
    <Stack gap={4}>
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
        <Menu disabled value="archive">
          <MenuTrigger>Archive</MenuTrigger>
          <MenuContent>
            <MenuItem>Restore order</MenuItem>
          </MenuContent>
        </Menu>
      </Menubar>
      <Menubar aria-label="Closed period" disabled>
        <Menu value="journal">
          <MenuTrigger>Journal</MenuTrigger>
          <MenuContent>
            <MenuItem>Post entry</MenuItem>
            <MenuItem>Reverse entry</MenuItem>
          </MenuContent>
        </Menu>
        <Menu value="ledger">
          <MenuTrigger>Ledger</MenuTrigger>
          <MenuContent>
            <MenuItem>Reconcile account</MenuItem>
          </MenuContent>
        </Menu>
      </Menubar>
    </Stack>
  );
}
