import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '@slotted/react/menu';

const GROUPINGS = [
  { value: 'none', label: 'No grouping' },
  { value: 'status', label: 'Status' },
  { value: 'customer', label: 'Customer' },
  { value: 'warehouse', label: 'Warehouse' },
];

export default function MenuRadioItems() {
  const [grouping, setGrouping] = useState('status');
  const current = GROUPINGS.find((option) => option.value === grouping)?.label;

  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Group by: {current}
          </Button>
        )}
      />
      <MenuContent>
        <MenuRadioGroup aria-label="Group orders by" onValueChange={setGrouping} value={grouping}>
          {GROUPINGS.map((option) => (
            <MenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}
