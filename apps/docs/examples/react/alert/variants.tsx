import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';
import { Stack } from '@slotted/react/stack';

export default function AlertVariants() {
  return (
    <Stack gap={3}>
      <Alert tone="warning" variant="soft">
        <AlertContent>
          <AlertTitle>Soft</AlertTitle>
          <AlertDescription>Inventory sync is 40 minutes behind.</AlertDescription>
        </AlertContent>
      </Alert>
      <Alert tone="warning" variant="outline">
        <AlertContent>
          <AlertTitle>Outline</AlertTitle>
          <AlertDescription>Inventory sync is 40 minutes behind.</AlertDescription>
        </AlertContent>
      </Alert>
      <Alert tone="warning" variant="solid">
        <AlertContent>
          <AlertTitle>Solid</AlertTitle>
          <AlertDescription>Inventory sync is 40 minutes behind.</AlertDescription>
        </AlertContent>
      </Alert>
    </Stack>
  );
}
