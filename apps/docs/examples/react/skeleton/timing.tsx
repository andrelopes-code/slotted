import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Skeleton, SkeletonDefaultsProvider, SkeletonRegion } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function SkeletonTiming() {
  const [loading, setLoading] = useState(false);
  const [withdrawn, setWithdrawn] = useState(0);

  const load = (duration: number) => {
    setLoading(true);
    setTimeout(() => setLoading(false), duration);
  };

  return (
    <SkeletonDefaultsProvider delay={200} minDuration={400}>
      <Stack gap={4}>
        <Inline gap={2}>
          <Button disabled={loading} onClick={() => load(80)} size="sm" variant="outline">
            Respond in 80 ms
          </Button>
          <Button disabled={loading} onClick={() => load(250)} size="sm" variant="outline">
            Respond in 250 ms
          </Button>
          <Button disabled={loading} onClick={() => load(1500)} size="sm" variant="outline">
            Respond in 1.5 s
          </Button>
        </Inline>
        <SkeletonRegion
          loading={loading}
          messages={{ label: 'Loading the shipment' }}
          onReveal={() => setWithdrawn((count) => count + 1)}
        >
          <Skeleton>
            <Text>Pallet PL-4821 left dock 6 at 14:05.</Text>
          </Skeleton>
        </SkeletonRegion>
        <Text size="sm" tone="muted">
          Placeholders withdrawn: {withdrawn}
        </Text>
      </Stack>
    </SkeletonDefaultsProvider>
  );
}
