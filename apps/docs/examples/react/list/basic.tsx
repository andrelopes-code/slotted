import { List } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
  ListItemLink,
} from '@slotted/react/list-item';

const WAREHOUSES = [
  { id: 'reno', name: 'Reno', summary: '312 orders to ship today', open: '1,284' },
  { id: 'columbus', name: 'Columbus', summary: '198 orders to ship today', open: '962' },
  { id: 'savannah', name: 'Savannah', summary: '74 orders to ship today', open: '418' },
];

export default function ListBasic() {
  return (
    <List aria-label="Warehouses" variant="ruled">
      {WAREHOUSES.map((warehouse) => (
        <ListItem key={warehouse.id}>
          <ListItemLink href={`#${warehouse.id}`}>
            <ListItemBody>
              <ListItemLabel>{warehouse.name}</ListItemLabel>
              <ListItemDescription>{warehouse.summary}</ListItemDescription>
            </ListItemBody>
            <ListItemEnd>{warehouse.open}</ListItemEnd>
          </ListItemLink>
        </ListItem>
      ))}
    </List>
  );
}
