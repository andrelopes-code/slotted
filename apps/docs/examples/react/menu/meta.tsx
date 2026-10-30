import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@slotted/react/menu';

const VIEWS = [
  { label: 'Awaiting payment', count: '18' },
  { label: 'Ready to ship', count: '42' },
  { label: 'On hold', count: '3' },
  { label: 'Returns', count: '7' },
];

export default function MenuMeta() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            All orders
          </Button>
        )}
      />
      <MenuContent>
        <MenuItem meta="1,284">All orders</MenuItem>
        <MenuSeparator />
        {VIEWS.map((view) => (
          <MenuItem key={view.label} meta={view.count}>
            {view.label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
