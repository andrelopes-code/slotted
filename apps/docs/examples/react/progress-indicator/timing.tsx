import { useEffect, useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { ProgressBar } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

/** Stand in for a response from a warm cache and for one from a distant region. */
const FAST_MS = 150;
const SLOW_MS = 1500;

export default function ProgressIndicatorTiming() {
  const [pending, setPending] = useState(false);
  const [withdrawals, setWithdrawals] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleRequest(duration: number) {
    clearTimeout(timer.current);
    setPending(true);
    timer.current = setTimeout(() => setPending(false), duration);
  }

  return (
    <Stack gap={4}>
      <Inline gap={3}>
        <Button onClick={() => handleRequest(FAST_MS)} variant="outline">
          Fast response
        </Button>
        <Button onClick={() => handleRequest(SLOW_MS)} variant="outline">
          Slow response
        </Button>
      </Inline>
      <Text size="sm" tone="muted">
        No timing
      </Text>
      <ProgressBar label="Loading shipments" loading={pending} />
      <Text size="sm" tone="muted">
        delay 200 ms, minDuration 400 ms
      </Text>
      <ProgressBar
        delay={200}
        label="Loading shipments, timed"
        loading={pending}
        minDuration={400}
        onWithdraw={() => setWithdrawals((count) => count + 1)}
      />
      <Text size="sm">Times the timed bar left the page: {withdrawals}</Text>
    </Stack>
  );
}
