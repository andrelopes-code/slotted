import { ProgressBar } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';

export default function ProgressIndicatorDeterminate() {
  return (
    <Stack gap={5}>
      <ProgressBar label="Copying files" showValue value={40} />
      <ProgressBar label="Pallets staged" max={400} min={200} showValue value={260} />
      <ProgressBar
        format={{ style: 'unit', unit: 'megabyte', unitDisplay: 'narrow' }}
        label="Downloading carrier manifest"
        max={512}
        showValue
        value={128}
      />
      <ProgressBar label="Importing orders" max={7} showValue value={3} valueText="3 of 7 files" />
      <ProgressBar label="Backup finished" showValue value={100} />
    </Stack>
  );
}
