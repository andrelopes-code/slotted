import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Card, CardBody } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function LoadingOverlayAnnounce() {
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 2500);
  };
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2500);
  };

  return (
    <Stack gap={4}>
      <Inline gap={2}>
        <Button onClick={save}>Save prices</Button>
        <Button onClick={refresh} variant="outline">
          Refresh stock
        </Button>
      </Inline>
      <LoadingOverlay
        loadedLabel="Prices saved"
        loading={saving}
        messages={{ label: 'Saving prices' }}
      >
        <Card>
          <CardBody>
            <Heading level={3} size="md">
              Price list
            </Heading>
            <Text>Announces the wait and the result.</Text>
          </CardBody>
        </Card>
      </LoadingOverlay>
      <LoadingOverlay live="off" loading={refreshing} messages={{ label: 'Refreshing stock' }}>
        <Card>
          <CardBody>
            <Heading level={3} size="md">
              Stock levels
            </Heading>
            <Text>Announces nothing: the page says it elsewhere.</Text>
          </CardBody>
        </Card>
      </LoadingOverlay>
    </Stack>
  );
}
