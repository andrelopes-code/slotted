import { useEffect, useState } from 'react';

import { Avatar } from '@slotted/react/avatar';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Skeleton, SkeletonRegion } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const TEAM = [
  { name: 'Maria Chen', role: 'Dock supervisor', widths: ['5.5rem', '7rem'] },
  { name: 'Tomás Rivera', role: 'Forklift operator', widths: ['6.5rem', '8rem'] },
  { name: 'Priya Nair', role: 'Inventory analyst', widths: ['5rem', '7.5rem'] },
];

export default function SkeletonRegionExample() {
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
          Warehouse team
        </Heading>
        <Button onClick={() => setLoading(true)} size="sm" variant="outline">
          Replay loading
        </Button>
      </Inline>
      <SkeletonRegion
        loadedLabel="Team loaded"
        loading={loading}
        messages={{ label: 'Loading the team' }}
      >
        <Stack gap={4}>
          {TEAM.map((member) => (
            <Inline key={member.name} align="center" gap={3}>
              {loading ? (
                <Skeleton shape="circle" size="md" />
              ) : (
                <Avatar name={member.name} size="md" />
              )}
              <Stack gap={1}>
                <Text>{loading ? <Skeleton inlineSize={member.widths[0]} /> : member.name}</Text>
                <Text size="sm" tone="muted">
                  {loading ? <Skeleton inlineSize={member.widths[1]} /> : member.role}
                </Text>
              </Stack>
            </Inline>
          ))}
        </Stack>
      </SkeletonRegion>
    </Stack>
  );
}
