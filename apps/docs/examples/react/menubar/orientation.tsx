import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import { Menubar } from '@slotted/react/menubar';

export default function MenubarOrientation() {
  return (
    <Menubar aria-label="Workspace" orientation="vertical">
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
  );
}
