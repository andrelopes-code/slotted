import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';

const LOCATIONS = [
  'Amsterdam',
  'Antwerp',
  'Barcelona',
  'Berlin',
  'Bologna',
  'Bordeaux',
  'Bratislava',
  'Brno',
  'Brussels',
  'Budapest',
  'Copenhagen',
  'Dublin',
  'Gdańsk',
  'Geneva',
  'Hamburg',
  'Helsinki',
  'Kraków',
  'Leipzig',
  'Lisbon',
  'Ljubljana',
  'Lyon',
  'Madrid',
  'Milan',
  'Munich',
  'Oslo',
  'Porto',
  'Prague',
  'Rotterdam',
  'Stockholm',
  'Tallinn',
  'Valencia',
  'Vienna',
  'Vilnius',
  'Warsaw',
  'Zagreb',
  'Zürich',
];

export default function MenuLongList() {
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Move to warehouse
          </Button>
        )}
      />
      <MenuContent>
        {LOCATIONS.map((location) => (
          <MenuItem key={location}>{location}</MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
