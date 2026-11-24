import { Badge, BadgeDefaultsProvider } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function BadgeDefaults() {
  return (
    <BadgeDefaultsProvider locale="de-DE" max={false} size="sm" variant="outline">
      <Stack gap={3}>
        <Inline gap={2}>
          <Badge tone="info">Pending</Badge>
          <Badge tone="success">Approved</Badge>
          <Badge size="md" tone="danger" variant="solid">
            Rejected
          </Badge>
        </Inline>
        <Inline align="center" gap={3}>
          <Badge count={12480} tone="secondary" />
          <Text>Units in stock</Text>
        </Inline>
      </Stack>
    </BadgeDefaultsProvider>
  );
}
