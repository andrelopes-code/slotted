import { useEffect, useState } from 'react';

import { Avatar } from '@slotted/react/avatar';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Skeleton, SkeletonRegion } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';
import { Heading } from '@slotted/react/typography';

const ACTIVE = ['Maria Chen', 'Tomás Rivera', 'Priya Nair', 'Jonas Weber'];

export default function SkeletonSilent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <Stack gap={4}>
      <Inline align="center" gap={3}>
        <Heading level={2} size="md">
          Recently active
        </Heading>
        <Button onClick={() => setLoading(true)} size="sm" variant="outline">
          Replay loading
        </Button>
      </Inline>
      <SkeletonRegion live="off" loading={loading}>
        <Inline gap={2}>
          {ACTIVE.map((name) =>
            loading ? (
              <Skeleton key={name} shape="circle" size="md" />
            ) : (
              <Avatar key={name} name={name} size="md" />
            ),
          )}
        </Inline>
      </SkeletonRegion>
    </Stack>
  );
}
