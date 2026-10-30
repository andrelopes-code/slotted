import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

export default function ButtonTones() {
  return (
    <Stack gap={3}>
      <Inline gap={2}>
        <Button>Create order</Button>
        <Button tone="secondary">Export</Button>
        <Button tone="success">Approve</Button>
        <Button tone="warning">Hold shipment</Button>
        <Button tone="danger">Void invoice</Button>
      </Inline>
      <Inline gap={2}>
        <Button variant="outline">Create order</Button>
        <Button tone="secondary" variant="outline">
          Export
        </Button>
        <Button tone="success" variant="outline">
          Approve
        </Button>
        <Button tone="warning" variant="outline">
          Hold shipment
        </Button>
        <Button tone="danger" variant="outline">
          Void invoice
        </Button>
      </Inline>
    </Stack>
  );
}
