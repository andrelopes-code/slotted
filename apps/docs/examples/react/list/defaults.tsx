import { List, ListDefaultsProvider } from '@slotted/react/list';
import { ListItem, ListItemBody, ListItemContent, ListItemLabel } from '@slotted/react/list-item';
import { Stack } from '@slotted/react/stack';

const ROWS = {
  carriers: ['UPS Ground', 'FedEx Express'],
  docks: ['Dock 1, inbound', 'Dock 3, outbound'],
};

export default function ListDefaultsExample() {
  return (
    <ListDefaultsProvider size="sm" variant="ruled">
      <Stack gap={5}>
        <List aria-label="Carriers">
          {ROWS.carriers.map((name) => (
            <ListItem key={name}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>{name}</ListItemLabel>
                </ListItemBody>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
        <List aria-label="Docks" variant="framed">
          {ROWS.docks.map((name) => (
            <ListItem key={name}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>{name}</ListItemLabel>
                </ListItemBody>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </Stack>
    </ListDefaultsProvider>
  );
}
