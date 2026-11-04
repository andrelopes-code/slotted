import { List } from '@slotted/react/list';
import { ListItem, ListItemBody, ListItemContent, ListItemLabel } from '@slotted/react/list-item';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const RULES = [
  'Lithium batteries ship by ground only',
  'Parcels over 30 kg need a two-person lift label',
];

const STEPS = ['Receive the pallet at dock 3', 'Scan every carton', 'Put each carton away by bin'];

export default function ListMarkers() {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          bullet
        </Text>
        <List aria-label="Shipping rules" marker="bullet">
          {RULES.map((rule) => (
            <ListItem key={rule}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>{rule}</ListItemLabel>
                </ListItemBody>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </Stack>

      <Stack gap={2}>
        <Text size="sm" tone="muted">
          number, ordered
        </Text>
        <List aria-label="Receiving steps" marker="number" ordered>
          {STEPS.map((step) => (
            <ListItem key={step}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>{step}</ListItemLabel>
                </ListItemBody>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}
