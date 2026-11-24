import { ProgressBar, ProgressCircle } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';

export default function ProgressIndicatorWave() {
  return (
    <Stack gap={5}>
      <ProgressBar label="Rendering the report" showValue size="lg" value={62} wave />
      <ProgressBar label="Preparing your export" size="lg" wave />
      <ProgressCircle label="Rendering the report" showValue size="lg" value={62} wave />
    </Stack>
  );
}
