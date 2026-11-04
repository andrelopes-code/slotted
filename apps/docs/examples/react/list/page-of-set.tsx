import { List } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
} from '@slotted/react/list-item';

const ORDERS = [
  { position: 41, id: 'SO-1141', customer: 'Granite Outfitters', total: '$612.40' },
  { position: 42, id: 'SO-1142', customer: 'Cobalt Fitness', total: '$1,208.00' },
  { position: 43, id: 'SO-1143', customer: 'Fernhill School', total: '$94.75' },
];

export default function ListPageOfSet() {
  return (
    <List aria-label="Orders 41 to 43 of 128" variant="ruled">
      {ORDERS.map((order) => (
        <ListItem key={order.id} position={order.position} setSize={128}>
          <ListItemContent>
            <ListItemBody>
              <ListItemLabel>{order.id}</ListItemLabel>
              <ListItemDescription>{order.customer}</ListItemDescription>
            </ListItemBody>
            <ListItemEnd>{order.total}</ListItemEnd>
          </ListItemContent>
        </ListItem>
      ))}
    </List>
  );
}
