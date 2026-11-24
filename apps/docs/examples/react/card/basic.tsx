import { Button } from '@slotted/react/button';
import { Card, CardBody, CardFooter, CardHeader } from '@slotted/react/card';
import { Heading, Text } from '@slotted/react/typography';

export default function CardBasic() {
  return (
    <Card>
      <CardHeader>
        <Heading level={2} size="md">
          Meridian Packaging
        </Heading>
        <Text size="sm" tone="muted">
          Supplier since 2019
        </Text>
      </CardHeader>
      <CardBody>
        <Text>Delivers pallets of cartons to Rotterdam every Tuesday and Friday.</Text>
      </CardBody>
      <CardFooter>
        <Button variant="outline">View orders</Button>
      </CardFooter>
    </Card>
  );
}
