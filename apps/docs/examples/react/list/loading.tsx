import { useEffect, useState } from 'react';

import { Button } from '@slotted/react/button';
import { List } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
} from '@slotted/react/list-item';
import { Skeleton, SkeletonRegion } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';

const CARRIERS = [
  { name: 'UPS Ground', cutoff: 'Pickup at 16:30', parcels: '142', widths: ['6rem', '7rem'] },
  { name: 'FedEx Express', cutoff: 'Pickup at 17:00', parcels: '38', widths: ['7.5rem', '7rem'] },
  { name: 'USPS Priority', cutoff: 'Drop-off by 18:00', parcels: '61', widths: ['7rem', '8rem'] },
];

export default function ListLoading() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <Stack align="start" gap={3}>
      <Button onClick={() => setLoading(true)} size="sm" variant="outline">
        Refresh carriers
      </Button>
      <SkeletonRegion
        delay={200}
        loading={loading}
        messages={{ label: 'Loading carriers' }}
        minDuration={400}
      >
        <List aria-label="Carriers" loading={loading} variant="ruled">
          {CARRIERS.map((carrier) => (
            <ListItem key={carrier.name} loading={loading}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>
                    {loading ? <Skeleton inlineSize={carrier.widths[0]} /> : carrier.name}
                  </ListItemLabel>
                  <ListItemDescription>
                    {loading ? <Skeleton inlineSize={carrier.widths[1]} /> : carrier.cutoff}
                  </ListItemDescription>
                </ListItemBody>
                <ListItemEnd>
                  {loading ? <Skeleton inlineSize="2rem" /> : carrier.parcels}
                </ListItemEnd>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </SkeletonRegion>
    </Stack>
  );
}
