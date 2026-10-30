import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';

export default function MenuDestructive() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Supplier
          </Button>
        )}
      />
      <MenuContent>
        <MenuItem>Edit details</MenuItem>
        <MenuItem tone="success">Approve for purchasing</MenuItem>
        <MenuItem tone="warning">Put payments on hold</MenuItem>
        <MenuSeparator />
        <MenuItem
          description="Removes Northwind Traders and its 18 open purchase orders."
          tone="danger"
        >
          Delete supplier…
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
