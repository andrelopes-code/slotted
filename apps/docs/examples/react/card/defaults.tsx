import { Card, CardBody, CardDefaultsProvider, CardHeader } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Heading, Text } from '@slotted/react/typography';

export default function CardDefaults() {
  return (
    <CardDefaultsProvider fill="elevated" size="lg">
      <Grid columns={2} gap={4} minItemWidth="xs">
        <Card>
          <CardHeader>
            <Heading level={2} size="md">
              Orders shipped
            </Heading>
            <Text size="sm" tone="muted">
              elevated, lg
            </Text>
          </CardHeader>
          <CardBody>
            <Text>312 orders left the Reno warehouse today.</Text>
          </CardBody>
        </Card>

        <Card fill="outline" size="sm">
          <CardHeader>
            <Heading level={2} size="md">
              Returns received
            </Heading>
            <Text size="sm" tone="muted">
              outline, sm
            </Text>
          </CardHeader>
          <CardBody>
            <Text>18 returns arrived and 11 are restocked.</Text>
          </CardBody>
        </Card>
      </Grid>
    </CardDefaultsProvider>
  );
}
