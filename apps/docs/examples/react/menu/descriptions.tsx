import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';

export default function MenuDescriptions() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Refund
          </Button>
        )}
      />
      <MenuContent>
        <MenuItem description="Returns $1,240.00 to the card used at checkout.">
          Full refund
        </MenuItem>
        <MenuItem description="Choose the lines and the amount to return.">
          Partial refund…
        </MenuItem>
        <MenuItem description="Adds $1,240.00 to the customer's account balance.">
          Store credit
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
