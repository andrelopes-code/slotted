import { Checkbox } from '@slotted/react/checkbox';
import { Stack } from '@slotted/react/stack';

export default function CheckboxLongLabel() {
  return (
    <Stack gap={4}>
      <Checkbox defaultChecked description="Notices go to the billing contact on the account.">
        Send notices about contract changes, delivery deadlines and changes to the return policy for
        this store and every other store in the group
      </Checkbox>
      <Checkbox>
        Forward order events to https://hooks.northwind.example/orders/fulfilment-updates
      </Checkbox>
    </Stack>
  );
}
