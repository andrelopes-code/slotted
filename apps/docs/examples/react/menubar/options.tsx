import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@slotted/react/menu';
import { Menubar } from '@slotted/react/menubar';

export default function MenubarOptions() {
  return (
    <Menubar aria-label="Operations">
      <Menu value="orders">
        <MenuTrigger>Orders</MenuTrigger>
        <MenuContent>
          <MenuItem>New order</MenuItem>
          <MenuItem>Open order…</MenuItem>
        </MenuContent>
      </Menu>
      <Menu value="view">
        <MenuTrigger>View</MenuTrigger>
        <MenuContent>
          <MenuCheckboxItem defaultChecked>Cancelled orders</MenuCheckboxItem>
          <MenuCheckboxItem>Archived orders</MenuCheckboxItem>
          <MenuCheckboxItem>Test orders</MenuCheckboxItem>
          <MenuSeparator />
          <MenuRadioGroup aria-label="Group orders by" defaultValue="status">
            <MenuRadioItem value="status">By status</MenuRadioItem>
            <MenuRadioItem value="customer">By customer</MenuRadioItem>
            <MenuRadioItem value="warehouse">By warehouse</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    </Menubar>
  );
}
