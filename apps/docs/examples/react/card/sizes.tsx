import { Card, CardBody, CardFooter, CardHeader } from '@slotted/react/card';
import type { CardSize } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Heading, Text } from '@slotted/react/typography';

const SIZES: CardSize[] = ['sm', 'md', 'lg'];

export default function CardSizes() {
  return (
    <Grid columns={3} gap={4} minItemWidth="xs">
      {SIZES.map((size) => (
        <Card key={size} size={size}>
          <CardHeader>
            <Heading level={2} size="md">
              Invoice 20418
            </Heading>
            <Text size="sm" tone="muted">{`size: ${size}`}</Text>
          </CardHeader>
          <CardBody>
            <Text>$4,820.00, due 15 December.</Text>
          </CardBody>
          <CardFooter>
            <Text size="sm" tone="muted">
              Meridian Packaging
            </Text>
          </CardFooter>
        </Card>
      ))}
    </Grid>
  );
}
