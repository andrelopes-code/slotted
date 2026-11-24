import {
  Alert,
  AlertActions,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@slotted/react/alert';
import { Button } from '@slotted/react/button';
import { Stack } from '@slotted/react/stack';

export default function AlertActionsExample() {
  return (
    <Stack gap={4}>
      <Alert tone="warning">
        <AlertContent>
          <AlertTitle>Your Northwind plan renews in three days</AlertTitle>
        </AlertContent>
        <AlertActions>
          <Button>Renew now</Button>
          <Button variant="ghost">View plans</Button>
        </AlertActions>
      </Alert>
      <Alert actionsPlacement="end" tone="info">
        <AlertContent>
          <AlertDescription>
            The suggestion changes three lines of purchase order PO-7712.
          </AlertDescription>
        </AlertContent>
        <AlertActions>
          <Button>Apply</Button>
        </AlertActions>
      </Alert>
      <Alert reach="page" tone="danger">
        <AlertContent>
          <AlertTitle>Payments are paused for the Rotterdam warehouse</AlertTitle>
        </AlertContent>
        <AlertActions>
          <Button>Resolve</Button>
        </AlertActions>
      </Alert>
    </Stack>
  );
}
