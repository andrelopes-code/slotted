import { useState } from 'react';
import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import {
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
} from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuCanvas() {
  const [labels, setLabels] = useState(true);
  const [paths, setPaths] = useState(false);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Stack gap={1}>
          <Heading level={2} size="md">
            Warehouse floor plan
          </Heading>
          <Text size="sm" tone="muted">
            Aisles A1 to D4. {labels ? 'Aisle labels on.' : 'Aisle labels off.'}{' '}
            {paths ? 'Pick paths on.' : 'Pick paths off.'}
          </Text>
        </Stack>
      </ContextMenuTrigger>
      <MenuContent aria-label="Floor plan actions">
        <MenuGroup label="View">
          <MenuCheckboxItem checked={labels} onCheckedChange={setLabels}>
            Aisle labels
          </MenuCheckboxItem>
          <MenuCheckboxItem checked={paths} onCheckedChange={setPaths}>
            Pick paths
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem>Export as PDF</MenuItem>
      </MenuContent>
    </ContextMenu>
  );
}
