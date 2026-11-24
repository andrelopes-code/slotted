import { ProgressBar, ProgressCircle } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';

export default function ProgressIndicatorIndeterminate() {
  return (
    <Stack gap={5}>
      <ProgressBar label="Preparing your export" />
      <ProgressCircle label="Checking availability" />
    </Stack>
  );
}
