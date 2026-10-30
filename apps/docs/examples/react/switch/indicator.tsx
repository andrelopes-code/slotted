import { useState } from 'react';
import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';

export default function SwitchIndicator() {
  const [open, setOpen] = useState(true);

  return (
    <Stack gap={5}>
      <Switch defaultChecked>Accept backorders</Switch>
      <Switch
        checked={open}
        indicator="none"
        onCheckedChange={setOpen}
        description={
          open ? 'Open: customers can place orders.' : 'Closed: customers see a maintenance page.'
        }
      >
        Storefront
      </Switch>
    </Stack>
  );
}
