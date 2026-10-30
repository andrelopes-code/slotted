import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';

export default function SwitchPlacement() {
  return (
    <Stack gap={5}>
      <Switch defaultChecked description="Paid invoices arrive as PDF attachments.">
        Email me a copy of each invoice
      </Switch>
      <Switch labelPlacement="start" description="Unpaid invoices are flagged on the 5th day.">
        Overdue reminders
      </Switch>
    </Stack>
  );
}
