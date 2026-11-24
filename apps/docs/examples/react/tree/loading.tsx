import { useEffect, useState } from 'react';
import { Button } from '@slotted/react/button';
import { Skeleton, SkeletonRegion } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';
import { Tree, TreeNode } from '@slotted/react/tree';

const ROWS = [
  { id: 'cmh', name: 'Columbus, OH' },
  { id: 'rno', name: 'Reno, NV' },
  { id: 'sav', name: 'Savannah, GA' },
  { id: 'dfw', name: 'Dallas, TX' },
];

export default function TreeLoading() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <Stack align="start" gap={3}>
      <Button size="sm" variant="outline" onClick={() => setLoading(true)}>
        Refresh locations
      </Button>
      <SkeletonRegion
        delay={200}
        loading={loading}
        messages={{ label: 'Loading locations' }}
        minDuration={400}
      >
        <Tree aria-label="Stock locations" loading={loading}>
          {ROWS.map((row) => (
            <TreeNode
              hasChildren
              key={row.id}
              label={loading ? <Skeleton /> : row.name}
              textValue={row.name}
              value={row.id}
            />
          ))}
        </Tree>
      </SkeletonRegion>
    </Stack>
  );
}
