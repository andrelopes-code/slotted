import { Card, CardBody } from '@slotted/react/card';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const VEILS = [
  { veil: 'wash', title: 'Open invoices', value: '14 invoices, $48,210.00' },
  { veil: 'blur', title: 'Overdue balance', value: '3 customers, $6,940.50' },
  { veil: 'none', title: 'Pending refunds', value: '2 orders, $318.00' },
] as const;

export default function LoadingOverlayVeil() {
  return (
    <Stack gap={4}>
      {VEILS.map(({ veil, title, value }) => (
        <LoadingOverlay
          description={veil}
          key={veil}
          messages={{ label: 'Refreshing balances' }}
          veil={veil}
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
