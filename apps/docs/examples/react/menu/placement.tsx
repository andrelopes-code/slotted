import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Menu, MenuAlign, MenuContent, MenuItem, MenuSide, MenuTrigger } from '@slotted/react/menu';

const PLACEMENTS: { label: string; side: MenuSide; align: MenuAlign }[] = [
  { label: 'Bottom, start', side: 'bottom', align: 'start' },
  { label: 'Bottom, end', side: 'bottom', align: 'end' },
  { label: 'Top, start', side: 'top', align: 'start' },
  { label: 'Inline end', side: 'inline-end', align: 'start' },
];

export default function MenuPlacement() {
  return (
    <Inline align="center" gap={3} wrap="wrap">
      {PLACEMENTS.map((placement) => (
        <Menu align={placement.align} key={placement.label} side={placement.side}>
          <MenuTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                {placement.label}
              </Button>
            )}
          />
          <MenuContent>
            <MenuItem>Rename…</MenuItem>
            <MenuItem>Duplicate</MenuItem>
            <MenuItem>Archive</MenuItem>
          </MenuContent>
        </Menu>
      ))}
    </Inline>
  );
}
