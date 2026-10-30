import { Button } from '@slotted/react/button';
import { Stack } from '@slotted/react/stack';

export default function ButtonFullWidth() {
  return (
    <Stack gap={2}>
      <Button fullWidth>Pay $1,240.00</Button>
      <Button fullWidth tone="secondary" variant="outline">
        Pay by bank transfer
      </Button>
    </Stack>
  );
}
