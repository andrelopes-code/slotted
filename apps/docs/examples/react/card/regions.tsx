import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import { Card, CardActions, CardBody, CardFooter, CardHeader } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { Heading, Text } from '@slotted/react/typography';

export default function CardRegions() {
  return (
    <Card>
      <CardHeader>
        <Heading level={2} size="md">
          Invoice 20418
        </Heading>
        <Text size="sm" tone="muted">
          Meridian Packaging
        </Text>
        <CardActions>
          <Badge tone="warning">Overdue</Badge>
        </CardActions>
      </CardHeader>
      <CardBody>
        <Text>$4,820.00 was due on 15 November. A late fee of 1.5% applies from 1 December.</Text>
      </CardBody>
      <CardFooter>
        <Inline>
          <Button>Pay invoice</Button>
          <Button tone="secondary" variant="outline">
            Download PDF
          </Button>
        </Inline>
      </CardFooter>
    </Card>
  );
}
