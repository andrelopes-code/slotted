import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';

export default function SwitchStates() {
  return (
    <Stack gap={5}>
      <Switch defaultChecked readOnly description="Your organization's security policy sets this.">
        Two-step sign-in
      </Switch>
      <Switch defaultChecked disabled description="Included in the Business plan.">
        Audit log
      </Switch>
      <Switch disabled description="Available on the Enterprise plan.">
        Single sign-on
      </Switch>
    </Stack>
  );
}
