import { Checkbox } from '@slotted/react/checkbox';
import { Stack } from '@slotted/react/stack';

export default function CheckboxPlacement() {
  return (
    <Stack gap={3}>
      <Checkbox labelPlacement="start" defaultChecked>
        Email when an order ships
      </Checkbox>
      <Checkbox labelPlacement="start">Email when stock runs low</Checkbox>
      <Checkbox labelPlacement="start" defaultChecked>
        Weekly sales digest
      </Checkbox>
    </Stack>
  );
}
