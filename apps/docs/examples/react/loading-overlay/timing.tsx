import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Card, CardBody } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function LoadingOverlayTiming() {
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(0);

  const look = (ms: number) => {
    setLoading(true);
    setTimeout(() => setLoading(false), ms);
  };

  return (
    <Stack gap={4}>
      <Inline gap={2}>
        <Button onClick={() => look(100)} variant="outline">
          Fast lookup (100 ms)
        </Button>
        <Button onClick={() => look(500)}>Slower lookup (500 ms)</Button>
      </Inline>
      <LoadingOverlay
        delay={300}
        loading={loading}
        messages={{ label: 'Looking up rates' }}
        minDuration={600}
        onReveal={() => setShown((count) => count + 1)}
      >
        <Card>
          <CardBody>
            <Heading level={3} size="md">
              Exchange rates
            </Heading>
            <Text>1 EUR = 1.08 USD, 1 GBP = 1.27 USD.</Text>
          </CardBody>
        </Card>
      </LoadingOverlay>
      <Text size="sm" tone="muted">
        Layers drawn: {shown}
      </Text>
    </Stack>
  );
}
