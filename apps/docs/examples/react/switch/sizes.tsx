import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';

export default function SwitchSizes() {
  return (
    <Stack gap={4}>
      <Switch size="sm" defaultChecked>
        Show archived orders
      </Switch>
      <Switch size="md" defaultChecked>
        Group orders by warehouse
      </Switch>
      <Switch size="lg" defaultChecked>
        Print packing slips
      </Switch>
    </Stack>
  );
}
