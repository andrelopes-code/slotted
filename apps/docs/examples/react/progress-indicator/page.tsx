import { useEffect, useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { ProgressBar } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

/** Stands in for the navigation to a report. */
const NAVIGATION_MS = 1800;

export default function ProgressIndicatorPage() {
  const [navigating, setNavigating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleNavigate() {
    clearTimeout(timer.current);
    setNavigating(true);
    timer.current = setTimeout(() => setNavigating(false), NAVIGATION_MS);
  }

  return (
    <Stack align="start" gap={3}>
      <ProgressBar
        delay={200}
        label="Loading page"
        loading={navigating}
        minDuration={400}
        placement="page"
      />
      <Button onClick={handleNavigate}>Open the Q3 report</Button>
      <Text size="sm" tone="muted">
        The bar crosses the top of the viewport while the report loads.
      </Text>
    </Stack>
  );
}
