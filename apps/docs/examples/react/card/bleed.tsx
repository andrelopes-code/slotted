import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { List } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemEnd,
  ListItemLabel,
} from '@slotted/react/list-item';
import { Heading, Text } from '@slotted/react/typography';

const INVOICES = [
  { id: '20418', supplier: 'Meridian Packaging', amount: '$4,820.00' },
  { id: '20431', supplier: 'Alder Freight', amount: '$12,115.50' },
  { id: '20437', supplier: 'Kestrel Pallets', amount: '$1,340.00' },
];

export default function CardBleed() {
  return (
    <Card>
      <CardHeader>
        <Heading level={2} size="md">
          Open invoices
        </Heading>
        <Text size="sm" tone="muted">
          Due before 31 December
        </Text>
      </CardHeader>
      <CardBody bleed>
        <List aria-label="Open invoices" variant="ruled">
          {INVOICES.map((invoice) => (
            <ListItem key={invoice.id}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>{invoice.supplier}</ListItemLabel>
                </ListItemBody>
                <ListItemEnd>{invoice.amount}</ListItemEnd>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </CardBody>
    </Card>
  );
}
