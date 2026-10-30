import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSelectEvent,
  MenuSeparator,
  MenuTrigger,
} from '@slotted/react/menu';
import { Text } from '@slotted/react/typography';

const FORMATS = ['CSV', 'PDF', 'Excel'];

export default function MenuKeyboard() {
  const [last, setLast] = useState('Focus Order, then press ArrowDown.');
  const ran = (command: string) => (event: MenuSelectEvent) =>
    setLast(`${command}, by ${event.reason}`);

  return (
    <Inline align="center" gap={3} wrap="wrap">
      <Menu>
        <MenuTrigger
          render={(props) => (
            <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
              Order
            </Button>
          )}
        />
        <MenuContent>
          <MenuItem onSelect={ran('Edit order')} shortcut="Mod+E">
            Edit order
          </MenuItem>
          <MenuItem onSelect={ran('Duplicate')} shortcut="Mod+D">
            Duplicate
          </MenuItem>
          <Menu>
            <MenuTrigger>Export as</MenuTrigger>
            <MenuContent>
              {FORMATS.map((format) => (
                <MenuItem key={format} onSelect={ran(`Export as ${format}`)}>
                  {format}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
          <MenuSeparator />
          <MenuItem onSelect={ran('Archive')}>Archive</MenuItem>
        </MenuContent>
      </Menu>
      <Text size="sm" tone="muted">
        {last}
      </Text>
    </Inline>
  );
}
