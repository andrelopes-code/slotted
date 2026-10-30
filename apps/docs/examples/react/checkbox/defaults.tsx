import { Checkbox, CheckboxDefaultsProvider } from '@slotted/react/checkbox';
import { Stack } from '@slotted/react/stack';

export default function CheckboxDefaults() {
  return (
    <CheckboxDefaultsProvider size="sm" labelPlacement="start">
      <Stack gap={2}>
        <Checkbox defaultChecked>Show prices with tax</Checkbox>
        <Checkbox>Show discontinued products</Checkbox>
        <Checkbox defaultChecked>Group orders by customer</Checkbox>
      </Stack>
    </CheckboxDefaultsProvider>
  );
}
