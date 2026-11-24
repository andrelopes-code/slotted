import { Button } from '@slotted/react/button';
import { Card, CardBody, CardFooter, CardHeader, CardMedia } from '@slotted/react/card';
import { Heading, Text } from '@slotted/react/typography';

const COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 160'%3E%3Crect width='320' height='160' fill='%23c7d2fe'/%3E%3Crect x='40' y='70' width='80' height='90' fill='%234338ca'/%3E%3Crect x='130' y='40' width='70' height='120' fill='%236366f1'/%3E%3Crect x='210' y='85' width='70' height='75' fill='%234338ca'/%3E%3C/svg%3E";

export default function CardMediaExample() {
  return (
    <Card>
      <CardMedia>
        <img alt="" src={COVER} />
      </CardMedia>
      <CardHeader>
        <Heading level={2} size="md">
          Meridian Packaging
        </Heading>
        <Text size="sm" tone="muted">
          Rotterdam, 3 warehouses
        </Text>
      </CardHeader>
      <CardBody>
        <Text>14 purchase orders are open, and the next delivery arrives on Tuesday.</Text>
      </CardBody>
      <CardFooter>
        <Button variant="outline">View supplier</Button>
      </CardFooter>
    </Card>
  );
}
