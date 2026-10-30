import { useState } from 'react';
import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';

export default function SwitchControlled() {
  const [paused, setPaused] = useState(false);

  return (
    <Stack gap={5}>
      <Switch
        checked={paused}
        labelPlacement="start"
        onCheckedChange={setPaused}
        description="Turns off the alerts below until you resume."
      >
        Pause all alerts
      </Switch>
      <Stack gap={4}>
        <Switch defaultChecked disabled={paused} labelPlacement="start">
          New orders
        </Switch>
        <Switch defaultChecked disabled={paused} labelPlacement="start">
          Failed payments
        </Switch>
        <Switch disabled={paused} labelPlacement="start">
          Return requests
        </Switch>
      </Stack>
    </Stack>
  );
}
