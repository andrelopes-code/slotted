import { ProgressBar } from '@slotted/react/progress-indicator';

export default function ProgressIndicatorBasic() {
  return <ProgressBar label="Uploading invoices" showValue value={40} />;
}
