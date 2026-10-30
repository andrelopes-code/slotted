import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';

export default function ButtonSizes() {
  return (
    <Inline align="center" gap={2}>
      <Button size="sm">Add line item</Button>
      <Button size="md">Add line item</Button>
      <Button size="lg">Add line item</Button>
    </Inline>
  );
}
