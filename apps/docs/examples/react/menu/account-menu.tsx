import { useState } from 'react';
import { Avatar } from '@slotted/react/avatar';
import { Button } from '@slotted/react/button';
import { Glyph, type GlyphName, Icon } from '@slotted/react/icon';
import {
  Menu,
  MenuContent,
  MenuHeader,
  MenuItem,
  MenuItemDescription,
  MenuItemLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@slotted/react/menu';

const WORKSPACES = ['Northwind Operations', 'Northwind Europe', 'Northwind Wholesale'];

const mark = (name: GlyphName) => (
  <Icon>
    <Glyph name={name} />
  </Icon>
);

export default function MenuAccountMenu() {
  const [workspace, setWorkspace] = useState('Northwind Operations');

  return (
    <Menu align="end">
      <MenuTrigger
        render={(props) => (
          <Button
            {...props}
            start={<Avatar decorative name="Maria Chen" size="sm" />}
            variant="ghost"
          >
            Maria Chen
          </Button>
        )}
      />
      <MenuContent>
        <MenuHeader>
          <Avatar decorative name="Maria Chen" size="md" />
          <MenuItemLabel>Maria Chen</MenuItemLabel>
          <MenuItemDescription>maria.chen@northwind.example</MenuItemDescription>
        </MenuHeader>
        <MenuSeparator />
        <MenuItem icon={mark('person')}>Profile</MenuItem>
        <MenuItem icon={mark('bell')}>Notifications</MenuItem>
        <Menu>
          <MenuTrigger meta={workspace.replace('Northwind ', '')}>Workspace</MenuTrigger>
          <MenuContent>
            <MenuRadioGroup onValueChange={setWorkspace} value={workspace}>
              {WORKSPACES.map((name) => (
                <MenuRadioItem key={name} value={name}>
                  {name}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
        <MenuSeparator />
        <MenuItem icon={mark('arrow-left')} tone="danger">
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
