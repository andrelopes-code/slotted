import { Alert, AlertContent, AlertTitle } from '@slotted/react/alert';
import { Stack } from '@slotted/react/stack';

export default function AlertTones() {
  return (
    <Stack gap={3}>
      <Alert tone="accent">
        <AlertContent>
          <AlertTitle>Cycle count starts Monday</AlertTitle>
        </AlertContent>
      </Alert>
      <Alert tone="secondary">
        <AlertContent>
          <AlertTitle>Carrier rates exclude tax</AlertTitle>
        </AlertContent>
      </Alert>
      <Alert tone="info">
        <AlertContent>
          <AlertTitle>Reorder points were recalculated</AlertTitle>
        </AlertContent>
      </Alert>
      <Alert tone="success">
        <AlertContent>
          <AlertTitle>Invoice INV-2041 was sent</AlertTitle>
        </AlertContent>
      </Alert>
      <Alert tone="warning">
        <AlertContent>
          <AlertTitle>Three shipments miss the pickup window</AlertTitle>
        </AlertContent>
      </Alert>
      <Alert tone="danger">
        <AlertContent>
          <AlertTitle>Payment to Harbor Freight failed</AlertTitle>
        </AlertContent>
      </Alert>
    </Stack>
  );
}
