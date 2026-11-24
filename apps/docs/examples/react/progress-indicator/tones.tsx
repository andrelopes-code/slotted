import { ProgressBar } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';

export default function ProgressIndicatorTones() {
  return (
    <Stack gap={5}>
      <ProgressBar label="Uploading invoices" showValue value={62} />
      <ProgressBar label="Reindexing the catalog" showValue tone="secondary" value={62} />
      <ProgressBar label="Syncing carrier rates" showValue tone="info" value={62} />
      <ProgressBar label="Backup complete" showValue tone="success" value={100} />
      <ProgressBar label="Storage used" showValue tone="warning" value={88} />
      <ProgressBar label="Transfer failed" showValue tone="danger" value={41} />
    </Stack>
  );
}
