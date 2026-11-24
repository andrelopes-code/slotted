import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const ORDERS = [
  { id: 'SO-10482', status: 'Shipped', tone: 'success' },
  { id: 'SO-10483', status: 'Awaiting pickup', tone: 'warning' },
  { id: 'SO-10484', status: 'Payment failed', tone: 'danger' },
  { id: 'SO-10485', status: 'Draft', tone: 'secondary' },
] as const;

export default function BadgeBasic() {
  return (
    <Stack gap={3}>
      {ORDERS.map((order) => (
        <Inline key={order.id} align="center" gap={3}>
          <Text numeric="tabular">{order.id}</Text>
          <Badge tone={order.tone}>{order.status}</Badge>
        </Inline>
      ))}
    </Stack>
  );
}
