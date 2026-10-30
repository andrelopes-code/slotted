import { Checkbox } from '@slotted/react/checkbox';
import { Stack } from '@slotted/react/stack';

export default function CheckboxBasic() {
  return (
    <Stack gap={3}>
      <Checkbox defaultChecked>Email the invoice to the customer</Checkbox>
      <Checkbox defaultChecked>Include a packing slip</Checkbox>
      <Checkbox>Gift-wrap the order</Checkbox>
    </Stack>
  );
}
