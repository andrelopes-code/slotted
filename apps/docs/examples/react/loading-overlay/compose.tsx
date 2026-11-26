import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Card, CardBody } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function LoadingOverlayCompose() {
  const [syncing, setSyncing] = useState(true);

  return (
    <Stack gap={4}>
      <Inline>
        <Button onClick={() => setSyncing(true)} variant="outline">
          Sync again
        </Button>
      </Inline>
      <LoadingOverlay
        cancellable
        loading={syncing}
        messages={{ label: 'Syncing the warehouse feed' }}
        onCancel={() => setSyncing(false)}
        render={(props) => <section {...props} />}
        renderCancel={(props) => <Button {...props} size="sm" variant="outline" />}
      >
        <Card>
          <CardBody>
            <Heading level={3} size="md">
              Warehouse feed
            </Heading>
            <Text>Lisbon and Rotterdam, 6 docks.</Text>
            <Text>Last sync at 09:40, 212 pallets received.</Text>
            <Text>Next sync at 10:10.</Text>
          </CardBody>
        </Card>
      </LoadingOverlay>
    </Stack>
  );
}
