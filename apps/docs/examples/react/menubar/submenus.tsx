import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';
import { Menubar } from '@slotted/react/menubar';

export default function MenubarSubmenus() {
  return (
    <Menubar aria-label="Operations">
      <Menu value="orders">
        <MenuTrigger>Orders</MenuTrigger>
        <MenuContent>
          <MenuItem>New order</MenuItem>
          <Menu>
            <MenuTrigger>Export as</MenuTrigger>
            <MenuContent>
              <MenuItem>CSV</MenuItem>
              <MenuItem>PDF</MenuItem>
              <MenuItem>Excel workbook</MenuItem>
            </MenuContent>
          </Menu>
          <MenuSeparator />
          <MenuItem>Print packing slip</MenuItem>
        </MenuContent>
      </Menu>
      <Menu value="inventory">
        <MenuTrigger>Inventory</MenuTrigger>
        <MenuContent>
          <MenuItem>Receive stock</MenuItem>
          <Menu>
            <MenuTrigger>Move to warehouse</MenuTrigger>
            <MenuContent>
              <MenuItem>Rotterdam</MenuItem>
              <MenuItem>Leipzig</MenuItem>
              <MenuItem>Lyon</MenuItem>
              <MenuItem>Gdańsk</MenuItem>
            </MenuContent>
          </Menu>
        </MenuContent>
      </Menu>
    </Menubar>
  );
}
