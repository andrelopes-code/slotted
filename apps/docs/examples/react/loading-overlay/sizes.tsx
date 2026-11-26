import { Card, CardBody } from '@slotted/react/card';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const SIZES = [
  { size: 'sm', title: 'Bank statement', value: '312 lines, 18 unmatched' },
  { size: 'md', title: 'Card payouts', value: '41 payouts, 2 on hold' },
  { size: 'lg', title: 'Supplier invoices', value: '27 invoices, 5 due this week' },
] as const;

export default function LoadingOverlaySizes() {
  return (
    <Stack gap={4}>
      {SIZES.map(({ size, title, value }) => (
        <LoadingOverlay
          description={size}
          key={size}
          messages={{ label: 'Reconciling' }}
          size={size}
        >
          <Card>
            <CardBody>
              <Heading level={3} size="md">
                {title}
              </Heading>
              <Text>{value}</Text>
            </CardBody>
          </Card>
        </LoadingOverlay>
      ))}
    </Stack>
  );
}
