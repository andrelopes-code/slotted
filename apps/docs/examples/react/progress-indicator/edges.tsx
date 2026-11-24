import { useEffect, useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { Card, CardBody, CardFooter, CardHeader } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { ProgressBar } from '@slotted/react/progress-indicator';
import { Heading, Text } from '@slotted/react/typography';

/** Stands in for a refresh and for a save that reports how much of it is done. */
const REFRESH_MS = 2500;
const SAVE_STEP = 10;

export default function ProgressIndicatorEdges() {
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const saving = saved !== null && saved < 100;

  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  useEffect(() => {
    if (!saving) return undefined;
    const timer = setInterval(
      () => setSaved((current) => Math.min(100, (current ?? 0) + SAVE_STEP)),
      250,
    );
    return () => clearInterval(timer);
  }, [saving]);

  function handleRefresh() {
    clearTimeout(refreshTimer.current);
    setRefreshing(true);
    refreshTimer.current = setTimeout(() => setRefreshing(false), REFRESH_MS);
  }

  function handleSave() {
    setSaved(0);
  }

  return (
    <Card>
      <ProgressBar label="Refreshing orders" loading={refreshing} placement="edge-start" />
      <CardHeader>
        <Heading level={2} size="md">
          Open orders
        </Heading>
        <Text size="sm" tone="muted">
          The bars stand on the top and bottom edges of this card.
        </Text>
      </CardHeader>
      <CardBody>
        <Text size="sm">38 orders are waiting for a carrier pickup.</Text>
      </CardBody>
      <CardFooter>
        <Inline gap={3}>
          <Button onClick={handleRefresh} variant="outline">
            Refresh orders
          </Button>
          <Button onClick={handleSave} variant="outline">
            Save view
          </Button>
        </Inline>
      </CardFooter>
      <ProgressBar label="Saving the view" loading={saving} placement="edge-end" value={saved} />
    </Card>
  );
}
