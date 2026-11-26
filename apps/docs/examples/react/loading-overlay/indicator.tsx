import { useRef, useState } from 'react';

import { Button } from '@slotted/react/button';
import { Card, CardBody } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { ProgressBar } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function LoadingOverlayIndicator() {
  const [progress, setProgress] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const upload = () => {
    setProgress(0);
    timer.current = window.setInterval(() => {
      setProgress((value) => {
        const next = (value ?? 0) + 10;
        if (next < 100) return next;
        window.clearInterval(timer.current);
        return null;
      });
    }, 400);
  };

  return (
    <Stack gap={4}>
      <Inline>
        <Button onClick={upload}>Upload manifest</Button>
      </Inline>
      <LoadingOverlay
        indicator={<ProgressBar hideLabel label="Uploaded" value={progress ?? 100} />}
        loading={progress !== null}
        messages={{ label: 'Uploading carrier-manifest.csv' }}
      >
        <Card>
          <CardBody>
            <Heading level={3} size="md">
              Carrier manifest
            </Heading>
            <Text>Pickup list for 14 Nov, 38 shipments.</Text>
          </CardBody>
        </Card>
      </LoadingOverlay>
    </Stack>
  );
}
