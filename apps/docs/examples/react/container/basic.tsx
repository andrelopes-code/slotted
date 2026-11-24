import { Badge } from '@slotted/react/badge';
import { Card, CardActions, CardHeader } from '@slotted/react/card';
import { Container } from '@slotted/react/container';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContainerBasic() {
  return (
    <Container size="measure">
      <Stack gap={5}>
        <Heading level={2} size="md">
          Usage this month
        </Heading>
        <Text>
          Seats are billed per active user and settled with the invoice on the first business day of
          the next month. Archived warehouses stop counting from the day they are archived.
        </Text>
        <Card>
          <CardHeader>
            <Text weight="semibold">42 active seats</Text>
            <Text size="sm" tone="muted">
              $1,260.00 on December 1
            </Text>
            <CardActions>
              <Badge tone="info">Open</Badge>
            </CardActions>
          </CardHeader>
        </Card>
      </Stack>
    </Container>
  );
}
