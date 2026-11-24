import { Card, CardBody, CardHeader } from '@slotted/react/card';
import type { CardFill } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Heading, Text } from '@slotted/react/typography';

const SUMMARIES: { fill: CardFill; title: string; body: string }[] = [
  { fill: 'outline', title: 'Open purchase orders', body: '14 orders, 3 awaiting approval.' },
  { fill: 'elevated', title: 'Invoices due this week', body: '6 invoices totaling $18,240.' },
  { fill: 'subtle', title: 'Reorder alerts', body: '9 products below their reorder point.' },
];

export default function CardFills() {
  return (
    <Grid columns={3} gap={4} minItemWidth="xs">
      {SUMMARIES.map((summary) => (
        <Card fill={summary.fill} key={summary.fill}>
          <CardHeader>
            <Heading level={2} size="md">
              {summary.title}
            </Heading>
            <Text size="sm" tone="muted">{`fill: ${summary.fill}`}</Text>
          </CardHeader>
          <CardBody>
            <Text>{summary.body}</Text>
          </CardBody>
        </Card>
      ))}
    </Grid>
  );
}
