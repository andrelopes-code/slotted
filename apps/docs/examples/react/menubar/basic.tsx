import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';
import { Menubar } from '@slotted/react/menubar';

export default function MenubarBasic() {
  return (
    <Menubar aria-label="Operations">
      <Menu value="orders">
        <MenuTrigger>Orders</MenuTrigger>
        <MenuContent>
          <MenuItem shortcut="Mod+N">New order</MenuItem>
          <MenuItem shortcut="Mod+O">Open order…</MenuItem>
          <MenuSeparator />
          <MenuItem shortcut="Mod+P">Print packing slip</MenuItem>
        </MenuContent>
      </Menu>
      <Menu value="inventory">
        <MenuTrigger>Inventory</MenuTrigger>
        <MenuContent>
          <MenuItem>Receive stock</MenuItem>
          <MenuItem>Count stock</MenuItem>
          <MenuItem>Transfer stock</MenuItem>
        </MenuContent>
      </Menu>
      <Menu value="reports">
        <MenuTrigger>Reports</MenuTrigger>
        <MenuContent>
          <MenuItem>Sales by region</MenuItem>
          <MenuItem>Stock aging</MenuItem>
          <MenuItem>Late shipments</MenuItem>
        </MenuContent>
      </Menu>
    </Menubar>
  );
}
