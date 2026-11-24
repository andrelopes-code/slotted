import { useEffect, useState } from 'react';

import { Avatar } from '@slotted/react/avatar';
import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Skeleton, SkeletonRegion } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function SkeletonCover() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <Stack gap={4}>
      <Inline>
        <Button onClick={() => setLoading(true)} size="sm" variant="outline">
          Replay loading
        </Button>
      </Inline>
      <SkeletonRegion loading={loading} messages={{ label: 'Loading the invoice' }}>
        <Inline align="center" gap={4}>
          <Skeleton shape="circle" size="lg">
            <Avatar name="Tomás Rivera" size="lg" />
          </Skeleton>
          <Stack gap={1}>
            <Skeleton>
              <Text>Tomás Rivera</Text>
            </Skeleton>
            <Skeleton>
              <Text size="sm" tone="muted">
                Invoice 4821, due 30 Nov
              </Text>
            </Skeleton>
          </Stack>
          <Skeleton>
            <Badge tone="success">Paid in full</Badge>
          </Skeleton>
        </Inline>
      </SkeletonRegion>
    </Stack>
  );
}
