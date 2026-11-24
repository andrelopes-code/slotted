import { ProgressBar } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';

export default function ProgressIndicatorBuffer() {
  return (
    <Stack gap={5}>
      <ProgressBar buffer={72} label="Processing uploaded pages" showValue size="lg" value={34} />
      <ProgressBar label="The same value without a buffer" showValue size="lg" value={34} />
    </Stack>
  );
}
