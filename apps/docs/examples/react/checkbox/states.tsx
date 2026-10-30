import { Checkbox } from '@slotted/react/checkbox';
import { Stack } from '@slotted/react/stack';

export default function CheckboxStates() {
  return (
    <Stack gap={4}>
      <Checkbox readOnly defaultChecked description="Set by the customer's tax certificate.">
        Tax exempt
      </Checkbox>
      <Checkbox disabled description="Not offered from the Seattle warehouse.">
        Same-day delivery
      </Checkbox>
      <Checkbox invalid description="Confirm the count before closing the cycle.">
        I counted every item on shelf A-14
      </Checkbox>
    </Stack>
  );
}
