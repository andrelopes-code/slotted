import { List, type ListVariant } from '@slotted/react/list';
import { ListItem, ListItemBody, ListItemContent, ListItemLabel } from '@slotted/react/list-item';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const VARIANTS: ListVariant[] = ['plain', 'ruled', 'framed', 'separated'];

export default function ListVariants() {
  return (
    <Stack gap={5}>
      {VARIANTS.map((variant) => (
        <Stack gap={2} key={variant}>
          <Text size="sm" tone="muted">
            {variant}
          </Text>
          <List aria-label={`Carriers, ${variant}`} variant={variant}>
            {['UPS Ground', 'FedEx Express'].map((carrier) => (
              <ListItem key={carrier}>
                <ListItemContent>
                  <ListItemBody>
                    <ListItemLabel>{carrier}</ListItemLabel>
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
