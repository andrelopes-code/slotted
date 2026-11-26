import { useRef, useState } from 'react';

import { Button } from '@slotted/react/button';
import { Card, CardBody } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function LoadingOverlayCancel() {
  const [importing, setImporting] = useState(false);
  const [outcome, setOutcome] = useState('No import has run yet.');
  const timer = useRef<number | undefined>(undefined);

  const start = () => {
    setImporting(true);
    setOutcome('Importing.');
    timer.current = window.setTimeout(() => {
      setImporting(false);
      setOutcome('Imported 4 812 rows.');
    }, 6000);
  };
  const stop = (reason: string) => {
    window.clearTimeout(timer.current);
    setImporting(false);
    setOutcome(`Import stopped (reason: ${reason}).`);
  };

  return (
    <Stack gap={4}>
      <Inline>
        <Button onClick={start}>Import price list</Button>
      </Inline>
      <LoadingOverlay
        cancellable
        loading={importing}
        messages={{ label: 'Importing 4 812 rows' }}
        onCancel={(request) => stop(request.reason)}
      >
        <Card>
          <CardBody>
            <Heading level={3} size="md">
              Price list
            </Heading>
            <Text>4 812 rows, last updated 12 Nov.</Text>
          </CardBody>
        </Card>
      </LoadingOverlay>
      <Text size="sm" tone="muted">
        {outcome}
      </Text>
    </Stack>
  );
}
