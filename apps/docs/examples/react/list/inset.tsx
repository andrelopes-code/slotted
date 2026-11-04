import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { List } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemLabel,
} from '@slotted/react/list-item';
import { Heading } from '@slotted/react/typography';

const CREW = [
  { name: 'Amara Nwosu', role: 'Shift lead, receiving' },
  { name: 'Diego Morales', role: 'Picker, aisles 1 to 6' },
  { name: 'Ingrid Holm', role: 'Packer, station 2' },
];

export default function ListInset() {
  return (
    <Card>
      <CardHeader>
        <Heading level={3} size="md">
          On shift in Reno
        </Heading>
      </CardHeader>
      <CardBody>
        <List aria-label="On shift in Reno" inset variant="ruled">
          {CREW.map((person) => (
            <ListItem key={person.name}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>{person.name}</ListItemLabel>
                  <ListItemDescription>{person.role}</ListItemDescription>
                </ListItemBody>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </CardBody>
    </Card>
  );
}
