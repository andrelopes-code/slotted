import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';
import { Stack } from '@slotted/react/stack';

export default function AlertContentExample() {
  return (
    <Stack gap={3}>
      <Alert tone="danger">
        <AlertContent>
          <AlertTitle>Deploy failed</AlertTitle>
          <AlertDescription>
            Image sha256:9f2c1ab4e0d37c58b1e6a7d94f03c2b85a1d6e7f4039bc82e15d7a60f3b9c418 was not
            found in the registry.
          </AlertDescription>
        </AlertContent>
      </Alert>
      <Alert hideIcon tone="warning">
        <AlertContent>
          <AlertTitle>Recount required</AlertTitle>
          <AlertDescription>Aisle 14 differs from the system by 3.2%.</AlertDescription>
        </AlertContent>
      </Alert>
      <Alert tone="success">
        <AlertContent>
          <AlertTitle>Pickup confirmed</AlertTitle>
        </AlertContent>
      </Alert>
      <Alert tone="info">
        <AlertContent>
          <AlertDescription>Rates were updated this morning.</AlertDescription>
        </AlertContent>
      </Alert>
    </Stack>
  );
}
