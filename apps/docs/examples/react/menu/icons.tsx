import { Button } from '@slotted/react/button';
import { Glyph, type GlyphName, Icon } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';

const mark = (name: GlyphName) => (
  <Icon>
    <Glyph name={name} />
  </Icon>
);

export default function MenuIcons() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Invoice INV-2041
          </Button>
        )}
      />
      <MenuContent>
        <MenuItem icon={mark('copy')} shortcut="Mod+D">
          Duplicate
        </MenuItem>
        <MenuItem icon={mark('external')} shortcut="Mod+Enter">
          Open in new tab
        </MenuItem>
        <MenuItem icon={mark('file-text')} shortcut="Mod+P">
          Print
        </MenuItem>
        <MenuItem icon={mark('pin')}>Pin to dashboard</MenuItem>
        <MenuItem shortcut="Shift+Mod+R">Rename…</MenuItem>
        <MenuSeparator />
        <MenuItem icon={mark('trash')} shortcut="Mod+Backspace" tone="danger">
          Delete draft
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
