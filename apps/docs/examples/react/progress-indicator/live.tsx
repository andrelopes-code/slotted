import { useEffect, useState } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { ProgressBar } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

/** Stands in for an import that reports how much of it is done. */
const STEP = 8;

export default function ProgressIndicatorLive() {
  const [started, setStarted] = useState(false);
  const [value, setValue] = useState(0);

  const running = started && value < 100;

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setValue((current) => Math.min(100, current + STEP)), 250);
    return () => clearInterval(timer);
  }, [running]);

  function handleStart() {
    setValue(0);
    setStarted(true);
  }

  return (
    <Stack aria-busy={running || undefined} aria-describedby="import-progress" gap={4}>
      <Inline>
        <Button onClick={handleStart}>Start import</Button>
      </Inline>
      <ProgressBar id="import-progress" label="Importing orders" showValue value={value} />
      <Text size="sm" tone="muted">
        {value === 100 ? '1,240 orders imported.' : 'Northwind Retail, 1,240 orders.'}
      </Text>
    </Stack>
  );
}
