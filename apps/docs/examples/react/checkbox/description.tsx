import { Checkbox } from '@slotted/react/checkbox';
import { Stack } from '@slotted/react/stack';

export default function CheckboxDescription() {
  return (
    <Stack gap={4}>
      <Checkbox
        defaultChecked
        description="One message per failed payment, sent to the billing contact."
      >
        Email me when a payment fails
      </Checkbox>
      <Checkbox description="Sent at 08:00 in the account's time zone, and skipped on days with no failures.">
        Send a daily summary instead
      </Checkbox>
    </Stack>
  );
}
