import { List, ListEmpty } from '@slotted/react/list';
import { Heading, Text } from '@slotted/react/typography';

export default function ListEmptyExample() {
  return (
    <List aria-label="Returns" variant="framed">
      <ListEmpty>
        <Heading level={3} size="md">
          No returns waiting
        </Heading>
        <Text tone="muted">A return appears here once the customer ships the parcel back.</Text>
      </ListEmpty>
    </List>
  );
}
