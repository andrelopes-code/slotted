import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';
import { Stack } from '@slotted/react/stack';

export default function AlertReach() {
  return (
    <Stack gap={4}>
      <Alert reach="inline" tone="danger">
        <AlertContent>
          <AlertDescription>Enter a valid EIN, such as 12-3456789.</AlertDescription>
        </AlertContent>
      </Alert>
      <Alert reach="section" tone="warning">
        <AlertContent>
          <AlertTitle>Billing address is incomplete</AlertTitle>
          <AlertDescription>
            Add a postal code before Northwind can issue invoices.
          </AlertDescription>
        </AlertContent>
      </Alert>
      <Alert reach="page" tone="info">
        <AlertContent>
          <AlertTitle>Scheduled maintenance on Saturday from 1:00 AM to 3:00 AM</AlertTitle>
        </AlertContent>
      </Alert>
    </Stack>
  );
}
