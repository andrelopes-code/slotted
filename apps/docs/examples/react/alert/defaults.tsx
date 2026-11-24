import { Alert, AlertContent, AlertDefaultsProvider, AlertTitle } from '@slotted/react/alert';
import { Stack } from '@slotted/react/stack';

export default function AlertDefaults() {
  return (
    <AlertDefaultsProvider reach="inline" tone="warning" variant="outline">
      <Stack gap={3}>
        <Alert>
          <AlertContent>
            <AlertTitle>Low stock: Oak desk, 4 left</AlertTitle>
          </AlertContent>
        </Alert>
        <Alert>
          <AlertContent>
            <AlertTitle>Low stock: Desk lamp, 7 left</AlertTitle>
          </AlertContent>
        </Alert>
        <Alert tone="danger">
          <AlertContent>
            <AlertTitle>Out of stock: Task chair</AlertTitle>
          </AlertContent>
        </Alert>
      </Stack>
    </AlertDefaultsProvider>
  );
}
