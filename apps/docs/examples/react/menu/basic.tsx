import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';

export default function MenuBasic() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Order actions
          </Button>
        )}
      />
      <MenuContent>
        <MenuItem>View order</MenuItem>
        <MenuItem shortcut="Mod+E">Edit order</MenuItem>
        <MenuItem shortcut="Mod+D">Duplicate</MenuItem>
        <MenuItem shortcut="Mod+P">Print packing slip</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger">Cancel order…</MenuItem>
      </MenuContent>
    </Menu>
  );
}
