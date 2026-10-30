import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';

const CARRIERS = [
  { name: 'DHL Express', transit: '1 day' },
  { name: 'DPD', transit: '2 days' },
  { name: 'FedEx', transit: '1 day' },
  { name: 'GLS', transit: '3 days' },
  { name: 'PostNL', transit: '2 days' },
  { name: 'Royal Mail', transit: '3 days' },
  { name: 'UPS', transit: '2 days' },
  { name: 'USPS', transit: '5 days' },
];

export default function MenuTypeahead() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Ship with
          </Button>
        )}
      />
      <MenuContent>
        {CARRIERS.map((carrier) => (
          <MenuItem key={carrier.name} meta={carrier.transit}>
            {carrier.name}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
