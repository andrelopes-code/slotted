import { Button, IconButton } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';
import {
  SplitButton,
  SplitButtonMenu,
  SplitButtonMenuTrigger,
  SplitButtonPrimary,
} from '@slotted/react/split-button';

export default function MenuTriggers() {
  return (
    <Inline align="center" gap={3}>
      <Menu>
        <MenuTrigger
          render={(props) => (
            <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
              Export
            </Button>
          )}
        />
        <MenuContent>
          <MenuItem>CSV for spreadsheets</MenuItem>
          <MenuItem>PDF summary</MenuItem>
          <MenuItem>Accounting journal</MenuItem>
        </MenuContent>
      </Menu>

      <Menu align="end">
        <MenuTrigger
          render={(props) => (
            <IconButton {...props} aria-label="More actions for SO-10482">
              <Glyph name="ellipsis" />
            </IconButton>
          )}
        />
        <MenuContent>
          <MenuItem>Copy order number</MenuItem>
          <MenuItem>Add internal note</MenuItem>
          <MenuItem>Open customer</MenuItem>
        </MenuContent>
      </Menu>

      <SplitButton>
        <SplitButtonPrimary>Ship order</SplitButtonPrimary>
        <SplitButtonMenu>
          <SplitButtonMenuTrigger aria-label="More ways to ship" />
          <MenuContent>
            <MenuItem>Ship and print label</MenuItem>
            <MenuItem>Ship part of the order…</MenuItem>
            <MenuItem>Schedule for tomorrow</MenuItem>
          </MenuContent>
        </SplitButtonMenu>
      </SplitButton>
    </Inline>
  );
}
