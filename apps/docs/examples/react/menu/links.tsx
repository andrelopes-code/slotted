import { Button } from '@slotted/react/button';
import { Glyph, Icon } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';

export default function MenuLinks() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Open
          </Button>
        )}
      />
      <MenuContent>
        <MenuItem render={(props) => <a {...props} href="#order-SO-10482" />}>Order page</MenuItem>
        <MenuItem render={(props) => <a {...props} href="#customer-northwind" />}>
          Customer profile
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          icon={
            <Icon>
              <Glyph name="external" />
            </Icon>
          }
          render={(props) => (
            <a
              {...props}
              href="https://example.com/carriers/track/1Z999AA10123456784"
              rel="noreferrer"
              target="_blank"
            />
          )}
        >
          Carrier tracking
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
