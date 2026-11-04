import { List, type ListSize } from '@slotted/react/list';
import { ListItem, ListItemBody, ListItemContent, ListItemLabel } from '@slotted/react/list-item';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const SIZES: ListSize[] = ['sm', 'md', 'lg'];

export default function ListSizes() {
  return (
    <Stack gap={5}>
      {SIZES.map((size) => (
        <Stack gap={2} key={size}>
          <Text size="sm" tone="muted">
            {size}
          </Text>
          <List aria-label={`Bins, ${size}`} size={size} variant="ruled">
            {['Aisle 4, bin 12', 'Aisle 4, bin 13'].map((bin) => (
              <ListItem key={bin}>
                <ListItemContent>
                  <ListItemBody>
                    <ListItemLabel>{bin}</ListItemLabel>
                  </ListItemBody>
                </ListItemContent>
              </ListItem>
            ))}
          </List>
        </Stack>
      ))}
    </Stack>
  );
}
