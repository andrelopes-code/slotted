import { Inline } from '@slotted/react/inline';
import { Loader, ProgressBar, ProgressCircle } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';

export default function ProgressIndicatorSizes() {
  return (
    <Stack gap={5}>
      <ProgressBar label="Small" showValue size="sm" value={55} />
      <ProgressBar label="Medium" showValue size="md" value={55} />
      <ProgressBar label="Large" showValue size="lg" value={55} />
      <Inline align="center" gap={4}>
        <ProgressCircle hideLabel label="Small ring" size="sm" value={55} />
        <ProgressCircle hideLabel label="Medium ring" size="md" value={55} />
        <ProgressCircle hideLabel label="Large ring" size="lg" value={55} />
      </Inline>
      <Inline align="center" gap={4}>
        <Loader hideLabel label="Small loader" size="sm" />
        <Loader hideLabel label="Medium loader" size="md" />
        <Loader hideLabel label="Large loader" size="lg" />
      </Inline>
    </Stack>
  );
}
