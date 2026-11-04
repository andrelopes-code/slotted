import { useState } from 'react';

import { Badge } from '@slotted/react/badge';
import { Checkbox } from '@slotted/react/checkbox';
import { List } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
  ListItemStart,
} from '@slotted/react/list-item';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

const ORDERS = [
  { id: 'SO-1182', customer: 'Contoso Foods', lines: 6 },
  { id: 'SO-1183', customer: 'Atlas Freight', lines: 2 },
  { id: 'SO-1184', customer: 'Ember Goods', lines: 11 },
];

export default function ListSelection() {
  const [picked, setPicked] = useState<string[]>(['SO-1182']);

  function handlePick(id: string, checked: boolean) {
    setPicked((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)));
  }

  return (
    <Stack gap={3}>
      <List aria-label="Orders to pick" variant="ruled">
        {ORDERS.map((order) => (
          <ListItem key={order.id} selected={picked.includes(order.id)}>
            <ListItemContent>
              <ListItemStart>
                <Checkbox
                  checked={picked.includes(order.id)}
                  onCheckedChange={(checked) => handlePick(order.id, checked)}
                >
                  <VisuallyHidden>Pick {order.id}</VisuallyHidden>
                </Checkbox>
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>{order.id}</ListItemLabel>
                <ListItemDescription>{order.customer}</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>
                <Badge variant="soft">{order.lines} lines</Badge>
              </ListItemEnd>
            </ListItemContent>
          </ListItem>
        ))}
      </List>
      <Text size="sm" tone="muted">
        {picked.length} of {ORDERS.length} orders on the pick list
      </Text>
    </Stack>
  );
}
