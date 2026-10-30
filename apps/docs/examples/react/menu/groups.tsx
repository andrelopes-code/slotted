import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@slotted/react/menu';

export default function MenuGroups() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            SO-10482
          </Button>
        )}
      />
      <MenuContent>
        <MenuGroup label="Fulfilment">
          <MenuItem>Mark as packed</MenuItem>
          <MenuItem>Mark as shipped</MenuItem>
          <MenuItem>Print packing slip</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label="Billing">
          <MenuItem>Send invoice</MenuItem>
          <MenuItem>Record payment…</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label="Customer">
          <MenuItem>Open Northwind Traders</MenuItem>
          <MenuItem>Email the buyer</MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}
