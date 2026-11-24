import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Skeleton, SkeletonRegion, SkeletonText } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';
import { Heading } from '@slotted/react/typography';

export default function SkeletonPartial() {
  return (
    <SkeletonRegion messages={{ label: 'Loading shipment SO-10482' }}>
      <Stack gap={3}>
        <Heading level={2} size="md">
          Shipment SO-10482
        </Heading>
        <Inline align="center" gap={3}>
          <Skeleton loading={false}>
            <Badge tone="info">In transit</Badge>
          </Skeleton>
          <Skeleton inlineSize="8rem" />
        </Inline>
        <SkeletonText lines={2} />
      </Stack>
    </SkeletonRegion>
  );
}
