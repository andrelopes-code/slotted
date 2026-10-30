import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@slotted/react/menu';

const PEOPLE = ['Maria Chen', 'Tomás Ortega', 'Aiko Tanaka', 'Unassigned'];
const WAREHOUSES = ['Rotterdam', 'Leipzig', 'Lyon', 'Gdańsk'];

export default function MenuSubmenus() {
  const [assignee, setAssignee] = useState('Maria Chen');

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
        <MenuItem>View order</MenuItem>
        <Menu>
          <MenuTrigger meta={assignee}>Assign to</MenuTrigger>
          <MenuContent>
            <MenuRadioGroup onValueChange={setAssignee} value={assignee}>
              {PEOPLE.map((person) => (
                <MenuRadioItem key={person} value={person}>
                  {person}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger>Move to warehouse</MenuTrigger>
          <MenuContent>
            {WAREHOUSES.map((warehouse) => (
              <MenuItem key={warehouse}>{warehouse}</MenuItem>
            ))}
          </MenuContent>
        </Menu>
        <MenuSeparator />
        <MenuItem tone="danger">Cancel order…</MenuItem>
      </MenuContent>
    </Menu>
  );
}
