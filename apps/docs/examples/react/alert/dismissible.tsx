import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

export default function AlertDismissible() {
  return (
    <Stack gap={4}>
      <Inline>
        <Button variant="outline">Export report</Button>
      </Inline>
      <Alert dismissible tone="info">
        <AlertContent>
          <AlertTitle>Carrier tracking links expire in 14 days</AlertTitle>
          <AlertDescription>Download the shipment manifests you still need.</AlertDescription>
        </AlertContent>
      </Alert>
    </Stack>
  );
}
