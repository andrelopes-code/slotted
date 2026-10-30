import { Checkbox } from '@slotted/react/checkbox';
import { Stack } from '@slotted/react/stack';

export default function CheckboxSizes() {
  return (
    <Stack gap={4}>
      <Checkbox size="sm" defaultChecked>
        Show archived orders
      </Checkbox>
      <Checkbox size="md" defaultChecked>
        Notify the warehouse
      </Checkbox>
      <Checkbox size="lg" defaultChecked>
        Remember this device
      </Checkbox>
    </Stack>
  );
}
