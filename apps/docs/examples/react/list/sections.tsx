import { List, ListSection } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
} from '@slotted/react/list-item';

const DAYS = [
  {
    day: 'Today',
    total: '$4,820.00',
    payouts: [
      { id: 'PO-2291', customer: 'Contoso Foods', amount: '$3,150.00' },
      { id: 'PO-2290', customer: 'Aster Bakery', amount: '$1,670.00' },
    ],
  },
  {
    day: 'Yesterday',
    total: '$3,115.50',
    payouts: [
      { id: 'PO-2289', customer: 'Bluefin Market', amount: '$2,240.50' },
      { id: 'PO-2288', customer: 'Driftwood Inn', amount: '$875.00' },
    ],
  },
];

export default function ListSections() {
  return (
    <List aria-label="Payouts" variant="ruled">
      {DAYS.map((group) => (
        <ListSection end={group.total} key={group.day} label={group.day}>
          {group.payouts.map((payout) => (
            <ListItem key={payout.id}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>{payout.customer}</ListItemLabel>
                  <ListItemDescription>{payout.id}</ListItemDescription>
                </ListItemBody>
                <ListItemEnd>{payout.amount}</ListItemEnd>
              </ListItemContent>
            </ListItem>
          ))}
        </ListSection>
      ))}
    </List>
  );
}
