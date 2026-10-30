import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Menu, MenuContent, MenuItem, MenuSize, MenuTrigger } from '@slotted/react/menu';

const SIZES: MenuSize[] = ['sm', 'md', 'lg'];

export default function MenuSizes() {
  return (
    <Inline align="center" gap={3}>
      {SIZES.map((size) => (
        <Menu key={size} size={size}>
          <MenuTrigger
            render={(props) => (
              <Button {...props} size={size} variant="outline">
                Actions, {size}
              </Button>
            )}
          />
          <MenuContent>
            <MenuItem shortcut="Mod+E">Edit order</MenuItem>
            <MenuItem shortcut="Mod+D">Duplicate</MenuItem>
            <MenuItem>Print packing slip</MenuItem>
          </MenuContent>
        </Menu>
      ))}
    </Inline>
  );
}
