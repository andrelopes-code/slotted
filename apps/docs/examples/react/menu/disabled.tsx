import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';

export default function MenuDisabled() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            SO-10477 · Shipped
          </Button>
        )}
      />
      <MenuContent>
        <MenuItem>Track shipment</MenuItem>
        <MenuItem>Create return…</MenuItem>
        <MenuItem description="A shipped order can no longer be edited." disabled>
          Edit order
        </MenuItem>
        <MenuSeparator />
        <MenuItem description="Create a return instead." disabled tone="danger">
          Cancel order
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
